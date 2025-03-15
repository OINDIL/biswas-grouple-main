import { onGetRazorpayIntegration, onGetStripeIntegration } from "@/actions/payments"
import { FallbackImage } from "@/components/global/fallback-image"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { INTEGRATION_LIST_ITEMS } from "@/constants/menus"
import IntegrationTrigger from "./_components/integration-trigger"

const IntegrationsPage = async ({
  params,
}: {
  params: { groupid: string }
}) => {
  const stripePayment = await onGetStripeIntegration()
  const razorpayPayment = await onGetRazorpayIntegration()
  
  const connections = {
    stripe: stripePayment?.status === 200,
    razorpay: razorpayPayment?.status === 200
  }

  const getImagePath = (name: string): string => {
    switch (name) {
      case "stripe":
        return "/stripe.png"
      case "razorpay":
        return "/razorpay.png"
      default:
        return "/vercel.svg"
    }
  }

  return (
    <div className="flex-1 h-0 grid grid-cols-1 p-5 content-start lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {INTEGRATION_LIST_ITEMS.map((item) => (
        <Card key={item.id} className="bg-themeBlack border-themeDarkGray">
          <CardContent className="flex flex-col p-5 gap-2">
            <div className="flex w-full justify-between items-start gap-x-20">
              <div className="">
                <div className="w-10 h-10 relative">
                  <FallbackImage
                    src={getImagePath(item.name)}
                    alt={`${item.name} Logo`}
                    width={40}
                    height={40}
                    priority
                  />
                </div>
                <h2 className="font-bold capitalize">{item.name}</h2>
              </div>
              <IntegrationTrigger
                connections={connections}
                title={item.title}
                descrioption={item.modalDescription}
                logo={getImagePath(item.name)}
                name={item.name as "stripe" | "razorpay"}
                groupid={params.groupid}
              />
            </div>
            <CardDescription>{item.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default IntegrationsPage
