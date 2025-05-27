"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  LogOut,
  Menu,
  X,
  UserCog,
  FileText,
  HardDrive,
  Bell,
} from "lucide-react"

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gestores", label: "Gestores", icon: UserCog },
  { id: "motoristas", label: "Motoristas", icon: Users },
  { id: "carros", label: "Carros", icon: Car },
  { id: "eventos", label: "Eventos", icon: Calendar },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "backup", label: "Backup", icon: HardDrive },
]

export default function Sidebar({ currentPage, onPageChange, onLogout, user }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">FleetFlow</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="p-2">
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user.nome ? user.nome.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.nome || "Gestor"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} ${
                  isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && item.label}
              </Button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={`w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 ${isCollapsed ? "px-2" : "px-3"}`}
            onClick={onLogout}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && "Sair"}
          </Button>
        </div>
      </div>
    </div>
  )
}
