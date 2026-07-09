"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { TagInput } from "@/components/ui/tag-input";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";
import { AGE_GROUPS, GENDER_OPTIONS, type SkinProfileFormValues } from "@/lib/schemas/skin-profile";
import { selectItems } from "@/lib/utils";

type SkinTypeRead = components["schemas"]["SkinTypeRead"];
type SkinConcernRead = components["schemas"]["SkinConcernRead"];
type SkinProfileRead = components["schemas"]["SkinProfileRead"];

const AGE_GROUP_ITEMS = selectItems(AGE_GROUPS);
const GENDER_ITEMS = selectItems(GENDER_OPTIONS);

const splitTags = (value: string | null | undefined): string[] =>
  value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

// Base UI's Slider supports multi-thumb range sliders, so onValueChange is typed to
// accept either a single number or an array — these sliders are always single-thumb.
const firstOf = (val: number | readonly number[]): number =>
  Array.isArray(val) ? val[0] : (val as number);

function formFromProfile(profile: SkinProfileRead | null): SkinProfileFormValues {
  if (!profile) {
    return { skin_type_id: 0, age_group: undefined, gender: undefined, concerns: [], allergies: [], sensitivities: [] };
  }
  return {
    skin_type_id: profile.skin_type_id,
    age_group: profile.age_group ?? undefined,
    gender: undefined, // gender isn't stored on skin_profiles — user_profiles owns it
    concerns: (profile.concerns ?? []).map((c) => ({
      concern_id: c.concern_id,
      severity_rating: c.severity_rating ?? 5,
      priority_level: c.priority_level ?? 5,
    })),
    allergies: splitTags(profile.allergies),
    sensitivities: splitTags(profile.sensitivities),
  };
}

export function SkinProfileForm() {
  const skinTypesQuery = useQuery({
    queryKey: ["skin-types"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/skin-types");
      return data ?? [];
    },
  });

  const concernsQuery = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/skin-concerns");
      return data ?? [];
    },
  });

  const profileQuery = useQuery({
    queryKey: ["skin-profile", "me"],
    queryFn: async () => {
      const { data, response } = await api.GET("/api/v1/skin-profiles/me");
      if (response.status === 404) return null;
      return data ?? null;
    },
  });

  if (skinTypesQuery.isLoading || concernsQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  return (
    <SkinProfileFormInner
      skinTypes={skinTypesQuery.data ?? []}
      concerns={concernsQuery.data ?? []}
      initialProfile={profileQuery.data ?? null}
    />
  );
}

