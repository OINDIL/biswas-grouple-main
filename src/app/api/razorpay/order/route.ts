import Razorpay from "razorpay"

export async function POST(req: Request) {
  try {
    const { amount } = await req.json() // Amount in INR (paise)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return Response.json(order) // Send order to frontend
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
