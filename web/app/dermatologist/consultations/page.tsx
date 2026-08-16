"use client";

import { useRouter } from "next/navigation";

import { AppointmentList } from "@/components/appointments/appointment-list";

export default function DermatologistConsultationsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Consultations</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Manage your appointment schedule.
        </p>
      </div>
      <AppointmentList
        viewerRole="dermatologist"
        onOpenProfile={(userId) => router.push(`/dermatologist/patients/${userId}`)}
      />
    </div>
  );
}
