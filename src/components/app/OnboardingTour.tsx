import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, Rocket, FileText, Settings, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_PREFIX = "foundriq:onboarding:v1:";

const steps = [
  {
    icon: LayoutDashboard,
    title: "Mission Control",
    body: "Your dashboard tracks every stage from idea to launch and highlights the next best action.",
  },
  {
    icon: Rocket,
    title: "Create a Startup",
    body: "Answer a short guided wizard — FoundrIQ researches the market and drafts an investor-ready plan.",
  },
  {
    icon: Sparkles,
    title: "AI Workspace",
    body: "Iterate with the AI co-founder to refine positioning, pricing, and go-to-market.",
  },
  {
    icon: FileText,
    title: "Reports",
    body: "Every blueprint is saved. View, copy, or export to PDF at any time.",
  },
  {
    icon: Settings,
    title: "Settings",
    body: "Personalize your workspace, notifications, and profile. Everything syncs across devices.",
  },
];

export function OnboardingTour() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (loading || !user?.id) return;
    try {
      const seen = localStorage.getItem(STORAGE_PREFIX + user.id);
      if (!seen) setOpen(true);
    } catch {
      /* ignore */
    }
  }, [loading, user?.id]);

  const finish = () => {
    try {
      if (user?.id) localStorage.setItem(STORAGE_PREFIX + user.id, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setIdx(0);
  };

  const step = steps[idx];
  const Icon = step.icon;
  const isLast = idx === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : finish())}>
      <DialogContent className="max-w-md animate-scale-in">
        <DialogHeader>
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl gradient-brand text-primary-foreground shadow-glow">
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center">{step.body}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === idx ? "w-6 bg-primary" : "w-1.5 bg-border")
              }
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
          <div className="flex gap-2">
            {idx > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIdx(idx - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Link to="/app/create" onClick={finish}>
                <Button size="sm" className="gradient-brand text-primary-foreground shadow-glow">
                  <Check className="mr-1.5 h-4 w-4" /> Get started
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="gradient-brand text-primary-foreground shadow-glow"
                onClick={() => setIdx(idx + 1)}
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
