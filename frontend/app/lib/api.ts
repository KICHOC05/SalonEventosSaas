// =====================================================
// CORE API
// =====================================================

const API_BASE = "http://localhost:8080/api";

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

const AUTH_KEY = "pos_auth";

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

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

// app/lib/api.ts - Agregar al final del archivo

// =====================================================
// PUBLIC API - LANDING
// =====================================================

import type { Package, StatsResponse, PublicAvailabilityResponse } from "~/types/landing";

const PUBLIC_API_BASE = "/api/public";

export async function fetchPublicPackages(): Promise<Package[]> {
  return apiFetch<Package[]>(`${PUBLIC_API_BASE}/packages`);
}

export async function fetchPublicStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>(`${PUBLIC_API_BASE}/stats`);
}

export async function fetchPublicAvailability(
  month: number,
  year: number
): Promise<AvailabilityResponse> {
  return apiFetch<AvailabilityResponse>(
    `${PUBLIC_API_BASE}/availability?month=${month}&year=${year}`
  );
}

// =====================================================
// AUTH
// =====================================================

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

export async function login(data: LoginRequest): Promise<LoginResponse> {
    return await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// =====================================================
// USERS
// =====================================================

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

// =====================================================
// BRANCHES
// =====================================================

export interface BranchResponse {
    id: number;
    publicId: string;
    name: string;
    address: string;
    phone: string;
}

export async function fetchBranches(): Promise<BranchResponse[]> {
    return apiFetch<BranchResponse[]>("/branches");
}

// =====================================================
// PRODUCTS
// =====================================================

import type {
    ProductType,
    ProductResponse,
    ProductRequest
} from "~/types/product";

export type { ProductType, ProductResponse, ProductRequest } from "~/types/product";

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

// =====================================================
// EVENTS
// =====================================================

import type {
  EventResponse,
  EventCalendarResponse,
  AvailabilityResponse,
  CreateEventRequest,
  UpdateEventRequest,
  RescheduleEventRequest,
  EventRescheduleHistoryResponse,
  RegisterEventPaymentRequest,
  EventPaymentResponse,
  EventPaymentMethod,
} from "~/types/event";



export async function fetchEvents(): Promise<EventResponse[]> {
  return apiFetch<EventResponse[]>("/events");
}

export async function fetchEventByPublicId(
  publicId: string
): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}`);
}

export async function createEvent(
  data: CreateEventRequest
): Promise<EventResponse> {
  return apiFetch<EventResponse>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(
  publicId: string,
  data: UpdateEventRequest
): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ✅ CORREGIDO - Usar DELETE con la URL correcta (sin /cancel)
export async function cancelEvent(publicId: string): Promise<void> {
  return apiFetch<void>(`/events/${publicId}`, {
    method: "DELETE",
  });
}

export async function checkEventAvailability(
  date: string,
  start: string,
  end: string,
  excludePublicId?: string
): Promise<AvailabilityResponse> {
  let url = `/events/availability?date=${date}&start=${start}&end=${end}`;
  if (excludePublicId) {
    url += `&excludePublicId=${excludePublicId}`;
  }
  return apiFetch<AvailabilityResponse>(url);
}

export async function fetchEventCalendar(
  from: string,
  to: string
): Promise<EventCalendarResponse[]> {
  return apiFetch<EventCalendarResponse[]>(
    `/events/calendar?from=${from}&to=${to}`
  );
}

// =====================================================
// EVENT WORKFLOW
// =====================================================

export async function confirmEvent(publicId: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}/confirm`, { method: "POST" });
}

export async function startEvent(publicId: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}/start`, { method: "POST" });
}

export async function completeEvent(publicId: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}/complete`, { method: "POST" });
}

export async function rescheduleEvent(
  publicId: string,
  data: RescheduleEventRequest
): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${publicId}/reschedule`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchEventRescheduleHistory(
  publicId: string
): Promise<EventRescheduleHistoryResponse[]> {
  return apiFetch<EventRescheduleHistoryResponse[]>(`/events/${publicId}/reschedule-history`);
}

// =====================================================
// EVENT PAYMENTS
// =====================================================

export async function registerEventPayment(
  publicId: string,
  data: RegisterEventPaymentRequest
): Promise<EventPaymentResponse> {
  return apiFetch<EventPaymentResponse>(`/events/${publicId}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchEventPayments(
  publicId: string
): Promise<EventPaymentResponse[]> {
  return apiFetch<EventPaymentResponse[]>(`/events/${publicId}/payments`);
}

