import type { Metadata } from "next";
import { Geist, Inter, Sora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { PaletteProvider, PaletteScript } from "@/components/providers/palette-provider";
import "./globals.css";

// Tri-font strategy — docs/DESIGN.md §4: Sora for headlines, Inter for body/UI,
// Geist for labels and all data (tabular figures).
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Skinlytics",
  description: "AI Skin Intelligence & Personalized Skincare Planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PaletteScript />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PaletteProvider>
            <QueryProvider>
              <TooltipProvider delay={200}>
                <div className="aurora" aria-hidden="true" />
                {children}
                <Toaster />
              </TooltipProvider>
            </QueryProvider>
          </PaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
