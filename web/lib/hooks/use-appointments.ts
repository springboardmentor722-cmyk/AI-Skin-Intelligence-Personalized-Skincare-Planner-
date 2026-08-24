import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type AppointmentRead = components["schemas"]["AppointmentRead"];
type AvailabilityRule = components["schemas"]["AvailabilityRule"];

const APPOINTMENTS_KEY = ["appointments", "me"] as const;

// Real query shape (list_my_appointments_api_v1_appointments_me_get) is
// { status?, date_from?, date_to? } — the brief this hook was drafted from only had
// `status`; widened to match api-types.ts exactly since Tasks 10-13 need date-range
// filtering for the calendar view.
export function useMyAppointmentsQuery(filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, filters],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/me", {
        params: { query: filters ?? {} },
      });
      return data ?? [];
    },
  });
}

export function useAppointmentQuery(appointmentId: number | null) {
  return useQuery({
    queryKey: ["appointments", appointmentId],
    queryFn: async () => {
      if (appointmentId === null) return null;
      const { data } = await api.GET("/api/v1/appointments/{appointment_id}", {
        params: { path: { appointment_id: appointmentId } },
      });
      return data ?? null;
    },
    enabled: appointmentId !== null,
  });
}

export function useProvidersQuery(role: "consultant" | "dermatologist") {
  return useQuery({
    queryKey: ["appointments", "providers", role],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/providers", {
        params: { query: { role } },
      });
      return data ?? [];
    },
  });
}

export function useProviderSlotsQuery(providerId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["appointments", "slots", providerId, date],
    queryFn: async () => {
      if (!providerId || !date) return [];
      const { data } = await api.GET("/api/v1/appointments/providers/{provider_id}/slots", {
        params: { path: { provider_id: providerId }, query: { date } },
      });
      return data ?? [];
    },
    enabled: Boolean(providerId && date),
  });
}

function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["appointments"] });
}

export function useBookAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (body: components["schemas"]["AppointmentCreate"]) => {
      const { data, error, response } = await api.POST("/api/v1/appointments", { body });
      if (error) {
        if (response.status === 409) throw new Error("slot_unavailable");
        throw new Error("booking_failed");
      }
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useConfirmAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/confirm", {
        params: { path: { appointment_id: appointmentId } },
      });
      if (error) throw new Error("confirm_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCompleteAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes?: string }) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/complete", {
        params: { path: { appointment_id: appointmentId } },
        body: { notes: notes ?? null },
      });
      if (error) throw new Error("complete_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useNoShowAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/no-show", {
        params: { path: { appointment_id: appointmentId } },
      });
      if (error) throw new Error("no_show_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCancelAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason?: string }) => {
      const { data, error, response } = await api.PATCH("/api/v1/appointments/{appointment_id}/cancel", {
        params: { path: { appointment_id: appointmentId } },
        body: { reason: reason ?? null },
      });
      if (error) {
        if (response.status === 403) throw new Error("cutoff_violation");
        throw new Error("cancel_failed");
      }
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRescheduleAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      startTime,
    }: {
      appointmentId: number;
      startTime: string;
    }) => {
      const { data, error, response } = await api.PATCH(
        "/api/v1/appointments/{appointment_id}/reschedule",
        { params: { path: { appointment_id: appointmentId } }, body: { start_time: startTime } }
      );
      if (error) {
        if (response.status === 409) throw new Error("slot_unavailable");
        throw new Error("reschedule_failed");
      }
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useSetMeetingLinkMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      meetingLink,
    }: {
      appointmentId: number;
      meetingLink: string;
    }) => {
      const { data, error } = await api.PATCH(
        "/api/v1/appointments/{appointment_id}/meeting-link",
        {
          params: { path: { appointment_id: appointmentId } },
          body: { meeting_link: meetingLink },
        }
      );
      if (error) throw new Error("meeting_link_update_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useMyAvailabilityQuery() {
  return useQuery({
    queryKey: ["appointments", "availability", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/availability/me");
      return data?.rules ?? [];
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rules: AvailabilityRule[]) => {
      const { data, error } = await api.PUT("/api/v1/appointments/availability/me", {
        body: { rules },
      });
      if (error) throw new Error("availability_update_failed");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export function useAvailabilityExceptionsQuery() {
  return useQuery({
    queryKey: ["appointments", "availability", "exceptions"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/availability/exceptions");
      return data ?? [];
    },
  });
}

export function useAddExceptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["AvailabilityExceptionCreate"]) => {
      const { data, error } = await api.POST("/api/v1/appointments/availability/exceptions", {
        body,
      });
      if (error) throw new Error("add_exception_failed");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export function useDeleteExceptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exceptionId: number) => {
      const { error } = await api.DELETE(
        "/api/v1/appointments/availability/exceptions/{exception_id}",
        {
          params: { path: { exception_id: exceptionId } },
        }
      );
      if (error) throw new Error("delete_exception_failed");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export type { AppointmentRead };
