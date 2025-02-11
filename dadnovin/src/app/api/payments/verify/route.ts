import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import prisma from "@/lib/prisma";
import FormData from "form-data";
import axios from "axios";

const BITPAY_API = "adxcv-zzadq-polkjsad-opp13opoz-1sdf455aadzmck1244567";

// Define the expected shape of the verification result
interface VerificationResult {
  status: number;
  amount: number;
  cardNumber: string;
  factorId: string;
}

//check who uses this route
async function verifyBitpayTransaction(
  transId: string,
  idGet: string
): Promise<VerificationResult> {
  const form = new FormData();
  form.append("api", BITPAY_API);
  form.append("trans_id", transId);
  form.append("id_get", idGet);
  form.append("json", "1");

  try {
    const response = await axios({
      method: "post",
      url: "https://bitpay.ir/payment-test/gateway-result-second",
      data: form,
      headers: { ...form.getHeaders() },
    });

    if (response.data.status !== 1) {
      throw new Error("Transaction not verified by Bitpay");
    }

    return {
      status: response.data.status,
      amount: Number(response.data.amount),
      cardNumber: response.data.cardNum,
      factorId: response.data.factorId,
    };
  } catch (error) {
    console.error("Bitpay verification error:", error);
    throw new Error("Failed to verify transaction with Bitpay");
  }
}

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get and validate request body
    const body = await request.json();
    const { transId, idGet } = body;

    if (
      !transId ||
      !idGet ||
      typeof transId !== "string" ||
      typeof idGet !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Check if this transaction was already processed
    const existingTransaction = await prisma.transaction.findFirst({
      // Casting to any because "transactionId" is not recognized by TransactionWhereInput.
      where: {
        transactionId: transId,
      } as any,
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: "Transaction already processed" },
        { status: 400 }
      );
    }

    // Verify the transaction with Bitpay
    const verificationResult = await verifyBitpayTransaction(transId, idGet);

    // Validate amount (should be multiple of 100,000 Rials)
    if (
      verificationResult.amount % 100000 !== 0 ||
      verificationResult.amount < 100000
    ) {
      throw new Error("Invalid payment amount");
    }

    const hours = Math.floor(verificationResult.amount / 100000);
    if (hours <= 0 || hours > 3) {
      throw new Error("Invalid hours calculation");
    }

    // Calculate new validUntil date
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + hours);

    // Create transaction record in database
    await prisma.$transaction(async (tx: any) => {
      // Create the transaction record
      await tx.transaction.create({
        data: {
          user: { connect: { id: payload.userId } },
          validUntil,
          amountPaid: verificationResult.amount / 10000, // Convert Rials to USD
          paymentStatus: "COMPLETED",
          transactionId: transId,
          cardNumber: verificationResult.cardNumber,
          factorId: verificationResult.factorId,
        },
      });

      // Update user's validUntil if needed
      await tx.user.update({
        where: { id: payload.userId },
        data: {
          validUntil: {
            set: validUntil,
          },
        },
      });
    });

    return NextResponse.json({ success: true, hours, validUntil });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}

