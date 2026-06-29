import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { PwaRegistry } from "@/components/pwa-registry";

const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KL Sync",
  description: "A fast, modern, and reliable attendance tracking portal for KL University.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KL Sync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${firaSans.variable} ${firaCode.variable} antialiased min-h-screen bg-[#060608] text-foreground overflow-x-hidden custom-scrollbar`}
      >
        <PwaRegistry />
        {children}
      </body>
    </html>
  );
}
