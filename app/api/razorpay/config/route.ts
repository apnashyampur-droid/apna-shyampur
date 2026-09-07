import { NextResponse } from "next/server";

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    console.error(
      "RAZORPAY_KEY_ID is missing."
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Razorpay payment configuration is missing.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    keyId,
  });
}