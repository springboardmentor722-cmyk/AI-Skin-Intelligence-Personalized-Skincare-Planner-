import { AvailabilitySettings } from "@/components/appointments/availability-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";

export default function DermatologistSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Settings</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Manage your account preferences.
        </p>
      </div>

      <AppearanceSettings />
      <AvailabilitySettings />
    </div>
  );
}
