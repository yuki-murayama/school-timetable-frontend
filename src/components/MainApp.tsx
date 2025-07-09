import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { TimetableGenerate } from "./TimetableGenerate"
import { DataRegistration } from "./DataRegistration"
import { TimetableView } from "./TimetableView"

interface MainAppProps {
  onLogout: () => void
}

export function MainApp({ onLogout }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState("generate")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "generate":
        return <TimetableGenerate />
      case "data":
        return <DataRegistration />
      case "view":
        return <TimetableView />
      default:
        return <TimetableGenerate />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{renderCurrentPage()}</div>
      </main>
    </div>
  )
}