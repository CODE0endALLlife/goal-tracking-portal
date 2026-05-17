"use client";

import { useState } from "react";
import { useTeamGoals, useApproveGoal, useRejectGoal } from "@/hooks/useGoals";
import { GoalStatus } from "@/types/models";
import { statusColor, getErrorMessage } from "@/lib/utils";
import { Check, X } from "lucide-react";

export default function ApprovalsPage() {
  const { data: goals = [], isLoading } = useTeamGoals();
  const approveGoal = useApproveGoal();
  const rejectGoal = useRejectGoal();

  const [approvalData, setApprovalData] = useState<Record<string, { target?: string; weightage?: string; comment?: string }>>({});
  const [rejectComment, setRejectComment] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const submittedGoals = goals.filter((g) => g.status === GoalStatus.Submitted);

  const handleApprove = async (goalId: string) => {
    setError(null);
    const data = approvalData[goalId] ?? {};
    try {
      await approveGoal.mutateAsync({
        goalId,
        data: {
          target: data.target ? parseFloat(data.target) : undefined,
          weightage: data.weightage ? parseFloat(data.weightage) : undefined,
          comment: data.comment,
        },
      });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleReject = async (goalId: string) => {
    const comment = rejectComment[goalId];
    if (!comment?.trim()) {
      setError("Rejection comment is required");
      return;
    }
    setError(null);
    try {
      await rejectGoal.mutateAsync({ goalId, data: { comment } });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Goal Approvals</h1>
        <p className="text-gray-500 mt-1">{submittedGoals.length} goals pending review</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {submittedGoals.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <Check className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No goals pending approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submittedGoals.map((goal) => (
            <div key={goal.id} className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(goal.status)}`}>
                  {goal.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm bg-gray-50 rounded-lg p-3">
                <div><span className="text-gray-500">Unit:</span> <span className="font-medium">{goal.unit_of_measurement}</span></div>
                <div><span className="text-gray-500">Target:</span> <span className="font-medium">{goal.target}</span></div>
                <div><span className="text-gray-500">Weightage:</span> <span className="font-medium">{goal.weightage}%</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Override Target</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={String(goal.target)}
                    value={approvalData[goal.id]?.target ?? ""}
                    onChange={(e) => setApprovalData((p) => ({ ...p, [goal.id]: { ...p[goal.id], target: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Override Weightage</label>
                  <input
                    type="number"
                    step="1"
                    placeholder={String(goal.weightage)}
                    value={approvalData[goal.id]?.weightage ?? ""}
                    onChange={(e) => setApprovalData((p) => ({ ...p, [goal.id]: { ...p[goal.id], weightage: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Comment</label>
                  <input
                    type="text"
                    placeholder="Optional comment..."
                    value={approvalData[goal.id]?.comment ?? ""}
                    onChange={(e) => setApprovalData((p) => ({ ...p, [goal.id]: { ...p[goal.id], comment: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Rejection reason (required to reject)..."
                  value={rejectComment[goal.id] ?? ""}
                  onChange={(e) => setRejectComment((p) => ({ ...p, [goal.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                />
                <button
                  onClick={() => handleReject(goal.id)}
                  disabled={rejectGoal.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(goal.id)}
                  disabled={approveGoal.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
