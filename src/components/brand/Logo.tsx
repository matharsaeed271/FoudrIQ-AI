import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 L4 7 L12 12 L20 7 Z" />
          <path d="M4 12 L12 17 L20 12" />
          <path d="M4 17 L12 22 L20 17" />
        </svg>
      </div>
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight">
          Foundr<span className="text-primary">IQ</span>
          <span className="ml-1 text-muted-foreground">AI</span>
        </span>
      )}
    </div>
  );
}
