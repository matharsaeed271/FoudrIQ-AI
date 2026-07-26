import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/Logo";
import {
  ArrowRight, Sparkles, Brain, Rocket, LineChart, Palette, FileText,
  Zap, Check, Star, Twitter, Github, Linkedin, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoundrIQ AI — From Idea to Investor-Ready Startup" },
      { name: "description", content: "Your AI Co-Founder. Transform any idea into a launch-ready startup with AI research, branding, planning, and automation." },
    ],
  }),
  component: Landing,
});

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth">
            <Button size="sm" className="gradient-brand text-primary-foreground shadow-glow">
              Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
        <Badge variant="outline" className="mb-6 gap-2 rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-primary">
          <Sparkles className="h-3 w-3" /> Introducing FoundrIQ 2.0 — AI Co-Founder
        </Badge>
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
          <span className="gradient-text">From idea to</span>
          <br />
          investor-ready startup.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          FoundrIQ is the AI Co-Founder that transforms your idea into a launch-ready business — market research, branding, business plans, and go-to-market — in a single premium workspace.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow">
              Start building free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-border bg-card">
            Watch 90-sec demo
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card. 3 startup blueprints free.</p>

        <div className="mx-auto mt-20 max-w-6xl">
          <div className="relative rounded-2xl border border-border bg-card/70 p-2 shadow-elegant backdrop-blur">
            <div className="rounded-xl border border-border/60 bg-background overflow-hidden">
              <MockDashboard />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs uppercase tracking-widest text-muted-foreground">
          <span>Trusted by founders from</span>
          <span className="font-semibold text-foreground/70">Y Combinator</span>
          <span className="font-semibold text-foreground/70">Techstars</span>
          <span className="font-semibold text-foreground/70">On Deck</span>
          <span className="font-semibold text-foreground/70">Antler</span>
          <span className="font-semibold text-foreground/70">Sequoia Arc</span>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="grid grid-cols-12 gap-0 h-[420px] text-left">
      <aside className="col-span-3 border-r border-border/60 bg-sidebar/60 p-4">
        <div className="flex items-center gap-2 pb-4">
          <div className="h-6 w-6 rounded gradient-brand" />
          <span className="text-xs font-semibold">FoundrIQ</span>
        </div>
        {["Dashboard","Projects","Create Startup","AI Workspace","Reports","Templates"].map((l, i) => (
          <div key={l} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-xs", i === 0 ? "bg-primary/15 text-foreground" : "text-muted-foreground")}>
            <div className="h-3 w-3 rounded-sm bg-current opacity-40" />
            {l}
          </div>
        ))}
      </aside>
      <div className="col-span-9 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-muted-foreground">Project</div>
            <div className="text-sm font-semibold">Nimbus — AI accounting for SMBs</div>
          </div>
          <Badge className="bg-success/20 text-success border-success/30">Blueprint Ready</Badge>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: "Health", v: "92" }, { l: "Market Fit", v: "A+" },
            { l: "TAM", v: "$14B" }, { l: "Runway", v: "18 mo" },
          ].map(k => (
            <div key={k.l} className="rounded-lg border border-border bg-elevated/60 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">{k.l}</div>
              <div className="mt-1 text-xl font-semibold">{k.v}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {["Market Research","Brand Kit","Pitch Deck"].map(t => (
            <div key={t} className="rounded-lg border border-border bg-card p-3">
              <div className="text-xs font-medium">{t}</div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full gradient-brand" style={{ width: `${60 + Math.random()*35}%` }} />
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">Generated by FoundrIQ</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Brain, title: "AI Market Research", desc: "Instant deep-dive: TAM/SAM/SOM, competitor teardowns, personas, and trends." },
  { icon: Palette, title: "Brand Identity Kit", desc: "Names, logos, palettes, and voice. Ship a brand before you ship a product." },
  { icon: FileText, title: "Business Plan Generator", desc: "Investor-grade docs — from executive summary to financial model." },
  { icon: LineChart, title: "Go-to-Market Strategy", desc: "Channel plans, pricing, positioning, and 90-day launch roadmap." },
  { icon: Rocket, title: "Pitch Deck Builder", desc: "10-slide narrative crafted for pre-seed to Series A investors." },
  { icon: Zap, title: "Automation Workflows", desc: "One-click landing pages, email sequences, and integrations." },
];

function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-border bg-card">Capabilities</Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Everything a founder needs.<br /><span className="text-muted-foreground">Nothing they don't.</span></h2>
          <p className="mt-4 text-muted-foreground">A single workspace replacing a stack of tools, consultants, and cofounders.</p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "01", t: "Describe your idea", d: "One sentence is enough. FoundrIQ asks smart follow-ups to sharpen the concept." },
    { n: "02", t: "AI runs deep research", d: "Market data, competitors, personas, positioning — synthesized in minutes." },
    { n: "03", t: "Blueprint generated", d: "Brand, business plan, go-to-market, and pitch deck — all interlinked." },
    { n: "04", t: "Launch & iterate", d: "Automations spin up landing pages, waitlists, and outreach on day one." },
  ];
  return (
    <section id="workflow" className="relative border-y border-border bg-surface/40 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-border bg-card">The Workflow</Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Four steps. One weekend. A real startup.</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-mono text-primary">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              {i < steps.length - 1 && <div className="absolute right-[-14px] top-1/2 hidden h-px w-7 bg-gradient-to-r from-primary/60 to-transparent lg:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "FoundrIQ built our seed-round narrative in an afternoon. Our lead investor called it 'unusually crisp'.", a: "Aria Chen", r: "Founder, Nimbus" },
    { q: "It's like hiring a McKinsey team, a brand studio, and a growth marketer — for the price of a coffee subscription.", a: "Marcus Vega", r: "Solo founder, Relay" },
    { q: "We went from Notion doc to shipped landing page and 200 waitlist signups in 72 hours.", a: "Priya Rao", r: "CEO, Fern Health" },
  ];
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map(t => (
            <figure key={t.a} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">"{t.q}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full gradient-brand" />
                <div>
                  <div className="text-sm font-medium">{t.a}</div>
                  <div className="text-xs text-muted-foreground">{t.r}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Starter", price: "Free", desc: "For exploring your first idea.", features: ["3 startup blueprints", "Basic market research", "Brand starter kit"], cta: "Start free" },
    { name: "Founder", price: "$29", per: "/mo", desc: "For serious builders.", features: ["Unlimited blueprints", "Deep AI research", "Pitch deck builder", "Automation workflows", "Priority support"], cta: "Start Founder", featured: true },
    { name: "Team", price: "$99", per: "/mo", desc: "For collaborating cofounders.", features: ["Everything in Founder", "Team workspace", "SSO & audit logs", "Dedicated success manager"], cta: "Start Team" },
  ];
  return (
    <section id="pricing" className="border-t border-border py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 border-border bg-card">Pricing</Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Simple. Transparent. Founder-friendly.</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map(t => (
            <div key={t.name} className={cn("relative rounded-2xl border p-6", t.featured ? "border-primary/50 bg-card shadow-glow" : "border-border bg-card")}>
              {t.featured && <Badge className="absolute -top-3 left-6 gradient-brand text-primary-foreground">Most popular</Badge>}
              <div className="text-sm font-medium">{t.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
                {t.per && <span className="text-sm text-muted-foreground">{t.per}</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="mt-8 block">
                <Button className={cn("w-full", t.featured ? "gradient-brand text-primary-foreground shadow-glow" : "")} variant={t.featured ? "default" : "outline"}>{t.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is FoundrIQ replacing my cofounder?", a: "No — it augments you. FoundrIQ handles the research, structure, and drafting so you focus on judgment, relationships, and execution." },
    { q: "How is this different from ChatGPT?", a: "FoundrIQ is a purpose-built workspace with domain agents, structured outputs, and integrated deliverables — not a blank chat window." },
    { q: "Can I export my blueprint?", a: "Yes. Every artifact exports to PDF, Notion, and Google Docs. Pitch decks export to Keynote and PowerPoint." },
    { q: "Is my idea safe?", a: "Absolutely. Data is encrypted at rest and in transit. We never train models on your private data." },
    { q: "Do you offer a founder discount?", a: "Yes — verified students and pre-revenue founders get 50% off Founder for 12 months." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border py-32">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-4xl font-semibold tracking-tight md:text-5xl">Questions, answered.</h2>
        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((it, i) => (
            <button key={it.q} onClick={() => setOpen(open === i ? null : i)} className="w-full px-6 py-5 text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{it.q}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open === i && "rotate-180")} />
              </div>
              {open === i && <p className="mt-3 text-sm text-muted-foreground">{it.a}</p>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl font-semibold tracking-tight md:text-6xl gradient-text">Your startup, in a weekend.</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Join thousands of founders shipping faster with an AI co-founder in their corner.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow">Start building free <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">From idea to investor-ready startup. Built for the next generation of founders.</p>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} FoundrIQ AI. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Workflow />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
