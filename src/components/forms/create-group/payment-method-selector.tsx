"use client"

import { Button } from "@/components/ui/button"
import { usePaymentMethod } from "@/hooks/payment"
import { cn } from "@/lib/utils"
import { memo } from "react"

type Props = {
  groupId: string
}

const PaymentMethodSelector = memo(({ groupId }: Props) => {
  const { paymentMethod, setPaymentMethod } = usePaymentMethod(groupId)

  const handleMethodChange = (method: "stripe" | "razorpay") => {
    if (method !== paymentMethod) {
      setPaymentMethod(method)
    }
  }

  return (
    <div className="flex gap-2 mb-6">
      <Button
        type="button"
        variant={paymentMethod === "stripe" ? "default" : "outline"}
        onClick={() => handleMethodChange("stripe")}
        className={cn(
          "flex-1 transition-all duration-200",
          paymentMethod === "stripe" && "bg-primary text-primary-foreground"
        )}
      >
        Pay with Stripe
      </Button>
      <Button
        type="button"
        variant={paymentMethod === "razorpay" ? "default" : "outline"}
        onClick={() => handleMethodChange("razorpay")}
        className={cn(
          "flex-1 transition-all duration-200",
          paymentMethod === "razorpay" && "bg-primary text-primary-foreground"
        )}
      >
        Pay with Razorpay
      </Button>
    </div>
  )
})

PaymentMethodSelector.displayName = "PaymentMethodSelector"

export default PaymentMethodSelector 