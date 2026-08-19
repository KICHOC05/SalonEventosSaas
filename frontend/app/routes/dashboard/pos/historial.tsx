import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
    Loader2,
    AlertTriangle,
    Clock,
    Eye,
    Printer,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Receipt,
    User,
    Baby,
    ArrowDown,
    ArrowUp,
    Vault,
    Ban,
    ListFilter,
    ShieldCheck,
    CreditCard,
} from "lucide-react";
import {
    fetchOrderHistory,
    getOrder,
    getOrderTicket,
    type OrderHistoryRecord,
    type OrderResponse,
    type CashMovementResponse,
    type CashRegisterHistoryItem,
    type CashRegisterDetail,
    type PageResponse,
    getCashMovementHistory,
    getCashMovementDetail,
    getCashRegisterHistory,
    getCashRegisterDetail,
    fetchFinancialAudit,
    fetchUsers,
    fetchBranches,
    getEventPaymentReceipt,
    type FinancialAuditEntry,
    type FinancialAuditSource,
    type UserResponse,
    type BranchResponse,
    type PaymentMethod,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";
import { useAuth } from "~/lib/auth";

export function meta() {
    return buildMeta("Historial del POS", "Auditoría de órdenes, movimientos y cajas");
}

type HistoryTab = "orders" | "cash" | "movements" | "audit";
type CatalogProps = { users: UserResponse[]; branches: BranchResponse[] };

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; label: string }> = {
        OPEN: { color: "badge-info", label: "Abierta" },
        CLOSED: { color: "badge-success", label: "Cerrada" },
        PARTIALLY_PAID: { color: "badge-warning", label: "Parcial" },
        CANCELLED: { color: "badge-error", label: "Cancelada" },
    };
    const { color, label } = config[status] ?? { color: "badge-ghost", label: status };
    return <span className={`badge ${color} badge-sm`}>{label}</span>;
}

function CashStatusBadge({ status }: { status: string }) {
    return status === "OPEN" ? (
        <span className="badge badge-success badge-sm gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Abierta
        </span>
    ) : (
        <span className="badge badge-ghost badge-sm">Cerrada</span>
    );
}

const TABS: { id: HistoryTab; label: string; icon: typeof Receipt }[] = [
    { id: "orders", label: "Órdenes", icon: Receipt },
    { id: "movements", label: "Movimientos de caja", icon: ArrowDown },
    { id: "cash", label: "Cajas", icon: Vault },
    { id: "audit", label: "Auditoría", icon: ShieldCheck },
];

export default function Historial() {
    const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
    const { isAdmin, isManager, isLoading } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [branches, setBranches] = useState<BranchResponse[]>([]);

    useEffect(() => {
        if (!isLoading && !isAdmin && !isManager) {
            navigate("/dashboard/pos", { replace: true });
        }
    }, [isLoading, isAdmin, isManager, navigate]);

    useEffect(() => {
        if (!isAdmin && !isManager) return;
        Promise.all([fetchUsers(), fetchBranches()])
            .then(([userList, branchList]) => {
                setUsers(userList);
                setBranches(branchList);
            })
            .catch(() => undefined);
    }, [isAdmin, isManager]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-base-content/40 text-sm">Cargando...</p>
            </div>
        );
    }

    if (!isAdmin && !isManager) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Historial del POS</h2>
                        <p className="text-xs text-base-content/40">Auditoría de órdenes, movimientos y cajas</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30 w-fit">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`btn btn-sm rounded-lg gap-1.5 ${activeTab === tab.id ? "btn-primary shadow-md" : "btn-ghost text-base-content/50"
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === "orders" && <OrdersTab users={users} branches={branches} />}
            {activeTab === "cash" && <CashRegistersTab users={users} branches={branches} />}
            {activeTab === "movements" && <MovementsTab users={users} branches={branches} />}
            {activeTab === "audit" && <AuditTab users={users} branches={branches} />}
        </div>
    );
}

