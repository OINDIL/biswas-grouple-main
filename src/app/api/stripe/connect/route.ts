import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20"
})

export async function POST(req: Request) {
  try {
    const { groupId, returnUrl, refreshUrl } = await req.json()

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe secret key is not configured" },
        { status: 500 }
      )
    }

    try {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: "individual",
        settings: {
          payouts: {
            schedule: {
              interval: "manual"
            }
          }
        }
      })

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding"
      })

      return NextResponse.json({
        url: accountLink.url,
        accountId: account.id
      })
    } catch (error: any) {
      if (error.code === 'parameter_missing' && error.param === 'account') {
        return NextResponse.json({
          needsConnectSetup: true,
          dashboardUrl: "https://dashboard.stripe.com/settings/connect"
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error("Stripe Connect Error:", error)
    
    // More detailed error response
    return NextResponse.json(
      { 
        error: "Failed to create Stripe Connect URL",
        details: error.message,
        code: error.code,
        type: error.type
      },
      { status: 500 }
    )
  }
}
