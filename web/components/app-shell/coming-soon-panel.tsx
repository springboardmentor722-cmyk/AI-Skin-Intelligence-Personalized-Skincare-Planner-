import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface ComingSoonPanelProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

// Compact grid-tile variant of the "not built yet" surface — same solid-card +
// icon-in-circle language as StateCard/ComingSoon (docs/DESIGN.md: data-adjacent
// surfaces stay solid, never a dashed placeholder border), sized for a panel grid
// instead of a full-page empty state. Copy stays honest ("Coming soon") — this is
// styling only, no fake data.
export function ComingSoonPanel({ icon: Icon, title, description }: ComingSoonPanelProps) {
  return (
    <div className="border-border bg-card flex flex-col items-center gap-1 rounded-2xl border p-6 text-center">
      <div className="bg-secondary/10 text-secondary mb-2 flex size-12 items-center justify-center rounded-full">
        <Icon className="size-6" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-on-surface text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-on-surface-variant font-sans text-xs">{description}</p>
      )}
      <Badge variant="outline" className="mt-2">
        Coming soon
      </Badge>
    </div>
  );
}
