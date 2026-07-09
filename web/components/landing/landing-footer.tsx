import Link from "next/link";
import { Globe, Share2, ShieldCheck } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["AI Diagnostic", "Routine Builder", "Pro Portal"],
  },
  {
    title: "Company",
    links: ["Our Research", "Clinical Partners", "Careers"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "HIPAA Compliance"],
  },
];

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
                  <li key={link}>
                    <a href="#" className="hover:text-on-surface">
                      {link}
                    </a>
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
            <a href="#" aria-label="Website" className="text-on-surface-variant hover:text-on-surface">
              <Globe className="size-5" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="Share" className="text-on-surface-variant hover:text-on-surface">
              <Share2 className="size-5" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="Trust & safety" className="text-on-surface-variant hover:text-on-surface">
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
