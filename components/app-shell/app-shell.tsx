"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Coffee, LogIn, Menu } from "lucide-react"

import { MainNav } from "./main-nav"
import { getShellPageMeta } from "./nav-config"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { title, description } = getShellPageMeta(pathname)

  return (
    <div className="flex min-h-svh w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Coffee className="size-4" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight text-sidebar-foreground">
              BrewLoop
            </span>
          </Link>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <MainNav />
          <Separator className="my-2 bg-sidebar-border" />
          <div className="px-3 pb-4">
            <p className="px-3 text-xs font-medium text-muted-foreground">
              Cafe loyalty
            </p>
          </div>
        </ScrollArea>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 gap-0 border-sidebar-border bg-sidebar p-0"
            >
              <SheetHeader className="space-y-0 border-b border-sidebar-border p-4 text-left">
                <SheetTitle className="flex items-center gap-2 font-heading">
                  <Coffee className="size-4 shrink-0" aria-hidden />
                  BrewLoop
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100dvh-5rem)]">
                <MainNav onNavigate={() => setMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {description}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2 sm:px-2.5"
                aria-label="Open account menu"
              >
                <Avatar size="sm" className="size-7">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-medium">
                    G
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[8rem] truncate text-left text-sm font-medium sm:inline">
                  Guest
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <span className="text-muted-foreground text-xs">
                  Not signed in
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/auth" className="cursor-pointer gap-2">
                  <LogIn className="size-4 opacity-70" aria-hidden />
                  Sign in
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
