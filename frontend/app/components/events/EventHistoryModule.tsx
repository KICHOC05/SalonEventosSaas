import { useState, useMemo } from "react";
import { Search, X, Eye, Calendar, Clock, User, Baby } from "lucide-react";
import type { EventResponse, EventStatus } from "~/types/event";
import { getStatusBadge, formatCurrency, formatTime, formatShortDate } from "~/utils/eventHelpers";

interface EventHistoryModuleProps {
  events: EventResponse[];
  loading: boolean;
  onViewDetails: (publicId: string) => void;
}

const HISTORY_STATUS_FILTERS: { value: EventStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING_DEPOSIT", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
];

type PaymentStatus = "all" | "paid" | "partial" | "pending";

function getPaymentStatus(event: EventResponse): PaymentStatus {
  if (event.remainingAmount <= 0) return "paid";
  if (event.depositAmount > 0 && event.remainingAmount > 0) return "partial";
  return "pending";
}

function getPaymentLabel(status: PaymentStatus): { label: string; color: string } {
  if (status === "paid") return { label: "Pagado", color: "bg-success/10 text-success border-success/20" };
  if (status === "partial") return { label: "Parcial", color: "bg-warning/10 text-warning border-warning/20" };
  return { label: "Pendiente", color: "bg-error/10 text-error border-error/20" };
}

export default function EventHistoryModule({ events, loading, onViewDetails }: EventHistoryModuleProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let result = [...events];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.customerName?.toLowerCase().includes(q) ||
          e.childName?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((e) => e.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter((e) => getPaymentStatus(e) === paymentFilter);
    }

    if (dateFrom) {
      result = result.filter((e) => e.eventDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((e) => e.eventDate <= dateTo);
    }

    result.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    return result;
  }, [events, search, statusFilter, paymentFilter, dateFrom, dateTo]);

  if (loading && events.length === 0) {
    return (
      <div className="bg-base-100 border border-base-300/20 rounded-xl p-12 flex items-center justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-base-100 border border-base-300/20 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Buscar cliente o niño..."
              className="input input-bordered input-sm w-full pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5 text-base-content/40" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              className="input input-bordered input-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Desde"
            />
            <input
              type="date"
              className="input input-bordered input-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Hasta"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {HISTORY_STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`badge badge-sm cursor-pointer transition-colors ${
                  statusFilter === f.value ? "badge-primary" : "badge-ghost hover:bg-base-300/50"
                }`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-base-300/30 mx-1" />

          <div className="flex items-center gap-1.5">
            {(["all", "paid", "partial", "pending"] as const).map((p) => (
              <button
                key={p}
                className={`badge badge-sm cursor-pointer transition-colors ${
                  paymentFilter === p ? "badge-primary" : "badge-ghost hover:bg-base-300/50"
                }`}
                onClick={() => setPaymentFilter(p)}
              >
                {p === "all" ? "Todos" : p === "paid" ? "Pagados" : p === "partial" ? "Parciales" : "Pendientes"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-base-100 border border-base-300/20 rounded-xl p-12 flex flex-col items-center justify-center text-base-content/30 gap-3">
          <Calendar className="w-10 h-10" />
          <p className="font-semibold text-sm">No hay eventos en el historial</p>
          <p className="text-xs">Intenta ajustar los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="bg-base-100 border border-base-300/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-[11px] uppercase text-base-content/40">
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Cliente</th>
                  <th>Niño</th>
                  <th className="hidden md:table-cell">Paquete</th>
                  <th className="hidden md:table-cell">Total</th>
                  <th className="hidden md:table-cell">Pagado</th>
                  <th className="hidden md:table-cell">Saldo</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => {
                  const badge = getStatusBadge(event.status);
                  const paymentStatus = getPaymentStatus(event);
                  const paymentInfo = getPaymentLabel(paymentStatus);
                  return (
                    <tr key={event.publicId} className="hover:bg-base-200/30 transition-colors">
                      <td className="text-sm font-medium whitespace-nowrap">
                        {formatShortDate(event.eventDate)}
                      </td>
                      <td className="text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1 text-base-content/70">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-base-content/40" />
                          {event.customerName}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-sm">
                          <Baby className="w-3 h-3 text-base-content/40" />
                          {event.childName}
                        </span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-base-content/70">
                          {event.packageName || "-"}
                        </span>
                      </td>
                      <td className="hidden md:table-cell font-mono text-sm">
                        {formatCurrency(event.eventPrice || 0)}
                      </td>
                      <td className="hidden md:table-cell font-mono text-sm text-success">
                        {formatCurrency(event.depositAmount || 0)}
                      </td>
                      <td className="hidden md:table-cell font-mono text-sm text-warning">
                        {formatCurrency(event.remainingAmount || 0)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: badge.bgColor, color: badge.dotColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dotColor }} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-xs btn-square"
                          title="Ver detalle"
                          onClick={() => onViewDetails(event.publicId)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-base-300/20 text-xs text-base-content/40">
            Mostrando {filtered.length} de {events.length} eventos
          </div>
        </div>
      )}
    </div>
  );
}
