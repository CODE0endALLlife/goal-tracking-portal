"use client";

import Link from "next/link";
import { useGoals, useThrustAreas } from "@/hooks/useGoals";
import { useCheckIns, useQuarterlyCycles } from "@/hooks/useCheckIns";
import { useCurrentUser, useUserRoles } from "@/store/authStore";
import { Goal, GoalStatus, UnitOfMeasurement } from "@/types/models";
import { statusColor, calculateProgressPercent, cn } from "@/lib/utils";
import {
  Target,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
  Lock,
  Users,
  FileText,
  BarChart3,
  Share2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const FEATURE_LINKS = [
  {
    title: "Goal sheet & approval",
    description: "Create goals, 100% weightage validation, submit for L1 approval",
    href: "/employee/goals",
    icon: Target,
    color: "bg-blue-500",
  },
  {
    title: "Quarterly check-ins",
    description: "Planned vs actual, status tracking, progress formulas by UoM",
    href: "/employee/check-ins",
    icon: CheckSquare,
    color: "bg-emerald-500",
  },
  {
    title: "Manager approvals",
    description: "Review team goals, inline edits, check-in comments",
    href: "/manager/approvals",
    icon: Users,
    color: "bg-violet-500",
    roles: ["Manager", "Admin", "HR"],
  },
  {
    title: "Reports & audit trail",
    description: "CSV export, completion dashboard, change history",
    href: "/admin/reports",
    icon: FileText,
    color: "bg-amber-500",
    roles: ["Admin", "HR"],
  },
  {
    title: "Team analytics",
    description: "Team performance charts and goal distribution",
    href: "/manager/analytics",
    icon: BarChart3,
    color: "bg-indigo-500",
    roles: ["Manager", "Admin", "HR"],
  },
  {
    title: "Admin settings",
    description: "Quarterly cycles, user management, goal unlocks",
    href: "/admin/settings",
    icon: Lock,
    color: "bg-rose-500",
    roles: ["Admin", "HR"],
  },
];

const DEMO_ACCOUNTS = [
  { role: "Employee", email: "employee@goaltracker.dev", password: "Demo123!", note: "Full dashboard with 4 goals & Q4 check-ins" },
  { role: "Employee 2", email: "employee2@goaltracker.dev", password: "Demo123!", note: "Pending approval + draft goals" },
  { role: "Manager", email: "manager@goaltracker.dev", password: "Demo123!", note: "Team approvals & analytics" },
  { role: "Admin", email: "admin@goaltracker.dev", password: "Admin123!", note: "Users, reports, audit logs" },
];

function goalProgress(goal: Goal, checkIns: ReturnType<typeof useCheckIns>["data"]) {
  const checkIn = (checkIns ?? []).find((c) => c.goal_id === goal.id);
  if (checkIn?.actual_value == null) return 0;
  return calculateProgressPercent(goal.unit_of_measurement, goal.target, checkIn.actual_value);
}

export default function EmployeeDashboardPage() {
  const user = useCurrentUser();
  const roles = useUserRoles();
  const { data: goals = [], isLoading } = useGoals();
  const { data: checkIns = [] } = useCheckIns();
  const { data: cycles = [] } = useQuarterlyCycles();
  const { data: thrustAreas = [] } = useThrustAreas();

  const activeCycle = cycles.find((c) => c.is_active);
  const approved = goals.filter((g) => g.status === GoalStatus.Approved);
  const pending = goals.filter((g) => g.status === GoalStatus.Submitted).length;
  const draft = goals.filter((g) => g.status === GoalStatus.Draft).length;
  const rejected = goals.filter((g) => g.status === GoalStatus.Rejected).length;
  const locked = goals.filter((g) => g.is_locked).length;
  const totalWeightage = goals.reduce((acc, g) => acc + Number(g.weightage), 0);

  const weightedProgress =
    approved.length > 0
      ? approved.reduce((sum, g) => sum + goalProgress(g, checkIns) * (Number(g.weightage) / 100), 0)
      : 0;

  const chartData = approved.map((g) => ({
    name: g.title.length > 22 ? `${g.title.slice(0, 22)}…` : g.title,
    progress: Math.round(goalProgress(g, checkIns)),
    weightage: Number(g.weightage),
  }));

  const thrustMap = Object.fromEntries(thrustAreas.map((t) => [t.id, t.name]));
  const byThrust = goals.reduce<Record<string, number>>((acc, g) => {
    const name = thrustMap[g.thrust_area_id] ?? "Other";
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const thrustChart = Object.entries(byThrust).map(([name, count]) => ({ name, count }));

  const checkInDone = approved.filter((g) => checkIns.some((c) => c.goal_id === g.id && c.actual_value != null)).length;

  const visibleFeatures = FEATURE_LINKS.filter(
    (f) => !f.roles || f.roles.some((r) => roles.includes(r))
  );

  const stats = [
    { label: "Total Goals", value: goals.length, icon: Target, color: "bg-blue-500" },
    { label: "Approved & locked", value: `${approved.length} / ${locked}`, icon: Lock, color: "bg-green-500" },
    { label: "Pending review", value: pending, icon: AlertCircle, color: "bg-yellow-500" },
    { label: "Weighted progress", value: `${weightedProgress.toFixed(0)}%`, icon: TrendingUp, color: "bg-purple-500" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-gray-500 mt-1">
            AtomQuest Goal Portal — your performance overview for {activeCycle?.name ?? "current quarter"}
          </p>
        </div>
        {activeCycle && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-800 px-4 py-2.5 rounded-xl text-sm">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{activeCycle.name}</strong> · Check-in window open · Goal setting ends{" "}
              {new Date(activeCycle.goal_setting_end).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4">
            <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {totalWeightage !== 100 && goals.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Weightage must equal 100%</p>
              <p className="mt-1">
                Current total: <strong>{totalWeightage}%</strong> · Min 10% per goal · Max 8 goals
              </p>
              <Link href="/employee/goals" className="inline-flex items-center gap-1 mt-2 text-amber-900 font-medium hover:underline">
                Adjust goals <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
        {approved.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-medium">Q4 check-ins: {checkInDone} of {approved.length} completed</p>
              <p className="mt-1">Update actuals and status for each approved goal.</p>
              <Link href="/employee/check-ins" className="inline-flex items-center gap-1 mt-2 text-emerald-900 font-medium hover:underline">
                Open check-ins <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
        {draft > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700">
            <strong>{draft}</strong> draft goal{draft > 1 ? "s" : ""} ready to submit
            {rejected > 0 && (
              <span> · <strong>{rejected}</strong> rejected — revise and resubmit</span>
            )}
          </div>
        )}
        {goals.length >= 4 && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
            <Share2 className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <p className="text-sm text-violet-800">
              <strong>Shared KPI</strong> linked to your sheet — weightage adjustable, title/target read-only.
            </p>
          </div>
        )}
      </div>

      {/* Charts */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Progress by goal (approved)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Progress"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"][i % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm py-12 text-center">Submit and get goals approved to see progress charts.</p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Goals by thrust area</h2>
            {thrustChart.length > 0 ? (
              <ul className="space-y-3">
                {thrustChart.map(({ name, count }) => (
                  <li key={name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate pr-2">{name}</span>
                    <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No goals yet</p>
            )}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">UoM coverage</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(UnitOfMeasurement).map((uom) => {
                  const has = goals.some((g) => g.unit_of_measurement === uom);
                  return (
                    <span
                      key={uom}
                      className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        has ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                      )}
                    >
                      {uom}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My goals</h2>
          <Link
            href="/employee/goals"
            className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
          >
            Manage goals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y">
          {goals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-2">No goals yet.</p>
              <p className="text-sm mb-4">Sign in as <strong>employee@goaltracker.dev</strong> / Demo123! for pre-loaded demo data.</p>
              <Link
                href="/employee/goals"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Create your first goal
              </Link>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = goalProgress(goal, checkIns);
              const checkIn = checkIns.find((c) => c.goal_id === goal.id);
              const thrust = thrustMap[goal.thrust_area_id];

              return (
                <div key={goal.id} className="px-6 py-4 hover:bg-gray-50/80 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{goal.title}</p>
                        {goal.is_locked && (
                          <Lock className="w-3.5 h-3.5 text-gray-400" aria-label="Locked" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {thrust} · {goal.unit_of_measurement} · Target: {goal.target} · Weight: {goal.weightage}%
                      </p>
                      {checkIn && (
                        <p className="text-xs text-gray-400 mt-1">
                          Actual: {checkIn.actual_value ?? "—"} · Check-in: {checkIn.status}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 sm:w-48">
                      {goal.status === GoalStatus.Approved && (
                        <div className="flex-1 min-w-[7rem]">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Feature showcase */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Portal features — demo tour</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleFeatures.map(({ title, description, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white rounded-xl border shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition"
            >
              <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-700">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
              <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-3">
                Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Demo accounts */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-1">Hackathon demo accounts</h2>
        <p className="text-slate-300 text-sm mb-4">
          Use these logins to showcase Employee, Manager, and Admin journeys (AtomQuest Problem Statement).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_ACCOUNTS.map((acc) => (
            <div key={acc.email} className="bg-white/10 rounded-lg p-4 border border-white/10">
              <p className="font-medium text-blue-200">{acc.role}</p>
              <p className="text-sm mt-1 font-mono">{acc.email}</p>
              <p className="text-sm text-slate-400">Password: {acc.password}</p>
              <p className="text-xs text-slate-400 mt-2">{acc.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