export async function getEventTicket(eventPublicId: string): Promise<string> {
    const auth = getStoredAuth();
    const headers: Record<string, string> = {};
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }
    const res = await fetch(`${API_BASE}/events/${eventPublicId}/ticket`, {
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

export async function getEventPaymentReceipt(
  eventPublicId: string,
  paymentPublicId: string
): Promise<string> {
    const auth = getStoredAuth();
    const headers: Record<string, string> = {};
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }
    const res = await fetch(
        `${API_BASE}/events/${eventPublicId}/payments/${paymentPublicId}/receipt`,
        { headers }
    );

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

    if (!res.ok) throw new ApiError("Error al obtener recibo", res.status);
    return res.text();
}

// =====================================================
// CASH REGISTER
// =====================================================

export interface CashRegisterResponse {
    publicId: string;
    openingAmount: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
    salesTotal: number;
    expectedCash: number;
    expectedAmount: number;
    depositTotal: number;
    withdrawalTotal: number;
    countedAmount: number | null;
    difference: number | null;
    openedAt: string;
    closedAt: string | null;
    status: string;
}

export interface OpenCashRequest {
    openingAmount?: number;
}

export interface CloseCashRequest {
    countedCash: number;
}

export interface CashSettingsResponse {
    defaultOpeningAmount: number;
}

export interface UpdateCashOpeningAmountRequest {
    defaultOpeningAmount: number;
}

export async function openCashRegister(
    data: OpenCashRequest = {}
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

export async function getCashSettings(): Promise<CashSettingsResponse> {
    return apiFetch<CashSettingsResponse>("/cash/settings");
}

export async function updateCashOpeningAmount(
    data: UpdateCashOpeningAmountRequest
): Promise<CashSettingsResponse> {
    return apiFetch<CashSettingsResponse>("/cash/settings/opening-amount", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export type CashMovementType = "WITHDRAWAL" | "DEPOSIT";

export interface CashMovementRequest {
    amount: number;
    reason: string;
    notes?: string;
}

export interface CashMovementResponse {
    publicId: string;
    type: CashMovementType;
    amount: number;
    reason: string;
    notes: string | null;
    userName: string;
    createdAt: string;
}

export async function createCashWithdrawal(
    data: CashMovementRequest
): Promise<CashMovementResponse> {
    return apiFetch<CashMovementResponse>("/cash/movements/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function createCashDeposit(
    data: CashMovementRequest
): Promise<CashMovementResponse> {
    return apiFetch<CashMovementResponse>("/cash/movements/deposits", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getCurrentCashMovements(): Promise<CashMovementResponse[]> {
    return apiFetch<CashMovementResponse[]>("/cash/movements/current");
}

export interface CashMovementHistoryParams {
    page?: number;
    size?: number;
    type?: CashMovementType;
    voided?: boolean;
    userPublicId?: string;
    from?: string;
    to?: string;
}

export async function getCashMovementHistory(
    params: CashMovementHistoryParams = {}
): Promise<PageResponse<CashMovementResponse>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.size !== undefined) searchParams.set("size", String(params.size));
    if (params.type) searchParams.set("type", params.type);
    if (params.voided !== undefined) searchParams.set("voided", String(params.voided));
    if (params.userPublicId) searchParams.set("userPublicId", params.userPublicId);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    const qs = searchParams.toString();
    return apiFetch<PageResponse<CashMovementResponse>>(
        `/cash/movements${qs ? `?${qs}` : ""}`
    );
}

export async function getCashMovementDetail(
    publicId: string
): Promise<CashMovementResponse> {
    return apiFetch<CashMovementResponse>(`/cash/movements/${publicId}`);
}

export async function voidCashMovement(
    publicId: string,
    reason: string
): Promise<CashMovementResponse> {
    return apiFetch<CashMovementResponse>(`/cash/movements/${publicId}/void`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
    });
}

export interface CashRegisterHistoryItem {
    publicId: string;
    status: string;
    openingAmount: number;
    closingAmount: number | null;
    expectedAmount: number | null;
    difference: number | null;
    openedAt: string;
    closedAt: string | null;
    openedByName: string;
    closedByName: string | null;
    orderCount: number;
    movementCount: number;
}

export interface CashRegisterDetail {
    publicId: string;
    status: string;
    openingAmount: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
    salesTotal: number;
    depositTotal: number;
    withdrawalTotal: number;
    expectedCash: number;
    countedCash: number | null;
    difference: number | null;
    openedAt: string;
    closedAt: string | null;
    openedByName: string;
    closedByName: string | null;
    orderCount: number;
    movementCount: number;
}

export interface CashRegisterHistoryParams {
    page?: number;
    size?: number;
    status?: string;
    openedByPublicId?: string;
    from?: string;
    to?: string;
}

export async function getCashRegisterHistory(
    params: CashRegisterHistoryParams = {}
): Promise<PageResponse<CashRegisterHistoryItem>> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.size !== undefined) searchParams.set("size", String(params.size));
    if (params.status) searchParams.set("status", params.status);
    if (params.openedByPublicId) searchParams.set("openedByPublicId", params.openedByPublicId);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    const qs = searchParams.toString();
    return apiFetch<PageResponse<CashRegisterHistoryItem>>(
        `/cash/history${qs ? `?${qs}` : ""}`
    );
}

export async function getCashRegisterDetail(
    publicId: string
): Promise<CashRegisterDetail> {
    return apiFetch<CashRegisterDetail>(`/cash/history/${publicId}`);
}

// =====================================================
// ORDERS
// =====================================================

export type OrderStatus = "OPEN" | "CLOSED" | "CANCELLED" | "PARTIALLY_PAID";

export interface OrderCreateRequest {
    customerName?: string;
    clientPublicId?: string;
}

export interface OrderItemRequest {
    productPublicId: string;
    quantity: number;
    childName?: string;
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
    status: string;
    warning?: string;
    childName?: string;
}

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
    sellerName?: string;
    paymentMethods?: string[];
    childNames?: string[];
    clientPublicId?: string;
    clientParentName?: string;
    items: OrderItemResponse[];
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

// =====================================================
// ORDER HISTORY (ADMIN / MANAGER)
// =====================================================

export interface OrderHistoryItem {
    productName: string;
    productType: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    childName: string | null;
    sessionStart: string | null;
    sessionEnd: string | null;
    durationMinutes: number | null;
}

export interface OrderHistoryRecord {
    publicId: string;
    shortCode: string;
    orderNumber: number;
    createdAt: string;
    closedAt: string | null;
    customerName: string | null;
    sellerName: string;
    status: string;
    totalAmount: number;
    paymentMethods: string[];
    childNames: string[];
    itemsCount: number;
    items?: OrderHistoryItem[];
}

export interface OrderHistoryParams {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
}

export async function fetchOrderHistory(
    params: OrderHistoryParams = {}
): Promise<PageResponse<OrderHistoryRecord>> {
    const sp = new URLSearchParams();
    if (params.page !== undefined) sp.set("page", String(params.page));
    if (params.size !== undefined) sp.set("size", String(params.size));
    if (params.search) sp.set("search", params.search);
    if (params.status) sp.set("status", params.status);
    if (params.createdAtFrom) sp.set("createdAtFrom", params.createdAtFrom);
    if (params.createdAtTo) sp.set("createdAtTo", params.createdAtTo);

    return apiFetch<PageResponse<OrderHistoryRecord>>(
        `/orders/history?${sp.toString()}`
    );
}

// =====================================================
// CLIENTS
// =====================================================

export interface ClientResponse {
    publicId: string;
    parentName: string;
    childName: string;
    phone: string;
    email: string;
    childBirthDate: string | null;
    notes: string;
    frequent: boolean;
    status: string;
    createdAt: string;
    currentCount?: number;
    requiredCount?: number;
    rewardsEarned?: number;
    rewardsAvailable?: number;
    rewardsRedeemed?: number;
    lastVisitAt?: string | null;
}

export interface ClientRequest {
    parentName: string;
    childName?: string;
    phone?: string;
    email?: string;
    childBirthDate?: string;
    notes?: string;
    frequent?: boolean;
}

export async function searchClients(
    search: string,
    page = 0,
    size = 10,
    frequent?: boolean
): Promise<PageResponse<ClientResponse>> {
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    sp.set("size", String(size));
    if (search) sp.set("search", search);
    if (frequent !== undefined) sp.set("frequent", String(frequent));

    return apiFetch<PageResponse<ClientResponse>>(
        `/clients?${sp.toString()}`
    );
}

export async function createClient(data: ClientRequest): Promise<ClientResponse> {
    return apiFetch<ClientResponse>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getClientByPublicId(publicId: string): Promise<ClientResponse> {
    return apiFetch<ClientResponse>(`/clients/${publicId}`);
}

// =====================================================
// LOYALTY
// =====================================================

export interface LoyaltyProgramResponse {
    publicId: string;
    name: string;
    description: string;
    qualifyingProductPublicId: string;
    qualifyingProductName: string;
    requiredPurchases: number;
    rewardQuantity: number;
    rewardDescription: string;
    active: boolean;
}

export interface LoyaltyProgramRequest {
    name?: string;
    description?: string;
    qualifyingProductPublicId?: string;
    requiredPurchases?: number;
    rewardQuantity?: number;
    rewardDescription?: string;
    active?: boolean;
}

export interface ClientLoyaltyResponse {
    totalVisits: number;
    requiredPurchases: number;
    rewardsEarned: number;
    rewardsAvailable: number;
    rewardsRedeemed: number;
    nextRewardAt: number;
}

export async function fetchLoyaltyProgram(): Promise<LoyaltyProgramResponse> {
    return apiFetch<LoyaltyProgramResponse>("/loyalty/program");
}

export async function updateLoyaltyProgram(
    data: LoyaltyProgramRequest
): Promise<LoyaltyProgramResponse> {
    return apiFetch<LoyaltyProgramResponse>("/loyalty/program", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function fetchClientLoyalty(
    clientPublicId: string
): Promise<ClientLoyaltyResponse> {
    return apiFetch<ClientLoyaltyResponse>(
        `/loyalty/clients/${clientPublicId}`
    );
}

export async function redeemLoyaltyReward(
    orderPublicId: string,
    clientPublicId: string
): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/loyalty/redeem/${orderPublicId}`, {
        method: "POST",
        body: JSON.stringify({ orderPublicId, clientPublicId }),
    });
}

// =====================================================
// PAYMENTS
// =====================================================

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

export async function registerPayment(
    orderPublicId: string,
    data: PaymentRequest
): Promise<PaymentResponse> {
    return apiFetch<PaymentResponse>(`/orders/${orderPublicId}/payments`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// =====================================================
// SETTINGS
// =====================================================

export interface TaxSettingsResponse {
    taxEnabled: boolean;
    taxRate: number;
}

export interface TaxSettingsRequest {
    taxEnabled: boolean;
    taxRate: number;
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

export async function getTaxSettings(): Promise<TaxSettingsResponse> {
    return apiFetch<TaxSettingsResponse>("/settings/tax");
}

export async function updateTaxSettings(
    data: TaxSettingsRequest
): Promise<TaxSettingsResponse> {
    return apiFetch<TaxSettingsResponse>("/settings/tax", {
        method: "PUT",
        body: JSON.stringify(data),
    });
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

// =====================================================
// DASHBOARD
// =====================================================

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

// =====================================================
// REPORTS (ADMIN ONLY)
// =====================================================

export async function getSalesReportTicket(period: "WEEKLY" | "BIWEEKLY" | "MONTHLY"): Promise<string> {
    const auth = getStoredAuth();
    const headers: Record<string, string> = {};
    if (auth?.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
    }

    const res = await fetch(`${API_BASE}/reports/sales-ticket?period=${period}`, { headers });

    if (res.status === 401 || res.status === 403) {
        throw new ApiError(res.status === 403 ? "Solo administradores pueden generar reportes" : "Sesión expirada", res.status);
    }
    if (!res.ok) {
        throw new ApiError("Error al generar reporte", res.status);
    }

    return res.text();
}

// =====================================================
// TIMERS
// =====================================================

export interface ActiveSessionResponse {
    itemPublicId: string;
    childName: string;
    productName: string;
    sessionStart: string;
    sessionEnd: string;
    remainingSeconds: number;
    remainingMinutes: number;
    durationMinutes: number;
    expiringSoon: boolean;
    expired: boolean;
    progressPercent: number;
    status: string;
    customerName: string;
    orderPublicId: string;
}

export interface TimerDashboardResponse {
    activeSessions: number;
    expiringSoon: number;
    finishedToday: number;
    expired: number;
    totalTodayMinutes: number;
}

export interface TimerHistoryResponse {
    itemPublicId: string;
    orderPublicId: string;
    customerName: string;
    childName: string;
    productName: string;
    sessionStart: string;
    sessionEnd: string;
    durationMinutes: number;
    status: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export async function fetchActiveSessions(): Promise<ActiveSessionResponse[]> {
    return apiFetch<ActiveSessionResponse[]>("/timers/active");
}

export async function fetchTimerHistory(
    page = 0,
    size = 10,
    search?: string,
    status?: string,
    date?: string
): Promise<PageResponse<TimerHistoryResponse>> {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("size", String(size));

    if (search?.trim()) {
        params.set("search", search);
    }

    if (status?.trim()) {
        params.set("status", status);
    }

    if (date?.trim()) {
        params.set("date", date);
    }

    return apiFetch<PageResponse<TimerHistoryResponse>>(
        `/timers/history?${params.toString()}`
    );
}

export async function fetchTimerDashboard(): Promise<TimerDashboardResponse> {
    return apiFetch<TimerDashboardResponse>("/timers/dashboard");
}
