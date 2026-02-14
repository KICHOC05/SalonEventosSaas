// app/routes/pos.tsx
import { useState } from "react";
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Check,
    Receipt,
} from "lucide-react";
import { posProducts, type PosProduct, type CartItem } from "~/data/mockData";

const TABS = [
    { id: "all", label: "Todos" },
    { id: "food", label: "Comida" },
    { id: "drinks", label: "Bebidas" },
    { id: "extras", label: "Extras" },
];

export default function POS() {
    const [activeTab, setActiveTab] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [addedId, setAddedId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const filtered =
        activeTab === "all"
            ? posProducts
            : posProducts.filter((p) => p.category === activeTab);

    /* ── Carrito ── */
    const addToCart = (product: PosProduct) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });

        // Feedback visual
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 800);
    };

    const updateQty = (id: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
                .filter((i) => i.quantity > 0)
        );
    };

    const removeItem = (id: number) =>
        setCart((prev) => prev.filter((i) => i.id !== id));

    const clearCart = () => {
        if (cart.length === 0) return;
        if (confirm("¿Vaciar carrito?")) setCart([]);
    };

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const checkout = () => {
        if (cart.length === 0) return;
        setProcessing(true);
        setTimeout(() => {
            alert(`Venta realizada por $${total.toFixed(2)}. ¡Gracias!`);
            setCart([]);
            setProcessing(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Punto de Venta</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ═══ PRODUCTOS ═══ */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div role="tablist" className="tabs tabs-bordered">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                role="tab"
                                className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Grid de productos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filtered.map((product) => (
                            <div
                                key={product.id}
                                className="card bg-base-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                                <div className="card-body items-center text-center p-4">
                                    <span className="text-4xl">{product.image}</span>
                                    <h4 className="font-medium text-sm mt-2">{product.name}</h4>
                                    <p className="text-base-content/50 text-sm">${product.price}</p>
                                    <button
                                        className={`btn btn-sm w-full gap-1 ${addedId === product.id
                                                ? "btn-success"
                                                : "btn-primary"
                                            }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        {addedId === product.id ? (
                                            <><Check className="w-3 h-3" /> Agregado</>
                                        ) : (
                                            <><ShoppingCart className="w-3 h-3" /> Agregar</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ CARRITO ═══ */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm sticky top-20">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="card-title text-base">Carrito de venta</h3>
                                <span className="badge badge-ghost">{cart.length} items</span>
                            </div>

                            {/* Items */}
                            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                                {cart.length === 0 ? (
                                    <p className="text-center text-base-content/30 py-8">
                                        El carrito está vacío
                                    </p>
                                ) : (
                                    cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between border-b border-base-300 pb-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{item.image}</span>
                                                <div>
                                                    <p className="text-sm font-medium">{item.name}</p>
                                                    <p className="text-xs text-base-content/50">
                                                        ${item.price} c/u
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="btn btn-ghost btn-xs btn-square"
                                                    onClick={() => updateQty(item.id, -1)}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-6 text-center text-sm">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    className="btn btn-ghost btn-xs btn-square"
                                                    onClick={() => updateQty(item.id, 1)}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-xs btn-square text-error ml-2"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totales */}
                            <div className="border-t border-base-300 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-base-content/50">Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-base-content/50">IVA (16%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-base-300 pt-3">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="mt-4 space-y-2">
                                <button
                                    className="btn btn-primary w-full gap-2"
                                    onClick={checkout}
                                    disabled={cart.length === 0 || processing}
                                >
                                    {processing ? (
                                        <span className="loading loading-spinner loading-sm" />
                                    ) : (
                                        <Receipt className="w-4 h-4" />
                                    )}
                                    Finalizar venta
                                </button>
                                <button
                                    className="btn btn-outline btn-error w-full gap-2"
                                    onClick={clearCart}
                                    disabled={cart.length === 0}
                                >
                                    <Trash2 className="w-4 h-4" /> Vaciar carrito
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}