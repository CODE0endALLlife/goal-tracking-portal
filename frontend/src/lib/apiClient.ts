import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach JWT from Zustand store or localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().accessToken || localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple concurrent token refreshes
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle 401 – try to refresh, and if failed, clear tokens and redirect
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and it's not a retry request already
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      // Don't try to refresh if it's the login or refresh endpoint itself failing with 401
      const isAuthUrl = originalRequest.url?.includes("/auth/login") || originalRequest.url?.includes("/auth/refresh");
      
      if (!isAuthUrl) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        (originalRequest as any)._retry = true;
        isRefreshing = true;

        const refreshToken = useAuthStore.getState().refreshToken || (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null);

        if (refreshToken) {
          try {
            // Call refresh endpoint directly using a clean axios instance to avoid infinite loop
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/refresh`,
              { refresh_token: refreshToken },
              { headers: { "Content-Type": "application/json" } }
            );

            const { access_token, refresh_token } = response.data;

            // Update Zustand store and localStorage
            const user = useAuthStore.getState().user;
            if (user) {
              useAuthStore.getState().setAuth(user, access_token, refresh_token);
            }

            processQueue(null, access_token);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return apiClient(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            // Refresh failed, clear state completely and log out
            useAuthStore.getState().clearAuth();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      // No refresh token available, clear state completely and log out
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
