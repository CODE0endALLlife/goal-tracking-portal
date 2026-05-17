"use client";

import { useState } from "react";
import { useGoals, useSubmitGoal, useDeleteGoal, useThrustAreas } from "@/hooks/useGoals";
import { GoalStatus } from "@/types/models";
import { statusColor, formatDate, getErrorMessage } from "@/lib/utils";
import { Plus, Lock, Unlock, Trash2, Send, Edit } from "lucide-react";
import GoalFormModal from "@/components/goals/GoalFormModal";
import { Goal } from "@/types/models";

export default function EmployeeGoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const submitGoal = useSubmitGoal();
  const deleteGoal = useDeleteGoal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalWeightage = goals.reduce((acc, g) => acc + g.weightage, 0);
  const canSubmit = Math.abs(totalWeightage - 100) < 0.01;

  const handleSubmitAll = async () => {
    setError(null);
    try {
      const draftGoals = goals.filter((g) => g.status === GoalStatus.Draft);
      for (const goal of draftGoals) {
        await submitGoal.mutateAsync(goal.id);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await deleteGoal.mutateAsync(id);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Goals</h1>
          <p className="text-gray-500 mt-1">
            {goals.length}/8 goals · Total weightage:{" "}
            <span className={totalWeightage === 100 ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
              {totalWeightage}%
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {canSubmit && goals.some((g) => g.status === GoalStatus.Draft) && (
            <button
              onClick={handleSubmitAll}
              disabled={submitGoal.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
            >
              <Send className="w-4 h-4" />
              Submit for Approval
            </button>
          )}
          {goals.length < 8 && (
            <button
              onClick={() => { setEditingGoal(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Goal Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Target</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Weightage</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {goals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No goals yet. Click "Add Goal" to create your first goal.
                </td>
              </tr>
            ) : (
              goals.map((goal) => (
                <tr key={goal.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{goal.title}</div>
                    {goal.description && <div className="text-xs text-gray-500 truncate max-w-xs">{goal.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{goal.unit_of_measurement}</td>
                  <td className="px-4 py-3 text-gray-600">{goal.target}</td>
                  <td className="px-4 py-3 text-gray-600">{goal.weightage}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(goal.status)}`}>
                      {goal.is_locked && <Lock className="w-3 h-3 inline mr-1" />}
                      {goal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(goal.status === GoalStatus.Draft || goal.status === GoalStatus.Rejected) && !goal.is_locked && (
                        <>
                          <button
                            onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
        currentWeightage={totalWeightage}
        maxGoals={8}
        currentCount={goals.length}
      />
    </div>
  );
}
