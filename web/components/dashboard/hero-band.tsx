import type { ReactNode } from "react";

interface HeroBandProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** "user" leads with --tertiary (teal, "the intelligence layer is speaking" —
   * docs/DESIGN.md §2). "clinical" leads with --secondary (royal blue, authority)
   * with a much smaller --tertiary presence, so Consultant/Dermatologist read as a
   * clinical instrument, not a reskinned end-user skin-hero. */
  tint: "user" | "clinical";
  children?: ReactNode;
}

const TINT_GRADIENT: Record<HeroBandProps["tint"], string> = {
  user: "radial-gradient(circle at 20% 20%, var(--tertiary), transparent 60%), radial-gradient(circle at 85% 80%, var(--secondary), transparent 55%)",
  clinical: "radial-gradient(circle at 20% 20%, var(--secondary), transparent 60%), radial-gradient(circle at 85% 80%, var(--tertiary), transparent 45%)",
};

// Level-4 glass, docs/DESIGN.md §3 — the .glass recipe itself is not touched here,
// only reused. The gradient wash below is a separate element scoped to this
// component only; it is NOT the global .aurora in app/globals.css and does not
// modify it.
export function HeroBand({ eyebrow, title, subtitle, tint, children }: HeroBandProps) {
  return (
    <div className="glass relative overflow-hidden rounded-lg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14] dark:opacity-[0.08]"
        style={{ backgroundImage: TINT_GRADIENT[tint] }}
      />
      <div className="relative z-10 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && (
            <p className="font-geist text-secondary mb-1 text-xs font-semibold tracking-[0.05em] uppercase">{eyebrow}</p>
          )}
          <h1 className="font-heading text-foreground text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
