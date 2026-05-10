"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { getNavForRole } from "./nav-config"

type MainNavProps = {
  onNavigate?: () => void
  className?: string
}

export function MainNav({ onNavigate, className }: MainNavProps) {
  const pathname = usePathname()
  const [role, setRole] = useState<"owner" | "customer">("customer")

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      if (profile?.role === "owner") setRole("owner")
    })
  }, [])

  const navItems = getNavForRole(role)

  return (
    <nav className={cn("flex flex-col gap-1 p-3", className)}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}