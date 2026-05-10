"use client";

import QRCode from "react-qr-code";
import { useEffect, useState, type ReactNode } from "react";
import {
  Building2,
  Coins,
  Gift,
  Mail,
  MapPin,
  Plus,
  QrCode,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Cafe = {
  id: string;
  cafe_name: string;
};

type Reward = {
  id: string;
  reward_name: string;
  points_required: number;
};

type LoyaltyPoint = {
  id: string;
  user_id: string;
  points: number;
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

function Panel({ children, className }: { children: ReactNode; className?: string }) {
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

function DashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted/80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />
        <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />
      </div>
      <div className="h-56 animate-pulse rounded-xl border border-border bg-muted/30" />
    </div>
  );
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [pointsRequired, setPointsRequired] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPoints, setCustomerPoints] = useState("");
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoint[]>([]);
  const [message, setMessage] = useState("");
  const [cafesLoading, setCafesLoading] = useState(true);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setEmail(user.email || "");
  };

  const fetchRewards = async (cafeId: string) => {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .eq("cafe_id", cafeId);
    if (data) setRewards(data);
  };

  const fetchLoyalty = async (cafeId: string) => {
    const { data } = await supabase
      .from("loyalty_points")
      .select("*")
      .eq("cafe_id", cafeId);
    if (data) setLoyaltyData(data);
  };

  const fetchCafes = async () => {
    setCafesLoading(true);
    const { data } = await supabase.from("cafes").select("*");
    if (data) {
      setCafes(data);
      if (data.length > 0) {
        setSelectedCafe(data[0].id);
        fetchRewards(data[0].id);
        fetchLoyalty(data[0].id);
      }
    }
    setCafesLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void getUser();
      void fetchCafes();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createReward = async () => {
    const { error } = await supabase.from("rewards").insert([
      {
        cafe_id: selectedCafe,
        reward_name: rewardName,
        points_required: Number(pointsRequired),
      },
    ]);
    if (!error) {
      setRewardName("");
      setPointsRequired("");
      fetchRewards(selectedCafe);
    }
  };

  const addPoints = async () => {
    const { data: users } = await supabase.auth.admin.listUsers();
    const foundUser = users?.users?.find((u) => u.email === customerEmail);

    if (!foundUser) {
      setMessage("Customer not found");
      return;
    }

    const { error } = await supabase.from("loyalty_points").insert([
      {
        user_id: foundUser.id,
        cafe_id: selectedCafe,
        points: Number(customerPoints),
      },
    ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Points added!");
      setCustomerEmail("");
      setCustomerPoints("");
      fetchLoyalty(selectedCafe);
    }
  };

  const selectedCafeName =
    cafes.find((c) => c.id === selectedCafe)?.cafe_name ?? null;
  const hasCafes = cafes.length > 0;
  const canManageCafe = Boolean(selectedCafe);

  if (cafesLoading && !hasCafes) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Signed in as
            </p>
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {email || "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCafeName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3.5 shrink-0 opacity-70" aria-hidden />
                {selectedCafeName}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <Separator />

      <Section
        title="Your cafe"
        description="Manage your cafe QR code, rewards and loyalty."
      >
        {!hasCafes ? (
          <Panel className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Store className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="font-medium text-foreground">No cafe assigned yet</p>
              <p className="text-sm text-muted-foreground">
                Contact BrewLoop to get your cafe set up.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cafes.map((cafe) => {
              const isSelected = selectedCafe === cafe.id;
              return (
                <button
                  key={cafe.id}
                  type="button"
                  onClick={() => {
                    setSelectedCafe(cafe.id);
                    fetchRewards(cafe.id);
                    fetchLoyalty(cafe.id);
                  }}
                  className={cn(
                    "rounded-xl border bg-card p-4 text-left shadow-sm outline-none transition-all hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <h3 className="truncate font-semibold text-foreground">
                          {cafe.cafe_name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isSelected ? "Selected" : "Click to manage"}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex shrink-0 text-muted-foreground">
                          <QrCode className="size-4" aria-hidden />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Check-in QR</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mt-4 flex justify-center rounded-lg bg-white p-3 ring-1 ring-border/60">
                    <QRCode
                      value={`${window.location.origin}/checkin/${cafe.id}`}
                      size={112}
                      className="h-auto w-full max-w-[7rem]"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Rewards"
        description={
          canManageCafe
            ? "Define what customers can redeem with their points."
            : "Select a cafe to create rewards."
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            className={cn(!canManageCafe && "pointer-events-none opacity-60")}
          >
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">New reward</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reward-name" className="text-sm font-medium">
                  Reward name
                </label>
                <Input
                  id="reward-name"
                  placeholder="Free drip coffee"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  disabled={!canManageCafe}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="points-required" className="text-sm font-medium">
                  Points required
                </label>
                <Input
                  id="points-required"
                  type="number"
                  min={0}
                  placeholder="10"
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(e.target.value)}
                  disabled={!canManageCafe}
                />
              </div>
              <Button
                className="w-full gap-1.5 sm:w-auto"
                onClick={createReward}
                disabled={
                  !canManageCafe ||
                  !rewardName.trim() ||
                  pointsRequired === "" ||
                  Number.isNaN(Number(pointsRequired))
                }
              >
                <Plus className="size-4" aria-hidden />
                Add reward
              </Button>
            </div>
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium">Catalog</span>
            </div>
            {!canManageCafe ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Select a cafe to see rewards.
              </p>
            ) : rewards.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Gift className="size-8 text-muted-foreground/50" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  No rewards yet
                </p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Create a reward on the left.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[min(20rem,50vh)] pr-3">
                <ul className="space-y-3">
                  {rewards.map((reward) => (
                    <li
                      key={reward.id}
                      className="rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <p className="font-medium text-foreground">
                        {reward.reward_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reward.points_required} points
                      </p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </Panel>
        </div>
      </Section>

      <Section
        title="Award points"
        description="Grant points to a customer by their account email."
      >
        <Panel
          className={cn(!canManageCafe && "pointer-events-none opacity-60")}
        >
          <div className="mb-4 flex items-center gap-2">
            <Coins className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Manual adjustment</span>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="customer-email" className="text-sm font-medium">
                Customer email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="customer@example.com"
                  className="pl-9"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  disabled={!canManageCafe}
                />
              </div>
            </div>
            <div className="w-full space-y-2 lg:w-40">
              <label htmlFor="points-amount" className="text-sm font-medium">
                Points
              </label>
              <Input
                id="points-amount"
                type="number"
                min={0}
                placeholder="5"
                value={customerPoints}
                onChange={(e) => setCustomerPoints(e.target.value)}
                disabled={!canManageCafe}
              />
            </div>
            <Button
              className="shrink-0 gap-1.5"
              onClick={addPoints}
              disabled={
                !canManageCafe ||
                !customerEmail.trim() ||
                customerPoints === "" ||
                Number.isNaN(Number(customerPoints))
              }
            >
              <Plus className="size-4" aria-hidden />
              Add points
            </Button>
          </div>
          {message ? (
            <p
              className={cn(
                "mt-4 text-sm",
                message === "Points added!"
                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </Panel>
      </Section>

      <Section
        title="Loyalty ledger"
        description="Point entries recorded for your cafe."
      >
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">Entries</span>
          </div>
          {!canManageCafe ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select a cafe to view loyalty data.
            </p>
          ) : loyaltyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Users className="size-8 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                No entries yet
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                When you award points or customers check in, rows will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[min(22rem,55vh)] pr-3">
              <ul className="space-y-2">
                {loyaltyData.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-mono text-xs text-muted-foreground break-all">
                      {item.user_id}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {item.points} pts
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