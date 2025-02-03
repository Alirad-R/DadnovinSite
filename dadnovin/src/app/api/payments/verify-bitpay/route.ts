import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import FormData from "form-data";
import axios from "axios";

const BITPAY_API = "adxcv-zzadq-polkjsad-opp13opoz-1sdf455aadzmck1244567";

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get transaction details from request
    const { transId, idGet } = await request.json();

    // Create form data for Bitpay verification
    const form = new FormData();
    form.append("api", BITPAY_API);
    form.append("trans_id", transId);
    form.append("id_get", idGet);
    form.append("json", "1");

    console.log("Verifying payment with Bitpay:", { transId, idGet });

    // Make request to Bitpay
    const response = await axios({
      method: "post",
      url: "https://bitpay.ir/payment-test/gateway-result-second",
      data: form,
      headers: { ...form.getHeaders() },
    });

    console.log("Bitpay verification response:", response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Bitpay verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
} 