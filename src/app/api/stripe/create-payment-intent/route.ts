import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { groupId, amount } = await req.json();

    // Validate inputs
    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }
    
    if (!amount || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }


    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'USD'.toLowerCase(),
      metadata: {
        groupId: groupId
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 