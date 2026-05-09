import {
  BarChart3,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Shown in the top bar; defaults to `label`. */
  pageTitle?: string
  /** Subtitle under the top bar title. */
  pageDescription?: string
}

export const SHELL_DEFAULT_DESCRIPTION =
  "Manage cafes, rewards, and loyalty in one place."

export const MAIN_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    pageDescription:
      "Overview of your cafes, visits, and reward activity.",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    pageDescription:
      "Visit and loyalty metrics for each of your cafes.",
  },
  {
    href: "/customer",
    label: "Customer",
    icon: Users,
    pageDescription:
      "Preview the loyalty experience your customers see.",
  },
]

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
