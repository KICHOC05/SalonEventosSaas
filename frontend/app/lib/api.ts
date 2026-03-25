const API_BASE = "http://localhost:8080/api";

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

const AUTH_KEY = "pos_auth";

export function getStoredAuth(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        const auth: AuthUser = JSON.parse(raw);
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

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

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
        if (endpoint === "/auth/login") {
            let errorBody: any = {};
            try {
                const text = await response.text();
                if (text && text.trim().length > 0) {
                    errorBody = JSON.parse(text);
                }
            } catch {
            }
            throw new ApiError(
                errorBody.message || errorBody.error || "Credenciales incorrectas",
                response.status,
                errorBody
            );
        }

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
        }
        throw new ApiError(
            errorBody.message || errorBody.error || `Error ${response.status}`,
            response.status,
            errorBody
        );
    }

    const text = await response.text();

    if (!text || text.trim().length === 0) {
        return {} as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return {} as T;
    }
}

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

export async function login(data: LoginRequest): Promise<LoginResponse> {
    return await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

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

export async function fetchBranches(): Promise<BranchResponse[]> {
    return apiFetch<BranchResponse[]>("/branches");
}

export type ProductType = "PRODUCT" | "SERVICE" | "PACKAGE";

export interface ProductResponse {
    publicId: string;
    name: string;
    description: string | null;
    price: number;
    stock: number | null;
    type: ProductType;
    active: boolean;
    department: string;
    durationMinutes: number | null;
    requiresSchedule: boolean | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProductRequest {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    type: ProductType;
    department: string;
    durationMinutes?: number;
    requiresSchedule?: boolean;
}

export async function fetchProducts(): Promise<ProductResponse[]> {
    return apiFetch<ProductResponse[]>("/products");
}

export async function fetchProductByPublicId(publicId: string): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${publicId}`);
}

export async function createProduct(data: ProductRequest): Promise<ProductResponse> {
    return apiFetch<ProductResponse>("/products", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateProduct(
    publicId: string,
    data: ProductRequest
): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${publicId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteProduct(publicId: string): Promise<void> {
    await apiFetch<void>(`/products/${publicId}`, {
        method: "DELETE",
    });
}

export async function toggleProductStatus(publicId: string): Promise<ProductResponse> {
    return apiFetch<ProductResponse>(`/products/${publicId}/toggle-status`, {
        method: "PATCH",
    });
}

export interface CashRegisterResponse {
    publicId: string;
    openingAmount: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
    salesTotal: number;
    expectedCash: number;
    expectedAmount: number;
    countedAmount: number | null;
    difference: number | null;
    openedAt: string;
    closedAt: string | null;
    status: string;
}

export interface OpenCashRequest {
    openingAmount: number;
}

export interface CloseCashRequest {
    countedCash: number;
}

export interface OrderCreateRequest {
    customerName?: string;
    childName?: string;
}

export interface OrderItemRequest {
    productPublicId: string;
    quantity: number;
    eventDate?: string;
    startTime?: string;
    endTime?: string;
}

export interface UpdateOrderItemRequest {
    quantity: number;
}

export interface OrderItemResponse {
    publicId: string;
    productPublicId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    warning: string | null;
    status: string;
}

export type OrderStatus = "OPEN" | "CLOSED" | "CANCELLED" | "PARTIALLY_PAID";

export interface OrderResponse {
    publicId: string;
    status: OrderStatus;
    customerName: string | null;
    childName: string | null;
    totalAmount: number;
    subtotal: number;
    tax: number;
    createdAt: string;
    closedAt: string | null;
    items: OrderItemResponse[];
}

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export interface PaymentRequest {
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
}

export interface PaymentResponse {
    orderTotal: number;
    totalPaid: number;
    remainingAmount: number;
    change: number;
    amountReceived: number;
    amountApplied: number;
    paymentMethod: string;
}

export interface TaxSettingsResponse {
    taxEnabled: boolean;
    taxRate: number;
}

export async function openCashRegister(
    data: OpenCashRequest
): Promise<CashRegisterResponse> {
    return apiFetch<CashRegisterResponse>("/cash/open", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getCurrentCash(): Promise<CashRegisterResponse> {
    return apiFetch<CashRegisterResponse>("/cash/current");
}

export async function closeCashRegister(
    data: CloseCashRequest
): Promise<CashRegisterResponse> {
    return apiFetch<CashRegisterResponse>("/cash/close", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function createOrder(
    data: OrderCreateRequest
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getOrder(publicId: string): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${publicId}`);
}

export async function addOrderItem(
    orderPublicId: string,
    data: OrderItemRequest
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${orderPublicId}/items`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateOrderItemQty(
    orderPublicId: string,
    itemPublicId: string,
    data: UpdateOrderItemRequest
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(
        `/orders/${orderPublicId}/items/${itemPublicId}`,
        { method: "PUT", body: JSON.stringify(data) }
    );
}

export async function voidOrderItem(
    orderPublicId: string,
    itemPublicId: string
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(
        `/orders/${orderPublicId}/items/${itemPublicId}/void`,
        { method: "POST" }
    );
}

export async function closeOrder(publicId: string): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${publicId}/close`, {
        method: "POST",
    });
}

