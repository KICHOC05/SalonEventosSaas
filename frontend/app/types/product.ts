// =====================================================
// PRODUCT TYPES
// =====================================================

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