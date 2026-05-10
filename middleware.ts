import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Not logged in → redirect to auth
  if (!user) {
    const protectedRoutes = ["/dashboard", "/analytics", "/customer"]
    const isProtected = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    )
    if (isProtected) {
      return NextResponse.redirect(new URL("/auth", request.url))
    }
    return response
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role ?? "customer"

  // Owner trying to access customer page → redirect to dashboard
  if (role === "owner" && pathname.startsWith("/customer")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Customer trying to access owner pages → redirect to customer
  if (role === "customer" && (pathname.startsWith("/dashboard") || pathname.startsWith("/analytics"))) {
    return NextResponse.redirect(new URL("/customer", request.url))
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/analytics/:path*", "/customer/:path*"],
}