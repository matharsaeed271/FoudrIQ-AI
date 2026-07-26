import { Button } from "@/components/ui/button";
import { Command, LogOut, Search, Sun, Moon, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAvatarUrl } from "@/hooks/use-profile";

export function TopNav({ onOpenCommand }: { onOpenCommand: () => void }) {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();

  const dark = profile?.dark_mode ?? true;

  const fullName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "there";
  const initial = fullName.charAt(0).toUpperCase();
  const email = profile?.email || user?.email || "";

  const toggleDark = async () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      if (profile) await update({ dark_mode: next });
    } catch {
      // Revert on failure
      document.documentElement.classList.toggle("dark", dark);
      toast.error("Couldn't save theme preference.");
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <button
        onClick={onOpenCommand}
        className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card md:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search projects, reports, actions…</span>
        <kbd className="hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono md:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleDark}>
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card p-0.5 pr-3 transition hover:bg-elevated">
              <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <span className="hidden max-w-[140px] truncate text-xs font-medium md:inline">{fullName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="text-sm font-medium truncate">{fullName}</div>
              {email && <div className="truncate text-xs text-muted-foreground">{email}</div>}
              <Badge variant="secondary" className="mt-2 text-[10px]">Free plan</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/settings"><UserIcon className="mr-2 h-4 w-4" /> Profile & Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
