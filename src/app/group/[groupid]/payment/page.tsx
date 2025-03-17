"use client"

import PaymentForm from "@/components/forms/create-group/payment-form"
import { RazorpayProvider } from "@/components/global/razorpay/provider"
import { StripeElements } from "@/components/global/stripe/elements"

type Props = {
  params: {
    groupid: string
  }
}

export default function GroupPaymentPage({ params }: Props) {
  return (
    <RazorpayProvider>
      <StripeElements>
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
            <p className="text-muted-foreground">
              Choose your preferred payment method to complete your group subscription
            </p>
          </div>
          
          <PaymentForm 
            groupId={params.groupid}
            userId=""
            affiliate={false}
            stripeId=""
            amount={99}
          />
        </div>
      </StripeElements>
    </RazorpayProvider>
  )
} 