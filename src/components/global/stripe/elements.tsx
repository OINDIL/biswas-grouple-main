"use client"

import { useStripeElements } from "@/hooks/payment"
import { Elements } from "@stripe/react-stripe-js"
import { memo, useEffect, useState } from "react"
import { Loader } from "../loader"

type StripeElementsProps = {
  children: React.ReactNode
}

const appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#0570de',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '4px',
  },
}

export const StripeElements = memo(({ children }: StripeElementsProps) => {
  const { StripePromise } = useStripeElements()
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true;

    const initializeStripe = async () => {
      try {
        const promise = await StripePromise()
        if (mounted) {
          setStripePromise(promise)
        }
      } catch (error) {
        console.error('Failed to initialize Stripe:', error)
        if (mounted) {
          setError('Failed to initialize payment system')
        }
      }
    }

    initializeStripe()

    return () => {
      mounted = false
    }
  }, [StripePromise])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!stripePromise) {
    return <Loader loading={true}>Loading payment form...</Loader>
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        appearance,
        loader: 'auto',
      }}
    >
      {children}
    </Elements>
  )
})
