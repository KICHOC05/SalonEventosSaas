import { useMemo } from "react";
import {
  CalendarDays, DollarSign, TrendingUp, AlertTriangle,
  Calendar, Baby, Eye,
} from "lucide-react";
import type { EventResponse } from "~/types/event";
import { getStatusBadge, formatCurrency, formatShortDate } from "~/utils/eventHelpers";

interface EventStatsModuleProps {
  events: EventResponse[];
  loading: boolean;
  onViewDetails: (publicId: string) => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING_DEPOSIT: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default function EventStatsModule({ events, loading, onViewDetails }: EventStatsModuleProps) {
  const stats = useMemo(() => {
    const total = events.length;
    const expectedRevenue = events.reduce((s, e) => s + (e.eventPrice || 0), 0);
    const totalPaid = events.reduce((s, e) => s + (e.depositAmount || 0), 0);
    const totalPending = events.reduce((s, e) => s + (e.remainingAmount || 0), 0);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const thisMonthEvents = events.filter((e) => {
      const d = new Date(e.eventDate);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });

    const upcomingEvents = events.filter(
      (e) => e.eventDate >= now.toISOString().split("T")[0] && e.status !== "CANCELLED"
    );

    const completed = events.filter((e) => e.status === "COMPLETED").length;
    const cancelled = events.filter((e) => e.status === "CANCELLED").length;
    const pendingDeposit = events.filter((e) => e.status === "PENDING_DEPOSIT").length;
    const confirmed = events.filter((e) => e.status === "CONFIRMED").length;
    const inProgress = events.filter((e) => e.status === "IN_PROGRESS").length;

    const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const avgEventValue = total > 0 ? expectedRevenue / total : 0;

    return {
      total, expectedRevenue, totalPaid, totalPending,
      thisMonthEvents: thisMonthEvents.length,
      upcomingEvents: upcomingEvents.length,
      completed, cancelled, pendingDeposit, confirmed, inProgress,
      cancellationRate, completionRate, avgEventValue,
    };
  }, [events]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING_DEPOSIT: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    events.forEach((e) => {
      if (counts[e.status] !== undefined) counts[e.status]++;
    });
    const max = Math.max(...Object.values(counts), 1);
    return Object.entries(counts).map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count,
      pct: stats.total > 0 ? (count / stats.total) * 100 : 0,
      barWidth: (count / max) * 100,
      badge: getStatusBadge(status),
    }));
  }, [events, stats.total]);

  const monthlySummary = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => {
      const d = new Date(e.eventDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, count]) => {
        const [year, month] = key.split("-");
        return { key, label: `${MONTHS[parseInt(month) - 1]} ${year}`, count };
      });
  }, [events]);

  const pendingBalanceEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((e) => e.eventDate >= today && e.remainingAmount > 0 && e.status !== "CANCELLED")
      .sort((a, b) => a.eventDate.localeCompare(a.eventDate))
      .slice(0, 5);
  }, [events]);

  if (loading && events.length === 0) {
    return (
      <div className="bg-base-100 border border-base-300/20 rounded-xl p-12 flex items-center justify-center">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Eventos totales", value: stats.total, icon: CalendarDays, color: "#3B82F6", bg: "bg-blue-500/10" },
          { label: "Ingresos esperados", value: formatCurrency(stats.expectedRevenue), icon: DollarSign, color: "#8B5CF6", bg: "bg-purple-500/10" },
          { label: "Pagado", value: formatCurrency(stats.totalPaid), icon: TrendingUp, color: "#10B981", bg: "bg-emerald-500/10" },
          { label: "Saldo pendiente", value: formatCurrency(stats.totalPending), icon: AlertTriangle, color: "#F59E0B", bg: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-base-100 border border-base-300/20 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0`} style={{ backgroundColor: bg, color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold">{value}</div>
              <div className="text-xs uppercase tracking-wider font-medium text-base-content/40">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Este mes", value: stats.thisMonthEvents, color: "text-info" },
          { label: "Próximos", value: stats.upcomingEvents, color: "text-success" },
          { label: "Valor promedio", value: formatCurrency(stats.avgEventValue), color: "text-primary" },
          { label: "Tasa de cancelación", value: `${stats.cancellationRate.toFixed(1)}%`, color: stats.cancellationRate > 20 ? "text-error" : "text-base-content/70" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-base-100 border border-base-300/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-base-content/50">{label}</span>
            <span className={`text-sm font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Status breakdown + Monthly summary + Pending balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="bg-base-100 border border-base-300/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-4">Eventos por estado</h3>
          <div className="space-y-3">
            {statusBreakdown.map(({ status, label, count, pct, barWidth, badge }) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.dotColor }} />
                    <span className="font-medium">{label}</span>
                  </span>
                  <span className="font-bold">{count}</span>
                </div>
                <div className="w-full bg-base-300/50 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: badge.dotColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly summary */}
        <div className="bg-base-100 border border-base-300/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-4">Eventos por mes</h3>
          {monthlySummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-base-content/20 gap-2">
              <Calendar className="w-8 h-8" />
              <p className="text-xs">Sin datos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthlySummary.map(({ key, label, count }) => {
                const maxCount = Math.max(...monthlySummary.map((m) => m.count), 1);
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-xs text-base-content/60 truncate">{label}</span>
                    <div className="flex-1 bg-base-300/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary/60"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 text-right font-bold text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming with pending balance */}
        <div className="bg-base-100 border border-base-300/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-4">Próximos con saldo pendiente</h3>
          {pendingBalanceEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-base-content/20 gap-2">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-xs">Sin eventos pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingBalanceEvents.map((e) => {
                const badge = getStatusBadge(e.status);
                return (
                  <div key={e.publicId} className="flex items-center justify-between p-2.5 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{e.customerName}</p>
                      <div className="flex items-center gap-2 text-xs text-base-content/50 mt-0.5">
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {formatShortDate(e.eventDate)}</span>
                        <span className="flex items-center gap-0.5"><Baby className="w-3 h-3" /> {e.childName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-warning">{formatCurrency(e.remainingAmount)}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: badge.bgColor, color: badge.dotColor }}>
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: badge.dotColor }} />
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Ver detalle"
                      onClick={() => onViewDetails(e.publicId)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
