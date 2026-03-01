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
        if (
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/dashboard")
        ) {
            window.location.href = "/dashboard/login";
        }
        throw new ApiError("Sesión expirada", response.status);
    }

    if (!response.ok) {
        let errorBody: any = {};
        try {
            const text = await response.text();
            if (text && text.trim().length > 0) {
                errorBody = JSON.parse(text);
            }
        } catch {
            // ignorar error de parseo
        }
        throw new ApiError(
            errorBody.error || `Error ${response.status}`,
            response.status,
            errorBody
        );
    }

    // ✅ Leer el body como texto PRIMERO
    const text = await response.text();

    // ✅ Si no hay contenido, retornar vacío
    if (!text || text.trim().length === 0) {
        return {} as T;
    }

    // ✅ Intentar parsear
    try {
        return JSON.parse(text) as T;
    } catch {
        return {} as T;
    }
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

// ─── Types para Users ───
export interface UserResponse {
    publicId: string;
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";
    active: boolean;
    branchId: number;
    branchName: string;
    createdAt: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    branchId: number;
    role: "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";
}

export interface UpdateUserRequest {
    name?: string;
    branchId?: number;
    role?: "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";
    active?: boolean;
}

export interface BranchResponse {
    id: number;
    publicId: string;
    name: string;
    address: string;
    phone: string;
}

// ─── Users API ───
export async function fetchUsers(): Promise<UserResponse[]> {
    return apiFetch<UserResponse[]>("/users");
}

export async function fetchUserByPublicId(publicId: string): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/${publicId}`);
}

export async function createUser(data: CreateUserRequest): Promise<UserResponse> {
    return apiFetch<UserResponse>("/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateUser(
    publicId: string,
    data: UpdateUserRequest
): Promise<UserResponse> {
    return apiFetch<UserResponse>(`/users/${publicId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function changeUserPassword(
    publicId: string,
    newPassword: string
): Promise<void> {
    await apiFetch<void>(
        `/users/${publicId}/password?newPassword=${encodeURIComponent(newPassword)}`,
        { method: "PATCH" }
    );
}

export async function deactivateUser(publicId: string): Promise<void> {
    await apiFetch<void>(`/users/${publicId}/deactivate`, {
        method: "PATCH",
    });
}

export async function deleteUser(publicId: string): Promise<void> {
    await apiFetch<void>(`/users/${publicId}`, {
        method: "DELETE",
    });
}

// ─── Branches API ───
export async function fetchBranches(): Promise<BranchResponse[]> {
    return apiFetch<BranchResponse[]>("/branches");
}
