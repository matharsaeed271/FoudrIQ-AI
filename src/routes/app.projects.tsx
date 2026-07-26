import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projects } from "@/lib/mock-data";
import { Plus, Search, LayoutGrid, List, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects")({
  head: () => ({ meta: [{ title: "Projects — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: Projects,
});

function Projects() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [stage, setStage] = useState("all");

  const filtered = projects.filter(p =>
    (stage === "all" || p.stage.toLowerCase() === stage) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.tagline.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your startup blueprints in one place.</p>
        </div>
        <Link to="/app/create">
          <Button className="gradient-brand text-primary-foreground shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects…" className="pl-9 bg-card" />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="ideation">Ideation</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="blueprint">Blueprint</SelectItem>
            <SelectItem value="launch">Launch</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md border border-border">
          <button onClick={() => setView("grid")} className={cn("p-2", view === "grid" ? "bg-elevated text-foreground" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={cn("p-2", view === "list" ? "bg-elevated text-foreground" : "text-muted-foreground")}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <div key={p.id} className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-lg gradient-brand text-primary-foreground font-semibold">{p.name[0]}</div>
                <StageBadge stage={p.stage} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.industry}</span><span>Health {p.health}</span>
              </div>
              <Progress value={p.progress} className="mt-2 h-1.5" />
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Updated {p.updated}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Project</th>
                <th className="p-4 font-medium">Industry</th>
                <th className="p-4 font-medium">Stage</th>
                <th className="p-4 font-medium">Progress</th>
                <th className="p-4 font-medium">Health</th>
                <th className="p-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="transition-colors hover:bg-elevated/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md gradient-brand" />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.tagline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.industry}</td>
                  <td className="p-4"><StageBadge stage={p.stage} /></td>
                  <td className="p-4"><Progress value={p.progress} className="h-1.5 w-32" /></td>
                  <td className="p-4">{p.health}</td>
                  <td className="p-4 text-muted-foreground">{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    Ideation: "bg-muted text-muted-foreground border-border",
    Research: "bg-warning/15 text-warning border-warning/30",
    Blueprint: "bg-primary/15 text-primary border-primary/30",
    Launch: "bg-success/15 text-success border-success/30",
  };
  return <Badge variant="outline" className={cn("text-[10px]", map[stage])}>{stage}</Badge>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Plus className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold">No projects match</h3>
      <p className="mt-1 text-sm text-muted-foreground">Try a different search or create your first startup blueprint.</p>
      <Link to="/app/create" className="mt-6 inline-block">
        <Button className="gradient-brand text-primary-foreground">Create startup</Button>
      </Link>
    </div>
  );
}
