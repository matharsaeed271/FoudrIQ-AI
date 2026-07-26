import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/brand/Logo";
import { ArrowRight, Loader2, Mail, Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — FoundrIQ AI" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .max(72)
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("signin");
  const [mode, setMode] = useState<"auth" | "forgot">("auth");

  // If already signed in, bounce to app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid")) return toast.error("Invalid email or password.");
      if (msg.includes("confirm")) return toast.error("Please verify your email before signing in.");
      if (msg.includes("network") || msg.includes("fetch")) return toast.error("Network error. Check your connection.");
      return toast.error(error.message);
    }
    toast.success("Welcome back to FoundrIQ");
    navigate({ to: "/app" });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    const trimmedName = parsed.data.name.trim().replace(/\s+/g, " ");
    const firstSpace = trimmedName.indexOf(" ");
    const firstName = firstSpace === -1 ? trimmedName : trimmedName.slice(0, firstSpace);
    const lastName = firstSpace === -1 ? "" : trimmedName.slice(firstSpace + 1);

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          full_name: trimmedName,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    if (error) {
      setLoading(false);
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered"))
        return toast.error("An account with that email already exists.");
      if (msg.includes("weak") || msg.includes("password"))
        return toast.error("Password is too weak. Try a stronger one.");
      if (msg.includes("network") || msg.includes("fetch"))
        return toast.error("Network error. Check your connection and try again.");
      return toast.error(error.message);
    }

    // Ensure profile row exists (trigger handles this, but upsert as a safety net when a session is available)
    if (data.user && data.session) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          email: parsed.data.email,
          full_name: trimmedName,
        },
        { onConflict: "id" },
      );
    }

    setLoading(false);
    if (!data.session) {
      toast.success("Account created. Check your email to verify your address.");
      setTab("signin");
      return;
    }
    toast.success("Account created. Let's build.");
    navigate({ to: "/app" });
  };



  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Enter a valid email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent — check your email.");
    setMode("auth");
  };

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2 bg-background">
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <blockquote className="max-w-md text-2xl font-medium leading-snug tracking-tight">
              "FoundrIQ compressed six months of founder-work into a single weekend. It's the most valuable tool in my stack."
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-brand" />
              <div>
                <div className="text-sm font-medium">Aria Chen</div>
                <div className="text-xs text-muted-foreground">Founder & CEO, Nimbus</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>

          {mode === "forgot" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll email you a secure link to set a new password.
              </p>
              <form onSubmit={handleForgot} className="mt-8 space-y-4">
                <Field id="email" name="email" label="Email" icon={Mail} type="email" placeholder="you@company.com" />
                <Button type="submit" disabled={loading} className="w-full gradient-brand text-primary-foreground shadow-glow">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send reset link <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
                <button type="button" onClick={() => setMode("auth")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  ← Back to sign in
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome to FoundrIQ</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your AI Co-Founder is waiting.</p>

              <Tabs value={tab} onValueChange={setTab} className="mt-8">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <div className="mt-6" />


                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <Field id="si-email" name="email" label="Email" icon={Mail} type="email" placeholder="you@company.com" autoComplete="email" />
                    <Field id="si-password" name="password" label="Password" icon={Lock} type="password" placeholder="••••••••" autoComplete="current-password" />
                    <div className="flex items-center justify-end">
                      <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full gradient-brand text-primary-foreground shadow-glow">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <Field id="su-name" name="name" label="Full name" icon={User} placeholder="Alex Founder" autoComplete="name" />
                    <Field id="su-email" name="email" label="Work email" icon={Mail} type="email" placeholder="you@company.com" autoComplete="email" />
                    <Field id="su-password" name="password" label="Password" icon={Lock} type="password" placeholder="At least 8 characters" autoComplete="new-password" />
                    <p className="text-[11px] text-muted-foreground">
                      Must be 8+ characters with uppercase, lowercase, and a number.
                    </p>
                    <Button type="submit" disabled={loading} className="w-full gradient-brand text-primary-foreground shadow-glow">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      By continuing you agree to our <a className="underline underline-offset-2" href="#">Terms</a> and{" "}
                      <a className="underline underline-offset-2" href="#">Privacy</a>.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, name, label, icon: Icon, type = "text", placeholder, autoComplete,
}: {
  id: string; name: string; label: string; icon: any; type?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} className="pl-9 h-11 bg-card" required />
      </div>
    </div>
  );
}
