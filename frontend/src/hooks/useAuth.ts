import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { TokenResponse } from "@/types/api";
import { User } from "@/types/models";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const tokenRes = await apiClient.post<TokenResponse>("/api/v1/auth/login", credentials);
      const { access_token, refresh_token } = tokenRes.data;
      // Fetch user profile
      const meRes = await apiClient.get<User>("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      return { user: meRes.data, access_token, refresh_token };
    },
    onSuccess: ({ user, access_token, refresh_token }) => {
      setAuth(user, access_token, refresh_token);
      // Route based on role
      const roles = user.roles.map((r) => r.name);
      if (roles.includes("Admin") || roles.includes("HR")) {
        router.push("/admin/users");
      } else if (roles.includes("Manager") && !roles.includes("Employee")) {
        router.push("/manager/approvals");
      } else {
        router.push("/employee/dashboard");
      }
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  return () => {
    clearAuth();
    router.push("/login");
  };
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { email: string; password: string; first_name: string; last_name: string }) =>
      apiClient.post("/api/v1/auth/register", data).then((r) => r.data),
    onSuccess: () => router.push("/login"),
  });
}
