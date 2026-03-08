const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem("ymail_token");
  }

  private authHeaders(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async post<T>(path: string, body: unknown, requiresAuth = false): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(requiresAuth ? this.authHeaders() : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message ?? `Request failed: ${response.status}`);
    }
    return data as T;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: this.authHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message ?? `Request failed: ${response.status}`);
    }
    return data as T;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: this.authHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message ?? `Request failed: ${response.status}`);
    }
    return data as T;
  }
}

export const api = new ApiClient();

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; createdAt: string };
}

export interface Connection {
  id: string;
  provider: string;
  authMode: string;
  status: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  toolName: string;
  status: string;
  errorCode: string | null;
  durationMs: number | null;
  createdAt: string;
}
