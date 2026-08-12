"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Droplet, Moon, RotateCw, Sun, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

const REMINDER_DEFAULTS = {
  routine_morning: { label: "Morning Routine", icon: Sun, defaultTime: "08:00" },
  routine_evening: { label: "Evening Routine", icon: Moon, defaultTime: "21:30" },
  hydration: { label: "Hydration Nudge", icon: Droplet, defaultTime: null },
} as const;

export default function Page() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/notifications/me");
      if (error) throw new Error("Couldn't load your notifications.");
      return data;
    },
  });

  const remindersQuery = useQuery({
    queryKey: ["reminders", "list"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reminders");
      if (error) throw new Error("Couldn't load your reminders.");
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ reminderId, isActive }: { reminderId: number; isActive: boolean }) => {
      const { error } = await api.PATCH("/api/v1/reminders/{reminder_id}", {
        params: { path: { reminder_id: reminderId } },
        body: { is_active: isActive },
      });
      if (error) throw new Error("Couldn't update that reminder.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", "list"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (reminderType: keyof typeof REMINDER_DEFAULTS) => {
      const config = REMINDER_DEFAULTS[reminderType];
      const { error } = await api.POST("/api/v1/reminders", {
        body: {
          reminder_type: reminderType,
          title: config.label,
          message: `Time for your ${config.label}`,
          reminder_time: config.defaultTime,
          frequency: reminderType === "hydration" ? "every_2h" : "daily",
          is_active: true,
        },
      });
      if (error) throw new Error("Couldn't create that reminder.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", "list"] }),
  });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Reminders</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Stay on top of your routine and hydration.
        </p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="settings">Reminder Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          {notificationsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : notificationsQuery.isError ? (
            <StateCard
              tone="destructive"
              icon={TriangleAlert}
              description="Couldn't load your notifications."
              action={
                <Button variant="outline" onClick={() => notificationsQuery.refetch()}>
                  <RotateCw className="size-4" strokeWidth={1.5} />
                  Retry
                </Button>
              }
            />
          ) : notificationsQuery.data && notificationsQuery.data.length === 0 ? (
            <StateCard
              icon={BellRing}
              title="No notifications yet"
              description="Reminder alerts and routine streaks will show up here."
            />
          ) : (
            <div className="space-y-3">
              {notificationsQuery.data?.map((n) => (
                <div
                  key={n.notification_id}
                  className="border-border bg-card flex items-start gap-3 rounded-2xl border p-4"
                >
                  <BellRing className="text-secondary mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-on-surface-variant text-sm">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {remindersQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : remindersQuery.isError ? (
            <StateCard
              tone="destructive"
              icon={TriangleAlert}
              description="Couldn't load your reminders."
              action={
                <Button variant="outline" onClick={() => remindersQuery.refetch()}>
                  <RotateCw className="size-4" strokeWidth={1.5} />
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(Object.keys(REMINDER_DEFAULTS) as (keyof typeof REMINDER_DEFAULTS)[]).map(
                (type) => {
                  const config = REMINDER_DEFAULTS[type];
                  const Icon = config.icon;
                  const existing = remindersQuery.data?.find((r) => r.reminder_type === type);
                  return (
                    <div
                      key={type}
                      className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="text-secondary size-5" strokeWidth={1.5} />
                          <h4 className="font-semibold">{config.label}</h4>
                        </div>
                        <Switch
                          checked={existing?.is_active ?? false}
                          onCheckedChange={(checked) =>
                            existing
                              ? toggleMutation.mutate({
                                  reminderId: existing.reminder_id,
                                  isActive: checked,
                                })
                              : createMutation.mutate(type)
                          }
                        />
                      </div>
                      {existing?.reminder_time && (
                        <p className="text-on-surface-variant text-sm">
                          Scheduled: {existing.reminder_time}
                        </p>
                      )}
                      {/* Channel toggle UI kept per spec, deliberately unwired — no push/email
                          adapter exists yet. */}
                      <div className="flex gap-2">
                        <span className="bg-secondary/10 text-secondary rounded-full px-3 py-1 text-xs font-semibold">
                          Push
                        </span>
                        <span className="bg-muted text-on-surface-variant rounded-full px-3 py-1 text-xs font-semibold">
                          Email
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
