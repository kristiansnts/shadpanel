'use client';

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Don't protect login and signup pages
  const publicPages = ['/admin/login', '/admin/signup']
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    if (status === 'loading') return
    if (!session && !isPublicPage) {
      router.push('/admin/login')
    }
  }, [session, status, router, isPublicPage])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // For public pages, render without authentication wrapper
  if (isPublicPage) {
    return <>{children}</>
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
