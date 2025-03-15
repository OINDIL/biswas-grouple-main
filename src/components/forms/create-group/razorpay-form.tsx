"use client"

import { Loader } from "@/components/global/loader"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useRazorpayPayment } from "@/hooks/payment"

type Props = {
  groupId: string
}

export default function RazorpayForm({ groupId }: Props) {
  const { onPayWithRazorpay, isPending } = useRazorpayPayment(groupId)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-3 mb-4">
          <Icons.razorpay className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Razorpay Secure Payment</h3>
            <p className="text-sm text-muted-foreground">
              Pay using UPI, cards, or netbanking
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Icons.upi className="h-5 w-5" />
              <span className="text-sm">UPI</span>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Icons.card className="h-5 w-5" />
              <span className="text-sm">Cards</span>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Icons.bank className="h-5 w-5" />
              <span className="text-sm">Netbanking</span>
            </div>
          </div>
          <Button
            onClick={onPayWithRazorpay}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader loading={true}>Processing payment...</Loader>
            ) : (
              <>
                <Icons.razorpay className="mr-2 h-4 w-4" />
                Pay Securely
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 