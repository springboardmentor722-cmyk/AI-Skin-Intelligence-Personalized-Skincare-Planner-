import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

const QUERY_KEY = ["appearance-preferences"] as const;

export type AppearancePreferences = components["schemas"]["AppearancePreferenceRead"];
type AppearancePreferenceUpdate = components["schemas"]["AppearancePreferenceUpdate"];

const DEFAULT_PREFERENCES: AppearancePreferences = {
  palette: "default",
  theme_mode: "system",
  accent_color: null,
  font_size: null,
  density: null,
  motion_preference: null,
};

// Postgres is the source of truth — components/app-shell/appearance-sync.tsx
// reconciles this into the local PaletteProvider/next-themes state once per
// authenticated session; this hook is the one place that ever talks to the backend
// for it. Falls back to schema defaults on a fetch error (e.g. logged out, or the
// row genuinely doesn't exist yet) rather than leaving the picker in a broken state.
export function useAppearancePreferencesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/users/me/appearance");
      return data ?? DEFAULT_PREFERENCES;
    },
    staleTime: 60_000,
  });
}

export function useUpdateAppearanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AppearancePreferenceUpdate) => {
      const { data, error } = await api.PUT("/api/v1/users/me/appearance", { body });
      if (error) throw new Error("Couldn't save appearance settings.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}

export function useResetAppearanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/users/me/appearance/reset");
      if (error) throw new Error("Couldn't reset appearance settings.");
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
