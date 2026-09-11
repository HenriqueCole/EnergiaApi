const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8080";

const TOKEN_KEY = "energia.token";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

type Options = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    setToken(null);
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    const message = await extractError(response);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.erro ?? data.mensagem ?? data.title ?? "Erro inesperado.";
  } catch {
    return "Erro inesperado.";
  }
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { auth }),
  post: <T>(path: string, body: unknown, auth = false) =>
    request<T>(path, { method: "POST", body, auth }),
};
