"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import Dashboard from "@/components/dashboard"
import Gestores from "@/components/gestores"
import Motoristas from "@/components/motoristas"
import Carros from "@/components/carros"
import Eventos from "@/components/eventos"
import Relatorios from "@/components/relatorios"
import Notificacoes from "@/components/notificacoes"
import Backup from "@/components/backup"
import Login from "@/components/login"

export default function Home() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState("dashboard")

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("usuarioLogado", JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("usuarioLogado")
    setCurrentPage("dashboard")
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />
      case "gestores":
        return <Gestores />
      case "motoristas":
        return <Motoristas />
      case "carros":
        return <Carros />
      case "eventos":
        return <Eventos />
      case "relatorios":
        return <Relatorios />
      case "notificacoes":
        return <Notificacoes />
      case "backup":
        return <Backup />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout} user={user} />
      <main className="flex-1 overflow-auto">
        <div className="animate-fade-in">{renderPage()}</div>
      </main>
    </div>
  )
}
