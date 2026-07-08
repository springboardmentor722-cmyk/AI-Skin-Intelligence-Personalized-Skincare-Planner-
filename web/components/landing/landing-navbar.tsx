import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#professionals", label: "For Professionals" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNavbar() {
  return (
    <header className="glass fixed top-0 z-50 w-full rounded-none border-x-0 border-t-0">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-heading text-on-surface text-xl font-bold">
            Skinlytics
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-on-surface font-sans text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login">Login</Link>}
          />
          <Button
            nativeButton={false}
            render={<Link href="/signup">Start free assessment</Link>}
          />
        </div>
      </nav>
    </header>
  );
}
