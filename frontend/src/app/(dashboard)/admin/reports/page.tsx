"use client";

import { useGoalCompletion, useExportCsv } from "@/hooks/useReporting";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { AuditLog } from "@/types/models";
import { formatDate, statusColor } from "@/lib/utils";
import { Download, ClipboardList, CheckCircle2, Clock, FileSpreadsheet, ShieldCheck } from "lucide-react";

type CompletionRow = {
  goal_id: string;
  employee_name: string;
  employee_email: string;
  goal_title: string;
  thrust_area: string;
  target: number;
  weightage: number;
  status: string;
  actual_value?: number | null;
  check_in_status?: string | null;
};

export default function AdminReportsPage() {
  const { data: completionData = [], isLoading } = useGoalCompletion();
  const exportCsv = useExportCsv();

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: ["auditLogs"],
    queryFn: async () => (await apiClient.get("/api/v1/admin/audit-logs?limit=50")).data,
  });

  const rows = completionData as CompletionRow[];
  const totalGoals = rows.length;
  const checkedIn = rows.filter((row) => row.actual_value !== null && row.actual_value !== undefined).length;
  const approved = rows.filter((row) => row.status === "Approved").length;
  const completionRate = totalGoals > 0 ? Math.round((checkedIn / totalGoals) * 100) : 0;
  const employees = new Set(rows.map((row) => row.employee_email)).size;
  const auditActions = auditLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1;
    return acc;
  }, {});
  const byEmployee = rows.reduce<Record<string, { total: number; done: number; email: string }>>((acc, row) => {
    acc[row.employee_name] ??= { total: 0, done: 0, email: row.employee_email };
    acc[row.employee_name].total += 1;
    if (row.actual_value !== null && row.actual_value !== undefined) acc[row.employee_name].done += 1;
    return acc;
  }, {});

  const statCards = [
    { label: "Tracked goals", value: totalGoals, icon: FileSpreadsheet, tone: "bg-blue-500" },
    { label: "Employees covered", value: employees, icon: ShieldCheck, tone: "bg-emerald-500" },
    { label: "Approved goals", value: approved, icon: CheckCircle2, tone: "bg-violet-500" },
    { label: "Check-in completion", value: `${completionRate}%`, icon: Clock, tone: "bg-amber-500" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Audit Logs</h1>
          <p className="text-gray-500 mt-1">Organization-wide goal completion & audit trail</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
        >
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
            <div className={`${tone} h-11 w-11 rounded-xl flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Quarterly Completion Dashboard</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
              {checkedIn} / {totalGoals} check-ins
            </span>
          </div>
          <div className="space-y-3">
            {Object.entries(byEmployee).map(([name, item]) => {
              const rate = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0;
              return (
                <div key={item.email}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{name}</span>
                    <span className="text-gray-500">{item.done}/{item.total} complete</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(byEmployee).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No employee completion data yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Audit Activity Mix</h2>
          <div className="space-y-3">
            {Object.entries(auditActions).map(([action, count]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{action}</span>
                <span className="text-sm font-semibold text-gray-900 bg-gray-100 rounded-full px-2.5 py-0.5">{count}</span>
              </div>
            ))}
            {Object.keys(auditActions).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No audit activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Goal Completion Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold text-gray-900">Goal Completion Report</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Goal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Target</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actual</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Weightage</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.employee_name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{row.goal_title}</div>
                    <div className="text-xs text-gray-400">{row.thrust_area}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.target}</td>
                  <td className="px-4 py-3 text-gray-600">{row.actual_value ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{row.weightage}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(row.status)}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2 font-semibold text-gray-900">
          <ClipboardList className="w-4 h-4" />Audit Log (Last 50)
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="px-6 py-3 text-sm">
              <div className="flex items-center gap-4">
              <span className="text-gray-400 text-xs w-40 flex-shrink-0">{formatDate(log.created_at)}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                log.action === "Approve" ? "bg-green-100 text-green-700" :
                log.action === "Reject" ? "bg-red-100 text-red-700" :
                log.action === "Unlock" ? "bg-purple-100 text-purple-700" :
                "bg-gray-100 text-gray-700"
              }`}>{log.action}</span>
              <span className="text-gray-600">{log.table_name}</span>
              <span className="text-gray-400 text-xs truncate">{log.record_id}</span>
              </div>
              {(log.old_value || log.new_value) && (
                <div className="mt-2 ml-44 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <pre className="bg-gray-50 border rounded-lg p-2 text-gray-500 overflow-x-auto">
                    {JSON.stringify(log.old_value ?? {}, null, 2)}
                  </pre>
                  <pre className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-blue-700 overflow-x-auto">
                    {JSON.stringify(log.new_value ?? {}, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No audit logs found</div>
          )}
        </div>
      </div>
    </div>
  );
}
