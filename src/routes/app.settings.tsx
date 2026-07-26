import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Sparkles, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useAvatarUrl, type ProfileUpdate } from "@/hooks/use-profile";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FoundrIQ AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Settings,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  role: z.string().trim().max(100).optional().or(z.literal("")),
});

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];

function friendlyError(e: unknown, fallback = "Something went wrong. Please try again.") {
  const msg = (e as { message?: string })?.message ?? "";
  if (/permission|denied|jwt/i.test(msg)) return "You don't have permission to do that.";
  if (/network|fetch/i.test(msg)) return "Network error. Please check your connection.";
  if (/quota|exceed|limit/i.test(msg)) return "Storage quota exceeded.";
  return fallback;
}

function Settings() {
  const { user } = useAuth();
  const { profile, loading, update } = useProfile();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  if (loading || !profile) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, workspace, and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileCard
            profile={profile}
            avatarUrl={avatarUrl}
            userId={user?.id ?? ""}
            update={update}
          />
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <WorkspaceCard profile={profile} update={update} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingCard email={user?.email ?? ""} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsCard profile={profile} update={update} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Separator />
      {children}
    </section>
  );
}

function ProfileCard({
  profile,
  avatarUrl,
  userId,
  update,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>["profile"]>;
  avatarUrl: string | null;
  userId: string;
  update: (patch: ProfileUpdate) => Promise<unknown>;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [role, setRole] = useState(profile.role ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile.full_name ?? "");
    setCompany(profile.company ?? "");
    setRole(profile.role ?? "");
  }, [profile.id, profile.full_name, profile.company, profile.role]);

  const dirty =
    (profile.full_name ?? "") !== fullName ||
    (profile.company ?? "") !== company ||
    (profile.role ?? "") !== role;

  const handleSave = async () => {
    const parsed = profileSchema.safeParse({ full_name: fullName, company, role });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    try {
      await update({
        full_name: parsed.data.full_name,
        company: parsed.data.company || null,
        role: parsed.data.role || null,
      });
      toast.success("Profile saved");
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile.full_name ?? "");
    setCompany(profile.company ?? "");
    setRole(profile.role ?? "");
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return toast.error("Only PNG, JPG or JPEG images are allowed.");
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return toast.error("Image must be under 2MB.");
    }

    setUploading(true);
    try {
      // Remove previous avatar objects for this user (folder = userId)
      const { data: existing } = await supabase.storage.from("avatars").list(userId);
      if (existing && existing.length) {
        await supabase.storage
          .from("avatars")
          .remove(existing.map((f) => `${userId}/${f.name}`));
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      await update({ avatar_url: path });
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(friendlyError(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const initial = (fullName || profile.email || "?").charAt(0).toUpperCase();

  return (
    <Card title="Profile" desc="Your public identity in FoundrIQ.">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full gradient-brand">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-semibold text-primary-foreground">
              {initial}
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" size="sm" onClick={handleFilePick} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Change avatar
              </>
            )}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Email" value={profile.email ?? ""} disabled />
        <Field label="Company" value={company} onChange={setCompany} />
        <Field label="Role" value={role} onChange={setRole} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={handleCancel} disabled={!dirty || saving}>
          Cancel
        </Button>
        <Button
          className="gradient-brand text-primary-foreground"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="bg-elevated"
      />
    </div>
  );
}

function WorkspaceCard({
  profile,
  update,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>["profile"]>;
  update: (patch: ProfileUpdate) => Promise<unknown>;
}) {
  const toggles: {
    key: keyof ProfileUpdate;
    label: string;
    desc: string;
    value: boolean;
  }[] = [
    { key: "dark_mode", label: "Dark mode", desc: "Enable the premium dark interface.", value: profile.dark_mode },
    { key: "compact_layout", label: "Compact layout", desc: "Denser spacing for large monitors.", value: profile.compact_layout },
    { key: "keyboard_shortcuts", label: "Keyboard shortcuts", desc: "Enable Cmd+K and other hotkeys.", value: profile.keyboard_shortcuts },
    { key: "ai_autopilot", label: "AI autopilot", desc: "Let FoundrIQ proactively suggest next actions.", value: profile.ai_autopilot },
  ];
  return (
    <Card title="Preferences" desc="How FoundrIQ behaves for you.">
      {toggles.map((t) => (
        <ToggleRow
          key={String(t.key)}
          label={t.label}
          desc={t.desc}
          checked={t.value}
          onChange={async (v) => {
            try {
              await update({ [t.key]: v } as ProfileUpdate);
              // Apply dark mode immediately
              if (t.key === "dark_mode") {
                document.documentElement.classList.toggle("dark", v);
              }
              if (t.key === "compact_layout") {
                document.documentElement.classList.toggle("compact", v);
              }
              toast.success("Preference updated");
            } catch (e) {
              toast.error(friendlyError(e));
            }
          }}
        />
      ))}
    </Card>
  );
}

function NotificationsCard({
  profile,
  update,
}: {
  profile: NonNullable<ReturnType<typeof useProfile>["profile"]>;
  update: (patch: ProfileUpdate) => Promise<unknown>;
}) {
  const toggles: {
    key: keyof ProfileUpdate;
    label: string;
    desc: string;
    value: boolean;
  }[] = [
    { key: "notify_blueprints", label: "Blueprint completions", desc: "When an AI-generated blueprint is ready.", value: profile.notify_blueprints },
    { key: "notify_weekly_reports", label: "Weekly reports", desc: "Summary every Monday morning.", value: profile.notify_weekly_reports },
    { key: "notify_product_updates", label: "Product updates", desc: "New features and improvements.", value: profile.notify_product_updates },
    { key: "notify_marketing", label: "Marketing emails", desc: "Occasional case studies and tips.", value: profile.notify_marketing },
  ];
  return (
    <Card title="Notifications" desc="Choose what pings you.">
      {toggles.map((t) => (
        <ToggleRow
          key={String(t.key)}
          label={t.label}
          desc={t.desc}
          checked={t.value}
          onChange={async (v) => {
            try {
              await update({ [t.key]: v } as ProfileUpdate);
              toast.success("Preference updated");
            } catch (e) {
              toast.error(friendlyError(e));
            }
          }}
        />
      ))}
    </Card>
  );
}

function BillingCard({ email }: { email: string }) {
  return (
    <Card title="Plan" desc="Your current subscription.">
      <div className="rounded-xl border border-border bg-elevated/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary">Free Plan</Badge>
            <div className="mt-3 text-2xl font-semibold">
              $0<span className="text-sm text-muted-foreground">/month</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {email ? `Signed in as ${email}` : "Get started with FoundrIQ"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">AI credits used</div>
            <div className="text-2xl font-semibold">
              0 <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Subscription: Inactive</div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button
            className="gradient-brand text-primary-foreground shadow-glow opacity-60 cursor-not-allowed"
            disabled
            aria-disabled
          >
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade (coming soon)
          </Button>
          <Button variant="outline" disabled>
            Manage billing
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
