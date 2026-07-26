import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Search, Trash2, Eye, Loader2, Printer, Copy, FileDown } from "lucide-react";
import { listStartups, getStartup, deleteStartup } from "@/lib/startups.functions";
import type { StartupBlueprint } from "@/lib/ai.functions";
import { buildMarkdown, buildPlainText, generatePdf, downloadBlob, safeFilename } from "@/lib/report";
import { StatusBadge, ConfidenceBadge, type StartupStatus } from "@/components/app/StatusBadge";
import { getExportedSet, markExported } from "@/lib/exports";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: Reports,
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

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Reports() {
  const listFn = useServerFn(listStartups);
  const getFn = useServerFn(getStartup);
  const deleteFn = useServerFn(deleteStartup);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
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

  const viewQuery = useQuery({
    queryKey: ["startup", viewId],
    queryFn: () => getFn({ data: { id: viewId! } }),
    enabled: !!viewId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Report deleted.");
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
          (r.industry ?? "").toLowerCase().includes(query),
        )
      : list;
    return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [data, q]);

  async function handleDownload(row: Row) {
    setDownloadingId(row.id);
    try {
      const full = await getFn({ data: { id: row.id } });
      const blueprint = full.report as unknown as StartupBlueprint;
      const blob = await generatePdf(blueprint, {
        name: full.name,
        score: full.score,
        createdAt: full.created_at,
      });
      downloadBlob(safeFilename(full.name, "pdf"), blob);
      markExported(full.id);
      toast.success("PDF downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every startup blueprint you've generated with FoundrIQ AI.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search reports…"
          aria-label="Search reports"
          className="pl-9 bg-card"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-sm font-semibold">Your reports</h2>
          <span className="text-xs text-muted-foreground">{rows.length} total</span>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">We couldn't load your reports.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Try again
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">
              {q ? "No reports match your search" : "No reports yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? "Try a different keyword." : "Generate your first startup blueprint to see it here."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(r => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-elevated/40">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(r.created_at)}
                    {r.industry ? ` · ${r.industry}` : ""}
                  </div>
                </div>
                <StatusBadge status={statusFor(r)} />
                <ConfidenceBadge score={r.score} />

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setViewId(r.id)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(r)}
                    disabled={downloadingId === r.id}
                  >
                    {downloadingId === r.id
                      ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      : <Download className="mr-1.5 h-3.5 w-3.5" />}
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete report"
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReportViewer
        open={!!viewId}
        onOpenChange={(o) => !o && setViewId(null)}
        loading={viewQuery.isLoading}
        row={viewQuery.data ?? null}
        onDownload={async () => {
          if (!viewQuery.data) return;
          const full = viewQuery.data;
          setDownloadingId(full.id);
          try {
            const blob = await generatePdf(full.report as unknown as StartupBlueprint, {
              name: full.name, score: full.score, createdAt: full.created_at,
            });
            downloadBlob(safeFilename(full.name, "pdf"), blob);
            markExported(full.id);
            toast.success("PDF downloaded.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to generate PDF.");
          } finally {
            setDownloadingId(null);
          }
        }}
        downloading={!!(viewQuery.data && downloadingId === viewQuery.data.id)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
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

/* -------------------- Viewer -------------------- */

type FullRow = {
  id: string;
  name: string;
  score: number | null;
  created_at: string;
  report: unknown;
};

function ReportViewer({
  open, onOpenChange, loading, row, onDownload, downloading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  row: FullRow | null;
  onDownload: () => void;
  downloading: boolean;
}) {
  const b = (row?.report ?? null) as StartupBlueprint | null;
  const meta = row ? { name: row.name, score: row.score, createdAt: row.created_at } : null;

  const handlePrint = () => {
    if (!b || !meta) return;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) { toast.error("Popup blocked. Allow popups to print."); return; }
    const html = buildMarkdown(b, meta)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/^- (.*)$/gm, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");
    w.document.write(`<!doctype html><html><head><title>${meta.name}</title>
      <style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:780px;margin:40px auto;padding:0 24px;color:#111;line-height:1.55}
      h1{font-size:28px;margin:0 0 8px}h2{font-size:16px;margin-top:28px;border-bottom:1px solid #ddd;padding-bottom:4px}
      li{margin:4px 0}p{margin:8px 0}</style></head><body><p>${html}</p>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  const handleCopy = async () => {
    if (!b || !meta) return;
    try {
      await navigator.clipboard.writeText(buildPlainText(b, meta));
      toast.success("Report copied to clipboard.");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  const handleMarkdown = () => {
    if (!b || !meta) return;
    const md = buildMarkdown(b, meta);
    downloadBlob(safeFilename(meta.name, "md"), new Blob([md], { type: "text/markdown" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="text-xl">{row?.name ?? "Report"}</DialogTitle>
          <DialogDescription>
            {row ? `Generated ${fmt(row.created_at)}${row.score != null ? ` · Score ${row.score}/100` : ""}` : ""}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            {loading || !b || !meta ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading report…
              </div>
            ) : (
              <ReportBody b={b} />
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-wrap gap-2 border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!b}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkdown} disabled={!b}>
            <FileDown className="mr-1.5 h-4 w-4" /> Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!b}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button
            size="sm"
            className="gradient-brand text-primary-foreground shadow-glow"
            onClick={onDownload}
            disabled={!b || downloading}
          >
            {downloading
              ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              : <Download className="mr-1.5 h-4 w-4" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{children}</div>
    </section>
  );
}

function List({ items }: { items: unknown }) {
  const arr = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
  if (!arr.length) return <p className="text-muted-foreground">—</p>;
  return (
    <ul className="list-disc pl-5 space-y-1">
      {arr.map((v, i) => <li key={i}>{v}</li>)}
    </ul>
  );
}

function ReportBody({ b }: { b: StartupBlueprint }) {
  const swot = b.swotAnalysis ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  return (
    <article className="space-y-1">
      {b.tagline && <p className="italic text-muted-foreground">{b.tagline}</p>}
      {b.elevatorPitch && <Section title="Executive Summary">{b.elevatorPitch}</Section>}
      {b.problemStatement && <Section title="Problem">{b.problemStatement}</Section>}
      {b.solution && <Section title="Solution">{b.solution}</Section>}
      {b.targetAudience && <Section title="Target Audience">{b.targetAudience}</Section>}
      {b.customerPersona && <Section title="Customer Persona">{b.customerPersona}</Section>}
      {b.marketOpportunity && <Section title="Market Opportunity">{b.marketOpportunity}</Section>}
      {b.competitorAnalysis && <Section title="Competitor Analysis">{b.competitorAnalysis}</Section>}
      {b.uniqueSellingProposition && <Section title="Unique Value Proposition">{b.uniqueSellingProposition}</Section>}
      <Section title="SWOT Analysis">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><div className="font-medium mb-1">Strengths</div><List items={swot.strengths} /></div>
          <div><div className="font-medium mb-1">Weaknesses</div><List items={swot.weaknesses} /></div>
          <div><div className="font-medium mb-1">Opportunities</div><List items={swot.opportunities} /></div>
          <div><div className="font-medium mb-1">Threats</div><List items={swot.threats} /></div>
        </div>
      </Section>
      {b.businessModel && <Section title="Business Model">{b.businessModel}</Section>}
      {b.revenueModel && <Section title="Revenue Streams">{b.revenueModel}</Section>}
      {b.pricingSuggestions && <Section title="Pricing Strategy">{b.pricingSuggestions}</Section>}
      {b.estimatedStartupCost && <Section title="Estimated Startup Cost">{b.estimatedStartupCost}</Section>}
      {b.brandingStrategy && <Section title="Branding Strategy">{b.brandingStrategy}</Section>}
      {b.brandIdentity && <Section title="Brand Identity">{b.brandIdentity}</Section>}
      {b.logoConcept && <Section title="Logo Concept">{b.logoConcept}</Section>}
      {b.colorPalette?.length ? <Section title="Color Palette"><List items={b.colorPalette} /></Section> : null}
      {b.marketingStrategy && <Section title="Marketing Strategy">{b.marketingStrategy}</Section>}
      {b.launchRoadmap && <Section title="Implementation Roadmap">{b.launchRoadmap}</Section>}
      {b.financialEstimate && <Section title="Financial Estimate">{b.financialEstimate}</Section>}
      <Section title="Risk Analysis"><List items={b.risks} /></Section>
      {b.growthOpportunities ? <Section title="Growth Opportunities"><List items={b.growthOpportunities} /></Section> : null}
      {b.investorPitchSummary && <Section title="Investor Pitch Summary">{b.investorPitchSummary}</Section>}
      <Section title="AI Recommendations"><List items={b.recommendations} /></Section>
      <Section title="Launch Checklist"><List items={b.nextSteps} /></Section>
    </article>
  );
}
