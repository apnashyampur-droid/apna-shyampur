import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing payment verification fields.",
        },
        { status: 400 }
      );
    }

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error(
        "RAZORPAY_KEY_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay secret is not configured.",
        },
        { status: 500 }
      );
    }

    const generatedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const generatedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    const isValid =
      generatedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        generatedBuffer,
        receivedBuffer
      );

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_id:
        razorpay_payment_id,
      order_id:
        razorpay_order_id,
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}