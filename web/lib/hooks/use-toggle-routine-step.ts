import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type RoutineRead = components["schemas"]["RoutineRead"];

const QUERY_KEY = ["routines", "me"] as const;

// Shared by every surface that renders a routine checklist (dashboard's
// RoutineChecklistCard, the /routine screen) so there's one canonical
// optimistic-update/rollback implementation, not a copy per screen. POSTs to
// Milestone 2's real completion-tracking endpoint (backend/app/services/routines/
// router.py) instead of tracking checked state client-side only.
export function useToggleRoutineStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: number; completed: boolean }) => {
      const { error } = await api.POST("/api/v1/routines/steps/{step_id}/log", {
        params: { path: { step_id: stepId } },
        body: { completed },
      });
      if (error) throw new Error("Couldn't save that step.");
    },
    onMutate: async ({ stepId, completed }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<RoutineRead[]>(QUERY_KEY);
      queryClient.setQueryData<RoutineRead[]>(QUERY_KEY, (current) =>
        current?.map((routine) => ({
          ...routine,
          steps: routine.steps.map((step) =>
            step.step_id === stepId ? { ...step, completed_today: completed } : step
          ),
        }))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
  });
}
