import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json(
        {
          error: "Invalid payment amount.",
        },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error(
        "Razorpay environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Razorpay payment configuration is missing.",
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receipt =
      `AS${Date.now()}`;

    const order =
      await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt,
      });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error(
      "Razorpay create order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create Razorpay order.",
      },
      { status: 500 }
    );
  }
}