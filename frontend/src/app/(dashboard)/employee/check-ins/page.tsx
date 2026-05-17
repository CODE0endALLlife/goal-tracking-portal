"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useCheckIns, useQuarterlyCycles, useCreateCheckIn, useUpdateCheckIn } from "@/hooks/useCheckIns";
import { GoalStatus, CheckInStatus } from "@/types/models";
import { calculateProgressPercent, getErrorMessage, statusColor } from "@/lib/utils";

export default function CheckInsPage() {
  const { data: goals = [] } = useGoals();
  const { data: checkIns = [] } = useCheckIns();
  const { data: cycles = [] } = useQuarterlyCycles();
  const createCheckIn = useCreateCheckIn();
  const updateCheckIn = useUpdateCheckIn();

  const approvedGoals = goals.filter((g) => g.status === GoalStatus.Approved);
  const activeCycle = cycles.find((c) => c.is_active);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCheckIn = (goalId: string) =>
    checkIns.find((c) => c.goal_id === goalId && c.quarterly_cycle_id === activeCycle?.id);

  const handleSave = async (goalId: string, actualValue: number, status: CheckInStatus) => {
    if (!activeCycle) return;
    setError(null);
    try {
      const existing = getCheckIn(goalId);
      if (existing) {
        await updateCheckIn.mutateAsync({ checkInId: existing.id, data: { actual_value: actualValue, status } });
      } else {
        await createCheckIn.mutateAsync({
          goal_id: goalId,
          quarterly_cycle_id: activeCycle.id,
          actual_value: actualValue,
          status,
        });
      }
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quarterly Check-Ins</h1>
        <p className="text-gray-500 mt-1">
          {activeCycle ? `Active cycle: ${activeCycle.name}` : "No active cycle"}
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {!activeCycle && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-4 rounded-xl text-sm">
          No active quarterly cycle. Please contact your admin.
        </div>
      )}

      <div className="grid gap-4">
        {approvedGoals.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
            No approved goals yet. Goals must be approved before check-ins can be submitted.
          </div>
        ) : (
          approvedGoals.map((goal) => {
            const checkIn = getCheckIn(goal.id);
            const progress = checkIn?.actual_value != null
              ? calculateProgressPercent(goal.unit_of_measurement, goal.target, checkIn.actual_value)
              : 0;

            return (
              <CheckInCard
                key={goal.id}
                goal={goal}
                checkIn={checkIn ?? null}
                progress={progress}
                disabled={!activeCycle}
                onSave={(actualValue, status) => handleSave(goal.id, actualValue, status)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function CheckInCard({ goal, checkIn, progress, disabled, onSave }: {
  goal: any;
  checkIn: any;
  progress: number;
  disabled: boolean;
  onSave: (actualValue: number, status: CheckInStatus) => void;
}) {
  const [actualValue, setActualValue] = useState<string>(checkIn?.actual_value?.toString() ?? "");
  const [status, setStatus] = useState<CheckInStatus>(checkIn?.status ?? CheckInStatus.NotStarted);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(parseFloat(actualValue), status);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{goal.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">Target: {goal.target} · Unit: {goal.unit_of_measurement}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(status)}`}>{status}</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Actual Value</label>
          <input
            type="number"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            placeholder="Enter actual..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CheckInStatus)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
          >
            {Object.values(CheckInStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={disabled || saving || !actualValue}
        className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {saving ? "Saving..." : checkIn ? "Update Check-In" : "Submit Check-In"}
      </button>
    </div>
  );
}
