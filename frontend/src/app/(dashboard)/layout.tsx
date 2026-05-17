"use client";

import { useIsAuthenticated, useAuthStore, useUserRoles } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLogout } from "@/hooks/useAuth";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";
import {
  Target, CheckSquare, BarChart2, Users, FileText, Settings,
  LogOut, Menu, X, Bell
} from "lucide-react";
import { useState } from "react";

const employeeNav = [
  { href: "/employee/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/employee/goals", label: "My Goals", icon: Target },
  { href: "/employee/check-ins", label: "Check-Ins", icon: CheckSquare },
];

const managerNav = [
  { href: "/manager/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/manager/team-goals", label: "Team Goals", icon: Target },
  { href: "/manager/analytics", label: "Analytics", icon: BarChart2 },
];

const adminNav = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const roles = useUserRoles();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);

  useEffect(() => {
    if (!useAuthStore.persist) {
      setAuthHydrated(true);
      return;
    }
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setAuthHydrated(true));
    setAuthHydrated(useAuthStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authHydrated && !isAuthenticated) router.push("/login");
  }, [authHydrated, isAuthenticated, router]);

  if (!authHydrated || !isAuthenticated || !user) return null;

  const canSeeEmployee =
    roles.includes("Employee") || roles.includes("Admin") || roles.includes("HR");
  const navItems = [
    ...(canSeeEmployee ? employeeNav : []),
    ...(roles.includes("Manager") ? managerNav : []),
    ...(roles.includes("Admin") || roles.includes("HR") ? adminNav : []),
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">GoalTracker</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user.first_name, user.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{user.roles[0]?.name}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-gray-500 hover:text-gray-700">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
