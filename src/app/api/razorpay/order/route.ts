import { NextResponse } from "next/server"
import Razorpay from "razorpay"

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Ensure environment variables exist
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: "Razorpay keys missing" }, { status: 500 })
    }

    const razorpay = new Razorpay({ key_id, key_secret })

    const options = {
      amount: amount * 100, // Convert INR to paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json(order) // Send order to frontend
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
