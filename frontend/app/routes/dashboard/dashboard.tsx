import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Package,
  ArrowUp,
  ArrowDown,
  Users,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import "~/lib/chartSetup";
import { darkGridOptions, darkDoughnutOptions } from "~/lib/chartSetup";
import { useAuth } from "~/lib/auth";
import { buildMeta } from "~/lib/meta";
import { fetchDashboard, type DashboardData } from "~/lib/api";

export function meta() {
  return buildMeta("Dashboard", "Panel de control");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  footer,
  delay,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  footer?: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="card bg-base-100 shadow-sm border border-base-300/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group animate-slide-up overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="card-body p-5 relative">
        <div
          className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${gradient} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}
        />

        <div className="flex items-start justify-between relative">
          <div className="space-y-1">
            <p className="text-xs font-medium text-base-content/40 uppercase tracking-wider">
              {title}
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight">{value}</h3>
          </div>
          <div
            className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shadow-lg shadow-primary/10`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {footer && <div className="text-xs mt-3 pt-3 border-t border-base-300/30">{footer}</div>}
      </div>
    </div>
  );
}

function GrowthBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <span className="flex items-center gap-1">
      <span
        className={`
          inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold
          ${isPositive ? "bg-success/15 text-success" : "bg-error/15 text-error"}
        `}
      >
        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
      <span className="text-base-content/40">{label}</span>
    </span>
  );
}

function ChartCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300/30">
      <div className="card-body p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm">{title}</h3>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-base-content/20 gap-2">
      <Sparkles className="w-8 h-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: "badge-success",
    PENDING: "badge-warning",
    CANCELLED: "badge-error",
  };
  return (
    <span className={`badge badge-sm ${map[status] || "badge-ghost"} font-medium`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, role, isAdmin, isManager } = useAuth();
  const canViewUsers = isAdmin || isManager;

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const salesChartData = data
    ? {
        labels: data.salesChart.labels,
        datasets: [
          {
            label: "Ventas ($)",
            data: data.salesChart.data,
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6,182,212,0.08)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#06b6d4",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null;

  const packagesChartData =
    data && data.topPackages.length > 0
      ? {
          labels: data.topPackages.map((p) => p.name),
          datasets: [
            {
              data: data.topPackages.map((p) => p.quantitySold),
              backgroundColor: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
              borderWidth: 0,
              hoverOffset: 8,
            },
          ],
        }
      : null;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <p className="text-base-content/40 text-sm animate-pulse">Cargando dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-error" />
        </div>
        <p className="text-error font-medium">{error}</p>
        <button className="btn btn-primary btn-sm gap-2" onClick={loadDashboard}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold">
              Bienvenido, {user?.name?.split(" ")[0] || "Usuario"}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm text-base-content/50">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="badge badge-sm badge-primary badge-outline">{role}</span>
            </span>
            {user?.branchName && (
              <span className="text-sm text-base-content/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {user.branchName}
              </span>
            )}
          </div>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-base-content/20" />}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Ventas del día"
            value={formatCurrency(data.salesToday)}
            icon={DollarSign}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
            delay={0}
            footer={<GrowthBadge value={data.salesTodayGrowth} label="vs. ayer" />}
          />
          <StatCard
            title="Eventos programados"
            value={String(data.scheduledEventsCount)}
            icon={CalendarCheck}
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            delay={75}
            footer={<span className="text-base-content/40">Próximamente</span>}
          />
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(data.monthlyRevenue)}
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={150}
            footer={<GrowthBadge value={data.monthlyGrowth} label="vs. mes anterior" />}
          />
          <StatCard
            title="Productos en inventario"
            value={String(data.inventory.totalProducts)}
            icon={Package}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={225}
            footer={
              data.inventory.lowStockCount > 0 ? (
                <span className="text-error font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {data.inventory.lowStockCount} con stock bajo
                </span>
              ) : (
                <span className="text-success font-medium">✓ Stock OK</span>
              )
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Ventas de la semana">
            <div className="h-72 mt-2">
              {isClient && salesChartData ? (
                <Line
                  data={salesChartData}
                  options={{ ...darkGridOptions, maintainAspectRatio: false, responsive: true } as any}
                />
              ) : (
                <EmptyChart message="Sin datos de ventas" />
              )}
            </div>
          </ChartCard>
        </div>
        <ChartCard title="Paquetes más vendidos">
          <div className="h-72 flex items-center justify-center mt-2">
            {isClient && packagesChartData ? (
              <Doughnut
                data={packagesChartData}
                options={{ ...darkDoughnutOptions, maintainAspectRatio: false, responsive: true } as any}
              />
            ) : (
              <EmptyChart message="Sin datos" />
            )}
          </div>
        </ChartCard>
      </div>

      {data && data.inventory.lowStockProducts.length > 0 && (
        <div className="card bg-gradient-to-r from-warning/5 to-transparent border border-warning/20 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <h3 className="font-bold text-sm">Productos con stock bajo</h3>
              <span className="badge badge-warning badge-sm">{data.inventory.lowStockProducts.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.inventory.lowStockProducts.map((p) => (
                <div
                  key={p.publicId}
                  className="inline-flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="badge badge-warning badge-xs">{p.stock} uds</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {canViewUsers && (
        <div className="card bg-base-100 shadow-sm border border-base-300/30">
          <div className="card-body p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Gestión de Usuarios</h3>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    {isAdmin
                      ? "Crear, editar y gestionar accesos"
                      : "Ver usuarios de tu sucursal"}
                  </p>
                </div>
              </div>
              <Link to="/dashboard/usuarios" className="btn btn-primary btn-sm gap-1.5">
                Administrar
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <ChartCard
        title="Eventos próximos"
        action={
          <Link to="/dashboard/eventos" className="btn btn-ghost btn-xs text-primary gap-1">
            Ver todos <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        {data && data.upcomingEvents.length > 0 ? (
          <div className="overflow-x-auto -mx-5 mt-2">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs uppercase text-base-content/40">
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Paquete</th>
                  <th className="text-center">Niños</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.upcomingEvents.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-base-200/50 transition-colors">
                    <td className="font-medium text-sm">{ev.date}</td>
                    <td className="text-sm">{ev.client}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{ev.packageName}</span>
                    </td>
                    <td className="text-center font-bold text-sm">{ev.children}</td>
                    <td>
                      <StatusBadge status={ev.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart message="No hay eventos próximos" />
        )}
      </ChartCard>
    </div>
  );
}