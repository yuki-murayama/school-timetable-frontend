"use client"

import { useState } from "react"
import { MainApp } from "@/components/main-app"
import LoginPage from "@/components/login-page"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return <>{isLoggedIn ? <MainApp onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}</>
}
