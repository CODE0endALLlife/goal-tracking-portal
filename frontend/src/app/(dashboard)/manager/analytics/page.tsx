"use client";

import { useTeamAnalytics, useGoalCompletion, useExportCsv } from "@/hooks/useReporting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download, Users, Target, TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

export default function ManagerAnalyticsPage() {
  const { data: analytics, isLoading } = useTeamAnalytics();
  const { data: completionData = [] } = useGoalCompletion();
  const exportCsv = useExportCsv();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const statusChartData = analytics
    ? Object.entries(analytics.status_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const completionChartData = (completionData as any[]).slice(0, 10).map((row: any) => ({
    name: row.employee_name?.split(" ")[0] ?? "N/A",
    target: row.target,
    actual: row.actual_value ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Analytics</h1>
          <p className="text-gray-500 mt-1">Performance overview for your team</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.team_size ?? 0}</p>
            <p className="text-sm text-gray-500">Team Members</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.total_goals ?? 0}</p>
            <p className="text-sm text-gray-500">Total Goals</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.status_distribution?.Approved ?? 0}
            </p>
            <p className="text-sm text-gray-500">Approved Goals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status distribution pie chart */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Goal Status Distribution</h2>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>

        {/* Planned vs Actual bar chart */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Planned vs Actual (Top 10)</h2>
          {completionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={completionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" fill="#3b82f6" name="Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}
