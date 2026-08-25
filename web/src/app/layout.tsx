import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProcureFlow",
  description: "SAP-backed procurement approval workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background">
        <div
          className="pointer-events-none fixed inset-0 -z-10 animate-glow-drift bg-[radial-gradient(circle_at_15%_0%,color-mix(in_oklch,var(--color-brand-500),transparent_88%),transparent_45%),radial-gradient(circle_at_85%_20%,color-mix(in_oklch,var(--color-brand-500),transparent_92%),transparent_40%)]"
          aria-hidden="true"
        />
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