function OrdersTab({ users, branches }: CatalogProps) {
    const [orders, setOrders] = useState<OrderHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [pendingSearch, setPendingSearch] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [pendingOrderNumber, setPendingOrderNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"" | PaymentMethod>("");
    const [userPublicId, setUserPublicId] = useState("");
    const [branchPublicId, setBranchPublicId] = useState("");
    const [size, setSize] = useState(20);
    const [showFilters, setShowFilters] = useState(false);

    const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);
    const [ticketLoading, setTicketLoading] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchOrderHistory({
                page,
                size,
                search: search || undefined,
                orderNumber: orderNumber || undefined,
                status: statusFilter || undefined,
                paymentMethod: paymentMethod || undefined,
                userPublicId: userPublicId || undefined,
                branchPublicId: branchPublicId || undefined,
                createdAtFrom: dateFrom || undefined,
                createdAtTo: dateTo || undefined,
            });
            setOrders(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err: any) {
            setError(err.message || "Error al cargar historial");
        } finally {
            setLoading(false);
        }
    }, [page, size, search, orderNumber, statusFilter, paymentMethod, userPublicId, branchPublicId, dateFrom, dateTo]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    function handleSearch() { setSearch(pendingSearch); setOrderNumber(pendingOrderNumber); setPage(0); }
    function handleClearFilters() {
        setPendingSearch(""); setSearch(""); setStatusFilter("");
        setOrderNumber(""); setPendingOrderNumber(""); setPaymentMethod(""); setUserPublicId("");
        setBranchPublicId(""); setDateFrom(""); setDateTo(""); setPage(0);
    }

    async function handleViewDetail(publicId: string) {
        try {
            const detail = await getOrder(publicId);
            setDetailOrder(detail);
        } catch (err: any) {
            setError(err.message || "Error al cargar detalle");
        }
    }

    async function handleReprintTicket(publicId: string) {
        setTicketLoading(publicId);
        try {
            const html = await getOrderTicket(publicId);
            const win = window.open("", "_blank", "width=400,height=600");
            if (win) { win.document.write(html); win.document.close(); }
        } catch { setError("Error al generar ticket"); }
        finally { setTicketLoading(null); }
    }

    return (
        <>
            {error && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>Cerrar</button>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300/30">
                <div className="card-body p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Search className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                            <input type="text" placeholder="Buscar cliente o vendedor..."
                                className="input input-bordered input-sm w-full rounded-lg"
                                value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                        </div>
                        <button className="btn btn-outline btn-sm gap-1.5 rounded-lg" onClick={() => setShowFilters(!showFilters)}>
                            <ListFilter className="w-3.5 h-3.5" />Filtros
                        </button>
                        <button className="btn btn-primary btn-sm gap-1 rounded-lg" onClick={handleSearch}>
                            <Search className="w-3.5 h-3.5" />Aplicar
                        </button>
                    </div>
                    {showFilters && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-base-300/30">
                        <input type="text" inputMode="numeric" placeholder="N.º de orden (123 o 000123)" className="input input-bordered input-sm rounded-lg"
                            value={pendingOrderNumber} onChange={(e) => setPendingOrderNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                        <select className="select select-bordered select-sm rounded-lg"
                            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">Todos los estados</option>
                            <option value="CLOSED">Cerradas</option>
                            <option value="OPEN">Abiertas</option>
                            <option value="PARTIALLY_PAID">Parciales</option>
                            <option value="CANCELLED">Canceladas</option>
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "" | PaymentMethod)}>
                            <option value="">Todos los métodos</option><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option>
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={userPublicId} onChange={(e) => setUserPublicId(e.target.value)}>
                            <option value="">Todos los usuarios</option>{users.map((user) => <option key={user.publicId} value={user.publicId}>{user.name} · {user.email}</option>)}
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={branchPublicId} onChange={(e) => setBranchPublicId(e.target.value)}>
                            <option value="">Todas las sucursales</option>{branches.map((branch) => <option key={branch.publicId} value={branch.publicId}>{branch.name}</option>)}
                        </select>
                        <div className="flex items-center gap-1 sm:col-span-2">
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Desde" />
                            <span className="text-xs text-base-content/40">a</span>
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Hasta" />
                        </div>
                        <select className="select select-bordered select-sm rounded-lg" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}>
                            <option value={20}>20 por página</option><option value={50}>50 por página</option><option value={100}>100 por página</option>
                        </select>
                        {(search || orderNumber || statusFilter || paymentMethod || userPublicId || branchPublicId || dateFrom || dateTo) && (
                            <button className="btn btn-ghost btn-sm gap-1 rounded-lg" onClick={handleClearFilters}>
                                <X className="w-3.5 h-3.5" />Limpiar
                            </button>
                        )}
                    </div>}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-base-content/40 text-sm">Cargando órdenes...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-base-content/20 gap-2">
                    <Receipt className="w-10 h-10" />
                    <p className="font-semibold text-sm">Sin órdenes en este periodo</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr className="text-[11px] uppercase text-base-content/40">
                                    <th>Orden</th><th>Fecha</th><th>Cliente</th>
                                    <th>Usuario</th><th>Método</th><th>Sucursal</th><th className="text-right">Total</th>
                                    <th>Estado</th><th className="w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.publicId} className="hover:bg-base-200/50 transition-colors">
                                        <td><span className="font-mono text-xs font-bold text-primary">{o.shortCode}</span></td>
                                        <td className="text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                                        <td>
                                            <div className="space-y-0.5">
                                                <span className="text-xs">{o.customerName || "Sin cliente"}</span>
                                                {o.childNames && o.childNames.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {o.childNames.map((child, i) => (
                                                            <span key={i} className="text-[10px] flex items-center gap-0.5 text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                                                <Baby className="w-2.5 h-2.5" />{child}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td><div className="flex items-center gap-1 text-xs"><User className="w-3 h-3 text-base-content/30" />{o.sellerName || "Sistema"}</div></td>
                                        <td className="text-xs">{o.paymentMethods?.join(" + ") || "—"}</td>
                                        <td className="text-xs">{o.branchName}</td>
                                        <td className="text-right font-bold text-xs">{formatCurrency(o.totalAmount)}</td>
                                        <td><OrderStatusBadge status={o.status} /></td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button className="btn btn-ghost btn-xs btn-square rounded-lg" onClick={() => handleViewDetail(o.publicId)} title="Ver detalle"><Eye className="w-3.5 h-3.5" /></button>
                                                {o.status === "CLOSED" && (
                                                    <button className="btn btn-ghost btn-xs btn-square rounded-lg" onClick={() => handleReprintTicket(o.publicId)} disabled={ticketLoading === o.publicId} title="Reimprimir ticket">
                                                        {ticketLoading === o.publicId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Paginator page={page} totalPages={totalPages} onPage={setPage} />}
                </>
            )}

            {detailOrder && (
                <div className="modal modal-open" onClick={() => setDetailOrder(null)}>
                    <div className="modal-box rounded-2xl max-w-lg p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Receipt className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg">Detalle de orden</h3>
                                    <p className="text-xs text-base-content/40">{detailOrder.shortCode}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setDetailOrder(null)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p className="text-[10px] uppercase text-base-content/40">Fecha</p><p className="font-medium">{formatDate(detailOrder.createdAt)}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Estado</p><OrderStatusBadge status={detailOrder.status} /></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Cliente</p><p className="font-medium">{detailOrder.customerName || "Sin cliente"}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Vendedor</p><p className="font-medium">{detailOrder.sellerName || "Sistema"}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Sucursal</p><p className="font-medium">{detailOrder.branchName}</p></div>
                            </div>
                            {detailOrder.items && detailOrder.items.length > 0 && (
                                <div className="border-t border-base-300/30 pt-3">
                                    <p className="text-[10px] uppercase text-base-content/40 mb-2">Productos / Servicios</p>
                                    <div className="space-y-2">
                                        {detailOrder.items.map((item) => (
                                            <div key={item.publicId} className="flex justify-between items-start text-sm">
                                                <div className="min-w-0 flex-1">
                                                     <p className="font-medium truncate">{item.productName}</p>
                                                     {item.status === "VOIDED" && <span className="badge badge-error badge-xs">Anulado</span>}
                                                    <div className="flex items-center gap-2 text-[11px] text-base-content/40">
                                                        <span>x{item.quantity}</span><span>{formatCurrency(item.unitPrice)} c/u</span>
                                                    </div>
                                                </div>
                                                <span className="font-bold ml-3 whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {detailOrder.payments && detailOrder.payments.length > 0 && (
                                <div className="border-t border-base-300/30 pt-3">
                                    <p className="text-[10px] uppercase text-base-content/40 mb-2">Pagos</p>
                                    <div className="space-y-2">
                                        {detailOrder.payments.map((payment) => <div key={payment.publicId} className="rounded-lg bg-base-200/50 p-3 text-xs">
                                            <div className="flex justify-between font-bold"><span>{payment.paymentMethod}</span><span>{formatCurrency(payment.amount)}</span></div>
                                            <div className="text-base-content/50 mt-1">{formatDate(payment.createdAt)} · {payment.receivedByName}</div>
                                            {payment.reference && <div className="text-base-content/60">Ref. {payment.reference}</div>}
                                        </div>)}
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-base-300/30 pt-3 flex justify-between items-center">
                                <span className="font-bold text-sm">Total</span>
                                <span className="text-lg font-extrabold text-primary">{formatCurrency(detailOrder.totalAmount)}</span>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button className="btn btn-ghost btn-sm flex-1" onClick={() => setDetailOrder(null)}>Cerrar</button>
                                {detailOrder.status === "CLOSED" && <button className="btn btn-primary btn-sm flex-1 gap-1.5" onClick={() => { handleReprintTicket(detailOrder.publicId); setDetailOrder(null); }}>
                                    <Printer className="w-3.5 h-3.5" />Ticket
                                </button>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function MovementsTab({ users, branches }: CatalogProps) {
    const [movements, setMovements] = useState<CashMovementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [typeFilter, setTypeFilter] = useState("");
    const [voidedFilter, setVoidedFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [userPublicId, setUserPublicId] = useState("");
    const [branchPublicId, setBranchPublicId] = useState("");
    const [cashRegisterPublicId, setCashRegisterPublicId] = useState("");
    const [pendingCashRegisterPublicId, setPendingCashRegisterPublicId] = useState("");

    const [detailMovement, setDetailMovement] = useState<CashMovementResponse | null>(null);

    const loadMovements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCashMovementHistory({
                page, size: 20,
                type: typeFilter ? (typeFilter as "WITHDRAWAL" | "DEPOSIT") : undefined,
                voided: voidedFilter === "" ? undefined : voidedFilter === "true",
                userPublicId: userPublicId || undefined,
                branchPublicId: branchPublicId || undefined,
                cashRegisterPublicId: cashRegisterPublicId || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            });
            setMovements(result.content);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar movimientos");
        } finally { setLoading(false); }
    }, [page, typeFilter, voidedFilter, userPublicId, branchPublicId, cashRegisterPublicId, dateFrom, dateTo]);

    useEffect(() => { loadMovements(); }, [loadMovements]);

    function handleClearFilters() {
        setTypeFilter(""); setVoidedFilter(""); setUserPublicId(""); setBranchPublicId("");
        setCashRegisterPublicId(""); setPendingCashRegisterPublicId(""); setDateFrom(""); setDateTo(""); setPage(0);
    }

    async function handleViewDetail(publicId: string) {
        try {
            const detail = await getCashMovementDetail(publicId);
            setDetailMovement(detail);
        } catch (err: any) { setError(err.message || "Error al cargar detalle"); }
    }

    return (
        <>
            {error && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>Cerrar</button>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300/30">
                <div className="card-body p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                        <select className="select select-bordered select-sm rounded-lg"
                            value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                            <option value="">Todos los tipos</option>
                            <option value="WITHDRAWAL">Retiros</option>
                            <option value="DEPOSIT">Depósitos</option>
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={userPublicId} onChange={(e) => { setUserPublicId(e.target.value); setPage(0); }}>
                            <option value="">Todos los usuarios</option>{users.map((user) => <option key={user.publicId} value={user.publicId}>{user.name}</option>)}
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={branchPublicId} onChange={(e) => { setBranchPublicId(e.target.value); setPage(0); }}>
                            <option value="">Todas las sucursales</option>{branches.map((branch) => <option key={branch.publicId} value={branch.publicId}>{branch.name}</option>)}
                        </select>
                        <div className="join"><input className="input input-bordered input-sm join-item w-40" placeholder="Caja (publicId)" value={pendingCashRegisterPublicId} onChange={(e) => setPendingCashRegisterPublicId(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setCashRegisterPublicId(pendingCashRegisterPublicId); setPage(0); } }} /><button className="btn btn-primary btn-sm join-item" onClick={() => { setCashRegisterPublicId(pendingCashRegisterPublicId); setPage(0); }}>Aplicar</button></div>
                        <select className="select select-bordered select-sm rounded-lg"
                            value={voidedFilter} onChange={(e) => { setVoidedFilter(e.target.value); setPage(0); }}>
                            <option value="">Todos los estados</option>
                            <option value="false">Activos</option>
                            <option value="true">Anulados</option>
                        </select>
                        <div className="flex items-center gap-1">
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} title="Desde" />
                            <span className="text-xs text-base-content/40">a</span>
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} title="Hasta" />
                        </div>
                        {(typeFilter || voidedFilter || userPublicId || branchPublicId || cashRegisterPublicId || dateFrom || dateTo) && (
                            <button className="btn btn-ghost btn-sm gap-1 rounded-lg" onClick={handleClearFilters}>
                                <X className="w-3.5 h-3.5" />Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-base-content/40 text-sm">Cargando movimientos...</p>
                </div>
            ) : movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-base-content/20 gap-2">
                    <ArrowDown className="w-10 h-10" />
                    <p className="font-semibold text-sm">Sin movimientos en este periodo</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr className="text-[11px] uppercase text-base-content/40">
                                    <th>Fecha</th><th>Tipo</th><th className="text-right">Monto</th>
                                    <th>Motivo</th><th>Usuario</th><th>Caja / Sucursal</th><th>Estado</th><th className="w-16">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map((m) => (
                                    <tr key={m.publicId} className={`hover:bg-base-200/50 transition-colors ${m.voided ? "opacity-50" : ""}`}>
                                        <td className="text-xs whitespace-nowrap">{formatDate(m.createdAt)}</td>
                                        <td>
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${m.type === "DEPOSIT" ? "text-success" : "text-error"}`}>
                                                {m.type === "DEPOSIT" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                                                {m.type === "DEPOSIT" ? "Depósito" : "Retiro"}
                                            </span>
                                        </td>
                                        <td className={`text-right font-bold text-xs ${m.type === "DEPOSIT" ? "text-success" : "text-error"}`}>
                                            {m.type === "DEPOSIT" ? "+" : "-"}{formatCurrency(m.amount)}
                                        </td>
                                        <td className="text-xs max-w-[180px] truncate">{m.reason}</td>
                                        <td className="text-xs">{m.userName}</td>
                                        <td className="text-xs"><div>{m.cashRegisterPublicId.substring(0, 8).toUpperCase()}</div><div className="text-base-content/40">{m.branchName}</div></td>
                                        <td>
                                            {m.voided ? (
                                                <span className="badge badge-error badge-sm gap-1"><Ban className="w-2.5 h-2.5" />Anulado</span>
                                            ) : (
                                                <span className="badge badge-success badge-sm">Activo</span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs btn-square rounded-lg" onClick={() => handleViewDetail(m.publicId)} title="Ver detalle">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Paginator page={page} totalPages={totalPages} onPage={setPage} />}
                </>
            )}

            {detailMovement && (
                <div className="modal modal-open" onClick={() => setDetailMovement(null)}>
                    <div className="modal-box rounded-2xl max-w-md p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 pb-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${detailMovement.type === "DEPOSIT" ? "bg-success/10" : "bg-error/10"}`}>
                                    {detailMovement.type === "DEPOSIT" ? <ArrowDown className="w-5 h-5 text-success" /> : <ArrowUp className="w-5 h-5 text-error" />}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg">{detailMovement.type === "DEPOSIT" ? "Depósito" : "Retiro"}</h3>
                                    <p className="text-xs text-base-content/40">{detailMovement.publicId.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setDetailMovement(null)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p className="text-[10px] uppercase text-base-content/40">Tipo</p><p className="font-medium">{detailMovement.type === "DEPOSIT" ? "Depósito" : "Retiro"}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Monto</p><p className={`font-bold ${detailMovement.type === "DEPOSIT" ? "text-success" : "text-error"}`}>{detailMovement.type === "DEPOSIT" ? "+" : "-"}{formatCurrency(detailMovement.amount)}</p></div>
                                <div className="col-span-2"><p className="text-[10px] uppercase text-base-content/40">Motivo</p><p className="font-medium">{detailMovement.reason}</p></div>
                                {detailMovement.notes && <div className="col-span-2"><p className="text-[10px] uppercase text-base-content/40">Notas</p><p className="text-sm text-base-content/60">{detailMovement.notes}</p></div>}
                                <div><p className="text-[10px] uppercase text-base-content/40">Creado por</p><p className="font-medium">{detailMovement.userName}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Fecha</p><p className="font-medium">{formatDate(detailMovement.createdAt)}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Caja</p><p className="font-mono text-xs">{detailMovement.cashRegisterPublicId}</p></div>
                                <div><p className="text-[10px] uppercase text-base-content/40">Sucursal</p><p className="font-medium">{detailMovement.branchName}</p></div>
                            </div>
                            {detailMovement.voided && (
                                <div className="border-t border-base-300/30 pt-3">
                                    <p className="text-[10px] uppercase text-base-content/40 mb-2">Información de anulación</p>
                                    <div className="grid grid-cols-2 gap-3 text-sm bg-error/5 rounded-xl p-3 border border-error/10">
                                        <div><p className="text-[10px] uppercase text-base-content/40">Anulado por</p><p className="font-medium">{detailMovement.voidedByName || "-"}</p></div>
                                        <div><p className="text-[10px] uppercase text-base-content/40">Fecha anulación</p><p className="font-medium">{formatDate(detailMovement.voidedAt ?? null)}</p></div>
                                        {detailMovement.voidReason && <div className="col-span-2"><p className="text-[10px] uppercase text-base-content/40">Motivo anulación</p><p className="text-sm">{detailMovement.voidReason}</p></div>}
                                    </div>
                                </div>
                            )}
                            <button className="btn btn-ghost btn-sm w-full" onClick={() => setDetailMovement(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function CashRegistersTab({ users, branches }: CatalogProps) {
    const [registers, setRegisters] = useState<CashRegisterHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [openedByPublicId, setOpenedByPublicId] = useState("");
    const [branchPublicId, setBranchPublicId] = useState("");

    const [detailRegister, setDetailRegister] = useState<CashRegisterDetail | null>(null);
    const [detailMovements, setDetailMovements] = useState<CashMovementResponse[]>([]);

    const loadRegisters = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCashRegisterHistory({
                page, size: 20,
                status: statusFilter || undefined,
                openedByPublicId: openedByPublicId || undefined,
                branchPublicId: branchPublicId || undefined,
                from: dateFrom || undefined,
                to: dateTo || undefined,
            });
            setRegisters(result.content);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar cajas");
        } finally { setLoading(false); }
    }, [page, statusFilter, openedByPublicId, branchPublicId, dateFrom, dateTo]);

    useEffect(() => { loadRegisters(); }, [loadRegisters]);

    function handleClearFilters() {
        setStatusFilter(""); setOpenedByPublicId(""); setBranchPublicId("");
        setDateFrom(""); setDateTo(""); setPage(0);
    }

    async function handleViewDetail(publicId: string) {
        try {
            const detail = await getCashRegisterDetail(publicId);
            setDetailRegister(detail);
            setDetailMovements([]);
        } catch (err: any) { setError(err.message || "Error al cargar detalle"); }
    }

    return (
        <>
            {error && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>Cerrar</button>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300/30">
                <div className="card-body p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                        <select className="select select-bordered select-sm rounded-lg"
                            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                            <option value="">Todos los estados</option>
                            <option value="OPEN">Abiertas</option>
                            <option value="CLOSED">Cerradas</option>
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={openedByPublicId} onChange={(e) => { setOpenedByPublicId(e.target.value); setPage(0); }}>
                            <option value="">Todos los usuarios</option>
                            {users.map((user) => <option key={user.publicId} value={user.publicId}>{user.name}</option>)}
                        </select>
                        <select className="select select-bordered select-sm rounded-lg" value={branchPublicId} onChange={(e) => { setBranchPublicId(e.target.value); setPage(0); }}>
                            <option value="">Todas las sucursales</option>
                            {branches.map((branch) => <option key={branch.publicId} value={branch.publicId}>{branch.name}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} title="Desde" />
                            <span className="text-xs text-base-content/40">a</span>
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} title="Hasta" />
                        </div>
                        {(statusFilter || openedByPublicId || branchPublicId || dateFrom || dateTo) && (
                            <button className="btn btn-ghost btn-sm gap-1 rounded-lg" onClick={handleClearFilters}>
                                <X className="w-3.5 h-3.5" />Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-base-content/40 text-sm">Cargando cajas...</p>
                </div>
            ) : registers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-base-content/20 gap-2">
                    <Vault className="w-10 h-10" />
                    <p className="font-semibold text-sm">Sin cajas en este periodo</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr className="text-[11px] uppercase text-base-content/40">
                                    <th>Caja / Sucursal</th><th>Usuario</th><th>Apertura</th><th>Cierre</th><th className="text-right">Apertura $</th>
                                    <th className="text-right">Esperado</th><th className="text-right">Contado</th>
                                    <th className="text-right">Dif.</th><th>Estado</th><th className="w-16">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registers.map((r) => (
                                    <tr key={r.publicId} className="hover:bg-base-200/50 transition-colors">
                                        <td className="text-xs"><div className="font-mono">{r.publicId.substring(0, 8).toUpperCase()}</div><div className="text-base-content/40">{r.branchName}</div></td>
                                        <td className="text-xs">{r.openedByName}</td>
                                        <td className="text-xs whitespace-nowrap">{formatDate(r.openedAt)}</td>
                                        <td className="text-xs whitespace-nowrap">{formatDate(r.closedAt)}</td>
                                        <td className="text-right text-xs">{formatCurrency(r.openingAmount)}</td>
                                        <td className="text-right text-xs">{r.expectedAmount != null ? formatCurrency(r.expectedAmount) : "-"}</td>
                                        <td className="text-right text-xs">{r.closingAmount != null ? formatCurrency(r.closingAmount) : "-"}</td>
                                        <td className={`text-right text-xs font-bold ${(r.difference ?? 0) === 0 ? "text-success" : (r.difference ?? 0) > 0 ? "text-warning" : "text-error"}`}>
                                            {r.difference != null ? formatCurrency(r.difference) : "-"}
                                        </td>
                                        <td><CashStatusBadge status={r.status} /></td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs btn-square rounded-lg" onClick={() => handleViewDetail(r.publicId)} title="Ver detalle">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Paginator page={page} totalPages={totalPages} onPage={setPage} />}
                </>
            )}

            {detailRegister && (
                <div className="modal modal-open" onClick={() => setDetailRegister(null)}>
                    <div className="modal-box rounded-2xl max-w-lg p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Vault className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg">Caja {detailRegister.publicId.substring(0, 8).toUpperCase()}</h3>
                                    <p className="text-xs text-base-content/40"><CashStatusBadge status={detailRegister.status} /></p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setDetailRegister(null)}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <p className="text-[10px] uppercase text-base-content/40 font-bold">Apertura</p>
                                <div className="flex justify-between text-sm"><span>Fecha</span><span>{formatDate(detailRegister.openedAt)}</span></div>
                                <div className="flex justify-between text-sm"><span>Usuario</span><span>{detailRegister.openedByName}</span></div>
                                <div className="flex justify-between text-sm"><span>Sucursal</span><span>{detailRegister.branchName}</span></div>
                                <div className="flex justify-between text-sm font-bold"><span>Monto</span><span>{formatCurrency(detailRegister.openingAmount)}</span></div>
                            </div>

                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <p className="text-[10px] uppercase text-base-content/40 font-bold">Ventas</p>
                                <div className="flex justify-between text-sm"><span>Efectivo</span><span>{formatCurrency(detailRegister.cashSales)}</span></div>
                                <div className="flex justify-between text-xs text-base-content/50 pl-3"><span>POS / Eventos</span><span>{formatCurrency(detailRegister.posCashSales ?? 0)} / {formatCurrency(detailRegister.eventCashPayments ?? 0)}</span></div>
                                <div className="flex justify-between text-sm"><span>Tarjeta</span><span>{formatCurrency(detailRegister.cardSales)}</span></div>
                                <div className="flex justify-between text-xs text-base-content/50 pl-3"><span>POS / Eventos</span><span>{formatCurrency(detailRegister.posCardSales ?? 0)} / {formatCurrency(detailRegister.eventCardPayments ?? 0)}</span></div>
                                <div className="flex justify-between text-sm"><span>Transferencia</span><span>{formatCurrency(detailRegister.transferSales)}</span></div>
                                <div className="flex justify-between text-xs text-base-content/50 pl-3"><span>POS / Eventos</span><span>{formatCurrency(detailRegister.posTransferSales ?? 0)} / {formatCurrency(detailRegister.eventTransferPayments ?? 0)}</span></div>
                                <div className="border-t border-base-300/50 pt-1 flex justify-between text-sm font-bold"><span>Total ventas</span><span>{formatCurrency(detailRegister.salesTotal)}</span></div>
                            </div>

                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <p className="text-[10px] uppercase text-base-content/40 font-bold">Movimientos</p>
                                <div className="flex justify-between text-sm"><span className="text-success">Depósitos</span><span className="text-success">+{formatCurrency(detailRegister.depositTotal)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-error">Retiros</span><span className="text-error">-{formatCurrency(detailRegister.withdrawalTotal)}</span></div>
                            </div>

                            <div className="bg-base-200/50 rounded-xl p-4 space-y-2 border border-base-300/30">
                                <p className="text-[10px] uppercase text-base-content/40 font-bold">Cierre</p>
                                <div className="flex justify-between text-sm"><span>Efectivo esperado</span><span className="font-bold">{formatCurrency(detailRegister.expectedCash)}</span></div>
                                <div className="flex justify-between text-sm"><span>Efectivo contado</span><span>{detailRegister.countedCash != null ? formatCurrency(detailRegister.countedCash) : "-"}</span></div>
                                {detailRegister.difference != null && (
                                    <div className={`flex justify-between text-sm font-bold ${detailRegister.difference === 0 ? "text-success" : detailRegister.difference > 0 ? "text-warning" : "text-error"}`}>
                                        <span>Diferencia</span><span>{formatCurrency(detailRegister.difference)}</span>
                                    </div>
                                )}
                                {detailRegister.closedAt && <div className="flex justify-between text-sm"><span>Cierre</span><span>{formatDate(detailRegister.closedAt)} - {detailRegister.closedByName || "-"}</span></div>}
                            </div>

                            <button className="btn btn-ghost btn-sm w-full" onClick={() => setDetailRegister(null)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

type AuditFilters = {
    source: "" | FinancialAuditSource;
    paymentMethod: "" | PaymentMethod;
    userPublicId: string;
    branchPublicId: string;
    from: string;
    to: string;
};

const EMPTY_AUDIT_FILTERS: AuditFilters = {
    source: "", paymentMethod: "", userPublicId: "", branchPublicId: "", from: "", to: "",
};

function AuditTab({ users, branches }: CatalogProps) {
    const [entries, setEntries] = useState<FinancialAuditEntry[]>([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [draft, setDraft] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
    const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
    const [printing, setPrinting] = useState<string | null>(null);

    const loadAudit = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const result = await fetchFinancialAudit({
                page, size,
                source: filters.source || undefined,
                paymentMethod: filters.paymentMethod || undefined,
                userPublicId: filters.userPublicId || undefined,
                branchPublicId: filters.branchPublicId || undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
            });
            setEntries(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err: any) {
            setError(err.message || "No fue posible consultar la auditoría financiera");
        } finally { setLoading(false); }
    }, [page, size, filters]);

    useEffect(() => { loadAudit(); }, [loadAudit]);

    function applyFilters() { setFilters({ ...draft }); setPage(0); }
    function clearFilters() {
        setDraft(EMPTY_AUDIT_FILTERS); setFilters(EMPTY_AUDIT_FILTERS); setPage(0);
    }

    async function printDocument(entry: FinancialAuditEntry) {
        setPrinting(entry.entryPublicId);
        try {
            const html = entry.source === "POS"
                ? await getOrderTicket(entry.operationPublicId)
                : await getEventPaymentReceipt(entry.operationPublicId, entry.entryPublicId);
            const win = window.open("", "_blank", "width=420,height=650");
            if (win) { win.document.write(html); win.document.close(); }
        } catch (err: any) {
            setError(err.message || "No fue posible obtener el comprobante");
        } finally { setPrinting(null); }
    }

    return <div className="space-y-4">
        {error && <div className="alert alert-warning border-0 bg-warning/10"><AlertTriangle className="w-4 h-4" /><span className="text-sm">{error}</span></div>}
        <div className="card bg-base-100 shadow-sm border border-base-300/30">
            <div className="card-body p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><p className="font-bold text-sm">Auditoría financiera unificada</p><p className="text-xs text-base-content/40">{totalElements} operaciones · solo lectura</p></div>
                    <button className="btn btn-outline btn-sm gap-1.5" onClick={() => setShowFilters(!showFilters)}><ListFilter className="w-3.5 h-3.5" />Filtros</button>
                </div>
                {showFilters && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-base-300/30">
                    <select className="select select-bordered select-sm" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as AuditFilters["source"] })}>
                        <option value="">Todos los orígenes</option><option value="POS">POS</option><option value="EVENT">Eventos</option><option value="MOVEMENT">Movimientos</option>
                    </select>
                    <select className="select select-bordered select-sm" value={draft.paymentMethod} onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value as AuditFilters["paymentMethod"] })}>
                        <option value="">Todos los métodos</option><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option>
                    </select>
                    <select className="select select-bordered select-sm" value={draft.userPublicId} onChange={(e) => setDraft({ ...draft, userPublicId: e.target.value })}>
                        <option value="">Todos los usuarios</option>{users.map((user) => <option key={user.publicId} value={user.publicId}>{user.name} · {user.email}</option>)}
                    </select>
                    <select className="select select-bordered select-sm" value={draft.branchPublicId} onChange={(e) => setDraft({ ...draft, branchPublicId: e.target.value })}>
                        <option value="">Todas las sucursales</option>{branches.map((branch) => <option key={branch.publicId} value={branch.publicId}>{branch.name}</option>)}
                    </select>
                    <input type="date" className="input input-bordered input-sm" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} title="Fecha desde" />
                    <input type="date" className="input input-bordered input-sm" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} title="Fecha hasta" />
                    <select className="select select-bordered select-sm" value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}><option value={20}>20 por página</option><option value={50}>50 por página</option><option value={100}>100 por página</option></select>
                    <div className="flex gap-2"><button className="btn btn-primary btn-sm flex-1" onClick={applyFilters}>Aplicar</button><button className="btn btn-ghost btn-sm" onClick={clearFilters}>Limpiar</button></div>
                </div>}
            </div>
        </div>

        {loading ? <div className="flex flex-col items-center py-20 gap-3"><Loader2 className="w-9 h-9 animate-spin text-primary" /><p className="text-sm text-base-content/40">Consultando auditoría...</p></div>
            : entries.length === 0 ? <div className="flex flex-col items-center py-20 gap-2 text-base-content/25"><ShieldCheck className="w-10 h-10" /><p className="font-semibold text-sm">No se encontraron operaciones con estos filtros.</p></div>
                : <>
                    <div className="overflow-x-auto rounded-xl border border-base-300/30 bg-base-100">
                        <table className="table table-sm">
                            <thead><tr className="text-[11px] uppercase text-base-content/40"><th>Fecha</th><th>Origen</th><th>Referencia</th><th>Método / Tipo</th><th className="text-right">Monto</th><th>Usuario</th><th>Sucursal</th><th></th></tr></thead>
                            <tbody>{entries.map((entry) => <tr key={`${entry.source}-${entry.entryPublicId}`} className="hover:bg-base-200/50">
                                <td className="text-xs whitespace-nowrap">{formatDate(entry.date)}</td>
                                <td><span className={`badge badge-sm ${entry.source === "POS" ? "badge-info" : entry.source === "EVENT" ? "badge-secondary" : "badge-ghost"}`}>{entry.source}</span></td>
                                <td className="text-xs font-medium">{entry.reference}</td>
                                <td className="text-xs">{entry.paymentMethod || (entry.type === "DEPOSIT" ? "Depósito" : "Retiro")}</td>
                                <td className={`text-right text-xs font-bold ${entry.amount < 0 ? "text-error" : "text-success"}`}>{entry.amount > 0 ? "+" : ""}{formatCurrency(entry.amount)}</td>
                                <td className="text-xs"><div>{entry.userName || "Usuario histórico"}</div>{entry.userEmail && entry.userEmail !== entry.userName && <div className="text-base-content/40">{entry.userEmail}</div>}</td>
                                <td className="text-xs">{entry.branchName}</td>
                                <td>{entry.source !== "MOVEMENT" && <button className="btn btn-ghost btn-xs btn-square" title="Imprimir comprobante" disabled={printing === entry.entryPublicId} onClick={() => printDocument(entry)}>{printing === entry.entryPublicId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}</button>}</td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    {totalPages > 1 && <Paginator page={page} totalPages={totalPages} onPage={setPage} />}
                </>}
    </div>;
}

function Paginator({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-2 pt-2">
            <button className="btn btn-ghost btn-sm rounded-lg" disabled={page === 0} onClick={() => onPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-base-content/40">Pág. {page + 1} de {totalPages}</span>
            <button className="btn btn-ghost btn-sm rounded-lg" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
