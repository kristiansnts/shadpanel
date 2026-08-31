'use client';

import { useSession } from "@/lib/auth-client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const publicPages = ['/admin/login', '/admin/signup']
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    if (isPublicPage) return
    if (isPending) return
    if (!session) {
      router.push('/admin/login')
    }
  }, [session, isPending, router, isPublicPage])

  if (isPublicPage) {
    return <>{children}</>
  }

  if (isPending) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
