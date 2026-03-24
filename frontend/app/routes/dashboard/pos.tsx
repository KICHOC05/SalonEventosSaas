import { useState, useEffect, useCallback } from "react";
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
    ArrowRightLeft,
    Sparkles,
    Package,
    Zap,
    Gift,
    User,
    Baby,
    Hash,
    ChevronRight,
    CircleDollarSign,
    Banknote,
    CheckCircle2,
    XCircle,
    Calculator,
    Clock,
    Building,
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
    type PaymentMethod,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Punto de venta", "Gestión de ventas y caja");
}


const PRODUCT_TABS = [
    { id: "all", label: "Todos", icon: Package },
    { id: "PRODUCT", label: "Productos", icon: Package },
    { id: "SERVICE", label: "Servicios", icon: Zap },
    { id: "PACKAGE", label: "Paquetes", icon: Gift },
];

const TYPE_CONFIG: Record<string, { emoji: string; gradient: string }> = {
    PRODUCT: { emoji: "📦", gradient: "from-cyan-500/10 to-blue-500/10" },
    SERVICE: { emoji: "⚡", gradient: "from-violet-500/10 to-purple-500/10" },
    PACKAGE: { emoji: "🎁", gradient: "from-pink-500/10 to-rose-500/10" },
};

const PAYMENT_METHODS: {
    value: PaymentMethod;
    label: string;
    shortLabel: string;
    icon: typeof DollarSign;
    emoji: string;
    color: string;
    activeColor: string;
}[] = [
        {
            value: "CASH",
            label: "Efectivo",
            shortLabel: "Efectivo",
            icon: Banknote,
            emoji: "💵",
            color: "text-success",
            activeColor: "btn-success",
        },
        {
            value: "CARD",
            label: "Tarjeta",
            shortLabel: "Tarjeta",
            icon: CreditCard,
            emoji: "💳",
            color: "text-info",
            activeColor: "btn-info",
        },
        {
            value: "TRANSFER",
            label: "Transferencia",
            shortLabel: "Transfer.",
            icon: ArrowRightLeft,
            emoji: "🏦",
            color: "text-warning",
            activeColor: "btn-warning",
        },
    ];


function formatMoney(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(amount);
}

interface OrderTab {
    id: string;
    label: string;
    order: OrderResponse | null;
    customerName: string;
    childName: string;
}

let tabCounter = 1;
function generateTabId(): string {
    return `tab-${Date.now()}-${tabCounter++}`;
}


function StockBadge({ stock }: { stock: number | null | undefined }) {
    if (stock === null || stock === undefined) return null;

    const config =
        stock <= 0
            ? { color: "bg-error/15 text-error border-error/20", label: "Agotado" }
            : stock <= 5
                ? { color: "bg-warning/15 text-warning border-warning/20", label: `${stock} uds` }
                : { color: "bg-base-200 text-base-content/50 border-base-300/30", label: `${stock} uds` };

    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${config.color}`}>
            {config.label}
        </span>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; label: string }> = {
        OPEN: { color: "bg-info/15 text-info border-info/20", label: "Abierta" },
        CLOSED: { color: "bg-success/15 text-success border-success/20", label: "Cerrada" },
        PARTIALLY_PAID: { color: "bg-warning/15 text-warning border-warning/20", label: "Parcial" },
        CANCELLED: { color: "bg-error/15 text-error border-error/20", label: "Cancelada" },
    };

    const { color, label } = config[status] ?? {
        color: "bg-base-200 text-base-content/50",
        label: status,
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "OPEN" ? "bg-info animate-pulse" :
                status === "CLOSED" ? "bg-success" :
                    status === "PARTIALLY_PAID" ? "bg-warning animate-pulse" :
                        "bg-error"
                }`} />
            {label}
        </span>
    );
}

function EmptyState({ icon: Icon, title, subtitle }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-base-content/20 gap-2">
            <Icon className="w-10 h-10" />
            <p className="font-semibold text-sm">{title}</p>
            {subtitle && <p className="text-xs">{subtitle}</p>}
        </div>
    );
}

function Modal({
    open,
    onClose,
    children,
    maxWidth = "max-w-md",
    closable = true,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
    closable?: boolean;
}) {
    if (!open) return null;

    return (
        <dialog className="modal modal-open">
            <div className={`modal-box rounded-2xl ${maxWidth} p-0 overflow-hidden`}>
                {children}
            </div>
            {closable && (
                <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={onClose} />
            )}
        </dialog>
    );
}

