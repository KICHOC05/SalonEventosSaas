import { useState, useEffect } from "react";
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Check,
    Receipt,
    DollarSign,
    CreditCard,
    AlertTriangle,
    Printer,
    X,
    Search,
    Ban,
    Vault,
    Loader2,
} from "lucide-react";
import {
    fetchProducts,
    createOrder,
    addOrderItem,
    updateOrderItemQty,
    voidOrderItem,
    closeOrder as closeOrderApi,
    cancelOrder as cancelOrderApi,
    registerPayment,
    getCurrentCash,
    openCashRegister,
    closeCashRegister,
    getOrderTicket,
    type ProductResponse,
    type OrderResponse,
    type OrderItemResponse,
    type CashRegisterResponse,
    type PaymentResponse as PaymentRes,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";

export function meta() {
  return buildMeta("Punto de venta", "Gestion de ventas y caja");
}


const TABS = [
    { id: "all", label: "Todos" },
    { id: "PRODUCT", label: "Productos" },
    { id: "SERVICE", label: "Servicios" },
    { id: "PACKAGE", label: "Paquetes" },
];
const TYPE_EMOJI: Record<string, string> = {
    PRODUCT: "📦",
    SERVICE: "⚡",
    PACKAGE: "🎁",
};
export default function POS() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [cash, setCash] = useState<CashRegisterResponse | null>(null);
    const [cashOpen, setCashOpen] = useState(false);
    const [cashLoading, setCashLoading] = useState(true);
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [childName, setChildName] = useState("");
    const [addingProductId, setAddingProductId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
    const [showOpenCash, setShowOpenCash] = useState(false);
    const [openingAmount, setOpeningAmount] = useState("");
    const [openingCash, setOpeningCash] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState<"CASH" | "CARD">("CASH");
    const [payReference, setPayReference] = useState("");
    const [payResult, setPayResult] = useState<PaymentRes | null>(null);
    const [paying, setPaying] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);
    const [showCloseCash, setShowCloseCash] = useState(false);
    const [countedCash, setCountedCash] = useState("");
    const [closingCash, setClosingCash] = useState(false);
    const [closeResult, setCloseResult] = useState<CashRegisterResponse | null>(
        null
    );
    useEffect(() => {
        loadData();
    }, []);
    async function loadData() {
        try {
            const prods = await fetchProducts();
            setProducts(prods.filter((p) => p.active));
        } catch {
            setError("Error cargando productos");
        } finally {
            setLoadingProducts(false);
        }
        try {
            const c = await getCurrentCash();
            setCash(c);
            setCashOpen(true);
        } catch {
            setCashOpen(false);
            setShowOpenCash(true);
        } finally {
            setCashLoading(false);
        }
    }
    async function refreshProducts() {
        try {
            const prods = await fetchProducts();
            setProducts(prods.filter((p) => p.active));
        } catch {
        }
    }
    async function handleOpenCash() {
        const amount = parseFloat(openingAmount);
        if (isNaN(amount) || amount < 0) {
            setError("Monto de apertura inválido");
            return;
        }
        setOpeningCash(true);
        try {
            const c = await openCashRegister({ openingAmount: amount });
            setCash(c);
            setCashOpen(true);
            setShowOpenCash(false);
            setOpeningAmount("");
            setError(null);
        } catch (e: any) {
            setError(e.message || "Error al abrir caja");
        } finally {
            setOpeningCash(false);
        }
    }
    async function handleShowCloseCash() {
        if (order && order.status === "OPEN") {
            const confirmed = confirm(
                "Hay una orden abierta sin cobrar. ¿Deseas cerrar la caja de todos modos?"
            );
            if (!confirmed) return;
        }
        try {
            const c = await getCurrentCash();
            setCash(c);
        } catch {
            setError("Error al obtener estado de caja");
            return;
        }
        setShowCloseCash(true);
    }
    async function handleCloseCash() {
        const amount = parseFloat(countedCash);
        if (isNaN(amount) || amount < 0) {
            setError("Monto inválido");
            return;
        }
        setClosingCash(true);
        try {
            const result = await closeCashRegister({ countedCash: amount });
            setCloseResult(result);
            setCashOpen(false);
            setCash(null);
        } catch (e: any) {
            setError(e.message || "Error al cerrar caja");
        } finally {
            setClosingCash(false);
        }
    }
    async function handleAddProduct(product: ProductResponse) {
        if (!cashOpen) {
            setShowOpenCash(true);
            return;
        }
        if (addingProductId) return;
        setAddingProductId(product.publicId);
        try {
            let currentOrder = order;
            if (!currentOrder) {
                setOrderLoading(true);
                currentOrder = await createOrder({
                    customerName: customerName || undefined,
                    childName: childName || undefined,
                });
                setOrder(currentOrder);
            }
            const existingItem = currentOrder.items?.find(
                (i) =>
                    i.productPublicId === product.publicId &&
                    i.status === "ACTIVE"
            );
            let updatedOrder: OrderResponse;
            if (existingItem) {
                updatedOrder = await updateOrderItemQty(
                    currentOrder.publicId,
                    existingItem.publicId,
                    { quantity: existingItem.quantity + 1 }
                );
            } else {
                updatedOrder = await addOrderItem(currentOrder.publicId, {
                    productPublicId: product.publicId,
                    quantity: 1,
                });
            }
            setOrder(updatedOrder);
            setError(null);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === product.publicId && p.stock !== null
                        ? { ...p, stock: p.stock - 1 }
                        : p
                )
            );
            const warnings = updatedOrder.items?.filter(
                (i) =>
                    i.productPublicId === product.publicId &&
                    i.status === "ACTIVE" &&
                    i.warning
            );
            if (warnings && warnings.length > 0) {
                setError(`⚠️ ${warnings[0].warning}`);
                setTimeout(() => setError(null), 4000);
            }
        } catch (e: any) {
            setError(e.message || "Error al agregar producto");
        } finally {
            setOrderLoading(false);
            setTimeout(() => setAddingProductId(null), 600);
        }
    }
    async function handleUpdateQty(item: OrderItemResponse, delta: number) {
        if (!order) return;
        if (updatingItemId === item.publicId) return;
        setUpdatingItemId(item.publicId);
        const newQty = item.quantity + delta;
        try {
            let updatedOrder: OrderResponse;
            if (newQty <= 0) {
                updatedOrder = await voidOrderItem(
                    order.publicId,
                    item.publicId
                );
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === item.productPublicId &&
                            p.stock !== null
                            ? { ...p, stock: p.stock + item.quantity }
                            : p
                    )
                );
            } else {
                updatedOrder = await updateOrderItemQty(
                    order.publicId,
                    item.publicId,
                    { quantity: newQty }
                );
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === item.productPublicId &&
                            p.stock !== null
                            ? { ...p, stock: p.stock - delta }
                            : p
                    )
                );
            }
            setOrder(updatedOrder);
        } catch (e: any) {
            setError(e.message || "Error al actualizar cantidad");
        } finally {
            setUpdatingItemId(null);
        }
    }
    async function handleVoidItem(item: OrderItemResponse) {
        if (!order) return;
        if (updatingItemId === item.publicId) return;
        setUpdatingItemId(item.publicId);
        try {
            const updatedOrder = await voidOrderItem(
                order.publicId,
                item.publicId
            );
            setOrder(updatedOrder);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === item.productPublicId && p.stock !== null
                        ? { ...p, stock: p.stock + item.quantity }
                        : p
                )
            );
        } catch (e: any) {
            setError(e.message || "Error al eliminar producto");
        } finally {
            setUpdatingItemId(null);
        }
    }
    async function handleCancelOrder() {
        if (!order) return;
        if (!confirm("¿Cancelar esta orden? Se repondrá el inventario."))
            return;
        try {
            await cancelOrderApi(order.publicId);
            resetOrder();
        } catch (e: any) {
            setError(e.message || "Error al cancelar orden");
        }
    }
    function resetOrder() {
        setOrder(null);
        setCustomerName("");
        setChildName("");
        setPayResult(null);
        setOrderCompleted(false);
        setShowPayment(false);
        setPayAmount("");
        setPayReference("");
        setPayMethod("CASH");
        setError(null);
        setUpdatingItemId(null);
        refreshProducts();
    }
    async function handlePayment() {
        if (!order) return;
        const amount = parseFloat(payAmount);
        if (isNaN(amount) || amount <= 0) {
            setError("Monto de pago inválido");
            return;
        }
        setPaying(true);
        setError(null);
        try {
            const result = await registerPayment(order.publicId, {
                amount,
                paymentMethod: payMethod,
                reference:
                    payMethod === "CARD"
                        ? payReference || undefined
                        : undefined,
            });
            setPayResult(result);
            setPayAmount("");
            setPayReference("");
            if (result.remainingAmount <= 0) {
                try {
                    const closedOrder = await closeOrderApi(order.publicId);
                    setOrder(closedOrder);
                    setOrderCompleted(true);
                } catch (e: any) {
                    setOrderCompleted(true);
                    setError(
                        "Pago registrado pero no se pudo cerrar la orden: " +
                        (e.message || "")
                    );
                }
            }
        } catch (e: any) {
            setError(e.message || "Error al procesar pago");
        } finally {
            setPaying(false);
        }
    }
    async function handlePrintTicket() {
        if (!order) return;
        try {
            const html = await getOrderTicket(order.publicId);
            const win = window.open("", "_blank", "width=400,height=600");
            if (win) {
                win.document.write(html);
                win.document.close();
                setTimeout(() => win.print(), 500);
            } else {
                setError(
                    "No se pudo abrir la ventana. Revisa el bloqueador de popups."
                );
            }
        } catch {
            setError("Error al generar ticket");
        }
    }
    const filtered = products.filter((p) => {
        const matchesTab = activeTab === "all" || p.type === activeTab;
        const matchesSearch =
            !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });
    const activeItems =
        order?.items?.filter((i) => i.status === "ACTIVE") ?? [];
    const itemCount = activeItems.reduce((s, i) => s + i.quantity, 0);
    if (cashLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold">Punto de Venta</h2>
                <div className="flex items-center gap-3">
                    {cashOpen && cash && (
                        <>
                            <div className="badge badge-success gap-1">
                                <Vault className="w-3 h-3" />
                                Caja abierta · $
                                {(cash.openingAmount ?? 0).toFixed(2)}
                            </div>
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleShowCloseCash}
                            >
                                Cerrar caja
                            </button>
                        </>
                    )}
                </div>
            </div>
            {error && (
                <div className="alert alert-error shadow-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setError(null)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {!cashOpen && !showOpenCash && (
                <div className="alert alert-warning">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                        <h3 className="font-bold">Caja cerrada</h3>
                        <p className="text-sm">
                            Necesitas abrir la caja para empezar a vender.
                        </p>
                    </div>
                    <button
                        className="btn btn-sm btn-warning"
                        onClick={() => setShowOpenCash(true)}
                    >
                        Abrir caja
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="input input-bordered w-full pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div role="tablist" className="tabs tabs-bordered">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                role="tab"
                                className={`tab ${activeTab === tab.id ? "tab-active" : ""
                                    }`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {loadingProducts ? (
                        <div className="flex justify-center py-12">
                            <span className="loading loading-spinner loading-lg" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-base-content/50">
                            No se encontraron productos
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map((product) => {
                                const isAdding =
                                    addingProductId === product.publicId;
                                return (
                                    <div
                                        key={product.publicId}
                                        onClick={() =>
                                            handleAddProduct(product)
                                        }
                                        className={`card bg-base-100 shadow-sm hover:shadow-md
                                            hover:-translate-y-0.5 transition-all cursor-pointer
                                            ${!cashOpen ? "opacity-60 pointer-events-none" : ""}
                                        `}
                                    >
                                        <div className="card-body items-center text-center p-4">
                                            <span className="text-4xl">
                                                {TYPE_EMOJI[product.type] ??
                                                    "📦"}
                                            </span>
                                            <h4 className="font-medium text-sm mt-2 line-clamp-2">
                                                {product.name}
                                            </h4>
                                            <p className="text-primary font-bold">
                                                ${product.price.toFixed(2)}
                                            </p>
                                            {product.stock !== null &&
                                                product.stock !== undefined && (
                                                    <span
                                                        className={`badge badge-sm ${product.stock <= 0
                                                            ? "badge-error"
                                                            : product.stock <= 5
                                                                ? "badge-warning"
                                                                : "badge-ghost"
                                                            }`}
                                                    >
                                                        Stock: {product.stock}
                                                    </span>
                                                )}
                                            <div
                                                className={`btn btn-sm w-full gap-1 mt-1 ${isAdding
                                                    ? "btn-success"
                                                    : "btn-primary"
                                                    }`}
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Check className="w-3 h-3" />{" "}
                                                        Agregado
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="w-3 h-3" />{" "}
                                                        Agregar
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm sticky top-20">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="card-title text-base">
                                    {order ? "Orden actual" : "Nueva orden"}
                                </h3>
                                {order && (
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-ghost">
                                            {itemCount} items
                                        </span>
                                        <span
                                            className={`badge ${order.status === "OPEN"
                                                ? "badge-info"
                                                : order.status === "CLOSED"
                                                    ? "badge-success"
                                                    : "badge-error"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {!order && (
                                <div className="space-y-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre del cliente (opcional)"
                                        className="input input-bordered input-sm w-full"
                                        value={customerName}
                                        onChange={(e) =>
                                            setCustomerName(e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        placeholder="Nombre del niño(a) (opcional)"
                                        className="input input-bordered input-sm w-full"
                                        value={childName}
                                        onChange={(e) =>
                                            setChildName(e.target.value)
                                        }
                                    />
                                </div>
                            )}
                            {order &&
                                (order.customerName || order.childName) && (
                                    <div className="text-sm text-base-content/70 mb-3">
                                        {order.customerName && (
                                            <p>👤 {order.customerName}</p>
                                        )}
                                        {order.childName && (
                                            <p>👶 {order.childName}</p>
                                        )}
                                    </div>
                                )}
                            {orderLoading && (
                                <div className="flex justify-center py-4">
                                    <span className="loading loading-spinner" />
                                </div>
                            )}
                            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                                {activeItems.length === 0 && !orderLoading ? (
                                    <p className="text-center text-base-content/30 py-8">
                                        Agrega productos para comenzar
                                    </p>
                                ) : (
                                    activeItems.map((item) => {
                                        const isItemUpdating =
                                            updatingItemId === item.publicId;
                                        return (
                                            <div
                                                key={item.publicId}
                                                className={`flex items-center justify-between border-b border-base-300 pb-3 transition-opacity ${isItemUpdating
                                                    ? "opacity-50"
                                                    : ""
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-base-content/50">
                                                        $
                                                        {item.unitPrice.toFixed(
                                                            2
                                                        )}{" "}
                                                        c/u → $
                                                        {item.subtotal.toFixed(
                                                            2
                                                        )}
                                                    </p>
                                                    {item.warning && (
                                                        <p className="text-xs text-warning flex items-center gap-1 mt-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {item.warning}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQty(
                                                                item,
                                                                -1
                                                            );
                                                        }}
                                                        disabled={
                                                            order?.status !==
                                                            "OPEN" ||
                                                            isItemUpdating
                                                        }
                                                    >
                                                        {isItemUpdating ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Minus className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQty(
                                                                item,
                                                                1
                                                            );
                                                        }}
                                                        disabled={
                                                            order?.status !==
                                                            "OPEN" ||
                                                            isItemUpdating
                                                        }
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square text-error ml-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleVoidItem(
                                                                item
                                                            );
                                                        }}
                                                        disabled={
                                                            order?.status !==
                                                            "OPEN" ||
                                                            isItemUpdating
                                                        }
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {order && (
                                <div className="border-t border-base-300 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-base-content/50">
                                            Subtotal
                                        </span>
                                        <span>
                                            $
                                            {(order.subtotal ?? 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {(order.tax ?? 0) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-base-content/50">
                                                IVA
                                            </span>
                                            <span>
                                                $
                                                {(order.tax ?? 0).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t border-base-300 pt-3">
                                        <span>Total</span>
                                        <span>
                                            $
                                            {(
                                                order.totalAmount ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {order && order.status === "OPEN" && (
                                <div className="mt-4 space-y-2">
                                    <button
                                        className="btn btn-primary w-full gap-2"
                                        disabled={activeItems.length === 0}
                                        onClick={() => {
                                            setPayAmount(
                                                (
                                                    order.totalAmount ?? 0
                                                ).toFixed(2)
                                            );
                                            setPayResult(null);
                                            setOrderCompleted(false);
                                            setShowPayment(true);
                                        }}
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        Cobrar $
                                        {(order.totalAmount ?? 0).toFixed(2)}
                                    </button>
                                    <button
                                        className="btn btn-outline btn-error w-full gap-2"
                                        onClick={handleCancelOrder}
                                    >
                                        <Ban className="w-4 h-4" />
                                        Cancelar orden
                                    </button>
                                </div>
                            )}
                            {order && order.status === "CLOSED" && (
                                <div className="mt-4 space-y-2">
                                    <div className="alert alert-success">
                                        <Check className="w-5 h-5" />
                                        <span>¡Venta completada!</span>
                                    </div>
                                    <button
                                        className="btn btn-outline w-full gap-2"
                                        onClick={handlePrintTicket}
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir ticket
                                    </button>
                                    <button
                                        className="btn btn-primary w-full gap-2"
                                        onClick={resetOrder}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nueva orden
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showOpenCash && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Vault className="w-5 h-5" />
                            Abrir Caja
                        </h3>
                        <p className="text-sm text-base-content/70 mt-2">
                            Ingresa el monto inicial en caja para comenzar a
                            vender.
                        </p>
                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">
                                    Monto inicial ($)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="input input-bordered"
                                value={openingAmount}
                                onChange={(e) =>
                                    setOpeningAmount(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleOpenCash()
                                }
                                autoFocus
                            />
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn"
                                onClick={() => setShowOpenCash(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary gap-2"
                                onClick={handleOpenCash}
                                disabled={openingCash}
                            >
                                {openingCash ? (
                                    <span className="loading loading-spinner loading-sm" />
                                ) : (
                                    <Vault className="w-4 h-4" />
                                )}
                                Abrir caja
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowOpenCash(false)}
                    />
                </dialog>
            )}
            {showPayment && order && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Procesar Pago
                        </h3>
                        <div className="bg-base-200 rounded-lg p-4 mt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total a cobrar</span>
                                <span>
                                    ${(order.totalAmount ?? 0).toFixed(2)}
                                </span>
                            </div>
                            {payResult && payResult.remainingAmount > 0 && (
                                <div className="flex justify-between text-sm text-warning mt-1">
                                    <span>Restante</span>
                                    <span>
                                        $
                                        {payResult.remainingAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {!orderCompleted ? (
                            <>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">
                                            Método de pago
                                        </span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            className={`btn flex-1 gap-2 ${payMethod === "CASH"
                                                ? "btn-primary"
                                                : "btn-outline"
                                                }`}
                                            onClick={() =>
                                                setPayMethod("CASH")
                                            }
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            Efectivo
                                        </button>
                                        <button
                                            className={`btn flex-1 gap-2 ${payMethod === "CARD"
                                                ? "btn-primary"
                                                : "btn-outline"
                                                }`}
                                            onClick={() =>
                                                setPayMethod("CARD")
                                            }
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Tarjeta
                                        </button>
                                    </div>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">
                                            Monto recibido ($)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="input input-bordered text-lg"
                                        value={payAmount}
                                        onChange={(e) =>
                                            setPayAmount(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handlePayment()
                                        }
                                        autoFocus
                                    />
                                </div>
                                {payMethod === "CASH" && (
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        {[50, 100, 200, 500, 1000].map(
                                            (amt) => (
                                                <button
                                                    key={amt}
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() =>
                                                        setPayAmount(
                                                            amt.toString()
                                                        )
                                                    }
                                                >
                                                    ${amt}
                                                </button>
                                            )
                                        )}
                                        <button
                                            className="btn btn-sm btn-outline btn-success"
                                            onClick={() =>
                                                setPayAmount(
                                                    (
                                                        payResult?.remainingAmount ??
                                                        order.totalAmount ??
                                                        0
                                                    ).toFixed(2)
                                                )
                                            }
                                        >
                                            Exacto
                                        </button>
                                    </div>
                                )}
                                {payMethod === "CARD" && (
                                    <div className="form-control mt-4">
                                        <label className="label">
                                            <span className="label-text">
                                                Referencia (opcional)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Últimos 4 dígitos…"
                                            className="input input-bordered"
                                            value={payReference}
                                            onChange={(e) =>
                                                setPayReference(e.target.value)
                                            }
                                        />
                                    </div>
                                )}
                                {payResult && (
                                    <div className="mt-4 bg-base-200 rounded-lg p-3 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Total pagado</span>
                                            <span>
                                                $
                                                {payResult.totalPaid.toFixed(2)}
                                            </span>
                                        </div>
                                        {payResult.change > 0 && (
                                            <div className="flex justify-between font-bold text-success text-lg">
                                                <span>Cambio</span>
                                                <span>
                                                    $
                                                    {payResult.change.toFixed(
                                                        2
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="modal-action">
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            setShowPayment(false);
                                            setPayResult(null);
                                        }}
                                        disabled={paying}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn btn-primary gap-2"
                                        onClick={handlePayment}
                                        disabled={paying}
                                    >
                                        {paying ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            <DollarSign className="w-4 h-4" />
                                        )}
                                        Cobrar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <div className="alert alert-success">
                                    <Check className="w-5 h-5" />
                                    <div>
                                        <h4 className="font-bold">
                                            ¡Pago completado!
                                        </h4>
                                        {payResult &&
                                            payResult.change > 0 && (
                                                <p className="text-lg">
                                                    Cambio: $
                                                    {payResult.change.toFixed(
                                                        2
                                                    )}
                                                </p>
                                            )}
                                    </div>
                                </div>
                                <button
                                    className="btn btn-outline w-full gap-2"
                                    onClick={handlePrintTicket}
                                >
                                    <Printer className="w-4 h-4" />
                                    Imprimir ticket
                                </button>
                                <button
                                    className="btn btn-primary w-full gap-2"
                                    onClick={resetOrder}
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva orden
                                </button>
                            </div>
                        )}
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            if (!paying && !orderCompleted) {
                                setShowPayment(false);
                                setPayResult(null);
                            }
                        }}
                    />
                </dialog>
            )}
            {showCloseCash && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Vault className="w-5 h-5" />
                            Cerrar Caja
                        </h3>
                        {!closeResult ? (
                            <>
                                {cash && (
                                    <div className="bg-base-200 rounded-lg p-4 mt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Monto apertura</span>
                                            <span>
                                                $
                                                {(
                                                    cash.openingAmount ?? 0
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Ventas en efectivo</span>
                                            <span>
                                                $
                                                {(
                                                    cash.salesTotal ?? 0
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t border-base-300 pt-2">
                                            <span>Esperado en caja</span>
                                            <span>
                                                $
                                                {(
                                                    cash.expectedAmount ?? 0
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">
                                            Efectivo contado ($)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="input input-bordered"
                                        value={countedCash}
                                        onChange={(e) =>
                                            setCountedCash(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" &&
                                            handleCloseCash()
                                        }
                                        autoFocus
                                    />
                                </div>
                                <div className="modal-action">
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            setShowCloseCash(false);
                                            setCountedCash("");
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="btn btn-primary gap-2"
                                        onClick={handleCloseCash}
                                        disabled={closingCash}
                                    >
                                        {closingCash ? (
                                            <span className="loading loading-spinner loading-sm" />
                                        ) : (
                                            <Vault className="w-4 h-4" />
                                        )}
                                        Cerrar caja
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <div className="alert alert-success">
                                    <Check className="w-5 h-5" />
                                    <span>Caja cerrada exitosamente</span>
                                </div>
                                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Monto apertura</span>
                                        <span>
                                            $
                                            {(
                                                closeResult.openingAmount ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Ventas</span>
                                        <span>
                                            $
                                            {(
                                                closeResult.salesTotal ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Esperado</span>
                                        <span>
                                            $
                                            {(
                                                closeResult.expectedAmount ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Contado</span>
                                        <span>
                                            $
                                            {(
                                                closeResult.countedAmount ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div
                                        className={`flex justify-between font-bold border-t border-base-300 pt-2 ${(closeResult.difference ?? 0) < 0
                                            ? "text-error"
                                            : (closeResult.difference ??
                                                0) > 0
                                                ? "text-warning"
                                                : "text-success"
                                            }`}
                                    >
                                        <span>Diferencia</span>
                                        <span>
                                            $
                                            {(
                                                closeResult.difference ?? 0
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => {
                                        setShowCloseCash(false);
                                        setCloseResult(null);
                                        setCountedCash("");
                                        resetOrder();
                                        setShowOpenCash(true);
                                    }}
                                >
                                    Aceptar
                                </button>
                            </div>
                        )}
                    </div>
                    {!closeResult && (
                        <div
                            className="modal-backdrop"
                            onClick={() => {
                                setShowCloseCash(false);
                                setCountedCash("");
                            }}
                        />
                    )}
                </dialog>
            )}
        </div>
    );
}