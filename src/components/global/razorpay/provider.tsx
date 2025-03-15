"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

type RazorpayProviderProps = {
  children: React.ReactNode
}

export const RazorpayProvider = ({ children }: RazorpayProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        if (window.Razorpay) {
          setIsLoaded(true)
          return
        }

        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => {
          toast.error("Failed to load Razorpay. Please try again later.")
        }
        document.body.appendChild(script)
      } catch (error) {
        toast.error("Failed to initialize Razorpay")
      }
    }

    loadRazorpay()
  }, [])

  if (!isLoaded) {
    return null // Or a loading spinner
  }

  return <>{children}</>
} 