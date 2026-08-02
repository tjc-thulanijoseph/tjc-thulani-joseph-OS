import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import { authService } from "@/services";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "TJC OS — Secure Sign In" },
      { name: "description", content: "Secure sign in to TJC OS, the private management system of Thulani Joseph." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "TJC OS — Secure Sign In" },
      { property: "og:description", content: "Private management system access." },
      { property: "og:url", content: "/auth" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

function AuthPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard/$module", params: { module: "overview" }, replace: true });
  }, [isAuthenticated, navigate]);

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = credentialsSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const message = await signIn(parsed.data);
    setBusy(false);
    if (message) toast.error("Sign in unavailable", { description: message });
  }

  async function onReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true);
    const result = await authService.requestPasswordReset(email);
    setBusy(false);
    toast[result.error ? "error" : "success"](
      result.error ? "Reset unavailable" : "Reset link sent",
      { description: result.error?.message ?? "Check your inbox to continue." },
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-halo)" }} />
      <div className="surface-panel relative w-full max-w-md rounded-3xl p-8 md:p-10">
        <Logo size={46} />
        <h1 className="mt-8 font-display text-2xl font-semibold">
          {mode === "signin" ? "Enter TJC OS" : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Private management system. Authorised access only."
            : "We'll email a secure link to set a new password."}
        </p>

        {mode === "signin" ? (
          <form onSubmit={onSignIn} noValidate className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" className="mt-2" />
              {errors["email"] && <p className="mt-1.5 text-xs text-destructive">{errors["email"]}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" className="mt-2" />
              {errors["password"] && <p className="mt-1.5 text-xs text-destructive">{errors["password"]}</p>}
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Verifying…" : "Sign in securely"}
            </Button>
            <button type="button" onClick={() => setMode("reset")} className="w-full text-xs text-muted-foreground hover:text-gold">
              Forgot password?
            </button>
          </form>
        ) : (
          <form onSubmit={onReset} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input id="reset-email" name="email" type="email" autoComplete="email" className="mt-2" required />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <button type="button" onClick={() => setMode("signin")} className="w-full text-xs text-muted-foreground hover:text-gold">
              Back to sign in
            </button>
          </form>
        )}

        {!isSupabaseConfigured && (
          <p className="mt-8 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
            Add <code className="mx-1 text-gold">VITE_SUPABASE_URL</code> and
            <code className="mx-1 text-gold">VITE_SUPABASE_ANON_KEY</code> to the
            <code className="mx-1 text-gold">.env</code> file at the project root, then reload to activate sign in.
          </p>
        )}

        <Link to="/" className="mt-8 inline-block text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
