import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, FileText, Loader2, PencilLine } from "lucide-react";

export type StartupStatus = "draft" | "generating" | "completed" | "exported";

const map: Record<StartupStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: {
    label: "Draft",
    className: "border-border bg-muted/60 text-muted-foreground",
    icon: PencilLine,
  },
  generating: {
    label: "Generating",
    className: "border-warning/30 bg-warning/10 text-warning",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "border-success/30 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  exported: {
    label: "Exported PDF",
    className: "border-primary/30 bg-primary/10 text-primary",
    icon: FileText,
  },
};

export function StatusBadge({ status, className }: { status: StartupStatus; className?: string }) {
  const s = map[status];
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-medium", s.className, className)}>
      <Icon className={cn("h-3 w-3", status === "generating" && "animate-spin")} />
      {s.label}
    </Badge>
  );
}

/** Confidence in 0-100. Returns null if score is missing. */
export function confidenceTier(score: number | null | undefined): "High" | "Medium" | "Low" | null {
  if (score == null) return null;
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

export function ConfidenceBadge({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  const tier = confidenceTier(score);
  if (tier == null || score == null) return null;
  const tone =
    tier === "High"
      ? "border-success/30 bg-success/10 text-success"
      : tier === "Medium"
      ? "border-warning/30 bg-warning/10 text-warning"
      : "border-destructive/30 bg-destructive/10 text-destructive";
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-medium", tone, className)}>
      <span className="tabular-nums">{Math.round(score)}%</span>
      <span className="opacity-70">· {tier}</span>
    </Badge>
  );
}
