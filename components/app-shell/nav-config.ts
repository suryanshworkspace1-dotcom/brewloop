import {
  BarChart3,
  LayoutDashboard,
  Coffee,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  pageTitle?: string
  pageDescription?: string
  roles: ("owner" | "customer")[]
}

export const SHELL_DEFAULT_DESCRIPTION =
  "Manage cafes, rewards, and loyalty in one place."

export const MAIN_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    pageDescription: "Overview of your cafes, visits, and reward activity.",
    roles: ["owner"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    pageDescription: "Visit and loyalty metrics for each of your cafes.",
    roles: ["owner"],
  },
  {
    href: "/customer",
    label: "My Loyalty",
    icon: Coffee,
    pageDescription: "Your points, rewards, and visit history.",
    roles: ["customer"],
  },
]

export function getNavForRole(role: "owner" | "customer") {
  return MAIN_NAV.filter((item) => item.roles.includes(role))
}

export function getShellPageMeta(pathname: string): {
  title: string
  description: string
} {
  const match = MAIN_NAV.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`))
  )

  if (match) {
    return {
      title: match.pageTitle ?? match.label,
      description: match.pageDescription ?? SHELL_DEFAULT_DESCRIPTION,
    }
  }

  return {
    title: "BrewLoop",
    description: SHELL_DEFAULT_DESCRIPTION,
  }
}