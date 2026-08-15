"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAddExceptionMutation,
  useAvailabilityExceptionsQuery,
  useDeleteExceptionMutation,
  useMyAvailabilityQuery,
  useUpdateAvailabilityMutation,
} from "@/lib/hooks/use-appointments";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayRow {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

// Settings > Availability, for the consultant/dermatologist roles only (Task 9's
// provider-availability endpoints). Weekly recurring hours + one-off blocked dates
// (exceptions), both mutated as a full replace-on-save rather than per-row PATCH —
// mirrors AppearanceSettings' shape (query + mutation hooks, no local form library).
export function AvailabilitySettings() {
  const availabilityQuery = useMyAvailabilityQuery();
  const updateAvailability = useUpdateAvailabilityMutation();
  const exceptionsQuery = useAvailabilityExceptionsQuery();
  const addException = useAddExceptionMutation();
  const deleteException = useDeleteExceptionMutation();

  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [blockDate, setBlockDate] = useState("");
  const [blockWholeDay, setBlockWholeDay] = useState(true);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("17:00");

  const effectiveRows: DayRow[] =
    rows ??
    DAYS.map((_, day_of_week) => {
      const existing = availabilityQuery.data?.find((r) => r.day_of_week === day_of_week);
      return existing
        ? { ...existing, enabled: true }
        : { day_of_week, enabled: false, start_time: "09:00", end_time: "17:00", slot_duration_minutes: 30 };
    });

  if (availabilityQuery.isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const updateRow = (day_of_week: number, patch: Partial<DayRow>) => {
    setRows(effectiveRows.map((r) => (r.day_of_week === day_of_week ? { ...r, ...patch } : r)));
  };

  const hasInvalidRange = effectiveRows.some((r) => r.enabled && r.start_time >= r.end_time);

  const handleSave = () => {
    const enabled = effectiveRows.filter((r) => r.enabled);
    updateAvailability.mutate(
      enabled.map(({ day_of_week, start_time, end_time, slot_duration_minutes }) => ({
        day_of_week,
        start_time,
        end_time,
        slot_duration_minutes,
      })),
      {
        onSuccess: () => toast.success("Availability saved"),
        onError: () => toast.error("Couldn't save availability. Try again."),
      }
    );
  };

  return (
    <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6">
      <div>
        <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">Weekly hours</h3>
        <div className="flex flex-col gap-3">
          {effectiveRows.map((row) => (
            <div key={row.day_of_week} className="flex flex-wrap items-center gap-3">
              <Switch
                checked={row.enabled}
                onCheckedChange={(checked) => updateRow(row.day_of_week, { enabled: checked })}
              />
              <span className="w-10 font-sans text-sm">{DAYS[row.day_of_week]}</span>
              {row.enabled && (
                <>
                  <Input
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.day_of_week, { start_time: e.target.value })}
                    className="w-28"
                  />
                  <Input
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.day_of_week, { end_time: e.target.value })}
                    className="w-28"
                  />
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={row.slot_duration_minutes}
                    onChange={(e) =>
                      updateRow(row.day_of_week, { slot_duration_minutes: Number(e.target.value) })
                    }
                    className="w-20"
                  />
                  <span className="text-on-surface-variant font-sans text-xs">min slots</span>
                </>
              )}
            </div>
          ))}
        </div>
        {hasInvalidRange && (
          <p className="text-destructive mt-2 font-sans text-xs">
            End time must be after start time.
          </p>
        )}
        <Button
          size="sm"
          className="mt-4"
          disabled={updateAvailability.isPending || hasInvalidRange}
          onClick={handleSave}
        >
          Save weekly hours
        </Button>
      </div>

      <div>
        <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">Blocked dates</h3>
        {exceptionsQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : exceptionsQuery.data && exceptionsQuery.data.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2">
            {exceptionsQuery.data.map((exc) => (
              <li
                key={exc.exception_id}
                className="border-border flex items-center justify-between rounded-xl border p-3"
              >
                <span className="font-sans text-sm">
                  {exc.exception_date}
                  {exc.start_time ? ` (${exc.start_time}–${exc.end_time})` : " (whole day)"}
                  {exc.reason ? ` — ${exc.reason}` : ""}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteException.mutate(exc.exception_id)}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-on-surface-variant mb-4 font-sans text-xs">No blocked dates.</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="w-40" />
          <Switch checked={blockWholeDay} onCheckedChange={setBlockWholeDay} />
          <span className="font-sans text-xs">Whole day</span>
          {!blockWholeDay && (
            <>
              <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="w-28" />
              <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="w-28" />
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!blockDate || addException.isPending}
            onClick={() =>
              addException.mutate(
                {
                  exception_date: blockDate,
                  start_time: blockWholeDay ? null : blockStart,
                  end_time: blockWholeDay ? null : blockEnd,
                  reason: null,
                },
                { onSuccess: () => setBlockDate("") }
              )
            }
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Block date
          </Button>
        </div>
      </div>
    </div>
  );
}
