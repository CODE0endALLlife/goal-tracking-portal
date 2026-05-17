import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { TeamAnalytics } from "@/types/api";

export function useGoalCompletion() {
  return useQuery({
    queryKey: ["reports", "goalCompletion"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/reports/goal-completion");
      return res.data;
    },
  });
}

export function useTeamAnalytics() {
  return useQuery<TeamAnalytics>({
    queryKey: ["reports", "teamAnalytics"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/reports/team-analytics");
      return res.data;
    },
  });
}

export function useExportCsv() {
  return async () => {
    const res = await apiClient.get("/api/v1/reports/goal-completion/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "goal_completion_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };
}
