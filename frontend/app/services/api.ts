const API_BASE = "http://localhost:8080/api";

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
}

export interface ProductRequest {
    name: string;
    description: string;
    price: number;
}

export const productApi = {
    async getAll(): Promise<Product[]> {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error("Error al obtener productos");
        return res.json();
    },

    async getById(id: number): Promise<Product> {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
    },

    async create(data: ProductRequest): Promise<Product> {
        const res = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al crear producto");
        return res.json();
    },

    async update(id: number, data: ProductRequest): Promise<Product> {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al actualizar producto");
        return res.json();
    },

    async delete(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar producto");
    },
};