import { MainApp } from "@/components/main-app"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredPermission="timetables:read">
      <MainApp />
    </ProtectedRoute>
  )
}
