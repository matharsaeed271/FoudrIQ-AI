import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { templates } from "@/lib/mock-data";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/templates")({
  head: () => ({ meta: [{ title: "Templates — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: Templates,
});

function Templates() {
  const [q, setQ] = useState("");
  const filtered = templates.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Battle-tested starting points from thousands of founders.</p>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search templates…" className="pl-9 bg-card" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(t => (
          <div key={t.name} className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
            <div className="mb-4 h-32 overflow-hidden rounded-lg gradient-brand opacity-90 grid-bg" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t.name}</h3>
              <Badge variant="outline" className="border-border text-[10px]">{t.tag}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t.uses.toLocaleString()} founders used this</span>
              <Button size="sm" onClick={() => toast.success(`${t.name} added to your workspace`)} className="gradient-brand text-primary-foreground">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Use
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