function ModalHeader({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    onClose,
}: {
    icon: React.ElementType;
    iconColor: string;
    title: string;
    subtitle?: string;
    onClose?: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-5 pb-0">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-extrabold text-lg">{title}</h3>
                    {subtitle && <p className="text-xs text-base-content/40">{subtitle}</p>}
                </div>
            </div>
            {onClose && (
                <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

function CashSummaryRow({ label, value, emoji, bold, color }: {
    label: string;
    value: number;
    emoji?: string;
    bold?: boolean;
    color?: string;
}) {
    return (
        <div className={`flex justify-between text-sm ${bold ? "font-bold text-base" : ""} ${color ?? ""}`}>
            <span className="flex items-center gap-1.5">
                {emoji && <span>{emoji}</span>}
                {label}
            </span>
            <span>{formatMoney(value)}</span>
        </div>
    );
}

function DifferenceAlert({ counted, expected }: { counted: string; expected: number }) {
    const value = parseFloat(counted);
    if (isNaN(value)) return null;

    const diff = value - expected;
    const config = diff === 0
        ? { color: "bg-success/10 border-success/20 text-success", icon: "✅", label: "Cuadra perfecto" }
        : diff > 0
            ? { color: "bg-warning/10 border-warning/20 text-warning", icon: "⬆️", label: "Sobrante" }
            : { color: "bg-error/10 border-error/20 text-error", icon: "⬇️", label: "Faltante" };

    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium ${config.color}`}>
            <span>{config.icon} {config.label}</span>
            <span className="font-bold">{formatMoney(diff)}</span>
        </div>
    );
}


interface Toast {
    id: number;
    type: "success" | "error" | "warning";
    message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="toast toast-top toast-end z-[100] gap-2">
            {toasts.map((toast) => {
                const config = {
                    success: { bg: "bg-success/10 border-success/20 text-success", Icon: CheckCircle2 },
                    error: { bg: "bg-error/10 border-error/20 text-error", Icon: XCircle },
                    warning: { bg: "bg-warning/10 border-warning/20 text-warning", Icon: AlertTriangle },
                }[toast.type];

                return (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border animate-slide-up ${config.bg}`}
                    >
                        <config.Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                );
            })}
        </div>
    );
}


