import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnimationProvider } from "../component/animations/AnimationProvider";
import Header from "../component/layout/Header";
import Footer from "../component/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JEC — Animation-first UI",
    template: "%s — JEC",
  },
  description: "Professional Next.js site with GSAP and anime.js animations.",
  metadataBase: new URL("https://example.com"),
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnimationProvider>
          <Header />
          {children}
          <Footer />
        </AnimationProvider>
      </body>
    </html>
  );
}
