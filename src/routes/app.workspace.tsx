import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";
import { Sparkles, Send, Bot, User, Paperclip, Brain, FileText, Palette, Rocket, LineChart, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI, type ChatTurn } from "@/lib/ai.functions";
import { toast } from "sonner";


export const Route = createFileRoute("/app/workspace")({
  head: () => ({ meta: [{ title: "AI Workspace — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: Workspace,
});

type Msg = { role: "user" | "ai"; text: string };

const suggestions = [
  { icon: Brain, t: "Analyze my top 3 competitors" },
  { icon: LineChart, t: "Estimate TAM/SAM/SOM" },
  { icon: FileText, t: "Draft an executive summary" },
  { icon: Palette, t: "Suggest 5 brand name options" },
  { icon: Rocket, t: "Build a 90-day GTM plan" },
];

function Workspace() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hi — I'm Nexora AI, your startup co-founder. What are we working on today?" },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [slow, setSlow] = useState(false);
  const [status, setStatus] = useState<"connected" | "generating" | "failed">("connected");
  const [streamingText, setStreamingText] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const runChat = useServerFn(chatWithAI);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const slowTimer = useRef<number | null>(null);
  const streamTimer = useRef<number | null>(null);
  const lastUserRef = useRef<string>("");

  const scrollDown = () => setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);

  const revealText = (full: string) =>
    new Promise<void>(resolve => {
      let i = 0;
      setStreamingText("");
      if (streamTimer.current) clearInterval(streamTimer.current);
      const step = Math.max(2, Math.ceil(full.length / 220));
      streamTimer.current = window.setInterval(() => {
        i = Math.min(full.length, i + step);
        setStreamingText(full.slice(0, i));
        scrollDown();
        if (i >= full.length) {
          if (streamTimer.current) clearInterval(streamTimer.current);
          resolve();
        }
      }, 20);
    });

  const runSend = async (text: string, history: Msg[]) => {
    cancelRef.current = { cancelled: false };
    const token = cancelRef.current;
    setThinking(true);
    setStatus("generating");
    setSlow(false);
    if (slowTimer.current) clearTimeout(slowTimer.current);
    slowTimer.current = window.setTimeout(() => { if (!token.cancelled) setSlow(true); }, 15_000);
    try {
      const historyForAI: ChatTurn[] = history.map(m => ({ role: m.role, text: m.text }));
      const { text: reply } = await runChat({ data: { history: historyForAI, message: text } });
      if (token.cancelled) return;
      setThinking(false);
      await revealText(reply);
      if (token.cancelled) return;
      setMsgs(m => [...m, { role: "ai", text: reply }]);
      setStreamingText("");
      setStatus("connected");
      scrollDown();
    } catch (err) {
      if (token.cancelled) return;
      const msg = err instanceof Error ? err.message : "Something went wrong. Please retry.";
      toast.error(msg);
      setMsgs(m => [...m, { role: "ai", text: `⚠️ ${msg}` }]);
      setStatus("failed");
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlow(false);
      setThinking(false);
    }
  };

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || thinking) return;
    lastUserRef.current = t;
    const history = msgs;
    setMsgs(m => [...m, { role: "user", text: t }]);
    setInput("");
    scrollDown();
    void runSend(t, history);
  };

  const retryLast = () => {
    if (!lastUserRef.current) return;
    const history = msgs.filter((m, i, arr) => !(i === arr.length - 1 && m.role === "ai" && m.text.startsWith("⚠️")));
    void runSend(lastUserRef.current, history);
  };

  const cancel = () => {
    cancelRef.current.cancelled = true;
    if (slowTimer.current) clearTimeout(slowTimer.current);
    if (streamTimer.current) clearInterval(streamTimer.current);
    setThinking(false);
    setStreamingText("");
    setSlow(false);
    setStatus("connected");
  };

  const statusMeta = {
    connected: { color: "bg-success", label: "Gemini Connected" },
    generating: { color: "bg-warning", label: "Generating Response" },
    failed: { color: "bg-destructive", label: "Connection Failed" },
  }[status];



  return (
    <div className="grid h-[calc(100dvh-64px)] grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-0 flex-col">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-brand"><Bot className="h-4 w-4 text-primary-foreground" /></div>
            <div>
              <div className="text-sm font-semibold">Nexora AI Assistant</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.color, status !== "failed" && "animate-pulse")} />
                {statusMeta.label}
              </div>
            </div>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "ai" && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md gradient-brand"><Bot className="h-3.5 w-3.5 text-primary-foreground" /></div>}
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "gradient-brand text-primary-foreground" : "border border-border bg-card")}>
                {m.text}
              </div>
              {m.role === "user" && <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-elevated"><User className="h-3.5 w-3.5" /></div>}
            </div>
          ))}
          {streamingText && (
            <div className="flex gap-3">
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md gradient-brand"><Bot className="h-3.5 w-3.5 text-primary-foreground" /></div>
              <div className="max-w-[75%] rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                {streamingText}
                <span className="ml-0.5 inline-block h-3 w-1.5 -mb-0.5 animate-pulse bg-primary/70" />
              </div>
            </div>
          )}
          {thinking && !streamingText && (
            <div className="flex gap-3">
              <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md gradient-brand"><Bot className="h-3.5 w-3.5 text-primary-foreground" /></div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            </div>
          )}
          {slow && (
            <div className="flex justify-center">
              <div className="rounded-xl border border-border bg-elevated px-4 py-3 text-center text-xs">
                <div className="text-foreground">Gemini is taking longer than expected.</div>
                <div className="mt-2 flex justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={retryLast}><RotateCcw className="mr-1.5 h-3 w-3" /> Retry</Button>
                  <Button size="sm" variant="ghost" onClick={cancel}><X className="mr-1.5 h-3 w-3" /> Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>


        <div className="border-t border-border p-4">
          {msgs.length <= 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s.t} onClick={() => send(s.t)} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  <s.icon className="h-3 w-3" /> {s.t}
                </button>
              ))}
            </div>
          )}
          <div className="relative rounded-2xl border border-border bg-card p-2 focus-within:border-primary/40">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={2}
              placeholder="Ask FoundrIQ anything — from market research to your next pitch..."
              className="resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><Paperclip className="mr-1.5 h-3.5 w-3.5" /> Attach</Button>
              <Button size="sm" onClick={() => send()} disabled={!input.trim() || thinking} className="gradient-brand text-primary-foreground">
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send
              </Button>

            </div>
          </div>
        </div>
      </div>

      <aside className="hidden border-l border-border bg-sidebar/40 p-5 lg:block overflow-y-auto">
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active project</div>
            <div className="mt-2 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md gradient-brand" />
                <div>
                  <div className="text-sm font-medium">Nimbus</div>
                  <div className="text-xs text-muted-foreground">Fintech · Launch stage</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context</div>
            <div className="mt-2 space-y-2">
              {["Market Research (PDF)","Competitor Matrix","Brand Kit v3"].map(f => (
                <div key={f} className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-xs">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {f}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agents</div>
            <div className="mt-2 space-y-1.5">
              {[
                { icon: Brain, l: "Research Analyst" },
                { icon: Palette, l: "Brand Strategist" },
                { icon: LineChart, l: "Financial Modeler" },
                { icon: Rocket, l: "Growth Marketer" },
              ].map(a => (
                <div key={a.l} className="flex items-center gap-2 rounded-md p-2 text-xs hover:bg-elevated cursor-pointer">
                  <a.icon className="h-3.5 w-3.5 text-primary" /> {a.l}
                  <Badge variant="outline" className="ml-auto border-border text-[10px]">Ready</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
