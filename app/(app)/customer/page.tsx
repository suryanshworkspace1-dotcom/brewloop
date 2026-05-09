"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Coffee,
  Gift,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type LoyaltyRow = {
  id: string;
  user_id: string;
  cafe_id: string;
  points: number;
};

type Cafe = {
  id: string;
  cafe_name: string;
};

type Reward = {
  id: string;
  cafe_id: string;
  reward_name: string;
  points_required: number;
};

type VisitRow = {
  id: string;
  cafe_id: string;
  points_earned: number;
  created_at: string;
};

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function CustomerSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading loyalty">
      <div className="space-y-2">
        <div className="h-8 w-56 max-w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted/80" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl border border-border bg-muted/30 md:col-span-1" />
        <div className="h-28 animate-pulse rounded-xl border border-border bg-muted/30 md:col-span-2" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

function aggregatePointsByCafe(rows: LoyaltyRow[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.cafe_id, (map.get(row.cafe_id) ?? 0) + row.points);
  }
  return map;
}

export default function CustomerPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loyaltyRows, setLoyaltyRows] = useState<LoyaltyRow[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setEmail(null);
          setUserId(null);
          setLoyaltyRows([]);
          setCafes([]);
          setRewards([]);
          setVisits([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setEmail(user.email ?? null);
        setUserId(user.id);
      }

      const { data: loyaltyData } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", user.id);

      const { data: visitData } = await supabase
        .from("visits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);

      const rows = loyaltyData ?? [];
      const visitsList = visitData ?? [];
      const loyaltyCafeIds = rows.map((r) => r.cafe_id);
      const visitCafeIds = visitsList.map((v) => v.cafe_id);
      const cafeIds = [
        ...new Set([...loyaltyCafeIds, ...visitCafeIds]),
      ];

      let cafeList: Cafe[] = [];
      if (cafeIds.length > 0) {
        const { data: cafeData } = await supabase
          .from("cafes")
          .select("id, cafe_name")
          .in("id", cafeIds);
        cafeList = cafeData ?? [];
      }

      const rewardCafeIds = [...new Set(loyaltyCafeIds)];
      let rewardList: Reward[] = [];
      if (rewardCafeIds.length > 0) {
        const { data: rewardData } = await supabase
          .from("rewards")
          .select("*")
          .in("cafe_id", rewardCafeIds);
        rewardList = rewardData ?? [];
      }

      if (!cancelled) {
        setLoyaltyRows(rows);
        setCafes(cafeList);
        setRewards(rewardList ?? []);
        setVisits(visitsList);
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pointsByCafe = useMemo(
    () => aggregatePointsByCafe(loyaltyRows),
    [loyaltyRows]
  );

  const totalPoints = useMemo(() => {
    let sum = 0;
    for (const v of pointsByCafe.values()) sum += v;
    return sum;
  }, [pointsByCafe]);

  const cafeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cafes) m.set(c.id, c.cafe_name);
    return m;
  }, [cafes]);

  const rewardsByCafe = useMemo(() => {
    const m = new Map<string, Reward[]>();
    for (const r of rewards) {
      const list = m.get(r.cafe_id) ?? [];
      list.push(r);
      m.set(r.cafe_id, list);
    }
    for (const [, list] of m) {
      list.sort((a, b) => a.points_required - b.points_required);
    }
    return m;
  }, [rewards]);

  if (loading) {
    return <CustomerSkeleton />;
  }

  if (!userId) {
    return (
      <div className="space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Coffee className="size-5" aria-hidden />
            <span className="text-sm font-medium uppercase tracking-wide">
              BrewLoop
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Your loyalty wallet
          </h1>
          <p className="max-w-lg text-muted-foreground">
            Sign in to see points you&apos;ve earned at participating cafes and
            which rewards you can redeem.
          </p>
        </header>
        <Panel className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <UserRound
                className="size-5 text-muted-foreground"
                aria-hidden
              />
            </div>
            <div>
              <p className="font-medium text-foreground">Not signed in</p>
              <p className="text-sm text-muted-foreground">
                Use the same account you scan with at the cafe.
              </p>
            </div>
          </div>
          <Button asChild className="gap-2">
            <Link href="/auth">
              Sign in
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </Panel>
      </div>
    );
  }

  const hasBalances = pointsByCafe.size > 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" aria-hidden />
            <span className="text-sm font-medium">Loyalty</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{email ?? "—"}</span>
          </p>
        </div>
        <Panel className="flex shrink-0 flex-row items-center gap-4 sm:min-w-[12rem] sm:flex-col sm:items-stretch sm:text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total points
          </p>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {totalPoints}
          </p>
        </Panel>
      </header>

      <Separator />

      <Section
        title="Balances by cafe"
        description="Points you’ve collected at each location. Scan the cafe QR to add more after you visit."
      >
        {!hasBalances ? (
          <Panel className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <MapPin className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-w-md space-y-1">
              <p className="font-medium text-foreground">No points yet</p>
              <p className="text-sm text-muted-foreground">
                Check in at a cafe with your account to earn your first stamp
                of points. Ask the barista for their BrewLoop QR.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...pointsByCafe.entries()].map(([cafeId, pts]) => (
              <Panel key={cafeId} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Coffee
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <h3 className="truncate font-semibold text-foreground">
                        {cafeNameById.get(cafeId) ?? "Cafe"}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available to redeem
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-lg font-semibold tabular-nums text-primary">
                    {pts}
                  </span>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Rewards"
        description="What you can unlock at each cafe. Locked rewards show how many more points you need."
      >
        {!hasBalances ? (
          <Panel className="py-10 text-center text-sm text-muted-foreground">
            Earn points at a cafe to see rewards here.
          </Panel>
        ) : (
          <div className="space-y-6">
            {[...pointsByCafe.keys()].map((cafeId) => {
              const pts = pointsByCafe.get(cafeId) ?? 0;
              const cafeRewards = rewardsByCafe.get(cafeId) ?? [];
              const name = cafeNameById.get(cafeId) ?? "Cafe";

              return (
                <Panel key={cafeId} className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="size-4 text-muted-foreground" aria-hidden />
                      <span className="font-semibold text-foreground">
                        {name}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      Your balance:{" "}
                      <span className="font-medium text-foreground">{pts}</span>
                    </span>
                  </div>
                  {cafeRewards.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      This cafe hasn&apos;t published rewards yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {cafeRewards.map((reward) => {
                        const eligible = pts >= reward.points_required;
                        const need = Math.max(
                          0,
                          reward.points_required - pts
                        );
                        return (
                          <li
                            key={reward.id}
                            className={cn(
                              "flex flex-col gap-1 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                              eligible
                                ? "border-primary/25 bg-primary/5"
                                : "border-border bg-muted/30"
                            )}
                          >
                            <span className="font-medium text-foreground">
                              {reward.reward_name}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                eligible
                                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              {eligible
                                ? `Redeem · ${reward.points_required} pts`
                                : `${need} more pts · ${reward.points_required} pts`}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Recent activity"
        description="Your latest check-ins and points from visits."
      >
        <Panel>
          {visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <CalendarCheck
                className="size-8 text-muted-foreground/50"
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">
                No visits yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                After you check in at a cafe, your visits will show up here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[min(18rem,45vh)] pr-3">
              <ul className="space-y-2">
                {visits.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium text-foreground">
                        {cafeNameById.get(v.cafe_id) ?? "Cafe visit"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                      +{v.points_earned} pts
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </Panel>
      </Section>
    </div>
  );
}
