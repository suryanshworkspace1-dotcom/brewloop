"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Gift,
  RefreshCw,
  Repeat,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Cafe = {
  id: string;
  cafe_name: string;
};

type TopCustomer = {
  user_id: string;
  points: number;
  streak_count: number;
};

type CafeAnalytics = {
  unique_customers: number;
  total_check_ins: number;
  repeat_visit_rate: number | null;
  total_redemptions: number;
  top_customers: TopCustomer[];
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

function parseAnalyticsPayload(raw: unknown): CafeAnalytics | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const top = o.top_customers;
  if (!Array.isArray(top)) return null;

  return {
    unique_customers: Number(o.unique_customers ?? 0),
    total_check_ins: Number(o.total_check_ins ?? 0),
    repeat_visit_rate:
      o.repeat_visit_rate === null || o.repeat_visit_rate === undefined
        ? null
        : Number(o.repeat_visit_rate),
    total_redemptions: Number(o.total_redemptions ?? 0),
    top_customers: top.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        user_id: String(r.user_id ?? ""),
        points: Number(r.points ?? 0),
        streak_count: Number(r.streak_count ?? 0),
      };
    }),
  };
}

function formatPercent(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading analytics">
      <div className="space-y-2">
        <div className="h-8 w-40 max-w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-muted/40 ring-1 ring-border/60"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted/30 ring-1 ring-border/60" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [analytics, setAnalytics] = useState<CafeAnalytics | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cafesLoading, setCafesLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const fetchCafes = useCallback(async () => {
    setCafesLoading(true);
    const { data, error } = await supabase.from("cafes").select("id, cafe_name");

    if (error) {
      setLoadError(error.message);
      setCafes([]);
      setCafesLoading(false);
      return;
    }

    const list = data ?? [];
    setCafes(list);
    if (list.length > 0) {
      setSelectedCafe((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : list[0].id
      );
    } else {
      setSelectedCafe("");
      setAnalytics(null);
    }
    setCafesLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async (cafeId: string) => {
    if (!cafeId) {
      setAnalytics(null);
      return;
    }
    setMetricsLoading(true);
    setLoadError(null);

    const { data, error } = await supabase.rpc("get_owner_cafe_analytics", {
      p_cafe_id: cafeId,
    });

    if (error) {
      setLoadError(error.message);
      setAnalytics(null);
      setMetricsLoading(false);
      return;
    }

    setAnalytics(parseAnalyticsPayload(data));
    setMetricsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCafes();
    });
  }, [fetchCafes]);

  useEffect(() => {
    if (!selectedCafe) return;
    queueMicrotask(() => {
      void fetchAnalytics(selectedCafe);
    });
  }, [selectedCafe, fetchAnalytics]);

  const hasCafes = cafes.length > 0;
  const selectedName =
    cafes.find((c) => c.id === selectedCafe)?.cafe_name ?? null;

  if (cafesLoading && !hasCafes) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-10">
      {selectedName ? (
        <p className="text-sm text-muted-foreground">
          Showing:{" "}
          <span className="font-medium text-foreground">{selectedName}</span>
        </p>
      ) : null}

      <Separator />

      <Section
        title="Select a cafe"
        description="Metrics are computed for the cafe you choose."
      >
        {!hasCafes ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No cafes yet</CardTitle>
              <CardDescription>
                Create a cafe on the Dashboard to see analytics here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cafes.map((cafe) => {
              const active = selectedCafe === cafe.id;
              return (
                <button
                  key={cafe.id}
                  type="button"
                  onClick={() => setSelectedCafe(cafe.id)}
                  className={cn(
                    "rounded-xl border bg-card p-4 text-left shadow-sm outline-none transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Building2
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="font-medium text-foreground">
                      {cafe.cafe_name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {active ? "Selected" : "View metrics"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {hasCafes && selectedCafe ? (
        <>
          <Section title="Overview">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Users className="size-3.5 opacity-70" aria-hidden />
                    Unique customers
                  </CardDescription>
                  <CardTitle className="font-mono text-2xl tabular-nums">
                    {metricsLoading ? "…" : analytics?.unique_customers ?? "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Distinct visitors with at least one check-in
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <BarChart3 className="size-3.5 opacity-70" aria-hidden />
                    Total check-ins
                  </CardDescription>
                  <CardTitle className="font-mono text-2xl tabular-nums">
                    {metricsLoading ? "…" : analytics?.total_check_ins ?? "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    All visit records for this cafe
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Repeat className="size-3.5 opacity-70" aria-hidden />
                    Repeat visit rate
                  </CardDescription>
                  <CardTitle className="font-mono text-2xl tabular-nums">
                    {metricsLoading
                      ? "…"
                      : formatPercent(analytics?.repeat_visit_rate ?? null)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Share of customers with more than one visit
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Gift className="size-3.5 opacity-70" aria-hidden />
                    Rewards redeemed
                  </CardDescription>
                  <CardTitle className="font-mono text-2xl tabular-nums">
                    {metricsLoading ? "…" : analytics?.total_redemptions ?? "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Redemption events recorded for this cafe
                  </p>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section
            title="Top customers by points"
            description="Highest point balances at this cafe (max five)."
          >
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                {metricsLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </p>
                ) : !analytics || analytics.top_customers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No loyalty rows yet for this cafe.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                        <TableHead className="text-right">Streak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.top_customers.map((row, i) => (
                        <TableRow key={row.user_id}>
                          <TableCell className="text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="max-w-[12rem] truncate font-mono text-xs sm:max-w-md">
                            {row.user_id}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {row.points}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {row.streak_count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Section>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void fetchAnalytics(selectedCafe)}
              disabled={metricsLoading}
            >
              <RefreshCw
                className={cn("size-4", metricsLoading && "animate-spin")}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
