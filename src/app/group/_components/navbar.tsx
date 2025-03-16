import { onAuthenticatedUser } from "@/actions/auth"
import { onGetUserGroups } from "@/actions/groups"

import GlassSheet from "@/components/global/glass-sheet"
import { Button } from "@/components/ui/button"
import { CheckBadge } from "@/icons"
import { MenuIcon } from "lucide-react"
import Link from "next/link"

export const Navbar = async () => {
  const user = await onAuthenticatedUser()
  const groups = await onGetUserGroups(user.id!)

  return (
    <div className="flex px-5 py-3 items-center bg-themeBlack border-b-[1px] border-themeDarkGray fixed z-50 w-full bg-clip-padding backdrop--blur__safari backdrop-filter backdrop-blur-2xl bg-opacity-60">
      <div className="hidden lg:inline">
        <Link href="/">
          <p >Ami Sikhbo.</p>
        </Link>
      </div>
      <GlassSheet
        trigger={
          <span className="lg:hidden flex items-center gap-2 py-2">
            <MenuIcon className="cursor-pointer" />
            <p>Ami Sikhbo.</p>
          </span>
        }
      >
        <div>Content</div>
      </GlassSheet>
      <div className="flex-1 lg:flex hidden justify-end mr-60">
        <Link href={user.status === 200 ? `/explore` : "/explore"}>
          <Button
            variant="outline"
            className="bg-themeBlack rounded-2xl flex gap-2 border-themeGray hover:bg-themeGray"
          >
            <CheckBadge />
            Explore
          </Button>
        </Link>
      
      </div>
    </div>
  )
}
