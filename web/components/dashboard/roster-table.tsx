"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowUpDown, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

export interface RosterColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface RosterTableProps<T> extends WidgetStateProps {
  columns?: RosterColumn<T>[];
  rows?: T[];
  rowKey: (row: T) => string | number;
  rowMenuItems?: (row: T) => { label: string; onClick: () => void }[];
  headerActionLabel?: string;
  headerActionHref?: string;
}

// Sortable client-only roster used by the Consultant/Dermatologist dashboards
// (UI_SPEC.md §4.2/§4.3) — sorting is a pure client-side re-order of the rows the
// caller already fetched (no widget-internal fetch, per the P3 guardrail).
export function RosterTable<T>({
  state = "ready",
  columns,
  rows,
  rowKey,
  rowMenuItems,
  headerActionLabel,
  headerActionHref,
  emptyIcon,
  emptyMessage = "No rows yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: RosterTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !columns || !rows || rows.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const sortedRows = sort
    ? [...rows].sort((a, b) => {
        const col = columns.find((c) => c.key === sort.key);
        const av = col?.sortValue?.(a) ?? "";
        const bv = col?.sortValue?.(b) ?? "";
        return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
      })
    : rows;

  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="flex flex-col gap-2">
      {headerActionLabel && headerActionHref && (
        <div className="flex justify-end">
          <Link href={headerActionHref} className="text-secondary text-sm font-medium hover:underline">
            {headerActionLabel}
          </Link>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="hover:text-foreground inline-flex items-center gap-1"
                  >
                    {col.header}
                    <ArrowUpDown className="size-3" strokeWidth={1.75} />
                  </button>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
            {rowMenuItems && <TableHead className="w-8" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(row)}</TableCell>
              ))}
              {rowMenuItems && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="size-4" strokeWidth={1.75} />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        {rowMenuItems(row).map((item) => (
                          <DropdownMenuItem key={item.label} onClick={item.onClick}>
                            {item.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
