import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, FolderKanban, FileBarChart2, LayoutTemplate, Settings, LayoutDashboard, Bot, Plus } from "lucide-react";
import { toast } from "sonner";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate();
  const go = (to: string) => { onOpenChange(false); nav({ to }); };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or type a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/app/create")}><Plus className="mr-2 h-4 w-4" /> New Startup Blueprint</CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); toast.success("AI Assistant activated"); }}><Sparkles className="mr-2 h-4 w-4" /> Ask FoundrIQ AI…</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/app")}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/app/projects")}><FolderKanban className="mr-2 h-4 w-4" /> Projects</CommandItem>
          <CommandItem onSelect={() => go("/app/workspace")}><Bot className="mr-2 h-4 w-4" /> AI Workspace</CommandItem>
          <CommandItem onSelect={() => go("/app/reports")}><FileBarChart2 className="mr-2 h-4 w-4" /> Reports</CommandItem>
          <CommandItem onSelect={() => go("/app/templates")}><LayoutTemplate className="mr-2 h-4 w-4" /> Templates</CommandItem>
          <CommandItem onSelect={() => go("/app/settings")}><Settings className="mr-2 h-4 w-4" /> Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
