import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard, FolderKanban, Sparkles, Bot, FileBarChart2,
  History, LayoutTemplate, Settings, LifeBuoy, LogOut,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAvatarUrl } from "@/hooks/use-profile";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/create", label: "Create Startup", icon: Sparkles },
  { to: "/app/workspace", label: "AI Workspace", icon: Bot },
  { to: "/app/reports", label: "Reports", icon: FileBarChart2 },
  { to: "/app/history", label: "History", icon: History },
  { to: "/app/templates", label: "Templates", icon: LayoutTemplate },
];

const bottomNav = [
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help", icon: LifeBuoy },
];

const STORAGE_KEY = "nexora.sidebar.collapsed";

export function AppSidebar() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const fullName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "Founder";
  const initial = fullName.charAt(0).toUpperCase();
  const emailDisplay = profile?.email || user?.email;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="relative flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/app" className="flex items-center overflow-hidden">
          {collapsed ? (
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-sm font-bold text-primary-foreground">
              N
            </div>
          ) : (
            <Logo />
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-card transition-colors hover:text-foreground lg:grid"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        {!collapsed && (
          <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
        )}
        <ul className="space-y-0.5">
          {nav.map(item => (
            <NavItem
              key={item.to}
              item={item}
              active={isActive(item.to, item.exact)}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <ul className="space-y-0.5">
          {bottomNav.map(item => (
            <NavItem key={item.to} item={item} active={isActive(item.to)} collapsed={collapsed} />
          ))}
        </ul>
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <div
          className={cn(
            "mt-3 flex items-center gap-3 rounded-lg border border-sidebar-border bg-card p-2",
            collapsed && "justify-center border-0 bg-transparent p-0"
          )}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full gradient-brand text-xs font-semibold text-primary-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{fullName}</div>
              {emailDisplay && <div className="truncate text-[11px] text-muted-foreground">{emailDisplay}</div>}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  item, active, collapsed,
}: {
  item: { to: string; label: string; icon: any };
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
          active
            ? "bg-sidebar-accent text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
        )}
        <Icon className={cn("h-[15px] w-[15px] shrink-0", active && "text-primary")} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      </Link>
    </li>
  );
}
