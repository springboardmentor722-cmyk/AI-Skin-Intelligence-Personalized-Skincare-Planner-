import type { ReactNode } from "react";

// forgot-password is a standalone centered glass card over the aurora — no app shell
// (docs/WIREFRAMES.md). Aurora itself is rendered once globally in app/layout.tsx.
// Login and signup moved out of this group (app/login/, app/signup/) — they need the
// full-viewport two-column split layout (AuthSplitLayout), not this centered wrapper.
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
