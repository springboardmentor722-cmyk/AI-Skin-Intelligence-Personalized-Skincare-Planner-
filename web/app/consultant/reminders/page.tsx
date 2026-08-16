"use client";

import { AlarmClock } from "lucide-react";
import { useRouter } from "next/navigation";

import { ComingSoon } from "@/components/app-shell/coming-soon";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConsultantAppointmentsAndRemindersPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          Appointments & reminders
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Manage your schedule and client reminders.
        </p>
      </div>
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <AppointmentList
            viewerRole="consultant"
            onOpenProfile={(userId) => router.push(`/consultant/clients/${userId}`)}
          />
        </TabsContent>
        <TabsContent value="reminders">
          <ComingSoon icon={AlarmClock} title="Reminders" description="Client reminders" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
