import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { status?: number; data?: { detail?: string | { msg: string }[] } };
      message?: string;
    };
    const detail = axiosError.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    if (axiosError.response?.status === 500) {
      return "Server error. Please try again or contact support.";
    }
    if (!axiosError.response && axiosError.message) {
      return "Cannot reach the API. Is the backend running at the configured URL?";
    }
  }
  return "An unexpected error occurred";
}

export function calculateProgressPercent(
  unitOfMeasurement: string,
  target: number,
  actual: number
): number {
  if (unitOfMeasurement === "ZeroBased") return actual === 0 ? 100 : 0;
  if (target === 0) return 0;
  return Math.min((actual / target) * 100, 100);
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    Draft: "bg-gray-100 text-gray-700",
    Submitted: "bg-blue-100 text-blue-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    Completed: "bg-purple-100 text-purple-700",
    Archived: "bg-yellow-100 text-yellow-700",
    "Not Started": "bg-gray-100 text-gray-700",
    "On Track": "bg-blue-100 text-blue-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}
