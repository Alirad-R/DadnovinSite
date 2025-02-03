import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import prisma from "@/lib/prisma";
import FormData from "form-data";
import axios from "axios";

const BITPAY_API = "adxcv-zzadq-polkjsad-opp13opoz-1sdf455aadzmck1244567"; // Test API key
const BITPAY_URL = "https://bitpay.ir/payment-test/gateway-send"; // Test endpoint

async function processUserPayment(userId: number, hours: number) {
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + hours);
  const amountPaid = hours * 10; // $10 per hour

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const paymentRecord = await tx.transaction.create({
        data: {
          user: { connect: { id: userId } },
          validUntil,
          amountPaid,
          paymentStatus: "COMPLETED", // For now, we'll mark it as completed immediately
        },
      });
      return paymentRecord;
    });

    return result;
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
}

async function initiateBitpayPayment(amount: number) {
  const form = new FormData();

  // Add required fields
  form.append("api", BITPAY_API);
  form.append("amount", amount * 10000); // Convert to Rials
  form.append(
    "redirect",
    `${process.env.NEXT_PUBLIC_BASE_URL}/account/payment-callback`
  );

  // Add optional fields
  form.append("name", "Test Payment");
  form.append("description", `Payment for ${amount} hours`);
  form.append("factorId", `INV-${Date.now()}`);

  try {
    const response = await axios({
      method: "post",
      url: BITPAY_URL,
      data: form,
      headers: { ...form.getHeaders() },
    });

    console.log("Bitpay response:", response.data);

    if (typeof response.data === "number" && response.data > 0) {
      const paymentUrl = `https://bitpay.ir/payment-test/gateway-${response.data}-get`;
      console.log("Generated payment URL:", paymentUrl);
      return {
        paymentUrl,
        id_get: response.data.toString(),
      };
    } else {
      switch (response.data) {
        case -1:
          throw new Error("API کد ارسالی صحیح نیست");
        case -2:
          throw new Error("مبلغ وارد شده صحیح نیست یا کمتر از 1000 ریال است");
        case -3:
          throw new Error("آدرس بازگشت مشخص نشده است");
        case -4:
          throw new Error("درگاه معتبر نیست یا در حالت انتظار است");
        case -5:
          throw new Error("خطا در اتصال به درگاه");
        default:
          throw new Error(`خطای ناشناخته از سمت درگاه: ${response.data}`);
      }
    }
  } catch (error: any) {
    console.error("Bitpay API Error:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { hours } = body;

    if (!hours || ![1, 2, 3].includes(hours)) {
      return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
    }

    const amount = hours * 10; // $10 per hour

    console.log("Initiating payment with:", {
      amount,
      apiKey: BITPAY_API.substring(0, 10) + "...", // Log partial API key for debugging
      redirectUrl:
        process.env.NEXT_PUBLIC_BASE_URL + "/account/payment-callback",
    });

    const paymentResult = await initiateBitpayPayment(amount);
    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      id_get: paymentResult.id_get,
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
