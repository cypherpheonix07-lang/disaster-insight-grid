import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  updated,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: "default" | "critical" | "warning" | "safe";
  updated?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    critical: "text-critical",
    warning: "text-warning",
    safe: "text-safe",
  }[tone];

  return (
    <div className="panel p-3">
      <div className="flex items-center gap-2">
        <p className="label-mono">{label}</p>
        {Icon && <Icon className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />}
      </div>
      <p className={cn("tabular mt-1.5 text-2xl font-semibold", toneClass)}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {updated && <p className="label-mono mt-2">Updated {updated}</p>}
    </div>
  );
}
