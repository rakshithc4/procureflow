"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/requisitions", label: "Requisitions" },
];

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (pathname === "/login") return null;

  const links = role === "approver" ? [...LINKS, { href: "/approvals", label: "Approvals" }] : LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
              <Package className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <span className="font-heading text-[15px] font-semibold tracking-tight text-slate-900">
              ProcureFlow
            </span>
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
                  pathname === link.href && "bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {session && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {initials(session.user?.name)}
              </span>
              <span className="hidden sm:inline">
                {session.user?.name} <span className="text-slate-400">·</span> {role}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
