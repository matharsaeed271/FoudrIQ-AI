import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Book, MessagesSquare, LifeBuoy, Search, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/help")({
  head: () => ({ meta: [{ title: "Help — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: Help,
});

const articles = [
  { t: "Getting started with your first blueprint", c: "Guides", read: "4 min" },
  { t: "How AI credits work", c: "Billing", read: "2 min" },
  { t: "Exporting to Notion, PDF, and Keynote", c: "Guides", read: "5 min" },
  { t: "Inviting cofounders to your workspace", c: "Teams", read: "3 min" },
  { t: "Understanding your Business Health Score", c: "AI", read: "6 min" },
  { t: "Security & data privacy at FoundrIQ", c: "Security", read: "4 min" },
];

function Help() {
  const [q, setQ] = useState("");
  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-8">
      <div className="rounded-3xl border border-border bg-card p-10 text-center grid-bg">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">How can we help, Alex?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Search the docs, browse guides, or chat with our team.</p>
        <div className="mx-auto mt-6 max-w-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles, e.g. 'pitch deck'…" className="h-12 pl-10 bg-background" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Book, t: "Documentation", d: "Guides, tutorials, and reference." },
          { icon: MessagesSquare, t: "Community", d: "Join thousands of founders." },
          { icon: LifeBuoy, t: "Contact support", d: "Get help from our team." },
        ].map(c => (
          <div key={c.t} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-glow">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><c.icon className="h-5 w-5" /></div>
            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{c.t}</h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <header className="border-b border-border p-5 text-sm font-semibold">Popular articles</header>
        <ul className="divide-y divide-border">
          {articles.filter(a => a.t.toLowerCase().includes(q.toLowerCase())).map(a => (
            <li key={a.t} className="flex items-center gap-4 p-5 hover:bg-elevated/40 cursor-pointer">
              <div className="flex-1">
                <div className="text-sm font-medium">{a.t}</div>
                <div className="text-xs text-muted-foreground">{a.read} read</div>
              </div>
              <Badge variant="outline" className="border-border">{a.c}</Badge>
              <Button variant="ghost" size="icon"><ArrowUpRight className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      </section>

      <Button className="gradient-brand text-primary-foreground shadow-glow">Contact support</Button>
    </div>
  );
}
