import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Next.js 16 proxy. Runs on the Node.js runtime (Proxy does not support Edge).
 * Validates the Better Auth session (database-backed, not a NextAuth JWT).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/admin/dashboard")) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/dashboard", "/admin/dashboard/:path*"],
}
