"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { User } from "@/types/models";
import { getErrorMessage, formatDate } from "@/lib/utils";
import { useState } from "react";
import { Shield, Users, UserCheck, UserX, Crown } from "lucide-react";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["adminUsers"],
    queryFn: async () => (await apiClient.get("/api/v1/admin/users")).data,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.put(`/api/v1/admin/users/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      apiClient.post(`/api/v1/admin/users/${userId}/roles/${roleName}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const [error, setError] = useState<string | null>(null);
  const assignableRoles = ["Employee", "Manager", "Admin", "HR"] as const;
  const roleCounts = users.reduce<Record<string, number>>((acc, user) => {
    user.roles.forEach((role) => {
      acc[role.name] = (acc[role.name] ?? 0) + 1;
    });
    return acc;
  }, {});
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.length - activeUsers;

  const statCards = [
    { label: "Total users", value: users.length, icon: Users, tone: "bg-blue-500" },
    { label: "Active", value: activeUsers, icon: UserCheck, tone: "bg-emerald-500" },
    { label: "Inactive", value: inactiveUsers, icon: UserX, tone: "bg-rose-500" },
    { label: "Managers/Admins", value: (roleCounts.Manager ?? 0) + (roleCounts.Admin ?? 0) + (roleCounts.HR ?? 0), icon: Crown, tone: "bg-violet-500" },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">{users.length} users in the system</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

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

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Role Coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {assignableRoles.map((role) => (
            <div key={role} className="rounded-lg bg-gray-50 border p-3">
              <p className="text-xs text-gray-500">{role}</p>
              <p className="text-xl font-bold text-gray-900">{roleCounts[role] ?? 0}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Roles</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.map((r) => (
                      <span key={r.id} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        <Shield className="w-3 h-3" />{r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const roleName = e.target.value;
                        if (!roleName) return;
                        setError(null);
                        assignRole.mutate({ userId: user.id, roleName });
                        e.target.value = "";
                      }}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white"
                      disabled={assignRole.isPending}
                    >
                      <option value="">Add role…</option>
                      {assignableRoles
                        .filter((name) => !user.roles.some((r) => r.name === name))
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => toggleActive.mutate({ id: user.id, is_active: !user.is_active })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${user.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
