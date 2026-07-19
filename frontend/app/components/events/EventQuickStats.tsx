import {
  CalendarDays,
  Activity,
  Clock,
  DollarSign,
} from "lucide-react";
import type { EventResponse } from "~/types/event";
import { formatCurrency, getStatusColor } from "~/utils/eventHelpers";

interface EventQuickStatsProps {
  events: EventResponse[];
}

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function EventQuickStats({ events }: EventQuickStatsProps) {
  const today = new Date().toISOString().split("T")[0];
  const activeEvents = events.filter(
    (e) => e.status !== "CANCELLED" && e.status !== "COMPLETED"
  );
  const pendingEvents = events.filter((e) => e.status === "PENDING_DEPOSIT");
  const totalRevenue = events.reduce((sum, e) => sum + (e.eventPrice || 0), 0);

  const stats: StatItem[] = [
    {
      label: "Total eventos",
      value: events.length,
      icon: <CalendarDays className="w-4 h-4" />,
      color: "#3B82F6",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Eventos activos",
      value: activeEvents.length,
      icon: <Activity className="w-4 h-4" />,
      color: "#10B981",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Pendientes",
      value: pendingEvents.length,
      icon: <Clock className="w-4 h-4" />,
      color: "#F59E0B",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Ingresos totales",
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="w-4 h-4" />,
      color: "#8B5CF6",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat bg-base-100 border border-base-300/20 rounded-xl p-4 flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: stat.bgColor, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div>
            <div className="stat-value text-lg font-bold">{stat.value}</div>
            <div className="stat-title text-xs uppercase tracking-wider font-medium text-base-content/40">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
