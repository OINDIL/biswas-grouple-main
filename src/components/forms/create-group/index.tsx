"use client"
import { onCreateNewGroup } from "@/actions/groups"
import { FormGenerator } from "@/components/global/form-generator"
import { GroupListSlider } from "@/components/global/group-list-slider"
import { StripeElements } from "@/components/global/stripe/elements"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import PaymentForm from "./payment-form"
import { CreateGroupSchema } from "./schema"

type Props = {
  userId: string
  affiliate: boolean
  stripeId?: string
  amount: number
}

const CreateGroup = ({ userId, affiliate, stripeId, amount }: Props) => {
  const [groupId, setGroupId] = useState<string>("")
  const [showPayment, setShowPayment] = useState(false)
  console.log(amount)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof CreateGroupSchema>>({
    resolver: zodResolver(CreateGroupSchema),
  })

  const onSubmit = async (data: z.infer<typeof CreateGroupSchema>) => {
    try {
      const result = await onCreateNewGroup(userId, data)
      if (result?.status === 200 && result.data?.group[0].id) {
        setGroupId(result.data.group[0].id)
        setShowPayment(true)
        toast.success("Group created! Please complete payment to continue.")
      } else {
        toast.error(result?.message || "Failed to create group")
      }
    } catch (error) {
      toast.error("Failed to create group")
    }
  }

  if (showPayment) {
    return (
      <StripeElements>
        <PaymentForm
          userId={userId}
          affiliate={affiliate}
          stripeId={stripeId}
          groupId={groupId}
          amount={amount}
        />
      </StripeElements>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <GroupListSlider
        selected={watch("category")}
        register={register}
        label="Select Category"
        slidesOffsetBefore={28}
      />
      <div className="space-y-4 px-6">
        <FormGenerator
          register={register}
          name="name"
          errors={errors}
          inputType="input"
          type="text"
          placeholder="Group Name"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Create Group
        </button>
      </div>
    </form>
  )
}

export default CreateGroup
