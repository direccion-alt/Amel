"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Truck,
  LayoutDashboard,
  Fuel,
  Route,
  Wrench,
  MapPin,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  UserCheck,
  MapPin as RoadIcon,
  DollarSign,
} from "lucide-react"
import { useState } from "react"
import type { Profile } from "@/lib/types"

interface SidebarProps {
  profile: Profile
}

const adminLinks = [
  { key: "dashboard", href: "/dashboard", label: "Panel General", icon: LayoutDashboard },
  { key: "units", href: "/dashboard/units", label: "Unidades", icon: Truck },
  { key: "operators", href: "/dashboard/operators", label: "Operadores", icon: UserCheck },
  { key: "rutas", href: "/dashboard/rutas-operativas", label: "Rutas Operativas", icon: Route },
  { key: "casetas", href: "/dashboard/casetas", label: "Casetas", icon: DollarSign },
  { key: "control_diesel", href: "/dashboard/combustible", label: "Control de Diesel", icon: Fuel },
  { key: "trips", href: "/dashboard/trips", label: "Logística", icon: RoadIcon },
  { key: "analisis", href: "/dashboard/analisis-financiero", label: "Análisis Financiero", icon: DollarSign },
  { key: "mantenimiento", href: "/dashboard/mantenimiento", label: "Mantenimiento", icon: Wrench },
  { key: "tracking", href: "/dashboard/tracking", label: "Rastreo GPS", icon: MapPin },
  { key: "users", href: "/dashboard/users", label: "Usuarios", icon: Users },
  { key: "settings", href: "/dashboard/settings", label: "Configuración", icon: Settings },
]

const userLinks = [
  { key: "dashboard", href: "/dashboard", label: "Panel General", icon: LayoutDashboard },
  { key: "units", href: "/dashboard/units", label: "Unidades", icon: Truck },
  { key: "operators", href: "/dashboard/operators", label: "Operadores", icon: UserCheck },
  { key: "rutas", href: "/dashboard/rutas-operativas", label: "Rutas Operativas", icon: Route },
  { key: "casetas", href: "/dashboard/casetas", label: "Casetas", icon: DollarSign },
  { key: "control_diesel", href: "/dashboard/combustible", label: "Control de Diesel", icon: Fuel },
  { key: "trips", href: "/dashboard/trips", label: "Logística", icon: RoadIcon },
  { key: "analisis", href: "/dashboard/analisis-financiero", label: "Análisis Financiero", icon: DollarSign },
  { key: "mantenimiento", href: "/dashboard/mantenimiento", label: "Mantenimiento", icon: Wrench },
  { key: "tracking", href: "/dashboard/tracking", label: "Rastreo GPS", icon: MapPin },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const rawLinks = profile.role === "admin" ? adminLinks : userLinks
  const permissions = profile.permissions || {}
  const links = rawLinks.filter((link) => {
    if (profile.role === "admin" && Object.keys(permissions).length === 0) return true
    return permissions[link.key] === true
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-black text-white hover:bg-gray-800"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Colores AMEL aplicados */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-black border-r border-gray-800 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header con logo */}
          <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg">FlotaControl AMEL</span>
                <span className="text-[#FFDE18] text-xs">Transportes Especializados</span>
              </div>
            )}
            {collapsed && <span className="text-[#FFDE18] font-bold text-lg mx-auto">A</span>}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-white hover:bg-gray-800"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-[#FFDE18] text-black font-medium"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-800 p-2">
            {!collapsed && (
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-medium text-white truncate">{profile.full_name || profile.email}</p>
                <p className="text-xs text-gray-400 capitalize">
                  {profile.role === "admin" ? "Administrador" : "Usuario"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-gray-300 hover:bg-gray-800 hover:text-white",
                collapsed && "justify-center",
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Cerrar sesión</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
