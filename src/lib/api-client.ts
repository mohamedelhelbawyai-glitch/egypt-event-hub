const API_BASE_URL = "https://tazkara-backend-production.up.railway.app/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorData: unknown;
    try {
      errorData = await res.json();
    } catch {
      errorData = await res.text();
    }
    const message =
      typeof errorData === "object" && errorData && "message" in errorData
        ? String((errorData as { message: string }).message)
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, errorData);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth Types ───────────────────────────────────────────

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

// ─── Auth API ─────────────────────────────────────────────

export const authApi = {
  adminLogin: (data: AdminLoginRequest) =>
    request<AdminAuthResponse>("/auth/admin/login", { method: "POST", body: data }),

  me: (token: string) =>
    request<Record<string, unknown>>("/auth/me", { token }),
};

// ─── Generic authenticated request helper ─────────────────

export function apiGet<T>(path: string, token: string) {
  return request<T>(path, { token });
}

export function apiPost<T>(path: string, body: unknown, token: string) {
  return request<T>(path, { method: "POST", body, token });
}

export function apiPatch<T>(path: string, body: unknown, token: string) {
  return request<T>(path, { method: "PATCH", body, token });
}

export function apiDelete<T>(path: string, token: string) {
  return request<T>(path, { method: "DELETE", token });
}
