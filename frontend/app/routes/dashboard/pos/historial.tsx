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
} from "lucide-react";
import { fetchOrderHistory, getOrder, getOrderTicket, type OrderHistoryRecord, type OrderResponse } from "~/lib/api";
import { buildMeta } from "~/lib/meta";
import { useAuth } from "~/lib/auth";

export function meta() {
    return buildMeta("Historial de Órdenes", "Consulta de ventas realizadas");
}

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

export default function Historial() {
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
    const [detailLoading, setDetailLoading] = useState(false);
    const [ticketLoading, setTicketLoading] = useState<string | null>(null);

    const { isAdmin, isManager, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAdmin && !isManager) {
            navigate("/dashboard/pos", { replace: true });
        }
    }, [isLoading, isAdmin, isManager, navigate]);

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

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    function handleSearch() {
        setSearch(pendingSearch);
        setPage(0);
    }

    function handleClearFilters() {
        setPendingSearch("");
        setSearch("");
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    }

    async function handleViewDetail(publicId: string) {
        setDetailLoading(true);
        try {
            const detail = await getOrder(publicId);
            setDetailOrder(detail);
        } catch (err: any) {
            setError(err.message || "Error al cargar detalle");
        } finally {
            setDetailLoading(false);
        }
    }

    async function handleReprintTicket(publicId: string) {
        setTicketLoading(publicId);
        try {
            const html = await getOrderTicket(publicId);
            const win = window.open("", "_blank", "width=400,height=600");
            if (win) {
                win.document.write(html);
                win.document.close();
            }
        } catch {
            setError("Error al generar ticket");
        } finally {
            setTicketLoading(null);
        }
    }

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
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Historial de Órdenes</h2>
                        <p className="text-xs text-base-content/40">
                            Consulta ventas realizadas, clientes y usuarios
                        </p>
                    </div>
                </div>
                {totalElements > 0 && (
                    <span className="text-xs text-base-content/40">
                        {totalElements} orden{totalElements !== 1 ? "es" : ""} encontrada{totalElements !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {error && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>
                        Cerrar
                    </button>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300/30">
                <div className="card-body p-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Search className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o vendedor..."
                                className="input input-bordered input-sm w-full rounded-lg"
                                value={pendingSearch}
                                onChange={(e) => setPendingSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <select
                            className="select select-bordered select-sm rounded-lg"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            <option value="">Todos los estados</option>
                            <option value="CLOSED">Cerradas</option>
                            <option value="OPEN">Abiertas</option>
                            <option value="PARTIALLY_PAID">Parciales</option>
                            <option value="CANCELLED">Canceladas</option>
                        </select>

                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                className="input input-bordered input-sm rounded-lg"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                title="Desde"
                            />
                            <span className="text-xs text-base-content/40">a</span>
                            <input
                                type="date"
                                className="input input-bordered input-sm rounded-lg"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                title="Hasta"
                            />
                        </div>

                        <button
                            className="btn btn-primary btn-sm gap-1 rounded-lg"
                            onClick={handleSearch}
                        >
                            <Search className="w-3.5 h-3.5" />
                            Buscar
                        </button>

                        {(search || statusFilter || dateFrom || dateTo) && (
                            <button
                                className="btn btn-ghost btn-sm gap-1 rounded-lg"
                                onClick={handleClearFilters}
                            >
                                <X className="w-3.5 h-3.5" />
                                Limpiar
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
                    <p className="text-xs">Intenta ajustar los filtros</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr className="text-[11px] uppercase text-base-content/40">
                                    <th>Orden</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Vendedor</th>
                                    <th className="text-right">Total</th>
                                    <th>Estado</th>
                                    <th className="w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((o) => (
                                    <tr key={o.publicId} className="hover:bg-base-200/50 transition-colors">
                                        <td>
                                            <span className="font-mono text-xs font-bold text-primary">
                                                {o.shortCode}
                                            </span>
                                        </td>
                                        <td className="text-xs whitespace-nowrap">
                                            {formatDate(o.createdAt)}
                                        </td>
                                        <td>
                                            <div className="space-y-0.5">
                                                <span className="text-xs">
                                                    {o.customerName || "Sin cliente"}
                                                </span>
                                                {o.childNames && o.childNames.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {o.childNames.map((child, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] flex items-center gap-0.5 text-primary bg-primary/10 px-1.5 py-0.5 rounded-md"
                                                            >
                                                                <Baby className="w-2.5 h-2.5" />
                                                                {child}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1 text-xs">
                                                <User className="w-3 h-3 text-base-content/30" />
                                                {o.sellerName || "Sistema"}
                                            </div>
                                        </td>
                                        <td className="text-right font-bold text-xs">
                                            {formatCurrency(o.totalAmount)}
                                        </td>
                                        <td>
                                            <OrderStatusBadge status={o.status} />
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="btn btn-ghost btn-xs btn-square rounded-lg"
                                                    onClick={() => handleViewDetail(o.publicId)}
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                {o.status === "CLOSED" && (
                                                    <button
                                                        className="btn btn-ghost btn-xs btn-square rounded-lg"
                                                        onClick={() => handleReprintTicket(o.publicId)}
                                                        disabled={ticketLoading === o.publicId}
                                                        title="Reimprimir ticket"
                                                    >
                                                        {ticketLoading === o.publicId ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Printer className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                className="btn btn-ghost btn-sm rounded-lg"
                                disabled={page === 0}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-base-content/40">
                                Pág. {page + 1} de {totalPages}
                            </span>
                            <button
                                className="btn btn-ghost btn-sm rounded-lg"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
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
                                    <p className="text-xs text-base-content/40">
                                        {detailOrder.publicId.substring(0, 8).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setDetailOrder(null)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-[10px] uppercase text-base-content/40">Fecha</p>
                                    <p className="font-medium">{formatDate(detailOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-base-content/40">Estado</p>
                                    <OrderStatusBadge status={detailOrder.status} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-base-content/40">Cliente</p>
                                    <p className="font-medium">{detailOrder.customerName || "Sin cliente"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-base-content/40">Vendedor</p>
                                    <p className="font-medium">{detailOrder.sellerName || "Sistema"}</p>
                                </div>
                                {detailOrder.childNames && detailOrder.childNames.length > 0 && (
                                    <div className="col-span-2">
                                        <p className="text-[10px] uppercase text-base-content/40">Niños</p>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {detailOrder.childNames.map((name, i) => (
                                                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                    <Baby className="w-3 h-3" />
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-base-300/30 pt-3">
                                <p className="text-[10px] uppercase text-base-content/40 mb-2">Productos / Servicios</p>
                                <div className="space-y-2">
                                    {detailOrder.items?.map((item) => (
                                        <div key={item.publicId} className="flex justify-between items-start text-sm">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{item.productName}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-base-content/40">
                                                    <span>x{item.quantity}</span>
                                                    <span>{formatCurrency(item.unitPrice)} c/u</span>
                                                </div>
                                                {item.childName && (
                                                    <p className="text-[10px] text-primary flex items-center gap-0.5 mt-0.5">
                                                        <Baby className="w-2.5 h-2.5" />
                                                        {item.childName}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-bold ml-3 whitespace-nowrap">
                                                {formatCurrency(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {detailOrder.paymentMethods && detailOrder.paymentMethods.length > 0 && (
                                <div className="border-t border-base-300/30 pt-3">
                                    <p className="text-[10px] uppercase text-base-content/40 mb-1">Métodos de pago</p>
                                    <div className="flex flex-wrap gap-1">
                                        {detailOrder.paymentMethods.map((m, i) => (
                                            <span key={i} className="badge badge-sm badge-outline">{m}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-base-300/30 pt-3 flex justify-between items-center">
                                <span className="font-bold text-sm">Total</span>
                                <span className="text-lg font-extrabold text-primary">
                                    {formatCurrency(detailOrder.totalAmount)}
                                </span>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    className="btn btn-ghost btn-sm flex-1"
                                    onClick={() => setDetailOrder(null)}
                                >
                                    Cerrar
                                </button>
                                <button
                                    className="btn btn-primary btn-sm flex-1 gap-1.5"
                                    onClick={() => {
                                        handleReprintTicket(detailOrder.publicId);
                                        setDetailOrder(null);
                                    }}
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
