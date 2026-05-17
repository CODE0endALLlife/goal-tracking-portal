import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { Goal, ThrustArea } from "@/types/models";
import { GoalCreatePayload, GoalUpdatePayload, GoalApprovalPayload, GoalRejectPayload } from "@/types/api";

const GOALS_KEY = "goals";

export function useGoals(status?: string) {
  return useQuery<Goal[]>({
    queryKey: [GOALS_KEY, status],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/goals", { params: status ? { status } : {} });
      return res.data;
    },
  });
}

export function useTeamGoals() {
  return useQuery<Goal[]>({
    queryKey: [GOALS_KEY, "team"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/goals/team");
      return res.data;
    },
  });
}

export function useGoal(goalId: string) {
  return useQuery<Goal>({
    queryKey: [GOALS_KEY, goalId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/goals/${goalId}`);
      return res.data;
    },
    enabled: !!goalId,
  });
}

export function useThrustAreas() {
  return useQuery<ThrustArea[]>({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/goals/thrust-areas");
      return res.data;
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalCreatePayload) => apiClient.post("/api/v1/goals", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useUpdateGoal(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GoalUpdatePayload) => apiClient.put(`/api/v1/goals/${goalId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useSubmitGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => apiClient.post(`/api/v1/goals/${goalId}/submit`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useApproveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: GoalApprovalPayload }) =>
      apiClient.post(`/api/v1/goals/${goalId}/approve`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useRejectGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: GoalRejectPayload }) =>
      apiClient.post(`/api/v1/goals/${goalId}/reject`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useUnlockGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => apiClient.post(`/api/v1/goals/${goalId}/unlock`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => apiClient.delete(`/api/v1/goals/${goalId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [GOALS_KEY] }),
  });
}
