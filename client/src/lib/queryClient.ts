import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://cornellagestion-app-production.up.railway.app"
    : "http://localhost:5000";
  const fullUrl = url.startsWith("/api") ? `${API_BASE_URL}${url}` : url;

  const token = localStorage.getItem("token");

  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fullUrl = (queryKey[0] as string).startsWith("/api")
      ? `${API_BASE_URL}${queryKey[0]}`
      : (queryKey[0] as string);

    const token = localStorage.getItem("token");

    const res = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});