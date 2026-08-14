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
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";
import { useAuth } from "~/lib/auth";

export function meta() {
    return buildMeta("Historial del POS", "Auditoría de órdenes, movimientos y cajas");
}

type HistoryTab = "orders" | "movements" | "cash";

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
];

export default function Historial() {
    const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
    const { isAdmin, isManager, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAdmin && !isManager) {
            navigate("/dashboard/pos", { replace: true });
        }
    }, [isLoading, isAdmin, isManager, navigate]);

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

            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "movements" && <MovementsTab />}
            {activeTab === "cash" && <CashRegistersTab />}
        </div>
    );
}

function OrdersTab() {
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

    const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);
    const [ticketLoading, setTicketLoading] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchOrderHistory({
                page,
                size: 20,
                search: search || undefined,
                status: statusFilter || undefined,
                createdAtFrom: dateFrom ? `${dateFrom}T00:00:00` : undefined,
                createdAtTo: dateTo ? `${dateTo}T23:59:59` : undefined,
            });
            setOrders(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
        } catch (err: any) {
            setError(err.message || "Error al cargar historial");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, dateFrom, dateTo]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    function handleSearch() { setSearch(pendingSearch); setPage(0); }
    function handleClearFilters() {
        setPendingSearch(""); setSearch(""); setStatusFilter("");
        setDateFrom(""); setDateTo(""); setPage(0);
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
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Search className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                            <input type="text" placeholder="Buscar por cliente o vendedor..."
                                className="input input-bordered input-sm w-full rounded-lg"
                                value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
                        </div>
                        <select className="select select-bordered select-sm rounded-lg"
                            value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                            <option value="">Todos los estados</option>
                            <option value="CLOSED">Cerradas</option>
                            <option value="OPEN">Abiertas</option>
                            <option value="PARTIALLY_PAID">Parciales</option>
                            <option value="CANCELLED">Canceladas</option>
                        </select>
                        <div className="flex items-center gap-1">
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} title="Desde" />
                            <span className="text-xs text-base-content/40">a</span>
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} title="Hasta" />
                        </div>
                        <button className="btn btn-primary btn-sm gap-1 rounded-lg" onClick={handleSearch}>
                            <Search className="w-3.5 h-3.5" />Buscar
                        </button>
                        {(search || statusFilter || dateFrom || dateTo) && (
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
                                    <th>Vendedor</th><th className="text-right">Total</th>
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
                            </div>
                            {detailOrder.items && detailOrder.items.length > 0 && (
                                <div className="border-t border-base-300/30 pt-3">
                                    <p className="text-[10px] uppercase text-base-content/40 mb-2">Productos / Servicios</p>
                                    <div className="space-y-2">
                                        {detailOrder.items.map((item) => (
                                            <div key={item.publicId} className="flex justify-between items-start text-sm">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium truncate">{item.productName}</p>
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
                            <div className="border-t border-base-300/30 pt-3 flex justify-between items-center">
                                <span className="font-bold text-sm">Total</span>
                                <span className="text-lg font-extrabold text-primary">{formatCurrency(detailOrder.totalAmount)}</span>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button className="btn btn-ghost btn-sm flex-1" onClick={() => setDetailOrder(null)}>Cerrar</button>
                                <button className="btn btn-primary btn-sm flex-1 gap-1.5" onClick={() => { handleReprintTicket(detailOrder.publicId); setDetailOrder(null); }}>
                                    <Printer className="w-3.5 h-3.5" />Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function MovementsTab() {
    const [movements, setMovements] = useState<CashMovementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [typeFilter, setTypeFilter] = useState("");
    const [voidedFilter, setVoidedFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [detailMovement, setDetailMovement] = useState<CashMovementResponse | null>(null);

    const loadMovements = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCashMovementHistory({
                page, size: 20,
                type: typeFilter ? (typeFilter as "WITHDRAWAL" | "DEPOSIT") : undefined,
                voided: voidedFilter === "" ? undefined : voidedFilter === "true",
                from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
                to: dateTo ? `${dateTo}T23:59:59` : undefined,
            });
            setMovements(result.content);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar movimientos");
        } finally { setLoading(false); }
    }, [page, typeFilter, voidedFilter, dateFrom, dateTo]);

    useEffect(() => { loadMovements(); }, [loadMovements]);

    function handleClearFilters() {
        setTypeFilter(""); setVoidedFilter(""); setDateFrom(""); setDateTo(""); setPage(0);
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
                        {(typeFilter || voidedFilter || dateFrom || dateTo) && (
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
                                    <th>Motivo</th><th>Usuario</th><th>Estado</th><th className="w-16">Acciones</th>
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

function CashRegistersTab() {
    const [registers, setRegisters] = useState<CashRegisterHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [detailRegister, setDetailRegister] = useState<CashRegisterDetail | null>(null);
    const [detailMovements, setDetailMovements] = useState<CashMovementResponse[]>([]);

    const loadRegisters = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getCashRegisterHistory({
                page, size: 20,
                status: statusFilter || undefined,
                from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
                to: dateTo ? `${dateTo}T23:59:59` : undefined,
            });
            setRegisters(result.content);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar cajas");
        } finally { setLoading(false); }
    }, [page, statusFilter, dateFrom, dateTo]);

    useEffect(() => { loadRegisters(); }, [loadRegisters]);

    function handleClearFilters() {
        setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(0);
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
                        <div className="flex items-center gap-1">
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} title="Desde" />
                            <span className="text-xs text-base-content/40">a</span>
                            <input type="date" className="input input-bordered input-sm rounded-lg"
                                value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} title="Hasta" />
                        </div>
                        {(statusFilter || dateFrom || dateTo) && (
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
                                    <th>Apertura</th><th>Cierre</th><th className="text-right">Apertura $</th>
                                    <th className="text-right">Esperado</th><th className="text-right">Contado</th>
                                    <th className="text-right">Dif.</th><th>Estado</th><th className="w-16">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registers.map((r) => (
                                    <tr key={r.publicId} className="hover:bg-base-200/50 transition-colors">
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
