"use client";

import { useTeamGoals } from "@/hooks/useGoals";
import { statusColor } from "@/lib/utils";
import { GoalStatus } from "@/types/models";

export default function TeamGoalsPage() {
  const { data: goals = [], isLoading } = useTeamGoals();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Goals</h1>
        <p className="text-gray-500 mt-1">{goals.length} total goals across your team</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Goal Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Target</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Weightage</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Locked</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {goals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No team goals found.</td>
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
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(goal.status)}`}>{goal.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{goal.is_locked ? "🔒 Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