export default function POS() {
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [activeProductTab, setActiveProductTab] = useState("all");
    const [search, setSearch] = useState("");

    const [cash, setCash] = useState<CashRegisterResponse | null>(null);
    const [cashOpen, setCashOpen] = useState(false);
    const [cashLoading, setCashLoading] = useState(true);

    const initialTabId = generateTabId();
    const [orderTabs, setOrderTabs] = useState<OrderTab[]>([
        { id: initialTabId, label: "Orden 1", order: null, customerName: "", childName: "" },
    ]);
    const [activeOrderTabId, setActiveOrderTabId] = useState<string>(initialTabId);

    const [orderLoading, setOrderLoading] = useState(false);
    const [addingProductId, setAddingProductId] = useState<string | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

    const [toasts, setToasts] = useState<Toast[]>([]);

    const [showOpenCash, setShowOpenCash] = useState(false);
    const [openingAmount, setOpeningAmount] = useState("");
    const [openingCash, setOpeningCash] = useState(false);
    const [showCloseCash, setShowCloseCash] = useState(false);
    const [countedCash, setCountedCash] = useState("");
    const [closingCash, setClosingCash] = useState(false);
    const [closeResult, setCloseResult] = useState<CashRegisterResponse | null>(null);

    const [showPayment, setShowPayment] = useState(false);
    const [payAmount, setPayAmount] = useState("");
    const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
    const [payReference, setPayReference] = useState("");
    const [payResult, setPayResult] = useState<PaymentRes | null>(null);
    const [paying, setPaying] = useState(false);
    const [orderCompleted, setOrderCompleted] = useState(false);

    const currentTab = orderTabs.find((t) => t.id === activeOrderTabId);
    const order = currentTab?.order ?? null;
    const customerName = currentTab?.customerName ?? "";
    const childName = currentTab?.childName ?? "";

    const showToast = (type: Toast["type"], message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };

    const updateCurrentTab = useCallback(
        (updates: Partial<OrderTab>) => {
            setOrderTabs((prev) =>
                prev.map((t) => (t.id === activeOrderTabId ? { ...t, ...updates } : t))
            );
        },
        [activeOrderTabId]
    );

    const setOrder = useCallback(
        (o: OrderResponse | null) => updateCurrentTab({ order: o }),
        [updateCurrentTab]
    );

    const setCustomerName = useCallback(
        (name: string) => updateCurrentTab({ customerName: name }),
        [updateCurrentTab]
    );

    const setChildName = useCallback(
        (name: string) => updateCurrentTab({ childName: name }),
        [updateCurrentTab]
    );


    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (orderTabs.length > 0 && !orderTabs.find((t) => t.id === activeOrderTabId)) {
            setActiveOrderTabId(orderTabs[0].id);
        }
    }, [orderTabs, activeOrderTabId]);

    async function loadData() {
        try {
            const prods = await fetchProducts();
            setProducts(prods.filter((p) => p.active));
        } catch {
            showToast("error", "Error cargando productos");
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
        } catch { }
    }


    function addOrderTab() {
        const newTab: OrderTab = {
            id: generateTabId(),
            label: `Orden ${orderTabs.length + 1}`,
            order: null,
            customerName: "",
            childName: "",
        };
        setOrderTabs((prev) => [...prev, newTab]);
        setActiveOrderTabId(newTab.id);
    }

    function closeOrderTab(tabId: string) {
        const tab = orderTabs.find((t) => t.id === tabId);
        if (tab?.order && tab.order.status === "OPEN") {
            if (!confirm("Esta pestaña tiene una orden abierta. ¿Cerrar de todos modos?")) return;
        }

        const remaining = orderTabs.filter((t) => t.id !== tabId);
        if (remaining.length === 0) {
            const newTab: OrderTab = {
                id: generateTabId(),
                label: "Orden 1",
                order: null,
                customerName: "",
                childName: "",
            };
            setOrderTabs([newTab]);
            setActiveOrderTabId(newTab.id);
        } else {
            setOrderTabs(remaining);
            if (activeOrderTabId === tabId) setActiveOrderTabId(remaining[0].id);
        }
    }


    async function handleOpenCash() {
        const amount = parseFloat(openingAmount);
        if (isNaN(amount) || amount < 0) {
            showToast("error", "Monto de apertura inválido");
            return;
        }
        setOpeningCash(true);
        try {
            const c = await openCashRegister({ openingAmount: amount });
            setCash(c);
            setCashOpen(true);
            setShowOpenCash(false);
            setOpeningAmount("");
            showToast("success", "Caja abierta correctamente");
        } catch (e: any) {
            showToast("error", e.message || "Error al abrir caja");
        } finally {
            setOpeningCash(false);
        }
    }

    async function handleShowCloseCash() {
        const hasOpenOrders = orderTabs.some((t) => t.order && t.order.status === "OPEN");
        if (hasOpenOrders) {
            if (!confirm("Hay órdenes abiertas sin cobrar. ¿Deseas cerrar la caja de todos modos?")) return;
        }
        try {
            const c = await getCurrentCash();
            setCash(c);
        } catch {
            showToast("error", "Error al obtener estado de caja");
            return;
        }
        setShowCloseCash(true);
    }

    async function handleCloseCash() {
        const amount = parseFloat(countedCash);
        if (isNaN(amount) || amount < 0) {
            showToast("error", "Monto inválido");
            return;
        }
        setClosingCash(true);
        try {
            const result = await closeCashRegister({ countedCash: amount });
            setCloseResult(result);
            setCashOpen(false);
            setCash(null);
        } catch (e: any) {
            showToast("error", e.message || "Error al cerrar caja");
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
                updateCurrentTab({ order: currentOrder, label: customerName || "Orden" });
            }

            const existingItem = currentOrder.items?.find(
                (i) => i.productPublicId === product.publicId && i.status === "ACTIVE"
            );

            let updatedOrder: OrderResponse;
            if (existingItem) {
                updatedOrder = await updateOrderItemQty(currentOrder.publicId, existingItem.publicId, {
                    quantity: existingItem.quantity + 1,
                });
            } else {
                updatedOrder = await addOrderItem(currentOrder.publicId, {
                    productPublicId: product.publicId,
                    quantity: 1,
                });
            }

            setOrder(updatedOrder);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === product.publicId && p.stock !== null ? { ...p, stock: p.stock - 1 } : p
                )
            );

            const warnings = updatedOrder.items?.filter(
                (i) => i.productPublicId === product.publicId && i.status === "ACTIVE" && i.warning
            );
            if (warnings && warnings.length > 0) {
                showToast("warning", warnings[0].warning!);
            }
        } catch (e: any) {
            showToast("error", e.message || "Error al agregar producto");
        } finally {
            setOrderLoading(false);
            setTimeout(() => setAddingProductId(null), 600);
        }
    }

    async function handleUpdateQty(item: OrderItemResponse, delta: number) {
        if (!order || updatingItemId === item.publicId) return;
        setUpdatingItemId(item.publicId);
        const newQty = item.quantity + delta;

        try {
            let updatedOrder: OrderResponse;
            if (newQty <= 0) {
                updatedOrder = await voidOrderItem(order.publicId, item.publicId);
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === item.productPublicId && p.stock !== null
                            ? { ...p, stock: p.stock + item.quantity }
                            : p
                    )
                );
            } else {
                updatedOrder = await updateOrderItemQty(order.publicId, item.publicId, { quantity: newQty });
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === item.productPublicId && p.stock !== null
                            ? { ...p, stock: p.stock - delta }
                            : p
                    )
                );
            }
            setOrder(updatedOrder);
        } catch (e: any) {
            showToast("error", e.message || "Error al actualizar cantidad");
        } finally {
            setUpdatingItemId(null);
        }
    }

    async function handleVoidItem(item: OrderItemResponse) {
        if (!order || updatingItemId === item.publicId) return;
        setUpdatingItemId(item.publicId);

        try {
            const updatedOrder = await voidOrderItem(order.publicId, item.publicId);
            setOrder(updatedOrder);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === item.productPublicId && p.stock !== null
                        ? { ...p, stock: p.stock + item.quantity }
                        : p
                )
            );
        } catch (e: any) {
            showToast("error", e.message || "Error al eliminar producto");
        } finally {
            setUpdatingItemId(null);
        }
    }

    async function handleCancelOrder() {
        if (!order) return;
        if (!confirm("¿Cancelar esta orden? Se repondrá el inventario.")) return;
        try {
            await cancelOrderApi(order.publicId);
            resetCurrentTab();
            showToast("success", "Orden cancelada");
        } catch (e: any) {
            showToast("error", e.message || "Error al cancelar orden");
        }
    }

    function resetCurrentTab() {
        updateCurrentTab({ order: null, customerName: "", childName: "", label: "Orden" });
        setPayResult(null);
        setOrderCompleted(false);
        setShowPayment(false);
        setPayAmount("");
        setPayReference("");
        setPayMethod("CASH");
        setUpdatingItemId(null);
        refreshProducts();
    }


    const currentRemaining = payResult?.remainingAmount ?? order?.totalAmount ?? 0;

    const liveChange = (() => {
        if (payMethod !== "CASH") return 0;
        const amount = parseFloat(payAmount);
        if (isNaN(amount) || amount <= 0) return 0;
        const diff = amount - currentRemaining;
        return diff > 0 ? diff : 0;
    })();

    async function handlePayment() {
        if (!order) return;
        const amount = parseFloat(payAmount);
        if (isNaN(amount) || amount <= 0) {
            showToast("error", "Monto de pago inválido");
            return;
        }
        if (payMethod !== "CASH" && amount > currentRemaining) {
            showToast("error", `El monto no puede exceder el restante: ${formatMoney(currentRemaining)}`);
            return;
        }

        setPaying(true);
        try {
            const result = await registerPayment(order.publicId, {
                amount,
                paymentMethod: payMethod,
                reference: payMethod !== "CASH" ? payReference || undefined : undefined,
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
                    showToast("warning", "Pago registrado pero no se pudo cerrar la orden");
                }
            }
        } catch (e: any) {
            showToast("error", e.message || "Error al procesar pago");
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
                showToast("error", "No se pudo abrir la ventana. Revisa el bloqueador de popups.");
            }
        } catch {
            showToast("error", "Error al generar ticket");
        }
    }


    const filtered = products.filter((p) => {
        const matchesTab = activeProductTab === "all" || p.type === activeProductTab;
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const activeItems = order?.items?.filter((i) => i.status === "ACTIVE") ?? [];
    const itemCount = activeItems.reduce((s, i) => s + i.quantity, 0);


    if (cashLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <div className="absolute inset-0 animate-ping opacity-20">
                        <Loader2 className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <p className="text-base-content/40 text-sm animate-pulse">Inicializando punto de venta...</p>
            </div>
        );
    }


    return (
        <div className="space-y-5">
            <ToastContainer toasts={toasts} />

            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Punto de Venta</h2>
                        <p className="text-xs text-base-content/40">Sistema de cobro y facturación</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {cashOpen && cash && (
                        <>
                            <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl px-3 py-2">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                <Vault className="w-4 h-4 text-success" />
                                <span className="text-sm font-semibold text-success">
                                    Caja abierta · {formatMoney(cash.openingAmount ?? 0)}
                                </span>
                            </div>
                            <button
                                className="btn btn-sm btn-outline rounded-xl gap-1.5"
                                onClick={handleShowCloseCash}
                            >
                                <Vault className="w-3.5 h-3.5" />
                                Cerrar caja
                            </button>
                        </>
                    )}
                    {!cashOpen && (
                        <button
                            className="btn btn-warning btn-sm gap-1.5 rounded-xl shadow-md"
                            onClick={() => setShowOpenCash(true)}
                        >
                            <Vault className="w-3.5 h-3.5" />
                            Abrir caja
                        </button>
                    )}
                </div>
            </div>

            {!cashOpen && !showOpenCash && (
                <div className="flex items-center gap-4 p-4 bg-warning/10 border border-warning/20 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-sm">Caja cerrada</h3>
                        <p className="text-xs text-base-content/50">Necesitas abrir la caja para empezar a vender.</p>
                    </div>
                    <button className="btn btn-warning btn-sm" onClick={() => setShowOpenCash(true)}>
                        Abrir caja
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 space-y-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30" />
                        <input
                            type="text"
                            placeholder="Buscar producto, servicio o paquete..."
                            className="input input-bordered w-full pl-11 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                                onClick={() => setSearch("")}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
                        {PRODUCT_TABS.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    className={`btn btn-sm rounded-lg flex-1 gap-1.5 ${activeProductTab === tab.id ? "btn-primary shadow-md" : "btn-ghost text-base-content/50"
                                        }`}
                                    onClick={() => setActiveProductTab(tab.id)}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-base-content/40">Cargando productos...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState icon={Package} title="No se encontraron productos" subtitle="Intenta con otra búsqueda" />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filtered.map((product) => {
                                const isAdding = addingProductId === product.publicId;
                                const config = TYPE_CONFIG[product.type] ?? TYPE_CONFIG.PRODUCT;

                                return (
                                    <div
                                        key={product.publicId}
                                        onClick={() => handleAddProduct(product)}
                                        className={`
                      group card bg-base-100 border border-base-300/30 overflow-hidden
                      hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30
                      transition-all duration-200 cursor-pointer
                      ${!cashOpen ? "opacity-50 pointer-events-none" : ""}
                      ${isAdding ? "ring-2 ring-success scale-[0.98]" : ""}
                    `}
                                    >
                                        <div className="card-body items-center text-center p-4 gap-2">
                                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                                                <span className="text-2xl">{config.emoji}</span>
                                            </div>

                                            <h4 className="font-semibold text-xs leading-tight line-clamp-2 min-h-[2rem]">
                                                {product.name}
                                            </h4>

                                            <p className="text-primary font-extrabold text-sm">{formatMoney(product.price)}</p>

                                            <StockBadge stock={product.stock} />

                                            <div
                                                className={`
                          w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1
                          transition-all duration-300
                          ${isAdding
                                                        ? "bg-success/15 text-success"
                                                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content"
                                                    }
                        `}
                                            >
                                                {isAdding ? (
                                                    <>
                                                        <Check className="w-3 h-3" />
                                                        Agregado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-3 h-3" />
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

                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm border border-base-300/30 sticky top-20 overflow-hidden">
                        <div className="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-thin">
                            {orderTabs.map((tab) => {
                                const isActive = tab.id === activeOrderTabId;
                                const tabActiveItems = tab.order?.items?.filter((i) => i.status === "ACTIVE") ?? [];
                                const tabItemCount = tabActiveItems.reduce((s, i) => s + i.quantity, 0);
                                const hasItems = tabItemCount > 0;

                                return (
                                    <div
                                        key={tab.id}
                                        className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-medium
                      transition-all whitespace-nowrap flex-shrink-0 border
                      ${isActive
                                                ? "bg-primary text-primary-content border-primary shadow-md shadow-primary/20"
                                                : "bg-base-200/50 hover:bg-base-200 border-base-300/30"
                                            }
                    `}
                                        onClick={() => setActiveOrderTabId(tab.id)}
                                    >
                                        <Receipt className="w-3 h-3" />
                                        <span className="truncate max-w-[70px]">
                                            {tab.order?.customerName || tab.label}
                                        </span>
                                        {hasItems && (
                                            <span
                                                className={`
                          inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold
                          ${isActive ? "bg-primary-content/20 text-primary-content" : "bg-primary/15 text-primary"}
                        `}
                                            >
                                                {tabItemCount}
                                            </span>
                                        )}
                                        {orderTabs.length > 1 && (
                                            <button
                                                className={`ml-0.5 rounded-full p-0.5 transition-colors ${isActive ? "hover:bg-primary-content/20" : "hover:bg-error/15 hover:text-error"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    closeOrderTab(tab.id);
                                                }}
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <button
                                className="btn btn-ghost btn-xs btn-circle flex-shrink-0"
                                onClick={addOrderTab}
                                title="Nueva orden"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="card-body p-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm">
                                    {order ? "Orden actual" : "Nueva orden"}
                                </h3>
                                {order && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-base-content/40">{itemCount} items</span>
                                        <OrderStatusBadge status={order.status} />
                                    </div>
                                )}
                            </div>

                            {!order && (
                                <div className="space-y-2 mt-2 mb-3">
                                    <div className="relative">
                                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                        <input
                                            type="text"
                                            placeholder="Nombre del cliente (opcional)"
                                            className="input input-bordered input-sm w-full pl-9 rounded-lg"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Baby className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
                                        <input
                                            type="text"
                                            placeholder="Nombre del niño(a) (opcional)"
                                            className="input input-bordered input-sm w-full pl-9 rounded-lg"
                                            value={childName}
                                            onChange={(e) => setChildName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {order && (order.customerName || order.childName) && (
                                <div className="flex items-center gap-3 p-2.5 bg-base-200/50 rounded-xl mt-1 mb-2">
                                    {order.customerName && (
                                        <span className="text-xs flex items-center gap-1 text-base-content/60">
                                            <User className="w-3 h-3" />
                                            {order.customerName}
                                        </span>
                                    )}
                                    {order.childName && (
                                        <span className="text-xs flex items-center gap-1 text-base-content/60">
                                            <Baby className="w-3 h-3" />
                                            {order.childName}
                                        </span>
                                    )}
                                </div>
                            )}

                            {orderLoading && (
                                <div className="flex items-center justify-center py-4 gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span className="text-xs text-base-content/40">Creando orden...</span>
                                </div>
                            )}

                            <div className="max-h-64 overflow-y-auto space-y-1 mb-3 -mx-1 px-1">
                                {activeItems.length === 0 && !orderLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-base-content/20 gap-2">
                                        <ShoppingCart className="w-8 h-8" />
                                        <p className="text-xs font-medium">Agrega productos para comenzar</p>
                                    </div>
                                ) : (
                                    activeItems.map((item) => {
                                        const isItemUpdating = updatingItemId === item.publicId;
                                        return (
                                            <div
                                                key={item.publicId}
                                                className={`
                          flex items-center gap-3 p-2.5 rounded-xl border border-transparent
                          hover:bg-base-200/50 hover:border-base-300/30 transition-all group
                          ${isItemUpdating ? "opacity-50" : ""}
                        `}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{item.productName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[11px] text-base-content/40">
                                                            {formatMoney(item.unitPrice)} × {item.quantity}
                                                        </span>
                                                        <ChevronRight className="w-2.5 h-2.5 text-base-content/20" />
                                                        <span className="text-xs font-bold text-primary">
                                                            {formatMoney(item.subtotal)}
                                                        </span>
                                                    </div>
                                                    {item.warning && (
                                                        <p className="text-[10px] text-warning flex items-center gap-1 mt-1">
                                                            <AlertTriangle className="w-2.5 h-2.5" />
                                                            {item.warning}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQty(item, -1);
                                                        }}
                                                        disabled={
                                                            (order?.status !== "OPEN" && order?.status !== "PARTIALLY_PAID") ||
                                                            isItemUpdating
                                                        }
                                                    >
                                                        {isItemUpdating ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Minus className="w-3 h-3" />
                                                        )}
                                                    </button>

                                                    <span className="w-7 text-center text-sm font-bold tabular-nums">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square rounded-lg"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQty(item, 1);
                                                        }}
                                                        disabled={
                                                            (order?.status !== "OPEN" && order?.status !== "PARTIALLY_PAID") ||
                                                            isItemUpdating
                                                        }
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>

                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square rounded-lg text-error opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleVoidItem(item);
                                                        }}
                                                        disabled={
                                                            (order?.status !== "OPEN" && order?.status !== "PARTIALLY_PAID") ||
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
                                <div className="border-t border-base-300/50 pt-3 space-y-2">
                                    <div className="flex justify-between text-xs text-base-content/50">
                                        <span>Subtotal</span>
                                        <span>{formatMoney(order.subtotal ?? 0)}</span>
                                    </div>
                                    {(order.tax ?? 0) > 0 && (
                                        <div className="flex justify-between text-xs text-base-content/50">
                                            <span>IVA</span>
                                            <span>{formatMoney(order.tax ?? 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-base-300/30">
                                        <span>Total</span>
                                        <span className="text-primary">{formatMoney(order.totalAmount ?? 0)}</span>
                                    </div>
                                </div>
                            )}

                            {order && (order.status === "OPEN" || order.status === "PARTIALLY_PAID") && (
                                <div className="mt-4 space-y-2">
                                    <button
                                        className="btn btn-primary w-full gap-2 shadow-md shadow-primary/20 rounded-xl"
                                        disabled={activeItems.length === 0}
                                        onClick={() => {
                                            setPayAmount((order.totalAmount ?? 0).toFixed(2));
                                            setPayMethod("CASH");
                                            setPayReference("");
                                            setPayResult(null);
                                            setOrderCompleted(false);
                                            setShowPayment(true);
                                        }}
                                    >
                                        <CircleDollarSign className="w-4 h-4" />
                                        Cobrar {formatMoney(order.totalAmount ?? 0)}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm w-full gap-2 text-error hover:bg-error/10 rounded-xl"
                                        onClick={handleCancelOrder}
                                    >
                                        <Ban className="w-3.5 h-3.5" />
                                        Cancelar orden
                                    </button>
                                </div>
                            )}

                            {order && order.status === "CLOSED" && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-success" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-success">¡Venta completada!</h4>
                                            <p className="text-xs text-success/70">La orden fue cerrada exitosamente</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-outline btn-sm flex-1 gap-1.5 rounded-xl"
                                            onClick={handlePrintTicket}
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            Ticket
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm flex-1 gap-1.5 rounded-xl"
                                            onClick={resetCurrentTab}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Nueva orden
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <Modal
                open={showOpenCash}
                onClose={() => setShowOpenCash(false)}
                maxWidth="max-w-sm"
            >
                <ModalHeader
                    icon={Vault}
                    iconColor="bg-success/10 text-success"
                    title="Abrir Caja"
                    subtitle="Ingresa el monto inicial para comenzar"
                    onClose={() => setShowOpenCash(false)}
                />
                <div className="p-5 pt-4 space-y-4">
                    <fieldset className="fieldset">
                        <legend className="fieldset-legend text-xs flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Monto inicial
                        </legend>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="input input-bordered w-full text-lg font-bold"
                            value={openingAmount}
                            onChange={(e) => setOpeningAmount(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleOpenCash()}
                            autoFocus
                        />
                    </fieldset>

                    <div className="flex gap-2 flex-wrap">
                        {[0, 500, 1000, 2000].map((amt) => (
                            <button
                                key={amt}
                                className={`btn btn-sm rounded-lg ${openingAmount === amt.toString() ? "btn-success" : "btn-ghost"
                                    }`}
                                onClick={() => setOpeningAmount(amt.toString())}
                            >
                                {amt === 0 ? "Sin fondo" : formatMoney(amt)}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button className="btn btn-ghost flex-1" onClick={() => setShowOpenCash(false)}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-success flex-1 gap-2 shadow-md"
                            onClick={handleOpenCash}
                            disabled={openingCash}
                        >
                            {openingCash ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Vault className="w-4 h-4" />
                            )}
                            Abrir caja
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                open={showPayment && !!order}
                onClose={() => {
                    if (!paying && !orderCompleted) {
                        setShowPayment(false);
                        setPayResult(null);
                    }
                }}
                closable={!paying && !orderCompleted}
            >
                <ModalHeader
                    icon={Receipt}
                    iconColor="bg-primary/10 text-primary"
                    title="Procesar Pago"
                    subtitle={order?.customerName || "Sin cliente"}
                    onClose={
                        !paying && !orderCompleted
                            ? () => {
                                setShowPayment(false);
                                setPayResult(null);
                            }
                            : undefined
                    }
                />

                <div className="p-5 pt-3 space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-base-content/60">Total a cobrar</span>
                            <span className="text-2xl font-extrabold text-primary">
                                {formatMoney(order?.totalAmount ?? 0)}
                            </span>
                        </div>
                        {payResult && payResult.remainingAmount > 0 && (
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/10">
                                <span className="text-xs text-warning font-medium">Restante</span>
                                <span className="text-lg font-bold text-warning">
                                    {formatMoney(payResult.remainingAmount)}
                                </span>
                            </div>
                        )}
                    </div>

                    {!orderCompleted ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-base-content/50">Método de pago</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {PAYMENT_METHODS.map((method) => {
                                        const isActive = payMethod === method.value;
                                        return (
                                            <button
                                                key={method.value}
                                                className={`
                          flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                          ${isActive
                                                        ? `border-current ${method.color} bg-current/5 shadow-md scale-[1.02]`
                                                        : "border-base-300/30 hover:border-base-300 hover:bg-base-200/30"
                                                    }
                        `}
                                                onClick={() => {
                                                    setPayMethod(method.value);
                                                    if (method.value === "CASH") setPayReference("");
                                                }}
                                            >
                                                <method.icon className={`w-5 h-5 ${isActive ? "" : "text-base-content/40"}`} />
                                                <span className="text-xs font-bold">{method.shortLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">
                                    {payMethod === "CASH" ? "Monto recibido" : "Monto a cobrar"}
                                </legend>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="input input-bordered w-full text-xl font-bold"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handlePayment()}
                                    autoFocus
                                />
                            </fieldset>

                            {payMethod === "CASH" && (
                                <div className="flex gap-2 flex-wrap">
                                    {[50, 100, 200, 500, 1000].map((amt) => (
                                        <button
                                            key={amt}
                                            className={`btn btn-sm rounded-lg ${payAmount === amt.toString() ? "btn-primary" : "btn-ghost"
                                                }`}
                                            onClick={() => setPayAmount(amt.toString())}
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-sm btn-outline btn-success rounded-lg"
                                        onClick={() => setPayAmount(currentRemaining.toFixed(2))}
                                    >
                                        Exacto
                                    </button>
                                </div>
                            )}

                            {payMethod === "CASH" && liveChange > 0 && (
                                <div className="flex items-center justify-between p-3.5 bg-success/10 border border-success/20 rounded-xl">
                                    <span className="text-sm font-semibold text-success flex items-center gap-1.5">
                                        <Calculator className="w-4 h-4" />
                                        Cambio a devolver
                                    </span>
                                    <span className="text-2xl font-extrabold text-success">{formatMoney(liveChange)}</span>
                                </div>
                            )}

                            {(payMethod === "CARD" || payMethod === "TRANSFER") && (
                                <>
                                    <fieldset className="fieldset">
                                        <legend className="fieldset-legend text-xs flex items-center gap-1">
                                            <Hash className="w-3 h-3" />
                                            {payMethod === "CARD" ? "Referencia (últ. 4 dígitos)" : "No. de operación"}
                                        </legend>
                                        <input
                                            type="text"
                                            placeholder={payMethod === "CARD" ? "1234" : "Referencia..."}
                                            className="input input-bordered w-full"
                                            value={payReference}
                                            onChange={(e) => setPayReference(e.target.value)}
                                        />
                                    </fieldset>

                                    <button
                                        className="btn btn-sm btn-outline btn-success rounded-lg w-full"
                                        onClick={() => setPayAmount(currentRemaining.toFixed(2))}
                                    >
                                        Monto exacto ({formatMoney(currentRemaining)})
                                    </button>
                                </>
                            )}

                            {payMethod === "TRANSFER" && (
                                <div className="flex items-center gap-2 p-3 bg-info/10 border border-info/20 rounded-xl text-info text-xs">
                                    <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
                                    <span>Las transferencias se suman a ventas pero NO al efectivo en caja.</span>
                                </div>
                            )}

                            {payResult && payResult.remainingAmount > 0 && (
                                <div className="bg-base-200/50 rounded-xl p-3 space-y-1.5 border border-base-300/30">
                                    <CashSummaryRow label="Pagado hasta ahora" value={payResult.totalPaid} />
                                    <CashSummaryRow label="Restante" value={payResult.remainingAmount} color="text-warning" bold />
                                    {payResult.change > 0 && (
                                        <CashSummaryRow label="Cambio" value={payResult.change} emoji="💰" color="text-success" bold />
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    className="btn btn-ghost flex-1"
                                    onClick={() => {
                                        setShowPayment(false);
                                        setPayResult(null);
                                    }}
                                    disabled={paying}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary flex-1 gap-2 shadow-md shadow-primary/20"
                                    onClick={handlePayment}
                                    disabled={paying}
                                >
                                    {paying ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CircleDollarSign className="w-4 h-4" />
                                    )}
                                    Cobrar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-4 gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                                    <Check className="w-8 h-8 text-success" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-extrabold text-lg text-success">¡Pago completado!</h4>
                                    {payResult && payResult.change > 0 && (
                                        <p className="text-2xl font-extrabold text-success mt-1">
                                            Cambio: {formatMoney(payResult.change)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <CashSummaryRow label="Total" value={order?.totalAmount ?? 0} bold />
                                {payResult && (
                                    <>
                                        <div className="divider my-1 text-[10px] text-base-content/30">Detalles</div>
                                        <div className="flex justify-between text-sm">
                                            <span>Método</span>
                                            <span className="flex items-center gap-1">
                                                {PAYMENT_METHODS.find((m) => m.value === payResult.paymentMethod)?.emoji}
                                                {PAYMENT_METHODS.find((m) => m.value === payResult.paymentMethod)?.label}
                                            </span>
                                        </div>
                                        {payResult.paymentMethod === "CASH" && (
                                            <CashSummaryRow label="Recibido" value={payResult.amountReceived} />
                                        )}
                                        <CashSummaryRow label="Aplicado" value={payResult.amountApplied} />
                                        {payResult.change > 0 && (
                                            <CashSummaryRow label="Cambio" value={payResult.change} emoji="💰" color="text-success" bold />
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button className="btn btn-outline flex-1 gap-1.5 rounded-xl" onClick={handlePrintTicket}>
                                    <Printer className="w-4 h-4" />
                                    Ticket
                                </button>
                                <button
                                    className="btn btn-primary flex-1 gap-1.5 rounded-xl shadow-md shadow-primary/20"
                                    onClick={resetCurrentTab}
                                >
                                    <Plus className="w-4 h-4" />
                                    Nueva orden
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                open={showCloseCash}
                onClose={() => {
                    if (!closeResult) {
                        setShowCloseCash(false);
                        setCountedCash("");
                    }
                }}
                closable={!closeResult}
            >
                <ModalHeader
                    icon={Vault}
                    iconColor="bg-primary/10 text-primary"
                    title="Cerrar Caja"
                    subtitle={!closeResult ? "Realiza el conteo de efectivo" : "Resumen de cierre"}
                    onClose={
                        !closeResult
                            ? () => {
                                setShowCloseCash(false);
                                setCountedCash("");
                            }
                            : undefined
                    }
                />

                <div className="p-5 pt-3 space-y-4">
                    {!closeResult ? (
                        <>
                            {cash && (
                                <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                    <CashSummaryRow label="Monto apertura" value={cash.openingAmount ?? 0} emoji="🏦" />

                                    <div className="divider my-1 text-[10px] text-base-content/30 uppercase tracking-wider">
                                        Ventas por método
                                    </div>

                                    <CashSummaryRow label="Efectivo" value={cash.cashSales ?? 0} emoji="💵" />
                                    <CashSummaryRow label="Tarjeta" value={cash.cardSales ?? 0} emoji="💳" />
                                    <CashSummaryRow label="Transferencia" value={cash.transferSales ?? 0} emoji="🏦" />

                                    <div className="border-t border-base-300/50 pt-2">
                                        <CashSummaryRow label="Total ventas" value={cash.salesTotal ?? 0} bold />
                                    </div>

                                    <div className="border-t border-base-300/50 pt-2">
                                        <div className="flex justify-between text-sm font-bold text-primary">
                                            <span>📊 Esperado en caja</span>
                                            <span>{formatMoney(cash.expectedCash ?? 0)}</span>
                                        </div>
                                        <p className="text-[10px] text-base-content/30 mt-0.5">
                                            = Apertura + Ventas en efectivo
                                        </p>
                                    </div>
                                </div>
                            )}

                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs flex items-center gap-1">
                                    <Calculator className="w-3 h-3" /> Efectivo contado
                                </legend>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="input input-bordered w-full text-lg font-bold"
                                    value={countedCash}
                                    onChange={(e) => setCountedCash(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCloseCash()}
                                    autoFocus
                                />
                            </fieldset>

                            {countedCash && cash && (
                                <DifferenceAlert counted={countedCash} expected={cash.expectedCash ?? 0} />
                            )}

                            <div className="flex gap-2">
                                <button
                                    className="btn btn-ghost flex-1"
                                    onClick={() => {
                                        setShowCloseCash(false);
                                        setCountedCash("");
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary flex-1 gap-2 shadow-md"
                                    onClick={handleCloseCash}
                                    disabled={closingCash}
                                >
                                    {closingCash ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Vault className="w-4 h-4" />
                                    )}
                                    Cerrar caja
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center py-3 gap-2">
                                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                                    <Check className="w-7 h-7 text-success" />
                                </div>
                                <h4 className="font-extrabold text-success">Caja cerrada exitosamente</h4>
                            </div>

                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <CashSummaryRow label="Monto apertura" value={closeResult.openingAmount ?? 0} emoji="🏦" />

                                <div className="divider my-1 text-[10px] text-base-content/30 uppercase tracking-wider">
                                    Desglose de ventas
                                </div>

                                <CashSummaryRow label="Efectivo" value={closeResult.cashSales ?? 0} emoji="💵" />
                                <CashSummaryRow label="Tarjeta" value={closeResult.cardSales ?? 0} emoji="💳" />
                                <CashSummaryRow label="Transferencia" value={closeResult.transferSales ?? 0} emoji="🏦" />

                                <div className="border-t border-base-300/50 pt-2">
                                    <CashSummaryRow label="Total ventas" value={closeResult.salesTotal ?? 0} bold />
                                </div>

                                <div className="border-t border-base-300/50 pt-2 space-y-1.5">
                                    <CashSummaryRow label="Esperado" value={closeResult.expectedCash ?? 0} />
                                    <CashSummaryRow label="Contado" value={closeResult.countedAmount ?? 0} />
                                </div>

                                <div className="border-t border-base-300/50 pt-2">
                                    <div
                                        className={`flex justify-between font-bold text-base ${(closeResult.difference ?? 0) < 0
                                            ? "text-error"
                                            : (closeResult.difference ?? 0) > 0
                                                ? "text-warning"
                                                : "text-success"
                                            }`}
                                    >
                                        <span>
                                            {(closeResult.difference ?? 0) === 0
                                                ? "✅ Diferencia"
                                                : (closeResult.difference ?? 0) > 0
                                                    ? "⬆️ Sobrante"
                                                    : "⬇️ Faltante"}
                                        </span>
                                        <span>{formatMoney(closeResult.difference ?? 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary w-full gap-2 rounded-xl shadow-md shadow-primary/20"
                                onClick={() => {
                                    setShowCloseCash(false);
                                    setCloseResult(null);
                                    setCountedCash("");
                                    const newTabId = generateTabId();
                                    setOrderTabs([
                                        { id: newTabId, label: "Orden 1", order: null, customerName: "", childName: "" },
                                    ]);
                                    setActiveOrderTabId(newTabId);
                                    refreshProducts();
                                    setShowOpenCash(true);
                                }}
                            >
                                <Check className="w-4 h-4" />
                                Aceptar y abrir nueva caja
                            </button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}