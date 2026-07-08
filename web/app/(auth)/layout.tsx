import type { ReactNode } from "react";

// Screens 1-2 (login, registration) plus forgot-password are standalone centered glass
// cards over the aurora — no app shell (docs/WIREFRAMES.md). Aurora itself is rendered
// once globally in app/layout.tsx.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <span className="font-heading text-on-surface text-2xl font-bold">
          Skinlytics
        </span>
      </div>
      {children}
    </div>
  );
}
