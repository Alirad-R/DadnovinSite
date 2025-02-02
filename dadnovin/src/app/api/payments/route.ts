import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import prisma from "@/lib/prisma";

async function processUserPayment(userId: number, hours: number) {
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + hours);
  const amountPaid = hours * 10; // $10 per hour

  try {
    const result = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.transaction.create({
        data: {
          user: { connect: { id: userId } },
          validUntil,
          amountPaid,
          paymentStatus: 'COMPLETED', // For now, we'll mark it as completed immediately
        },
      });
      return paymentRecord;
    });

    return result;
  } catch (error) {
    console.error('Error processing payment:', error);
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

    const transaction = await processUserPayment(payload.userId, hours);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
} 