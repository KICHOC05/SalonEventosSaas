// app/data/mockData.ts

export interface Event {
    id: number;
    date: string;
    client: string;
    package: string;
    children: number;
    total: number;
    status: "active" | "pending" | "cancelled";
}

export interface InventoryProduct {
    id: number;
    name: string;
    category: string;
    stock: number;
    price: number;
    status: "optimal" | "low" | "out";
}

export interface PosProduct {
    id: number;
    name: string;
    category: "food" | "drinks" | "extras";
    price: number;
    image: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    lastAccess: string;
    status: "active" | "inactive";
}

export interface CartItem extends PosProduct {
    quantity: number;
}

export const events: Event[] = [
    { id: 1, date: "2025-07-15", client: "Ana López", package: "Viaje Galáctico", children: 12, total: 2199, status: "active" },
    { id: 2, date: "2025-07-18", client: "Carlos Ramírez", package: "Cohete Básico", children: 8, total: 1299, status: "active" },
    { id: 3, date: "2025-07-20", client: "María Fernández", package: "Misión Súper Space", children: 25, total: 3499, status: "pending" },
    { id: 4, date: "2025-07-22", client: "Jorge Martínez", package: "Viaje Galáctico", children: 15, total: 2199, status: "active" },
    { id: 5, date: "2025-07-25", client: "Laura González", package: "Cohete Básico", children: 10, total: 1299, status: "cancelled" },
];

export const inventoryProducts: InventoryProduct[] = [
    { id: 1, name: "Pizza espacial", category: "Comida", stock: 42, price: 120, status: "optimal" },
    { id: 2, name: "Hot dogs galácticos", category: "Comida", stock: 15, price: 80, status: "low" },
    { id: 3, name: "Nuggets de astronauta", category: "Comida", stock: 28, price: 90, status: "optimal" },
    { id: 4, name: "Refresco espacial", category: "Bebidas", stock: 56, price: 35, status: "optimal" },
    { id: 5, name: "Jugo de planeta", category: "Bebidas", stock: 8, price: 40, status: "low" },
    { id: 6, name: "Agua lunar", category: "Bebidas", stock: 32, price: 25, status: "optimal" },
    { id: 7, name: "Pastel espacial", category: "Extras", stock: 12, price: 350, status: "optimal" },
    { id: 8, name: "Cupcakes de estrella", category: "Extras", stock: 5, price: 45, status: "low" },
    { id: 9, name: "Galletas de cohete", category: "Extras", stock: 24, price: 60, status: "optimal" },
];

export const posProducts: PosProduct[] = [
    { id: 1, name: "Pizza espacial", category: "food", price: 120, image: "🍕" },
    { id: 2, name: "Hot dogs galácticos", category: "food", price: 80, image: "🌭" },
    { id: 3, name: "Nuggets de astronauta", category: "food", price: 90, image: "🍗" },
    { id: 4, name: "Refresco espacial", category: "drinks", price: 35, image: "🥤" },
    { id: 5, name: "Jugo de planeta", category: "drinks", price: 40, image: "🧃" },
    { id: 6, name: "Agua lunar", category: "drinks", price: 25, image: "💧" },
    { id: 7, name: "Pastel espacial", category: "extras", price: 350, image: "🍰" },
    { id: 8, name: "Cupcakes de estrella", category: "extras", price: 45, image: "🧁" },
    { id: 9, name: "Galletas de cohete", category: "extras", price: 60, image: "🍪" },
    { id: 10, name: "Helado de Marte", category: "extras", price: 55, image: "🍦" },
    { id: 11, name: "Palomitas espaciales", category: "extras", price: 70, image: "🍿" },
    { id: 12, name: "Sandwich lunar", category: "food", price: 95, image: "🥪" },
];

export const users: User[] = [
    { id: 1, name: "María González", email: "maria@spacekids.com", role: "Administrador", lastAccess: "2025-07-15", status: "active" },
    { id: 2, name: "Carlos Ramírez", email: "carlos@spacekids.com", role: "Empleado", lastAccess: "2025-07-14", status: "active" },
    { id: 3, name: "Ana Fernández", email: "ana@spacekids.com", role: "Empleado", lastAccess: "2025-07-13", status: "active" },
    { id: 4, name: "Jorge López", email: "jorge@spacekids.com", role: "Gerente", lastAccess: "2025-07-12", status: "inactive" },
    { id: 5, name: "Laura Martínez", email: "laura@spacekids.com", role: "Empleado", lastAccess: "2025-07-10", status: "active" },
];