export async function cancelOrder(publicId: string): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/${publicId}/cancel`, {
        method: "POST",
    });
}

export async function registerPayment(
    orderPublicId: string,
    data: PaymentRequest
): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>(`/orders/${orderPublicId}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getTaxSettings(): Promise<TaxSettingsResponse> {
    return apiFetch<TaxSettingsResponse>("/settings/tax");
}

export async function getOrderTicket(orderPublicId: string): Promise<string> {
    const auth = getStoredAuth();
    const headers: Record<string, string> = {};
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }
    const res = await fetch(`${API_BASE}/orders/${orderPublicId}/ticket`, {
        headers,
    });

    if (res.status === 401 || res.status === 403) {
        clearStoredAuth();
        if (
            typeof window !== "undefined" &&
            window.location.pathname.startsWith("/dashboard")
        ) {
            window.location.href = "/dashboard/login";
        }
        throw new ApiError("Sesión expirada", res.status);
    }

    if (!res.ok) throw new ApiError("Error al obtener ticket", res.status);
    return res.text();
}

export interface CompanySettingsResponse {
    businessName: string;
    phone: string | null;
    website: string | null;
    logoUrl: string | null;
}

export interface CompanySettingsRequest {
    businessName?: string;
    phone?: string;
    website?: string;
}

export interface TenantSettingsResponse {
    inventoryMode: "STRICT" | "WARNING" | "DISABLED";
}

export async function getCompanySettings(): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>("/settings/company");
}

export async function updateCompanySettings(
    data: CompanySettingsRequest
): Promise<CompanySettingsResponse> {
    return apiFetch<CompanySettingsResponse>("/settings/company", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const auth = getStoredAuth();
    const formData = new FormData();
    formData.append("logo", file);

    const headers: Record<string, string> = {};
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }

    const res = await fetch(`${API_BASE}/settings/logo`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (res.status === 401 || res.status === 403) {
        clearStoredAuth();
        throw new ApiError("Sesión expirada", res.status);
    }

    if (!res.ok) {
        let errorBody: any = {};
        try { errorBody = await res.json(); } catch { }
        throw new ApiError(
            errorBody.error || `Error ${res.status}`,
            res.status,
            errorBody
        );
    }

    return res.json();
}


export async function getTenantSettings(): Promise<TenantSettingsResponse> {
    return apiFetch<TenantSettingsResponse>("/settings");
}

export async function updateInventoryMode(
    mode: "STRICT" | "WARNING" | "DISABLED"
): Promise<TenantSettingsResponse> {
    return apiFetch<TenantSettingsResponse>("/settings/inventory-mode", {
        method: "PUT",
        body: JSON.stringify({ inventoryMode: mode }),
    });
}


export interface TaxSettingsRequest {
    taxEnabled: boolean;
    taxRate: number;
}

export async function updateTaxSettings(
    data: TaxSettingsRequest
): Promise<TaxSettingsResponse> {
    return apiFetch<TaxSettingsResponse>("/settings/tax", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}


export interface InventorySummary {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    lowStockProducts: {
        publicId: string;
        name: string;
        stock: number;
    }[];
}

export interface SalesChartData {
    labels: string[];
    data: number[];
    fullDates: string[];
}

export interface TopItem {
    publicId: string;
    name: string;
    quantitySold: number;
    totalRevenue: number;
}

export interface UpcomingEvent {
    date: string;
    client: string;
    packageName: string;
    children: number;
    status: string;
}

export interface DashboardData {
    salesToday: number;
    salesYesterday: number;
    salesTodayGrowth: number;
    monthlyRevenue: number;
    previousMonthRevenue: number;
    monthlyGrowth: number;
    inventory: InventorySummary;
    salesChart: SalesChartData;
    topPackages: TopItem[];
    upcomingEvents: UpcomingEvent[];
    scheduledEventsCount: number;
}

export interface PaymentBreakdownData {
    cashTotal: number;
    cardTotal: number;
    transferTotal: number;
}

export interface StatsData {
    rangeDays: number;
    dateFrom: string;
    dateTo: string;
    dailySales: SalesChartData;
    salesByProduct: TopItem[];
    salesByPackage: TopItem[];
    topProducts: TopItem[];
    totalSales: number;
    averageTicket: number;
    growthPercentage: number;
    totalOrders: number;
    scheduledEvents: number;
    paymentBreakdown: PaymentBreakdownData;
}

export async function fetchDashboard(): Promise<DashboardData> {
    return apiFetch<DashboardData>("/dashboard");
}

export async function fetchStats(range: number = 7): Promise<StatsData> {
    return apiFetch<StatsData>(`/dashboard/stats?range=${range}`);
}
