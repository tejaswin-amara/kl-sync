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

import { DotPattern } from "@/components/ui/dot-pattern";
import { CommandMenu } from "@/components/command-menu";

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${firaSans.variable} ${firaCode.variable} antialiased min-h-screen bg-background text-foreground overflow-x-hidden custom-scrollbar relative`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PwaRegistry />
          <DotPattern
            width={28}
            height={28}
            cx={2}
            cy={2}
            cr={1.5}
            className="opacity-[0.15] mix-blend-screen dark:opacity-20"
          />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_100%)] z-0" />
          <div className="relative z-10">
            {children}
          </div>
          <CommandMenu />
        </ThemeProvider>
      </body>
    </html>
  );
}
