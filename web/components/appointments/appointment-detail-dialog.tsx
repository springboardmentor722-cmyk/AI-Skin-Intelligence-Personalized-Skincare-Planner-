"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useConfirmAppointmentMutation,
  useNoShowAppointmentMutation,
  type AppointmentRead,
} from "@/lib/hooks/use-appointments";

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

interface AppointmentDetailDialogProps {
  appointment: AppointmentRead | null;
  viewerRole: "user" | "consultant" | "dermatologist";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile?: (otherPartyUserId: string) => void;
}

export function AppointmentDetailDialog({
  appointment,
  viewerRole,
  open,
  onOpenChange,
  onOpenProfile,
}: AppointmentDetailDialogProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const confirmMutation = useConfirmAppointmentMutation();
  const completeMutation = useCompleteAppointmentMutation();
  const noShowMutation = useNoShowAppointmentMutation();
  const cancelMutation = useCancelAppointmentMutation();

  if (!appointment) return null;
  const isProvider = viewerRole !== "user";
  const otherPartyId = viewerRole === "user" ? appointment.provider_id : appointment.user_id;

  const handleCancel = () => {
    cancelMutation.mutate(
      { appointmentId: appointment.appointment_id },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled");
          setConfirmingCancel(false);
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(
            err.message === "cutoff_violation"
              ? "Appointments can only be cancelled at least 24 hours in advance."
              : "Couldn't cancel this appointment. Try again."
          ),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {confirmingCancel ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel this appointment?</DialogTitle>
              <DialogDescription>This can&apos;t be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
                Keep appointment
              </Button>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={handleCancel}
              >
                Cancel appointment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{appointment.other_party_name ?? "Appointment"}</DialogTitle>
              <DialogDescription>
                {new Date(appointment.start_time).toLocaleString()} ·{" "}
                {appointment.consultation_mode}
              </DialogDescription>
            </DialogHeader>
            <Badge variant={STATUS_TONE[appointment.status] ?? "outline"}>
              {appointment.status.replace("_", " ")}
            </Badge>
            {appointment.notes && (
              <p className="text-on-surface-variant font-sans text-sm">{appointment.notes}</p>
            )}
            <DialogFooter className="flex-wrap gap-2">
              {onOpenProfile && (
                <Button variant="outline" onClick={() => onOpenProfile(otherPartyId)}>
                  Open profile
                </Button>
              )}
              {isProvider && appointment.status === "pending" && (
                <Button
                  disabled={confirmMutation.isPending}
                  onClick={() =>
                    confirmMutation.mutate(appointment.appointment_id, {
                      onSuccess: () => toast.success("Appointment confirmed"),
                      onError: () => toast.error("Couldn't confirm. Try again."),
                    })
                  }
                >
                  Confirm
                </Button>
              )}
              {isProvider && appointment.status === "confirmed" && (
                <>
                  <Button
                    disabled={completeMutation.isPending}
                    onClick={() =>
                      completeMutation.mutate(
                        { appointmentId: appointment.appointment_id },
                        {
                          onSuccess: () => toast.success("Marked complete"),
                          onError: () => toast.error("Couldn't complete. Try again."),
                        }
                      )
                    }
                  >
                    Mark complete
                  </Button>
                  <Button
                    variant="outline"
                    disabled={noShowMutation.isPending}
                    onClick={() =>
                      noShowMutation.mutate(appointment.appointment_id, {
                        onSuccess: () => toast.success("Marked no-show"),
                        onError: () => toast.error("Couldn't update. Try again."),
                      })
                    }
                  >
                    No-show
                  </Button>
                </>
              )}
              {["pending", "confirmed"].includes(appointment.status) && (
                <Button variant="destructive" onClick={() => setConfirmingCancel(true)}>
                  Cancel
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
