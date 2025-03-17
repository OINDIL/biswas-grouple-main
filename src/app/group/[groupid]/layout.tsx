import { onAuthenticatedUser } from "@/actions/auth"
import {
  onGetAllGroupMembers,
  onGetGroupChannels,
  onGetGroupInfo,
  onGetGroupSubscriptions,
  onGetUserGroups,
} from "@/actions/groups"
import SideBar from "@/components/global/sidebar"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { redirect } from "next/navigation"
import MobileNav from "../_components/mobile-nav"
import GroupNavbar from "./_components/group-navbar"

type Props = {
  children: React.ReactNode
  params: {
    groupid: string
  }
}

const GroupLayout = async ({ children, params }: Props) => {
  const query = new QueryClient()

  const user = await onAuthenticatedUser()
  if (!user.id) redirect("/sign-in")

  const groupId : string = params.groupid

  //group info
  await query.prefetchQuery({
    queryKey: ["group-info"],
    queryFn: async () => {
      const result = await onGetGroupInfo(groupId)
      return result || { status: 404 }
    },
  })

  //user groups
  await query.prefetchQuery({
    queryKey: ["user-groups"],
    queryFn: async () => {
      const result = await onGetUserGroups(user.id as string)
      return result || { status: 404 }
    },
  })

  //channels
  await query.prefetchQuery({
    queryKey: ["group-channels"],
    queryFn: async () => {
      const result = await onGetGroupChannels(groupId)
      return result || { status: 404, channels: [] }
    },
  })

  //group subscriptions
  await query.prefetchQuery({
    queryKey: ["group-subscriptions"],
    queryFn: async () => {
      const result = await onGetGroupSubscriptions(groupId)
      return result || { status: 404, subscriptions: [], count: 0 }
    },
  })

  //member-chats
  await query.prefetchQuery({
    queryKey: ["member-chats"],
    queryFn: async () => {
      const result = await onGetAllGroupMembers(groupId)
      return result || { status: 404, members: [] }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className="flex h-screen md:pt-5">
        <SideBar groupid={groupId} userid={user.id} />
        <div className="md:ml-[300px] flex flex-col flex-1 bg-[#101011] md:rounded-tl-xl overflow-y-auto border-l-[1px] border-t-[1px] border-[#28282D]">
          {/* <Navbar groupid={groupId} userid={user.id} /> */}
          {/* @ts-ignore */}
          <GroupNavbar groupid={groupId} userid={user.id} />
          {children}
          <MobileNav groupid={groupId} />
        </div>
      </div>
    </HydrationBoundary>
  )
}

export default GroupLayout
