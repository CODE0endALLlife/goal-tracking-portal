"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  {
    role: "Employee",
    email: "employee@goaltracker.dev",
    password: "Demo123!",
    note: "Approved goals, Q4 check-ins, progress charts",
  },
  {
    role: "Employee 2",
    email: "employee2@goaltracker.dev",
    password: "Demo123!",
    note: "Draft and pending goals for approval flow",
  },
  {
    role: "Manager",
    email: "manager@goaltracker.dev",
    password: "Demo123!",
    note: "Team approvals, analytics, manager journey",
  },
  {
    role: "Admin",
    email: "admin@goaltracker.dev",
    password: "Admin123!",
    note: "Users, reports, settings, audit trail",
  },
];

export default function LoginPage() {
  const login = useLogin();
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDemoEmail, setSelectedDemoEmail] = useState(DEMO_ACCOUNTS[0].email);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const selectedDemo = DEMO_ACCOUNTS.find((account) => account.email === selectedDemoEmail) ?? DEMO_ACCOUNTS[0];

  useEffect(() => {
    const storedMode = localStorage.getItem("demo_mode") === "on";
    setDemoMode(storedMode);
    if (storedMode) {
      setValue("email", selectedDemo.email, { shouldValidate: true });
      setValue("password", selectedDemo.password, { shouldValidate: true });
    }
  }, [selectedDemo.email, selectedDemo.password, setValue]);

  const toggleDemoMode = (enabled: boolean) => {
    setDemoMode(enabled);
    localStorage.setItem("demo_mode", enabled ? "on" : "off");
    if (enabled) {
      setValue("email", selectedDemo.email, { shouldValidate: true });
      setValue("password", selectedDemo.password, { shouldValidate: true });
    } else {
      setValue("email", "");
      setValue("password", "");
    }
  };

  const chooseDemoAccount = (email: string) => {
    const account = DEMO_ACCOUNTS.find((item) => item.email === email);
    if (!account) return;
    setSelectedDemoEmail(email);
    setValue("email", account.email, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    await login.mutateAsync(data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Goal Tracker</h1>
        <p className="text-gray-500 mt-2">
          {demoMode ? "Demo mode is on for the hackathon walkthrough" : "Sign in to your account"}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Demo mode</p>
            <p className="text-xs text-gray-500">Show seeded role journeys and fill credentials instantly.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => toggleDemoMode(!demoMode)}
            className={`relative h-7 w-12 rounded-full transition ${demoMode ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                demoMode ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {demoMode && (
          <div className="mt-4 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => {
              const selected = account.email === selectedDemoEmail;
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => chooseDemoAccount(account.email)}
                  className={`text-left rounded-lg border p-3 transition ${
                    selected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{account.role}</p>
                      <p className="text-xs text-gray-500">{account.note}</p>
                    </div>
                    {selected ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {login.error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {getErrorMessage(login.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || login.isPending}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {login.isPending ? "Signing in..." : demoMode ? `Sign in as ${selectedDemo.role}` : "Sign In"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Don't have an account?{" "}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
