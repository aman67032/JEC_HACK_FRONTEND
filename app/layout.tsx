import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HealthConnect — PillSync 360",
  description: "Smart Medication & Emergency Companion for Families",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--background)]/85 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <a href="/" className="flex items-center gap-1">
              <Image src="/logo.png" alt="HealthConnect logo" width={140} height={10} className="rounded-md" />
            </a>
            <div className="flex items-center gap-3">
              <a href="/" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Home</a>
              <a href="/dashboard" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Dashboard</a>
              <a href="/login" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Login</a>
              <a href="/signup" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Sign Up</a>
              <a href="/dashboard#emergency" className="ml-3 inline-flex items-center justify-center rounded-full bg-[color:var(--color-accent)] px-5 py-2 text-lg font-bold tracking-wide text-white hover:bg-[color:var(--color-accent-hover)]">Emergency</a>
            </div>
          </nav>
        </header>
        <StoreProvider>
          <main className="mx-auto min-h-[calc(100dvh-64px)] w-full max-w-6xl px-6 py-10">
            {children}
          </main>
        </StoreProvider>
        <footer className="border-t border-[color:var(--color-border)] py-8 text-center text-sm text-[color:var(--color-muted)]">
          © {new Date().getFullYear()} HealthConnect — Smart Medication & Emergency Companion
        </footer>
      </body>
    </html>
  );
}
