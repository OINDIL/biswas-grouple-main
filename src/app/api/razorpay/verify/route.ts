import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { order_id, payment_id, signature } = await req.json()
    const secret = process.env.RAZORPAY_KEY_SECRET!

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(order_id + "|" + payment_id)
      .digest("hex")

    if (generated_signature !== signature) {
      return Response.json(
        { success: false, message: "Invalid signature" },
        { status: 400 },
      )
    }

    return Response.json({ success: true, message: "Payment verified" })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
