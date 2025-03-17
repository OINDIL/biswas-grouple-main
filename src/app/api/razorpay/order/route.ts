import { validateGroupId } from "@/lib/validations"; // You'll need to create this
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { amount, groupId } = await req.json()
    console.log(amount, groupId)

    // Validate inputs
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!validateGroupId(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 })
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
      notes: {
        groupId: groupId
      }
    }

    const order = await razorpay.orders.create(options)
    
    // Log successful order creation
    console.log(`Order created for group ${groupId}: ${order.id}`)

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
