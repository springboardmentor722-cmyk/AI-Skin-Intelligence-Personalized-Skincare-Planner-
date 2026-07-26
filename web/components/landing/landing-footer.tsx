"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Globe, Share2, ShieldCheck } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "AI Diagnostic", href: "/assessment" },
      { label: "Routine Builder", href: "/product/routine-builder" },
      { label: "Pro Portal", href: "/product/pro-portal" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Research", href: "/company/our-research" },
      { label: "Clinical Partners", href: "/company/clinical-partners" },
      { label: "Careers", href: "/company/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms of Service", href: "/legal/terms-of-service" },
      { label: "HIPAA Compliance", href: "/legal/hipaa-compliance" },
    ],
  },
];

function ShareButton() {
  const handleShare = async () => {
    const shareData = { title: "Skinlytics", url: window.location.origin };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share"
      className="text-on-surface-variant hover:text-on-surface cursor-pointer"
    >
      <Share2 className="size-5" strokeWidth={1.5} />
    </button>
  );
}

// bugs_report.md 2026-07-26, bug #6 — every link here used to be href="#". AI
// Diagnostic points at the real, already-built assessment wizard (zero fabrication,
// best possible outcome); everything else routes to an honest PublicStubPage rather
// than a dead link or invented marketing/legal content. Share uses the real Web
// Share API instead of linking anywhere.
export function LandingFooter() {
  return (
    <footer className="border-border bg-card border-t pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <Link href="/" className="font-heading text-on-surface mb-6 block text-xl font-bold">
              Skinlytics
            </Link>
            <p className="text-on-surface-variant max-w-xs font-sans text-sm">
              Skin intelligence and personalized skincare planning through accessible AI
              diagnostics.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-on-surface font-geist mb-6 text-xs font-semibold tracking-[0.05em] uppercase">
                {column.title}
              </h3>
              <ul className="text-on-surface-variant flex flex-col gap-4 font-sans text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-on-surface/8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-on-surface-variant font-geist text-xs">
            © 2026 Skinlytics Lab. Not medical advice.
          </p>
          <div className="flex gap-6">
            <Link href="/" aria-label="Website" className="text-on-surface-variant hover:text-on-surface">
              <Globe className="size-5" strokeWidth={1.5} />
            </Link>
            <ShareButton />
            <Link
              href="/legal/hipaa-compliance"
              aria-label="Trust & safety"
              className="text-on-surface-variant hover:text-on-surface"
            >
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
