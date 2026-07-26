import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Search, Users, Building2,
  GraduationCap, HeartPulse, BookOpen, Landmark, Globe2, Pencil, Loader2, RotateCcw, X, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/countries";
import { generateStartup, type StartupBlueprint, type StartupBlueprintInput } from "@/lib/ai.functions";
import { saveStartup } from "@/lib/startups.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/app/create")({
  head: () => ({ meta: [{ title: "Create Startup — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: CreateStartup,
});

type Customer = "Consumers" | "Businesses" | "Students" | "Healthcare" | "Education" | "Government" | "Other";
type Experience = "None" | "Beginner" | "Intermediate" | "Expert";
type Timeline = "ASAP" | "30 Days" | "90 Days" | "6 Months" | "1 Year";

type WizardState = {
  idea: string;
  problem: string;
  customers: Customer[];
  country: string;
  budget: number;
  experience: Experience | "";
  timeline: Timeline | "";
  advantage: string;
  step: number;
};

const initial: WizardState = {
  idea: "", problem: "", customers: [], country: "", budget: 25000,
  experience: "", timeline: "", advantage: "", step: 1,
};

const STORAGE_KEY = "foundriq:wizard:v1";
const TOTAL = 10;

const customerOptions: { value: Customer; icon: typeof Users; hint: string }[] = [
  { value: "Consumers", icon: Users, hint: "Everyday people" },
  { value: "Businesses", icon: Building2, hint: "Companies & teams" },
  { value: "Students", icon: GraduationCap, hint: "Learners" },
  { value: "Healthcare", icon: HeartPulse, hint: "Clinics, patients" },
  { value: "Education", icon: BookOpen, hint: "Schools, institutions" },
  { value: "Government", icon: Landmark, hint: "Public sector" },
  { value: "Other", icon: Globe2, hint: "Custom niche" },
];

const experienceOptions: Experience[] = ["None", "Beginner", "Intermediate", "Expert"];
const timelineOptions: Timeline[] = ["ASAP", "30 Days", "90 Days", "6 Months", "1 Year"];

const ideaExamples = ["AI Accounting Software", "Coffee Shop", "Fashion Brand", "Medical AI"];

const thinkingLines = [
  "Analyzing market…",
  "Finding competitors…",
  "Creating brand…",
  "Estimating costs…",
  "Preparing roadmap…",
];

function CreateStartup() {
  const nav = useNavigate();
  const [s, setS] = useState<WizardState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [blueprint, setBlueprint] = useState<StartupBlueprint | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const runGenerate = useServerFn(generateStartup);
  const runSave = useServerFn(saveStartup);


  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setS({ ...initial, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Autosave
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s, hydrated]);

  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setS(prev => ({ ...prev, [k]: v }));

  const canContinue = useMemo(() => {
    switch (s.step) {
      case 1: return s.idea.trim().length >= 3;
      case 2: return s.problem.trim().length >= 10;
      case 3: return s.customers.length > 0;
      case 4: return !!s.country;
      case 5: return s.budget >= 0;
      case 6: return !!s.experience;
      case 7: return !!s.timeline;
      case 8: return s.advantage.trim().length >= 5;
      case 9: return true;
      default: return true;
    }
  }, [s]);

  const next = () => canContinue && setS(p => ({ ...p, step: Math.min(TOTAL, p.step + 1) }));
  const back = () => setS(p => ({ ...p, step: Math.max(1, p.step - 1) }));

  const toggleCustomer = (c: Customer) =>
    update("customers", s.customers.includes(c) ? s.customers.filter(x => x !== c) : [...s.customers, c]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    const list = q ? COUNTRIES.filter(c => c.toLowerCase().includes(q)) : COUNTRIES;
    return list.slice(0, 80);
  }, [countryQuery]);

  // Thinking loop
  const thinkingTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!generating) return;
    setThinkingIndex(0);
    thinkingTimer.current = window.setInterval(() => {
      setThinkingIndex(i => (i + 1) % thinkingLines.length);
    }, 1400);
    return () => { if (thinkingTimer.current) clearInterval(thinkingTimer.current); };
  }, [generating]);

  const slowTimer = useRef<number | null>(null);
  const startGeneration = async () => {
    if (generating && !aiError) return; // prevent duplicate submissions
    setGenerating(true);
    setBlueprint(null);
    setAiError(null);
    setSlow(false);
    cancelRef.current = { cancelled: false };
    const token = cancelRef.current;
    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = window.setTimeout(() => {
      if (!token.cancelled) setSlow(true);
    }, 15_000);
    const inputs: StartupBlueprintInput = {
      idea: s.idea,
      problem: s.problem,
      customers: s.customers,
      country: s.country,
      budget: s.budget,
      experience: s.experience,
      timeline: s.timeline,
      advantage: s.advantage,
    };
    try {
      const result = await runGenerate({ data: inputs });
      if (token.cancelled) return;
      setBlueprint(result);
      try { localStorage.setItem("foundriq:blueprint:latest", JSON.stringify(result)); } catch { /* ignore */ }
      // Auto-save to Supabase (non-blocking for UI)
      runSave({ data: { blueprint: result, inputs } })
        .then(({ id }) => {
          if (token.cancelled) return;
          toast.success("Saved to your projects.");
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : "Could not save your startup.";
          toast.error(msg);
        });
    } catch (err) {
      if (token.cancelled) return;
      const msg = err instanceof Error ? err.message : "Something went wrong. Please retry.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlow(false);
    }
  };
  const cancelGeneration = () => {
    cancelRef.current.cancelled = true;
    if (slowTimer.current) clearTimeout(slowTimer.current);
    setGenerating(false);
    setSlow(false);
    setAiError(null);
  };

  const percent = Math.round((s.step / TOTAL) * 100);

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {s.step} of {TOTAL}</span>
          <span>Autosaved</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-brand transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {generating ? (
        blueprint ? (
          <BlueprintView blueprint={blueprint} onReset={() => { setBlueprint(null); setGenerating(false); }} />
        ) : aiError ? (
          <AiErrorScreen message={aiError} onRetry={startGeneration} onCancel={cancelGeneration} />
        ) : (
          <GeneratingScreen line={thinkingLines[thinkingIndex]} slow={slow} onRetry={startGeneration} onCancel={cancelGeneration} />
        )

      ) : (
        <div key={s.step} className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          {s.step === 1 && (
            <StepShell title="What do you want to build?" subtitle="Describe your startup idea in a sentence or two.">
              <Textarea rows={5} autoFocus value={s.idea} onChange={e => update("idea", e.target.value)}
                onKeyDown={onEnterAdvance(next)}
                placeholder="e.g. A subscription platform that helps freelancers automate invoicing and taxes."
                className="bg-elevated" />
              <div className="mt-3 flex flex-wrap gap-2">
                {ideaExamples.map(x => (
                  <button key={x} type="button" onClick={() => update("idea", x)}
                    className="rounded-full border border-border bg-elevated px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
                    {x}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {s.step === 2 && (
            <StepShell title="What problem does your startup solve?"
              subtitle="The more specific you are, the better FoundrIQ can help. Who feels this pain and how sharp is it today?">
              <Textarea rows={8} autoFocus value={s.problem} onChange={e => update("problem", e.target.value)}
                placeholder="Describe the pain point, who suffers from it, and why existing solutions fall short…"
                className="bg-elevated" />
              <p className="mt-2 text-xs text-muted-foreground">{s.problem.trim().length} characters — aim for a rich paragraph.</p>
            </StepShell>
          )}

          {s.step === 3 && (
            <StepShell title="Who will buy this?" subtitle="Select every group that fits. You can pick more than one.">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {customerOptions.map(({ value, icon: Icon, hint }) => {
                  const active = s.customers.includes(value);
                  return (
                    <button key={value} type="button" onClick={() => toggleCustomer(value)}
                      className={cn("group relative rounded-xl border p-4 text-left transition-all",
                        active ? "border-primary/60 bg-primary/5 shadow-glow" : "border-border bg-elevated hover:border-primary/30")}>
                      <div className={cn("grid h-10 w-10 place-items-center rounded-lg",
                        active ? "gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="mt-3 text-sm font-semibold">{value}</div>
                      <div className="text-xs text-muted-foreground">{hint}</div>
                      {active && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {s.step === 4 && (
            <StepShell title="Where will the business launch?" subtitle="Pick the primary country. You can expand later.">
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex w-full items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3 text-left text-sm hover:border-primary/40">
                    <span className={s.country ? "" : "text-muted-foreground"}>
                      {s.country || "Select a country"}
                    </span>
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="border-b border-border p-2">
                    <Input autoFocus placeholder="Search countries…" value={countryQuery}
                      onChange={e => setCountryQuery(e.target.value)} className="h-9 bg-elevated" />
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {filteredCountries.map(c => (
                      <button key={c} type="button"
                        onClick={() => { update("country", c); setCountryOpen(false); setCountryQuery(""); }}
                        className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                          s.country === c && "text-primary")}>
                        <span>{c}</span>
                        {s.country === c && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </StepShell>
          )}

          {s.step === 5 && (
            <StepShell title="What's your starting budget?" subtitle="An honest ballpark helps us tailor the roadmap.">
              <div className="rounded-2xl border border-border bg-elevated p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Budget</span>
                  <span className="text-3xl font-semibold tracking-tight">
                    ${s.budget.toLocaleString()}<span className="ml-1 text-sm text-muted-foreground">USD</span>
                  </span>
                </div>
                <Slider className="mt-6" min={0} max={500000} step={1000}
                  value={[s.budget]} onValueChange={([v]) => update("budget", v)} />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>$0</span><span>$500,000</span>
                </div>
              </div>
            </StepShell>
          )}

          {s.step === 6 && (
            <StepShell title="How much business experience do you have?" subtitle="No wrong answers — this shapes how we guide you.">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {experienceOptions.map(v => (
                  <PillCard key={v} label={v} active={s.experience === v} onClick={() => update("experience", v)} />
                ))}
              </div>
            </StepShell>
          )}

          {s.step === 7 && (
            <StepShell title="When do you want to launch?" subtitle="We'll pace the plan to match your goal.">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                {timelineOptions.map(v => (
                  <PillCard key={v} label={v === "ASAP" ? "As Soon As Possible" : v} active={s.timeline === v}
                    onClick={() => update("timeline", v)} />
                ))}
              </div>
            </StepShell>
          )}

          {s.step === 8 && (
            <StepShell title="What's your unique advantage?" subtitle="Why should customers choose you over the alternatives?">
              <Textarea rows={7} autoFocus value={s.advantage} onChange={e => update("advantage", e.target.value)}
                placeholder="e.g. Deep domain expertise, proprietary data, exclusive partnerships, faster onboarding, radically simpler UX…"
                className="bg-elevated" />
            </StepShell>
          )}

          {s.step === 9 && (
            <StepShell title="Review your answers" subtitle="Everything looks right? Edit any step before generation.">
              <div className="space-y-3">
                <ReviewRow label="Startup idea" value={s.idea} onEdit={() => update("step", 1)} />
                <ReviewRow label="Problem" value={s.problem} onEdit={() => update("step", 2)} />
                <ReviewRow label="Target customers" value={s.customers.join(", ") || "—"} onEdit={() => update("step", 3)} />
                <ReviewRow label="Country" value={s.country} onEdit={() => update("step", 4)} />
                <ReviewRow label="Budget" value={`$${s.budget.toLocaleString()} USD`} onEdit={() => update("step", 5)} />
                <ReviewRow label="Experience" value={s.experience} onEdit={() => update("step", 6)} />
                <ReviewRow label="Launch goal" value={s.timeline} onEdit={() => update("step", 7)} />
                <ReviewRow label="Unique advantage" value={s.advantage} onEdit={() => update("step", 8)} />
              </div>
            </StepShell>
          )}

          {s.step === 10 && (
            <StepShell title="Ready when you are" subtitle="FoundrIQ will interview the market and assemble your blueprint.">
              <div className="rounded-2xl border border-border bg-elevated p-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-brand shadow-glow">
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Generate your startup blueprint</h3>
                <p className="mt-1 text-sm text-muted-foreground">This will begin the AI research and analysis process.</p>
                <Button onClick={startGeneration} className="mt-6 gradient-brand text-primary-foreground shadow-glow">
                  <Sparkles className="mr-2 h-4 w-4" /> Start generation
                </Button>
              </div>
            </StepShell>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={back} disabled={s.step === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-3">
              {s.step === 1 && (
                <button type="button" onClick={() => { localStorage.removeItem(STORAGE_KEY); setS(initial); }}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  Reset
                </button>
              )}
              {s.step < TOTAL && (
                <Button onClick={next} disabled={!canContinue} className="gradient-brand text-primary-foreground shadow-glow">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function onEnterAdvance(cb: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); cb(); }
  };
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function PillCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-xl border px-4 py-4 text-sm font-medium transition-all",
        active ? "border-primary/60 bg-primary/5 shadow-glow text-foreground" : "border-border bg-elevated text-muted-foreground hover:border-primary/30 hover:text-foreground")}>
      {label}
    </button>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-elevated p-4">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 whitespace-pre-wrap text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0">
        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
      </Button>
    </div>
  );
}

function GeneratingScreen({ line, slow, onRetry, onCancel }: { line: string; slow: boolean; onRetry: () => void; onCancel: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-3xl gradient-brand opacity-40" />
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl gradient-brand shadow-glow">
          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">FoundrIQ is thinking</h2>
      <p className="mt-2 text-sm text-muted-foreground">Building your investor-ready blueprint. This can take a moment.</p>
      <div className="mt-8 h-6 overflow-hidden">
        <div key={line} className="text-sm font-medium text-foreground animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          {line}
        </div>
      </div>
      {slow && (
        <div className="mt-8 max-w-md rounded-xl border border-border bg-elevated p-4">
          <p className="text-sm text-foreground">Gemini is taking longer than expected.</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" onClick={onRetry} className="gradient-brand text-primary-foreground">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AiErrorScreen({ message, onRetry, onCancel }: { message: string; onRetry: () => void; onCancel: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">We couldn't finish your blueprint</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={onRetry} className="gradient-brand text-primary-foreground shadow-glow">
          <RotateCcw className="mr-2 h-4 w-4" /> Retry
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
      </div>
    </div>
  );
}

function BlueprintView({ blueprint: b, onReset }: { blueprint: StartupBlueprint; onReset: () => void }) {
  const sections: { title: string; body: React.ReactNode }[] = [
    { title: "Tagline", body: <p>{b.tagline}</p> },
    { title: "Elevator pitch", body: <p>{b.elevatorPitch}</p> },
    { title: "Problem statement", body: <p>{b.problemStatement}</p> },
    { title: "Solution", body: <p>{b.solution}</p> },
    { title: "Target audience", body: <p>{b.targetAudience}</p> },
    { title: "Customer persona", body: <p>{b.customerPersona}</p> },
    { title: "Market opportunity", body: <p>{b.marketOpportunity}</p> },
    { title: "Competitor analysis", body: <p>{b.competitorAnalysis}</p> },
    ...(b.uniqueSellingProposition ? [{ title: "Unique selling proposition", body: <p>{b.uniqueSellingProposition}</p> }] : []),
    {
      title: "SWOT analysis",
      body: (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["strengths", "weaknesses", "opportunities", "threats"] as const).map(k => (
            <div key={k} className="rounded-md border border-border bg-elevated p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</div>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {(b.swotAnalysis?.[k] ?? []).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ),
    },
    { title: "Business model", body: <p>{b.businessModel}</p> },
    { title: "Revenue model", body: <p>{b.revenueModel}</p> },
    { title: "Pricing suggestions", body: <p>{b.pricingSuggestions}</p> },
    ...(b.estimatedStartupCost ? [{ title: "Estimated startup cost", body: <p>{b.estimatedStartupCost}</p> }] : []),
    { title: "Branding strategy", body: <p>{b.brandingStrategy}</p> },
    ...(b.brandIdentity ? [{ title: "Brand identity", body: <p>{b.brandIdentity}</p> }] : []),
    ...(b.logoConcept ? [{ title: "Logo concept", body: <p>{b.logoConcept}</p> }] : []),
    ...(b.colorPalette && b.colorPalette.length ? [{
      title: "Color palette",
      body: (
        <div className="flex flex-wrap gap-2">
          {b.colorPalette.map((c, i) => {
            const hex = c.match(/#[0-9a-fA-F]{3,8}/)?.[0];
            return (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-elevated px-2 py-1.5 text-xs">
                <span className="h-4 w-4 rounded" style={{ background: hex ?? "#888" }} />
                <span>{c}</span>
              </div>
            );
          })}
        </div>
      ),
    }] : []),
    { title: "Marketing strategy", body: <p>{b.marketingStrategy}</p> },
    { title: "Launch roadmap", body: <p>{b.launchRoadmap}</p> },
    { title: "Financial estimate", body: <p>{b.financialEstimate}</p> },
    { title: "Risks", body: <ul className="list-disc space-y-1 pl-5">{(Array.isArray(b.risks) ? b.risks : []).map((x, i) => <li key={i}>{x}</li>)}</ul> },
    ...(Array.isArray(b.growthOpportunities) && b.growthOpportunities.length ? [{
      title: "Growth opportunities",
      body: <ul className="list-disc space-y-1 pl-5">{b.growthOpportunities.map((x, i) => <li key={i}>{x}</li>)}</ul>,
    }] : []),
    ...(b.investorPitchSummary ? [{ title: "Investor pitch summary", body: <p>{b.investorPitchSummary}</p> }] : []),
    { title: "Recommendations", body: <ul className="list-disc space-y-1 pl-5">{(Array.isArray(b.recommendations) ? b.recommendations : []).map((x, i) => <li key={i}>{x}</li>)}</ul> },
    { title: "Next steps", body: <ul className="list-disc space-y-1 pl-5">{(Array.isArray(b.nextSteps) ? b.nextSteps : []).map((x, i) => <li key={i}>{x}</li>)}</ul> },
  ];
  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="rounded-2xl border border-border gradient-brand p-6 text-primary-foreground shadow-glow">
        <div className="text-xs uppercase tracking-widest opacity-80">Your blueprint</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{b.startupName}</h1>
        <p className="mt-2 text-sm opacity-90">{b.tagline}</p>
      </div>
      <div className="mt-6 space-y-4">
        {sections.map(sec => (
          <div key={sec.title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{sec.title}</h3>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{sec.body}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" /> Start over
        </Button>
      </div>
    </div>
  );
}
