import { Separator } from "@/components/ui/separator"

export default function AppLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-8 max-w-xs animate-pulse rounded-md bg-muted" />
        <div className="h-4 max-w-md animate-pulse rounded-md bg-muted/80" />
      </div>
      <Separator />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-border bg-card/50"
          />
        ))}
      </div>
      <div className="h-48 w-full animate-pulse rounded-xl border border-border bg-card/50" />
    </div>
  )
}
