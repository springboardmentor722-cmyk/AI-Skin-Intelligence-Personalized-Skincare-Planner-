"use client";

import { useMemo, useState } from "react";
import { CalendarX, RotateCw, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyAppointmentsQuery, type AppointmentRead } from "@/lib/hooks/use-appointments";

import { AppointmentDetailDialog } from "./appointment-detail-dialog";

interface AppointmentListProps {
  viewerRole: "user" | "consultant" | "dermatologist";
  onOpenProfile?: (otherPartyUserId: string) => void;
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();

export function AppointmentList({ viewerRole, onOpenProfile }: AppointmentListProps) {
  const [selected, setSelected] = useState<AppointmentRead | null>(null);
  const { data, isLoading, isError, refetch } = useMyAppointmentsQuery();

  const { today, upcoming, history } = useMemo(() => {
    const rows = data ?? [];
    return {
      today: rows.filter((a) => isToday(a.start_time) && ["pending", "confirmed"].includes(a.status)),
      upcoming: rows.filter(
        (a) => !isToday(a.start_time) && isFuture(a.start_time) && ["pending", "confirmed"].includes(a.status)
      ),
      history: rows.filter((a) => !["pending", "confirmed"].includes(a.status) || !isFuture(a.start_time)),
    };
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (isError) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Unable to load appointments."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const renderRows = (rows: AppointmentRead[], emptyMessage: string) =>
    rows.length === 0 ? (
      <StateCard icon={CalendarX} description={emptyMessage} />
    ) : (
      <ul className="flex flex-col gap-3">
        {rows.map((a) => (
          <li key={a.appointment_id}>
            <button
              type="button"
              onClick={() => setSelected(a)}
              className="border-border bg-card hover:bg-muted flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors"
            >
              <div>
                <p className="font-sans text-sm font-semibold">{a.other_party_name ?? "Appointment"}</p>
                <p className="text-on-surface-variant font-sans text-xs">
                  {new Date(a.start_time).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{a.status.replace("_", " ")}</Badge>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="today">{renderRows(today, "No appointments today.")}</TabsContent>
        <TabsContent value="upcoming">{renderRows(upcoming, "No upcoming appointments.")}</TabsContent>
        <TabsContent value="history">{renderRows(history, "No appointment history.")}</TabsContent>
      </Tabs>
      <AppointmentDetailDialog
        appointment={selected}
        viewerRole={viewerRole}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
}
