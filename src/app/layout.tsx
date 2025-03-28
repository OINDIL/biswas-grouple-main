import { RazorpayProvider } from "@/components/global/razorpay/provider"
import { ThemeProvider } from "@/components/theme"
import { ReactQueryProvider } from "@/react-query/provider"
import { ReduxProvider } from "@/redux/provider"
import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Toaster } from "sonner"
import "./global.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ami Sikhbo",
  description: "Ami Sikhbo",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${jakarta.className} bg-black`}>
          <RazorpayProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              disableTransitionOnChange
            >
              <ReduxProvider>
                <ReactQueryProvider>{children}</ReactQueryProvider>
              </ReduxProvider>
              <Toaster />
            </ThemeProvider>
          </RazorpayProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
