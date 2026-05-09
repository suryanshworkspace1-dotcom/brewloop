"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Coffee,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

function resolveCafeId(params: ReturnType<typeof useParams>) {
  const raw = params.cafeid ?? params.cafeId;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

function CheckinSkeleton() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12"
      aria-busy="true"
      aria-label="Loading check-in"
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="h-8 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-md bg-muted/80" />
        <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60" />
      </div>
    </div>
  );
}

export default function CheckinPage() {
  const params = useParams();
  const cafeId = resolveCafeId(params);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cafeLoading, setCafeLoading] = useState(true);
  const [cafeName, setCafeName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setAuthReady(false);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) {
        setUserEmail(user?.email ?? null);
        setAuthReady(true);
      }

      if (!cafeId) {
        if (!cancelled) setCafeLoading(false);
        return;
      }

      const { data } = await supabase
        .from("cafes")
        .select("cafe_name")
        .eq("id", cafeId)
        .maybeSingle();

      if (!cancelled) {
        setCafeName(data?.cafe_name ?? null);
        setCafeLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cafeId]);

  const handleCheckin = async () => {
    setSubmitting(true);
    try {
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please login first");
        return;
      }

      // CHECK LAST VISIT
      const { data: lastVisit } = await supabase
        .from("visits")
        .select("*")
        .eq("user_id", user.id)
        .eq("cafe_id", cafeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastVisit) {
        const lastVisitTime = new Date(lastVisit.created_at).getTime();
        const now = Date.now();

        const hoursPassed = (now - lastVisitTime) / (1000 * 60 * 60);

        if (hoursPassed < 12) {
          setMessage(
            `You already checked in recently. Try again later.`
          );
          return;
        }
      }

      // CREATE VISIT
      await supabase.from("visits").insert([
        {
          user_id: user.id,
          cafe_id: cafeId,
          points_earned: 10,
        },
      ]);

      // CHECK EXISTING POINTS
      const { data: existingPoints } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id)
        .eq("cafe_id", cafeId)
        .maybeSingle();

      if (existingPoints) {
        await supabase
          .from("loyalty_points")
          .update({
            points: existingPoints.points + 10,
          })
          .eq("id", existingPoints.id);
      } else {
        await supabase.from("loyalty_points").insert([
          {
            user_id: user.id,
            cafe_id: cafeId,
            points: 10,
          },
        ]);
      }

      setMessage("Check-in successful! +10 points");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady || (cafeId && cafeLoading)) {
    return <CheckinSkeleton />;
  }

  if (!cafeId) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
            <MapPin className="size-7 text-destructive" aria-hidden />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Invalid check-in link
            </h1>
            <p className="text-sm text-muted-foreground">
              This QR code or URL is missing a cafe. Ask the team for a fresh
              BrewLoop QR.
            </p>
          </div>
          <Button variant="outline" asChild className="w-full">
            <Link href="/customer">View my loyalty</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isSuccess = message.startsWith("Check-in successful!");

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border bg-card/80 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-card/60 sm:px-6">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Coffee className="size-4" aria-hidden />
            </span>
            <span className="font-semibold tracking-tight">BrewLoop</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-7 text-primary" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Check in
            </h1>
            <p className="text-sm text-muted-foreground">
              Earn points for your visit at this cafe.
            </p>
          </div>

          <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1 text-center">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-lg font-semibold">
                  {cafeName ?? "Cafe"}
                </span>
              </div>
              {!cafeName ? (
                <p className="text-xs text-muted-foreground">
                  We couldn&apos;t load this cafe&apos;s name, but you can still
                  check in.
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center">
                <p className="text-sm font-medium text-foreground">
                  +10 points per check-in
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  One check-in every 12 hours at this location.
                </p>
              </div>

              {userEmail ? (
                <p className="text-center text-xs text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-medium text-foreground">{userEmail}</span>
                </p>
              ) : (
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sign in first so we know who to credit.
                  </p>
                  <Button variant="link" size="sm" className="mt-1 h-auto p-0" asChild>
                    <Link href="/auth" className="gap-1">
                      Go to sign in
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}

              <Button
                className="h-11 w-full gap-2 text-base"
                onClick={handleCheckin}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Checking in…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" aria-hidden />
                    Collect 10 points
                  </>
                )}
              </Button>

              {message ? (
                <p
                  role="status"
                  className={cn(
                    "text-center text-sm",
                    isSuccess
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {message}
                </p>
              ) : null}

              {message === "Please login first" ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth">Sign in to continue</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link
              href="/customer"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Open my loyalty wallet
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
