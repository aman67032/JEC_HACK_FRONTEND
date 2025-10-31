import type { Metadata } from "next";
import { Inter, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Image from "next/image";
import AuthControls from "@/components/AuthControls";
import EmergencyNavButton from "@/components/EmergencyNavButton";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
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
        className={`${inter.variable} ${playfair.variable} ${poppins.variable} antialiased bg-background text-foreground`}
      >
        <StoreProvider>
          <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--background)]/85 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <a href="/" className="flex items-center gap-1">
                <Image src="/logo.png" alt="HealthConnect logo" width={140} height={10} className="rounded-md" />
              </a>
              <div className="flex items-center gap-3">
                <a href="/" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Home</a>
                <a href="/dashboard" className="rounded-full px-5 py-2 text-lg font-semibold tracking-wide text-[color:var(--color-foreground)] hover:bg-black/[.04]">Dashboard</a>
                <AuthControls />
                <EmergencyNavButton />
              </div>
            </nav>
          </header>
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
