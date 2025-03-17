"use client"

import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useJoinGroup, usePaymentMethod } from "@/hooks/payment/index"
import { CardElement } from "@stripe/react-stripe-js"
import { memo, useCallback, useState } from "react"
import PaymentMethodSelector from "./payment-method-selector"
import RazorpayForm from "./razorpay-form"

type Props = {
  userId: string
  affiliate: boolean
  stripeId?: string
  groupId: string
  amount: number
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
      iconColor: "#666EE8",
    },
    invalid: {
      color: "#9e2146",
      iconColor: "#fa755a",
    },
  },
  hidePostalCode: true,
} as const;

const StripePaymentForm = memo(({ onPayWithStripe, isStripeLoading, onCardChange }: {
  onPayWithStripe: () => void;
  isStripeLoading: boolean;
  onCardChange: (event: any) => void;
}) => (
  <div className="space-y-4">
    <div className="rounded-lg border p-4">
      <CardElement
        onChange={onCardChange}
        options={cardElementOptions}
      />
    </div>
    <Button
      onClick={onPayWithStripe}
      disabled={isStripeLoading}
      className="w-full"
    >
      {isStripeLoading ? (
        <Loader loading={true}>Processing payment...</Loader>
      ) : (
        "Pay with Stripe"
      )}
    </Button>
  </div>
));

const PaymentForm = ({ userId, affiliate, stripeId, groupId, amount }: Props) => {
  const { paymentMethod } = usePaymentMethod(groupId)
  const { onPayToJoin: onPayWithStripe, isPending: isStripeLoading } = useJoinGroup(groupId, amount)
  

  const [cardError, setCardError] = useState<string | null>(null)

  const handleCardChange = useCallback((event: any) => {
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
          <CardDescription>
            Choose your preferred payment method to complete your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodSelector groupId={groupId} />
          
          {cardError && (
            <div className="text-sm text-red-500 mb-4">
              {cardError}
            </div>
          )}
          
          {paymentMethod === "stripe" ? (
            <StripePaymentForm 
              onPayWithStripe={onPayWithStripe}
              isStripeLoading={isStripeLoading}
              onCardChange={handleCardChange}
            />
          ) : (
            <RazorpayForm groupId={groupId} amount={amount} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

PaymentForm.displayName = "PaymentForm"
StripePaymentForm.displayName = "StripePaymentForm"

export default PaymentForm
