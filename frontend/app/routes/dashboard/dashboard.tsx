// app/routes/dashboard.tsx
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

/* ── Tarjeta de estadística ── */
function StatCard({
    title,
    value,
    icon: Icon,
    iconBg,
    iconColor,
    footer,
    delay,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    footer?: React.ReactNode;
    delay: number;
}) {
    return (
        <div
            className="card bg-base-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-slide-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="card-body p-5">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-sm text-base-content/50">{title}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                </div>
                {footer && <div className="text-sm">{footer}</div>}
            </div>
        </div>
    );
}

/* ── Formato de moneda ── */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/* ── Growth Badge ── */
function GrowthBadge({ value, label }: { value: number; label: string }) {
    const isPositive = value >= 0;
    return (
        <span className={`flex items-center gap-1 ${isPositive ? "text-success" : "text-error"}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(value).toFixed(1)}%{" "}
            <span className="text-base-content/50">{label}</span>
        </span>
    );
}

/* ── Página Dashboard ── */
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

    // Auto-refresh cada 5 minutos
    useEffect(() => {
        const interval = setInterval(loadDashboard, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadDashboard]);

    // ── Chart data ──
    const salesChartData = data
        ? {
              labels: data.salesChart.labels,
              datasets: [
                  {
                      label: "Ventas ($)",
                      data: data.salesChart.data,
                      borderColor: "#06b6d4",
                      backgroundColor: "rgba(6,182,212,0.1)",
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4,
                  },
              ],
          }
        : null;

    const packagesChartData = data && data.topPackages.length > 0
        ? {
              labels: data.topPackages.map((p) => p.name),
              datasets: [
                  {
                      data: data.topPackages.map((p) => p.quantitySold),
                      backgroundColor: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
                      borderWidth: 0,
                  },
              ],
          }
        : null;

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-base-content/60">Cargando dashboard...</span>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle className="w-12 h-12 text-error" />
                <p className="text-error">{error}</p>
                <button className="btn btn-primary btn-sm" onClick={loadDashboard}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ═══ SALUDO CON ROL ═══ */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Bienvenido, {user?.name || "Usuario"}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-sm text-base-content/60">
                            Rol: <span className="badge badge-sm badge-primary">{role}</span>
                        </span>
                        {user?.branchName && (
                            <span className="text-sm text-base-content/60">
                                • Sucursal: {user.branchName}
                            </span>
                        )}
                    </div>
                </div>
                {loading && (
                    <Loader2 className="w-5 h-5 animate-spin text-base-content/30" />
                )}
            </div>

            {/* ═══ TARJETAS DE ESTADÍSTICAS ═══ */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Ventas del día"
                        value={formatCurrency(data.salesToday)}
                        icon={DollarSign}
                        iconBg="bg-primary/10"
                        iconColor="text-primary"
                        delay={100}
                        footer={
                            <GrowthBadge value={data.salesTodayGrowth} label="vs. ayer" />
                        }
                    />
                    <StatCard
                        title="Eventos programados"
                        value={String(data.scheduledEventsCount)}
                        icon={CalendarCheck}
                        iconBg="bg-secondary/10"
                        iconColor="text-secondary"
                        delay={200}
                        footer={<span className="text-base-content/50">Próximamente</span>}
                    />
                    <StatCard
                        title="Ingresos del mes"
                        value={formatCurrency(data.monthlyRevenue)}
                        icon={TrendingUp}
                        iconBg="bg-accent/10"
                        iconColor="text-accent"
                        delay={300}
                        footer={
                            <GrowthBadge value={data.monthlyGrowth} label="vs. mes anterior" />
                        }
                    />
                    <StatCard
                        title="Productos en inventario"
                        value={String(data.inventory.totalProducts)}
                        icon={Package}
                        iconBg="bg-success/10"
                        iconColor="text-success"
                        delay={400}
                        footer={
                            data.inventory.lowStockCount > 0 ? (
                                <span className="text-error">
                                    {data.inventory.lowStockCount} producto{data.inventory.lowStockCount > 1 ? "s" : ""} con stock bajo
                                </span>
                            ) : (
                                <span className="text-success">Stock OK</span>
                            )
                        }
                    />
                </div>
            )}

            {/* ═══ GRÁFICAS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base">Ventas de la semana</h3>
                        <div className="chart-container">
                            {isClient && salesChartData && (
                                <Line data={salesChartData} options={darkGridOptions as any} />
                            )}
                            {(!salesChartData || !isClient) && (
                                <div className="flex items-center justify-center h-64 text-base-content/30">
                                    Sin datos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base">Paquetes más vendidos</h3>
                        <div className="chart-container">
                            {isClient && packagesChartData && (
                                <Doughnut
                                    data={packagesChartData}
                                    options={darkDoughnutOptions as any}
                                />
                            )}
                            {(!packagesChartData || !isClient) && (
                                <div className="flex items-center justify-center h-64 text-base-content/30">
                                    Sin datos de paquetes
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ PRODUCTOS CON STOCK BAJO ═══ */}
            {data && data.inventory.lowStockProducts.length > 0 && (
                <div className="card bg-base-100 shadow-sm border-l-4 border-warning">
                    <div className="card-body">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-5 h-5 text-warning" />
                            <h3 className="card-title text-base">Productos con stock bajo</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.inventory.lowStockProducts.map((p) => (
                                <div
                                    key={p.publicId}
                                    className="badge badge-warning badge-outline gap-1 p-3"
                                >
                                    {p.name}: {p.stock} uds
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ SECCIÓN DE USUARIOS - SOLO ADMIN / MANAGER ═══ */}
            {canViewUsers && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="card-title text-base">
                                    Gestión de Usuarios
                                </h3>
                            </div>
                            <Link
                                to="/dashboard/usuarios"
                                className="btn btn-primary btn-sm"
                            >
                                Administrar usuarios
                            </Link>
                        </div>
                        <p className="text-sm text-base-content/60">
                            {isAdmin
                                ? "Como administrador puedes crear, editar, desactivar y eliminar usuarios."
                                : "Como manager puedes ver la lista de usuarios de tu sucursal."}
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ EVENTOS PRÓXIMOS (placeholder) ═══ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-base">Eventos próximos</h3>
                        <Link to="/dashboard/eventos" className="link link-primary text-sm">
                            Ver todos
                        </Link>
                    </div>
                    {data && data.upcomingEvents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Paquete</th>
                                        <th>Niños</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.upcomingEvents.map((ev, idx) => (
                                        <tr key={idx} className="hover">
                                            <td>{ev.date}</td>
                                            <td>{ev.client}</td>
                                            <td>{ev.packageName}</td>
                                            <td>{ev.children}</td>
                                            <td>
                                                <span className="badge badge-sm badge-ghost">
                                                    {ev.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-base-content/40 text-center py-8">
                            No hay eventos próximos. El módulo de eventos estará disponible pronto.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}