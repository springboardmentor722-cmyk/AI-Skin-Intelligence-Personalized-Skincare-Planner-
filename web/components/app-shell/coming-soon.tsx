import type { LucideIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Shared titled empty state for every nav item whose page doesn't exist yet
// (Milestone 2 P2 — MILESTONE_2_MASTER_PROMPT.md: "Zero href='#', zero dead links").
// One component so every stub route matches the same anatomy instead of N one-off
// hand-rolled empty states.
export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p className="text-muted-foreground text-sm">Coming soon.</p>
      </EmptyContent>
    </Empty>
  );
}
