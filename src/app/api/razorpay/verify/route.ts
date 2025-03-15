import crypto from "crypto"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { order_id, payment_id, signature } = await req.json()

    // Validate required parameters
    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Ensure secret key exists
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json(
        { success: false, message: "Razorpay secret key is missing" },
        { status: 500 }
      )
    }

    // Generate expected signature
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex")

    // Compare signatures
    if (generated_signature !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, message: "Payment verified" })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
