import { FileQuestion } from "lucide-react";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface PublicStubPageProps {
  title: string;
  description: string;
  /** Legal pages only — an honest "this isn't reviewed legal text yet" notice, never
   * fabricated policy content (AGENTS.md §8). */
  disclaimer?: string;
}

// Public equivalent of components/app-shell/coming-soon.tsx's "zero href='#', zero
// dead links" pattern (docs/milestones/milestone_2/MILESTONE_2_MASTER_PROMPT.md P2) —
// that one assumes the authenticated app shell's sidebar; this wraps the same Empty
// primitives in the landing page's own navbar/footer chrome instead
// (bugs_report.md 2026-07-26, bug #6).
export function PublicStubPage({ title, description, disclaimer }: PublicStubPageProps) {
  return (
    <>
      <LandingNavbar />
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center px-6 pt-16 pb-16">
        <Empty className="w-full border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestion strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <p className="text-muted-foreground text-sm">Not yet published.</p>
            {disclaimer && <p className="text-muted-foreground text-xs">{disclaimer}</p>}
          </EmptyContent>
        </Empty>
      </main>
      <LandingFooter />
    </>
  );
}
