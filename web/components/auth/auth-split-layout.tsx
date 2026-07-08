import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, FlaskConical } from "lucide-react";

// Two-column auth shell — web/designs/wireframes/login.html / signup.html: left is a
// glass branding panel over the aurora (Hero & signature housing, docs/DESIGN.md §3),
// right is the actual form. No shared (auth) layout wrapper here (that one is a
// centered single card, still used by forgot-password) — login/signup get the full
// viewport for this split. The wireframe's left panel used a WebGL shader; per
// .agents/rules/skinlytics-stitch.md that's a Stitch authoring artifact, not something
// to port — the app's real global `.aurora` (app/layout.tsx) already sits behind
// everything, so the glass panel here just floats over that.
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden items-center justify-center overflow-hidden p-2xl lg:flex">
        <div className="glass glass-strong relative z-10 max-w-md rounded-2xl border border-white/20 p-8">
          <h1 className="font-heading text-on-surface text-4xl font-bold">Skinlytics</h1>
          <p className="text-on-surface-variant mt-4 font-sans text-lg">
            Clinical grade AI for professional dermatological insights. Precision
            monitoring through every layer.
          </p>
          <div className="mt-8 flex gap-6">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="text-secondary size-5" strokeWidth={1.5} />
              <span className="font-geist text-on-surface text-xs font-semibold tracking-[0.05em] uppercase">
                HIPAA compliant
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <FlaskConical className="text-secondary size-5" strokeWidth={1.5} />
              <span className="font-geist text-on-surface text-xs font-semibold tracking-[0.05em] uppercase">
                AI-powered
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-background flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="font-heading text-on-surface mb-8 block text-center text-2xl font-bold lg:hidden"
          >
            Skinlytics
          </Link>
          {children}
        </div>
      </section>
    </div>
  );
}
