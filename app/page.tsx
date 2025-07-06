"use client"

import { useAuth } from "@/hooks/use-auth"
import { MainApp } from "@/components/main-app"
import LoginPage from "@/components/login-page"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{isAuthenticated ? <MainApp /> : <LoginPage />}</>
}
