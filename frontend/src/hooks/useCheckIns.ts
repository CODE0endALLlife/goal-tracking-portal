import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { CheckIn, QuarterlyCycle } from "@/types/models";
import { CheckInPayload } from "@/types/api";

const CHECKIN_KEY = "checkIns";

export function useCheckIns(goalId?: string) {
  return useQuery<CheckIn[]>({
    queryKey: [CHECKIN_KEY, goalId],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/check-ins", { params: goalId ? { goal_id: goalId } : {} });
      return res.data;
    },
  });
}

export function useQuarterlyCycles() {
  return useQuery<QuarterlyCycle[]>({
    queryKey: ["quarterlyCycles"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/check-ins/cycles");
      return res.data;
    },
  });
}

export function useCreateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInPayload) => apiClient.post("/api/v1/check-ins", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHECKIN_KEY] }),
  });
}

export function useUpdateCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkInId, data }: { checkInId: string; data: Partial<CheckInPayload> }) =>
      apiClient.put(`/api/v1/check-ins/${checkInId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHECKIN_KEY] }),
  });
}

export function useAddManagerComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checkInId, comment }: { checkInId: string; comment: string }) =>
      apiClient.post(`/api/v1/check-ins/${checkInId}/comment`, { comment }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHECKIN_KEY] }),
  });
}
