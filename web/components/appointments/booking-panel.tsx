"use client";

import { useState } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useBookAppointmentMutation,
  useProviderSlotsQuery,
  useProvidersQuery,
} from "@/lib/hooks/use-appointments";

interface BookingPanelProps {
  providerId: string;
  role: "consultant" | "dermatologist";
  onBack: () => void;
  onBooked: () => void;
}

export function BookingPanel({ providerId, role, onBack, onBooked }: BookingPanelProps) {
  const providersQuery = useProvidersQuery(role);
  const provider = providersQuery.data?.find((p) => p.provider_id === providerId);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<string>(provider?.consultation_modes?.[0] ?? "video");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [concern, setConcern] = useState("");
  const bookMutation = useBookAppointmentMutation();

  // Local date, not UTC: date is local midnight of the clicked day, so
  // .toISOString() (which converts to UTC first) shifts it back a day for any
  // UTC-ahead timezone — including India (UTC+5:30), this app's primary market.
  const dateParam = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;
  const slotsQuery = useProviderSlotsQuery(providerId, dateParam);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    bookMutation.mutate(
      {
        provider_id: providerId,
        start_time: selectedSlot,
        consultation_mode: mode as "video" | "in_person" | "chat",
        concern: concern.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Appointment booked");
          setConfirmOpen(false);
          setConcern("");
          onBooked();
        },
        onError: (err) => {
          if (err.message === "slot_unavailable") {
            toast.error("This appointment slot is no longer available. Please choose another time.");
            setSelectedSlot(null);
            slotsQuery.refetch();
          } else {
            toast.error("Couldn't book this appointment. Try again.");
          }
          setConfirmOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        Back to providers
      </Button>

      {provider && (
        <div className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-on-surface text-lg font-semibold">{provider.name}</h2>
          {provider.biography && (
            <p className="text-on-surface-variant mt-1 font-sans text-sm">{provider.biography}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setSelectedSlot(null);
          }}
          disabled={{ before: new Date() }}
        />

        <div>
          <h3 className="font-heading text-on-surface mb-3 text-sm font-semibold">Available times</h3>
          {!date ? (
            <StateCard icon={CalendarDays} description="Pick a date to see available times." />
          ) : slotsQuery.isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : !slotsQuery.data || slotsQuery.data.length === 0 ? (
            <StateCard icon={Clock} description="No available slots for this date." />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotsQuery.data.map((slot) => (
                <Button
                  key={slot.start_time}
                  variant={selectedSlot === slot.start_time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSlot(slot.start_time)}
                >
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Button>
              ))}
            </div>
          )}

          {provider?.consultation_modes && provider.consultation_modes.length > 1 && (
            <Select value={mode} onValueChange={(v) => v && setMode(v)}>
              <SelectTrigger className="mt-4 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {provider.consultation_modes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button className="mt-4 w-full" disabled={!selectedSlot} onClick={() => setConfirmOpen(true)}>
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm appointment</DialogTitle>
            <DialogDescription>
              {provider?.name} · {selectedSlot && new Date(selectedSlot).toLocaleString()} · {mode}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="booking-concern" className="text-on-surface font-sans text-sm font-medium">
              Describe your concern
            </label>
            <Textarea
              id="booking-concern"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              maxLength={2000}
              placeholder="Briefly describe the skin concern you'd like to discuss with the consultant."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <Button disabled={bookMutation.isPending} onClick={handleConfirm}>
              Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
