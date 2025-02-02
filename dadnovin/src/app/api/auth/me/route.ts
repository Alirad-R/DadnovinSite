// api/auth/me/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import prisma from "@/lib/prisma"; // Update import path

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch the user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
    console.log("**** just fetched User:", user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let validUntil = null;

    try {
      // Check for an active subscription - wrapped in try/catch in case Transaction table isn't ready
      const currentDate = new Date();
      const activeTransaction = await prisma.transaction.findFirst({
        where: {
          userId: payload.userId,
          paymentStatus: "COMPLETED",
          validUntil: {
            gt: currentDate,
          },
        },
        orderBy: {
          validUntil: "desc",
        },
      });

      if (activeTransaction) {
        validUntil = activeTransaction.validUntil;
      }
    } catch (error) {
      console.warn("Could not check subscription status:", error);
      // Continue without subscription check
    }

    // Return the user data regardless of subscription status
    return NextResponse.json({
      user,
      validUntil,
    });
  } catch (error) {
    console.error("ME endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Cleanup
    await prisma.$disconnect();
  }
}
