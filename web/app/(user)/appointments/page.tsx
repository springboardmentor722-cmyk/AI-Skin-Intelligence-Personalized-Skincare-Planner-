"use client";

import { useState } from "react";

import { AppointmentList } from "@/components/appointments/appointment-list";
import { BookingPanel } from "@/components/appointments/booking-panel";
import { ProviderBrowse } from "@/components/appointments/provider-browse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
  const [booking, setBooking] = useState<{ providerId: string; role: "consultant" | "dermatologist" } | null>(
    null
  );
  const [tab, setTab] = useState("book");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Appointments</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Book time with a consultant or dermatologist.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(next) => {
          setTab(next as string);
          setBooking(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="appointments">My appointments</TabsTrigger>
        </TabsList>
        <TabsContent value="book">
          {booking ? (
            <BookingPanel
              providerId={booking.providerId}
              role={booking.role}
              onBack={() => setBooking(null)}
              onBooked={() => {
                setBooking(null);
                setTab("appointments");
              }}
            />
          ) : (
            <ProviderBrowse onSelectProvider={(providerId, role) => setBooking({ providerId, role })} />
          )}
        </TabsContent>
        <TabsContent value="appointments">
          <AppointmentList viewerRole="user" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
