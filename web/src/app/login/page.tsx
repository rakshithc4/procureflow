"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, ShieldCheck, UserRound } from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { DEMO_CREDENTIALS } from "@/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWith(emailValue: string, passwordValue: string) {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email: emailValue, password: passwordValue, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    return signInWith(email, password);
  }

  return (
    <BackgroundPaths
      title="ProcureFlow"
      icon={
        <span className="flex size-12 items-center justify-center rounded-xl bg-status-approved-fg text-[#0a0b10] shadow-[0_0_24px_-6px_var(--color-status-approved-fg)]">
          <Package className="size-6" strokeWidth={2.25} aria-hidden="true" />
        </span>
      }
    >
      <div className="mx-auto w-full max-w-sm text-left">
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Sign in to manage purchase requisitions
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-9">
          <div className="group relative transition-transform duration-300 ease-out focus-within:translate-x-1.5">
            <label
              htmlFor="email"
              className="mb-3 block font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="peer w-full border-0 border-b border-border bg-transparent pb-3 text-lg text-foreground outline-none"
            />
            <span className="absolute bottom-0 left-0 h-px w-0 bg-status-approved-fg shadow-[0_0_12px_var(--color-status-approved-fg)] transition-all duration-500 ease-out peer-focus:w-full" />
          </div>

          <div className="group relative transition-transform duration-300 ease-out focus-within:translate-x-1.5">
            <label
              htmlFor="password"
              className="mb-3 block font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="peer w-full border-0 border-b border-border bg-transparent pb-3 text-lg text-foreground outline-none"
            />
            <span className="absolute bottom-0 left-0 h-px w-0 bg-status-approved-fg shadow-[0_0_12px_var(--color-status-approved-fg)] transition-all duration-500 ease-out peer-focus:w-full" />
          </div>

          {error && (
            <p className="font-mono text-xs tracking-wide text-status-rejected-fg uppercase">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-foreground py-4 text-sm font-extrabold tracking-[0.15em] text-background uppercase transition-all duration-300 hover:tracking-[0.3em] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-10 border-t border-border pt-6">
          <p className="mb-3 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">Demo credentials</p>
          <div className="grid gap-3">
            {DEMO_CREDENTIALS.map((cred) => {
              const Icon = cred.label === "Approver" ? ShieldCheck : UserRound;
              return (
                <button
                  key={cred.email}
                  type="button"
                  disabled={loading}
                  onClick={() => signInWith(cred.email, cred.password)}
                  className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card/40 p-3 text-left transition-colors duration-200 hover:border-status-approved-fg/40 hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-status-approved-fg disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="size-4 text-status-approved-fg" aria-hidden="true" />
                    Try as {cred.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cred.label === "Approver"
                      ? "Approve, reject, and create purchase orders"
                      : "Create and submit requisitions"}
                  </span>
                  <span className="font-mono text-[11px] text-foreground/70">
                    {cred.email} / {cred.password}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </BackgroundPaths>
  );
}
