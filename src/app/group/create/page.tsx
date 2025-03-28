"use server"
import { onAuthenticatedUser } from "@/actions/auth"
import { onGetAffiliateInfo } from "@/actions/groups"
import CreateGroup from "@/components/forms/create-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { redirect } from "next/navigation"

const GroupCreatePage = async ({
  searchParams,
}: {
  searchParams: { [affiliate: string]: string }
}) => {
  const params = await searchParams
  const user = await onAuthenticatedUser()

  if (!user || !user.id) return redirect("/sign-in")

  const affiliateId = params?.affiliate

  const affiliate = affiliateId ? await onGetAffiliateInfo(affiliateId) : null

  return (
    <>
      <div className="px-7 flex flex-col">
        <h5 className="font-bold text-base text-themeTextWhite">
          Payment Method
        </h5>
        <p className="text-themeTextGray leading-tight">
          Free for 14 days, then $99/month. Cancel anytime. All features.
          Unlimited everything. No hidden fees.
        </p>
        {affiliate?.status === 200 && affiliate?.user?.Group?.User && (
          <div className="w-full mt-5 flex justify-center items-center gap-x-2 italic text-themeTextGray text-sm">
            You were referred by
            <Avatar>
              <AvatarImage
                src={affiliate.user.Group.User.image ?? ""}
                alt="User"
              />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            {affiliate.user.Group.User.firstname}{" "}
            {affiliate.user.Group.User.lastname}
          </div>
        )}
      </div>
      <CreateGroup
        userId={user?.id ?? ""}
        affiliate={affiliate?.status === 200}
        stripeId={affiliate?.user?.Group?.User?.stripeId ?? ""}
        amount={99}
      />
    </>
  )
}

export default GroupCreatePage
