"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS } from "@/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,var(--color-brand-100),transparent_55%)]"
        aria-hidden="true"
      />
      <Card className="w-full max-w-sm shadow-lg shadow-brand-600/5">
        <CardHeader className="text-center">
          <span className="mx-auto mb-1 flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Package className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl">
            <h1>ProcureFlow</h1>
          </CardTitle>
          <CardDescription>Sign in to manage purchase requisitions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-status-rejected-fg">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-1.5 font-medium text-slate-700">Demo credentials</p>
            {DEMO_CREDENTIALS.map((cred) => (
              <p key={cred.email} className="leading-relaxed">
                {cred.label}: <span className="font-mono text-slate-700">{cred.email}</span> /{" "}
                <span className="font-mono text-slate-700">{cred.password}</span>
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