function SkinProfileFormInner({
  skinTypes,
  concerns,
  initialProfile,
}: {
  skinTypes: SkinTypeRead[];
  concerns: SkinConcernRead[];
  initialProfile: SkinProfileRead | null;
}) {
  const queryClient = useQueryClient();
  // Lazy initializer, not a useEffect syncing after mount — the parent only mounts
  // this component once `initialProfile` has actually loaded, so the Skin type
  // <Select>'s `value` is correct from its very first render. Mounting with
  // `value={undefined}` and only updating to the real value on a later render (the
  // useEffect-based approach this replaced) left Base UI's Select stuck showing its
  // placeholder after a real reload — found by actually reloading the page after a
  // real save, not by reading the code; the plain controlled inputs (checkboxes, tag
  // input) didn't have the same problem, only this Select did.
  const [form, setForm] = useState<SkinProfileFormValues>(() => formFromProfile(initialProfile));
  const [severityErrors, setSeverityErrors] = useState(false);
  const isFirstSetup = initialProfile == null;

  const saveMutation = useMutation({
    mutationFn: async (values: SkinProfileFormValues) => {
      const { data, error } = await api.POST("/api/v1/skin-profiles", {
        body: {
          skin_type_id: values.skin_type_id,
          age_group: values.age_group ?? null,
          allergies: values.allergies.join(", ") || null,
          sensitivities: values.sensitivities.join(", ") || null,
          concerns: values.concerns,
        },
      });
      if (error) throw new Error("Failed to save skin profile");
      return data;
    },
    // Optimistic save with rollback on error — docs/WIREFRAMES.md "4. Skin profile &
    // lifestyle" Accept criteria.
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: ["skin-profile", "me"] });
      const previous = queryClient.getQueryData<SkinProfileRead | null>(["skin-profile", "me"]);
      // Full shape, not a partial spread over `previous` — for a first-time profile
      // `previous` is null (no profile existed, GET .../me 404s), so `{...previous}`
      // would silently omit fields like `concerns`.
      const now = new Date().toISOString();
      queryClient.setQueryData(["skin-profile", "me"], {
        skin_profile_id: previous?.skin_profile_id ?? 0,
        skin_type_id: values.skin_type_id,
        age_group: values.age_group ?? null,
        allergies: values.allergies.join(", ") || null,
        sensitivities: values.sensitivities.join(", ") || null,
        concerns: values.concerns,
        created_at: previous?.created_at ?? now,
        updated_at: now,
      });
      return { previous };
    },
    onError: (_err, _values, context) => {
      if (context) queryClient.setQueryData(["skin-profile", "me"], context.previous);
      toast.error("Couldn't save your skin profile. Please try again.");
    },
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: ["skin-profile", "me"] });
    },
  });

  const toggleConcern = (concernId: number, checked: boolean) => {
    setForm((f) => ({
      ...f,
      concerns: checked
        ? [...f.concerns, { concern_id: concernId, severity_rating: 5, priority_level: 5 }]
        : f.concerns.filter((c) => c.concern_id !== concernId),
    }));
  };

  const updateConcern = (
    concernId: number,
    field: "severity_rating" | "priority_level",
    val: number
  ) => {
    setForm((f) => ({
      ...f,
      concerns: f.concerns.map((c) => (c.concern_id === concernId ? { ...c, [field]: val } : c)),
    }));
  };

  const handleSave = () => {
    if (!form.skin_type_id) {
      toast.error("Select your skin type first");
      return;
    }
    const invalid = form.concerns.some(
      (c) =>
        c.severity_rating < 1 ||
        c.severity_rating > 10 ||
        c.priority_level < 1 ||
        c.priority_level > 10
    );
    setSeverityErrors(invalid);
    if (invalid) return;
    saveMutation.mutate(form);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="font-heading text-base font-semibold text-card-foreground">
          Skin profile
        </h2>
        <p className="mt-1 font-sans text-sm text-muted-foreground">
          {isFirstSetup
            ? "Tell us about your skin so we can personalize your routine and recommendations."
            : "Update your skin profile any time — changes refresh your recommendations."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Skin type</Label>
          <Select
            // `null`, never `undefined` — Base UI's useControlled decides controlled vs.
            // uncontrolled from whether `value` is `undefined` on the *first* render only
            // (@base-ui/utils/useControlled.mjs) and warns/desyncs on any later switch.
            // `form.skin_type_id` starts at the `0` "unset" sentinel on first-time setup,
            // so `... ? String(...) : undefined` used to mount this uncontrolled, then
            // flip to controlled the instant a skin type was picked. `null` is Base UI's
            // own "nothing selected" value (Select's `defaultValue` default) — passing it
            // instead keeps this controlled from mount onward, no transition, ever.
            value={form.skin_type_id ? String(form.skin_type_id) : null}
            onValueChange={(v) => setForm((f) => ({ ...f, skin_type_id: Number(v) }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select skin type">
                {(value: string | null) =>
                  skinTypes.find((t) => String(t.skin_type_id) === value)?.skin_type_name ??
                  "Select skin type"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {skinTypes.map((t) => (
                <SelectItem key={t.skin_type_id} value={String(t.skin_type_id)}>
                  {t.skin_type_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Age group</Label>
          <Select
            items={AGE_GROUP_ITEMS}
            // Same fix as the skin type Select above — `age_group` starts `undefined`
            // on first-time setup, which would otherwise mount this uncontrolled and
            // flip it controlled the instant a value is picked.
            value={form.age_group ?? null}
            onValueChange={(v) => setForm((f) => ({ ...f, age_group: v ?? undefined }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              {AGE_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Gender (optional)</Label>
          <Select
            items={GENDER_ITEMS}
            // Same fix as above — `gender` is never stored on skin_profiles (see
            // formFromProfile), so it always starts `undefined`, every time.
            value={form.gender ?? null}
            onValueChange={(v) => setForm((f) => ({ ...f, gender: v ?? undefined }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <Label>Concerns</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {concerns.map((concern) => {
            const selected = form.concerns.find((c) => c.concern_id === concern.concern_id);
            return (
              <div key={concern.concern_id} className="rounded-lg bg-muted p-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={!!selected}
                    onCheckedChange={(checked) =>
                      toggleConcern(concern.concern_id, checked === true)
                    }
                  />
                  <span className="font-sans text-sm text-on-surface">
                    {concern.concern_name}
                  </span>
                </label>
                {selected && (
                  <div className="mt-3 flex flex-col gap-3 pl-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-geist text-xs text-on-surface-variant">
                          Severity
                        </span>
                        <span className="font-geist text-xs tabular-nums text-on-surface">
                          {selected.severity_rating}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[selected.severity_rating]}
                        onValueChange={(v) =>
                          updateConcern(concern.concern_id, "severity_rating", firstOf(v))
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-geist text-xs text-on-surface-variant">
                          Priority
                        </span>
                        <span className="font-geist text-xs tabular-nums text-on-surface">
                          {selected.priority_level}
                        </span>
                      </div>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[selected.priority_level]}
                        onValueChange={(v) =>
                          updateConcern(concern.concern_id, "priority_level", firstOf(v))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {severityErrors && (
          <p className="text-xs text-destructive">Severity and priority must be 1–10.</p>
        )}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Allergies</Label>
          <TagInput
            value={form.allergies}
            onChange={(allergies) => setForm((f) => ({ ...f, allergies }))}
            placeholder="Type an allergy and press Enter"
            aria-label="Allergies"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sensitivities</Label>
          <TagInput
            value={form.sensitivities}
            onChange={(sensitivities) => setForm((f) => ({ ...f, sensitivities }))}
            placeholder="Type a sensitivity and press Enter"
            aria-label="Sensitivities"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
          Save skin profile
        </Button>
      </div>
    </div>
  );
}
