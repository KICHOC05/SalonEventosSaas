// app/lib/api.ts

const API_BASE = "http://localhost:8080/api";

// ─── Tipos ───
export interface LoginRequest {
    tenantPublicId: string;
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    name: string;
    email: string;
    role: string;
    userPublicId: string;
    tenantId: number;
    branchId: number;
    businessName: string;
    branchName: string;
}

export interface AuthUser {
    token: string;
    name: string;
    email: string;
    role: string;
    userPublicId: string;
    tenantId: number;
    branchId: number;
    businessName: string;
    branchName: string;
}

// ─── Almacenamiento ───
const AUTH_KEY = "pos_auth";

export function getStoredAuth(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        const auth: AuthUser = JSON.parse(raw);
        // Verificar que el token no esté expirado (decodificar JWT)
        if (isTokenExpired(auth.token)) {
            localStorage.removeItem(AUTH_KEY);
            return null;
        }
        return auth;
    } catch {
        return null;
    }
}

export function setStoredAuth(auth: AuthUser): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
    localStorage.removeItem(AUTH_KEY);
}

// ─── Verificar expiración del JWT ───
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

// ─── API Fetch wrapper ───
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const auth = getStoredAuth();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        clearStoredAuth();
        // Redirigir al login si estamos en el dashboard
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
            window.location.href = "/dashboard/login";
        }
        throw new ApiError("Sesión expirada", response.status);
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new ApiError(
            errorBody.error || `Error ${response.status}`,
            response.status,
            errorBody
        );
    }

    // Para respuestas vacías (204 No Content)
    if (response.status === 204) return {} as T;

    return response.json();
}

// ─── Error personalizado ───
export class ApiError extends Error {
    status: number;
    body: any;

    constructor(message: string, status: number, body?: any) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

// ─── Auth API ───
export async function login(data: LoginRequest): Promise<LoginResponse> {
    return await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}