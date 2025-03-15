import { SimpleModal } from "@/components/global/simple-modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2Icon, CloudIcon } from "lucide-react"
import { RazorpayConnect } from "../connect/razorpay"
import { StripeConnect } from "../connect/stripe"

type Props = {
  name: "stripe" | "razorpay"
  logo: string
  title: string
  descrioption: string
  groupid: string
  connections: {
    stripe: boolean
    razorpay: boolean
  }
}

const IntegrationTrigger = ({
  name,
  logo,
  title,
  descrioption,
  connections,
  groupid,
}: Props) => {
  const renderConnectButton = () => {
    switch (name) {
      case "stripe":
        return <StripeConnect connected={connections.stripe} groupid={groupid} />;
      case "razorpay":
        return <RazorpayConnect connected={connections.razorpay} groupid={groupid} />;
      default:
        return null;
    }
  };

  return (
    <SimpleModal
      title={title}
      type="Integration"
      logo={logo}
      description={descrioption}
      trigger={
        <Card className="px-3 py-2 cursor-pointer flex gap-2 bg-themeBlack border-themeGray">
          <CloudIcon />
          {connections[name] ? "connected" : "connect"}
        </Card>
      }
    >
      <Separator orientation="horizontal" />
      <div className="flex flex-col gap-2">
        <h2 className="font-bold">{name === "stripe" ? "Stripe" : "Razorpay"} would like to access</h2>
        {[
          "Payment and bank information",
          "Products and services you sell",
          "Business and tax information",
          "Create and update Products",
        ].map((item, key) => (
          <div key={key} className="flex gap-2 items-center pl-3">
            <CheckCircle2Icon />
            <p>{item}</p>
          </div>
        ))}
        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            className="bg-themeBlack border-themeDarkGray"
          >
            Learn more
          </Button>
          {renderConnectButton()}
        </div>
      </div>
    </SimpleModal>
  )
}

export default IntegrationTrigger
