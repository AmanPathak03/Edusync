"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // If authenticated but trying to access the wrong dashboard type
      if (user && pathname.includes("/dashboard/")) {
        const isTeacherPath = pathname.includes("/dashboard/teacher")
        const isStudentPath = pathname.includes("/dashboard/student")

        if ((isTeacherPath && user.role !== "teacher") || (isStudentPath && user.role !== "student")) {
          router.push(`/dashboard/${user.role}`)
        }
      }
    }
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = function () {
    window.history.go(1);
    };
  }, [isAuthenticated, isLoading, pathname, router, user])

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
