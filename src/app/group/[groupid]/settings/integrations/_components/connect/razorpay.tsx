"use client"

import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { useRazorpayConnect } from "@/hooks/payment"

type RazorpayConnectProps = {
  connected: boolean
  groupid: string
}

export const RazorpayConnect = ({ connected, groupid }: RazorpayConnectProps) => {
  const { onRazorpayConnect, isConnecting } = useRazorpayConnect(groupid)
  return (
    <Button disabled={connected} onClick={onRazorpayConnect}>
      <Loader loading={isConnecting}>
        {connected ? "Connected" : "Connect to Razorpay"}
      </Loader>
    </Button>
  )
} 