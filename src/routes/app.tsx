import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";
import { TopNav } from "@/components/app/TopNav";
import { CommandPalette } from "@/components/app/CommandPalette";
import { OnboardingTour } from "@/components/app/OnboardingTour";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";


export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({ meta: [{ title: "Workspace — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AppShell,
});

function AppShell() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { profile } = useProfile();

  // Apply user preferences (dark mode, compact layout) whenever profile loads/changes.
  useEffect(() => {
    if (!profile) return;
    document.documentElement.classList.toggle("dark", profile.dark_mode);
    document.documentElement.classList.toggle("compact", profile.compact_layout);
  }, [profile?.dark_mode, profile?.compact_layout]);

  useEffect(() => {
    const enabled = profile?.keyboard_shortcuts ?? true;
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profile?.keyboard_shortcuts]);


  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenCommand={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <OnboardingTour />
    </div>
  );
}
