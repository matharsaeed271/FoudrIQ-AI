import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listStartups, renameStartup, deleteStartup } from "@/lib/startups.functions";
import { StatusBadge, ConfidenceBadge, type StartupStatus } from "@/components/app/StatusBadge";
import { getExportedSet } from "@/lib/exports";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "History — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: History,
});

type Row = {
  id: string;
  name: string;
  industry: string | null;
  problem: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
};

type SortKey = "newest" | "oldest" | "industry" | "score";

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function History() {
  const listFn = useServerFn(listStartups);
  const renameFn = useServerFn(renameStartup);
  const deleteFn = useServerFn(deleteStartup);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [renameTarget, setRenameTarget] = useState<Row | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [exported, setExported] = useState<Set<string>>(() => getExportedSet());

  useEffect(() => {
    const onChange = () => setExported(getExportedSet());
    window.addEventListener("foundriq:exports-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("foundriq:exports-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const statusFor = (r: Row): StartupStatus => {
    if (exported.has(r.id)) return "exported";
    if (r.problem || r.score != null) return "completed";
    return "draft";
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["startups"],
    queryFn: () => listFn(),
  });

  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) => renameFn({ data: v }),
    onSuccess: () => {
      toast.success("Renamed.");
      setRenameTarget(null);
      qc.invalidateQueries({ queryKey: ["startups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["startups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as Row[];
    const query = q.trim().toLowerCase();
    const filtered = query
      ? list.filter(r =>
          r.name.toLowerCase().includes(query) ||
          (r.industry ?? "").toLowerCase().includes(query) ||
          (r.problem ?? "").toLowerCase().includes(query),
        )
      : list;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "industry": return (a.industry ?? "").localeCompare(b.industry ?? "");
        case "score": return (b.score ?? -1) - (a.score ?? -1);
        default: return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [data, q, sort]);

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your generated startup blueprints.</p>
        </div>
        <Link to="/app/create">
          <Button className="gradient-brand text-primary-foreground shadow-glow">
            <Plus className="mr-2 h-4 w-4" /> New startup
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search startups…"
            aria-label="Search startups"
            className="pl-9 bg-card"
          />
        </div>
        <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
          <SelectTrigger className="w-44 bg-card" aria-label="Sort startups">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="industry">Industry</SelectItem>
            <SelectItem value="score">Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your startups…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">We couldn't load your startups.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">Try again</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Plus className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold">
            {q ? "No startups match your search" : "No startups yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {q ? "Try a different search or sort." : "Generate your first blueprint to see it here."}
          </p>
          {!q && (
            <Link to="/app/create" className="mt-6 inline-block">
              <Button className="gradient-brand text-primary-foreground">Create startup</Button>
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map(r => (
            <li key={r.id} className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{r.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {r.problem ?? "No problem description."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={statusFor(r)} />
                  <ConfidenceBadge score={r.score} />
                  {r.industry && (
                    <Badge variant="outline" className="border-border text-[10px]">
                      {r.industry.split(",")[0]}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Created {fmt(r.created_at)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Rename ${r.name}`}
                    onClick={() => { setRenameTarget(r); setRenameValue(r.name); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename startup</DialogTitle>
            <DialogDescription>Give this blueprint a new name.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            placeholder="Startup name"
            autoFocus
            maxLength={120}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button
              onClick={() => renameTarget && rename.mutate({ id: renameTarget.id, name: renameValue })}
              disabled={rename.isPending || !renameValue.trim()}
              className="gradient-brand text-primary-foreground"
            >
              {rename.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this startup?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (deleteTarget) remove.mutate(deleteTarget.id); }}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
