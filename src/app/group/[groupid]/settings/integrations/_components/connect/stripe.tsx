"use client"

import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { useStripeConnect } from "@/hooks/payment"

type StripeConnectProps = {
  connected: boolean
  groupid: string
}
export const StripeConnect = ({ connected, groupid }: StripeConnectProps) => {
  const { onStripeConnect, isConnecting } = useStripeConnect(groupid)
  return (
    <Button disabled={connected} onClick={onStripeConnect}>
      <Loader loading={isConnecting}>
        {connected ? "Connected" : "Connect to Stripe"}
      </Loader>
    </Button>
  )
} 