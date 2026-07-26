import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles, ArrowRight, Rocket, Lightbulb, Search, Palette,
  DollarSign, Megaphone, Rocket as LaunchIcon, Check, Clock,
  ShieldAlert, ArrowUpRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Mission Control — NEXORA AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

type StageStatus = "done" | "active" | "todo";
type Stage = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; status: StageStatus };

function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = useAuth();
  const firstName = useMemo(() => {
    const name =
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      user?.email?.split("@")[0] ||
      "founder";
    return name.split(" ")[0].replace(/^./, c => c.toUpperCase());
  }, [user]);
  const greeting = useGreeting();

  // No projects table exists yet → single source of truth for the empty state.
  const hasStartup = false;

  // Roadmap. With no startup, only "Idea" is complete (they signed up = idea captured),
  // and the next active step is Research. Nothing fabricated.
  const stages: Stage[] = [
    { key: "idea", label: "Idea", icon: Lightbulb, status: "done" },
    { key: "research", label: "Research", icon: Search, status: "active" },
    { key: "branding", label: "Branding", icon: Palette, status: "todo" },
    { key: "finance", label: "Finance", icon: DollarSign, status: "todo" },
    { key: "marketing", label: "Marketing", icon: Megaphone, status: "todo" },
    { key: "launch", label: "Launch", icon: LaunchIcon, status: "todo" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
      <HeroMissionControl greeting={greeting} firstName={firstName} stages={stages} hasStartup={hasStartup} />

      {hasStartup ? null : <EmptyMissionState />}

      <AICofounderPanel hasStartup={hasStartup} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero — Founder Mission Control                                             */
/* -------------------------------------------------------------------------- */

function HeroMissionControl({
  greeting, firstName, stages, hasStartup,
}: { greeting: string; firstName: string; stages: Stage[]; hasStartup: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}, {firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back to your startup. Today we'll move your company one step closer to launch.
            </p>
          </div>

          {hasStartup ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/app/create">
                <Button className="gradient-brand text-primary-foreground shadow-glow">
                  Continue Building <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/app/reports">
                <Button variant="outline">View Previous Reports</Button>
              </Link>
            </div>
          ) : (
            <Link to="/app/create">
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                <Sparkles className="mr-2 h-4 w-4" /> Start Building
              </Button>
            </Link>
          )}
        </div>

        <Roadmap stages={stages} />
      </div>
    </section>
  );
}

function Roadmap({ stages }: { stages: Stage[] }) {
  // animate the progress line on mount
  const activeIdx = stages.findIndex(s => s.status === "active");
  const doneCount = stages.filter(s => s.status === "done").length;
  const targetPct =
    activeIdx === -1
      ? (doneCount / Math.max(stages.length - 1, 1)) * 100
      : (activeIdx / (stages.length - 1)) * 100;

  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setPct(targetPct), 60);
    return () => window.clearTimeout(t);
  }, [targetPct]);

  return (
    <div className="mt-8">
      <div className="relative">
        {/* connecting line */}
        <div className="absolute left-5 right-5 top-5 h-[2px] rounded-full bg-border sm:left-6 sm:right-6 sm:top-6" />
        <div
          className="absolute left-5 top-5 h-[2px] rounded-full bg-primary transition-[width] duration-1000 ease-out sm:left-6 sm:top-6"
          style={{ width: `calc((100% - 2.5rem) * ${pct} / 100)` }}
        />

        <ol className="relative grid grid-cols-6 gap-2">
          {stages.map((s, i) => (
            <StageNode key={s.key} stage={s} index={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function StageNode({ stage, index }: { stage: Stage; index: number }) {
  const { icon: Icon, status, label } = stage;
  return (
    <li className="flex flex-col items-center gap-2 text-center" style={{ animationDelay: `${index * 60}ms` }}>
      <div
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-500 sm:h-12 sm:w-12",
          status === "done" && "border-transparent bg-success/15 text-success",
          status === "active" && "border-primary/50 bg-primary text-primary-foreground shadow-glow",
          status === "todo" && "border-border bg-background text-muted-foreground"
        )}
      >
        {status === "active" && (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" aria-hidden />
        )}
        {status === "done" ? (
          <Check className="relative h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Icon className="relative h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </div>
      <div
        className={cn(
          "text-[11px] font-medium sm:text-xs",
          status === "active" && "text-foreground",
          status === "done" && "text-muted-foreground",
          status === "todo" && "text-muted-foreground/70"
        )}
      >
        {label}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyMissionState() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40 grid-bg" />
      <div className="relative mx-auto max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-border bg-background shadow-card">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-tight">Your company starts today.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Let's transform your idea into a real business. NEXORA will research the market,
          define your brand, and prepare an investor-ready plan.
        </p>
        <div className="mt-6">
          <Link to="/app/create">
            <Button className="gradient-brand text-primary-foreground shadow-glow">
              <Sparkles className="mr-2 h-4 w-4" /> Create Your First Startup
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  AI Co-Founder panel                                                        */
/* -------------------------------------------------------------------------- */

function AICofounderPanel({ hasStartup }: { hasStartup: boolean }) {
  // Deterministic, non-fabricated recommendation. No fake AI messaging.
  const recommendation = hasStartup
    ? {
        title: "Research your competitors first",
        reason:
          "It helps improve pricing and positioning before branding. A clear competitive map is the fastest way to sharpen your value proposition.",
        priority: "High" as const,
        eta: "~15 min",
        risk: "Low" as const,
        nextHref: "/app/create",
        nextLabel: "Continue Research",
      }
    : {
        title: "Start your first startup blueprint",
        reason:
          "NEXORA needs an idea to work with. Once your startup is created we'll research the market, define positioning, and generate a plan tailored to it.",
        priority: "High" as const,
        eta: "~5 min",
        risk: "Low" as const,
        nextHref: "/app/create",
        nextLabel: "Create Startup",
      };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">AI Co-Founder</div>
            <div className="text-[11px] text-muted-foreground">Today's recommendation</div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Ready
        </div>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next best action
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">{recommendation.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Why: </span>
            {recommendation.reason}
          </p>

          <div className="mt-5">
            <Link to={recommendation.nextHref}>
              <Button className="gradient-brand text-primary-foreground shadow-glow">
                {recommendation.nextLabel} <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MetaCell label="Current Priority" value={recommendation.priority} tone="primary" />
          <MetaCell label="Estimated Time" value={recommendation.eta} icon={<Clock className="h-3.5 w-3.5" />} />
          <MetaCell label="Risk Level" value={recommendation.risk} icon={<ShieldAlert className="h-3.5 w-3.5" />} tone="success" />
        </div>
      </div>
    </section>
  );
}

function MetaCell({
  label, value, icon, tone,
}: { label: string; value: string; icon?: React.ReactNode; tone?: "primary" | "success" | "neutral" }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        {icon}
        <span
          className={cn(
            "text-sm font-semibold",
            tone === "primary" && "text-primary",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
