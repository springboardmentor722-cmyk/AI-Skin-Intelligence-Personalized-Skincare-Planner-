import type { Metadata } from "next";
import { Geist, Inter, Sora } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="aurora" aria-hidden="true" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
