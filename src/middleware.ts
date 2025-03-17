import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher(["/group(.*)"])
const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"])

export default clerkMiddleware(async (auth, req) => {
  const baseHost = "localhost:3000"
  const host = req.headers.get("host")
  const reqPath = req.nextUrl.pathname
  const origin = req.nextUrl.origin

  // Redirect logged-in users away from auth routes
  const { userId } = auth()
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/group/create", origin))
  }

  // Protect group routes
  if (isProtectedRoute(req)) auth().protect()

  // Handle custom domain logic
  if (!baseHost.includes(host as string) && reqPath.includes("/group")) {
    const response = await fetch(`${origin}/api/domain?host=${host}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    if (data.status === 200 && data) {
      return NextResponse.rewrite(
        new URL(reqPath, `https://${data.domain}/${reqPath}`),
      )
    }
  }
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}