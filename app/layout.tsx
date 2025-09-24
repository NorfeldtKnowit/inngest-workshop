import type { Metadata } from "next";
import { Geist, Geist_Mono, Bungee, Fredoka, Luckiest_Guy } from "next/font/google";
import { DevTools } from "@/components/dev-tools";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bungee = Bungee({
  weight: "400",
  variable: "--font-bungee",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const luckiestGuy = Luckiest_Guy({
  weight: "400",
  variable: "--font-luckiest-guy",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🍔 FastFood Workshop",
  description: "Event-driven kitchen simulation with Inngest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bungee.variable} ${fredoka.variable} ${luckiestGuy.variable} font-mono antialiased`}
      >
        {children}
        <DevTools />
      </body>
    </html>
  );
}
