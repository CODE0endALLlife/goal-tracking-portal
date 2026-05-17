"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { QuarterlyCycle } from "@/types/models";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { useState } from "react";
import { useUnlockGoal } from "@/hooks/useGoals";
import { useGoalCompletion } from "@/hooks/useReporting";
import { CalendarClock, LockOpen, Mail, ShieldAlert } from "lucide-react";

type CompletionRow = {
  goal_id: string;
  employee_name: string;
  goal_title: string;
  status: string;
  weightage: number;
};

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data: cycles = [] } = useQuery<QuarterlyCycle[]>({
    queryKey: ["cycles"],
    queryFn: async () => (await apiClient.get("/api/v1/check-ins/cycles")).data,
  });

  const createCycle = useMutation({
    mutationFn: (data: Omit<QuarterlyCycle, "id">) => apiClient.post("/api/v1/admin/cycles", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cycles"] }),
  });

  const unlockGoal = useUnlockGoal();
  const { data: completionData = [] } = useGoalCompletion();
  const [unlockId, setUnlockId] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const rows = completionData as CompletionRow[];
  const lockedGoals = rows.filter((row) => row.status === "Approved");
  const activeCycle = cycles.find((cycle) => cycle.is_active);

  const handleUnlock = async () => {
    if (!unlockId.trim()) return;
    setUnlockError(null);
    setUnlockSuccess(false);
    try {
      await unlockGoal.mutateAsync(unlockId.trim());
      setUnlockSuccess(true);
      setUnlockId("");
    } catch (e) {
      setUnlockError(getErrorMessage(e));
    }
  };

  const schedule = [
    { label: "Phase 1", window: "May", action: "Goal creation, submission & approval" },
    { label: "Q1", window: "July", action: "Progress update against planned targets" },
    { label: "Q2", window: "October", action: "Quarterly check-in and manager feedback" },
    { label: "Q3", window: "January", action: "Mid-year visibility and course correction" },
    { label: "Q4 / Annual", window: "March / April", action: "Final achievement capture" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-500 mt-1">Manage quarterly cycles and goal unlocks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active cycle</p>
              <p className="font-semibold text-gray-900">{activeCycle?.name ?? "Not configured"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center">
              <LockOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Locked approved goals</p>
              <p className="font-semibold text-gray-900">{lockedGoals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reminder rules</p>
              <p className="font-semibold text-gray-900">4 active templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Unlock */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Unlock a Goal</h2>
        <p className="text-sm text-gray-500 mb-4">Select an approved goal or paste a Goal ID to unlock it for exception handling.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {lockedGoals.slice(0, 6).map((goal) => (
            <button
              key={goal.goal_id}
              type="button"
              onClick={() => setUnlockId(goal.goal_id)}
              className="text-left rounded-lg border bg-gray-50 p-3 hover:border-purple-300 hover:bg-purple-50 transition"
            >
              <p className="text-sm font-medium text-gray-900">{goal.goal_title}</p>
              <p className="text-xs text-gray-500">{goal.employee_name} · {goal.weightage}% · approved</p>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={unlockId}
            onChange={(e) => setUnlockId(e.target.value)}
            placeholder="Goal UUID..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleUnlock}
            disabled={unlockGoal.isPending || !unlockId.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {unlockGoal.isPending ? "Unlocking..." : "Unlock"}
          </button>
        </div>
        {unlockError && <p className="mt-2 text-sm text-red-600">{unlockError}</p>}
        {unlockSuccess && <p className="mt-2 text-sm text-green-600">Goal unlocked successfully.</p>}
      </div>

      {/* Quarterly Cycles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quarterly Cycles</h2>
          <div className="space-y-3">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{cycle.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Goal setting: {formatDate(cycle.goal_setting_start)} - {formatDate(cycle.goal_setting_end)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cycle.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {cycle.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {cycles.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No cycles configured.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">BRD Check-in Schedule</h2>
          <div className="space-y-3">
            {schedule.map((item) => (
              <div key={item.label} className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <div className="w-20 flex-shrink-0 text-sm font-semibold text-gray-900">{item.label}</div>
                <div>
                  <p className="text-sm text-gray-700">{item.action}</p>
                  <p className="text-xs text-gray-500">Window opens: {item.window}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-gray-900">Escalation & Notification Demo Rules</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              "Employee goal sheet not submitted within 7 days",
              "Manager approval pending beyond 5 days",
              "Quarterly check-in incomplete near window close",
            ].map((rule, index) => (
              <div key={rule} className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs font-semibold text-amber-700">Rule {index + 1}</p>
                <p className="text-sm text-amber-900 mt-1">{rule}</p>
                <p className="text-xs text-amber-700 mt-3">Notify employee - manager - HR</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
