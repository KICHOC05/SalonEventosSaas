// app/routes/dashboard.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
    DollarSign,
    CalendarCheck,
    TrendingUp,
    Package,
    ArrowUp,
    Users,
    ShieldCheck,
} from "lucide-react";
import { Line, Doughnut } from "react-chartjs-2";
import "~/lib/chartSetup";
import { darkGridOptions, darkDoughnutOptions } from "~/lib/chartSetup";
import { events } from "~/data/mockData";
import { useAuth } from "~/lib/auth"; // ← IMPORTAR

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

/* ── Badge de estado ── */
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; label: string }> = {
        active: { cls: "badge-success", label: "Activo" },
        pending: { cls: "badge-warning", label: "Pendiente" },
        cancelled: { cls: "badge-error", label: "Cancelado" },
    };
    const { cls, label } = map[status] ?? { cls: "badge-ghost", label: status };
    return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

/* ── Página Dashboard ── */
export default function Dashboard() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    // ═══════════════════════════════════════════
    // OBTENER ROL DEL USUARIO AUTENTICADO
    // ═══════════════════════════════════════════
    const { user, role, isAdmin, isManager } = useAuth();

    // Solo ADMIN y MANAGER pueden ver la sección de usuarios
    const canViewUsers = isAdmin || isManager;

    const salesData = {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
            {
                label: "Ventas ($)",
                data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
                borderColor: "#06b6d4",
                backgroundColor: "rgba(6,182,212,0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const packagesData = {
        labels: ["Cohete Básico", "Viaje Galáctico", "Misión Súper Space"],
        datasets: [
            {
                data: [30, 50, 20],
                backgroundColor: ["#06b6d4", "#8b5cf6", "#ec4899"],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* ═══════════════════════════════════════
                SALUDO CON ROL
            ═══════════════════════════════════════ */}
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
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Ventas del día"
                    value="$2,450"
                    icon={DollarSign}
                    iconBg="bg-primary/10"
                    iconColor="text-primary"
                    delay={100}
                    footer={
                        <span className="text-success flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" /> 12%{" "}
                            <span className="text-base-content/50">vs. ayer</span>
                        </span>
                    }
                />
                <StatCard
                    title="Eventos programados"
                    value="8"
                    icon={CalendarCheck}
                    iconBg="bg-secondary/10"
                    iconColor="text-secondary"
                    delay={200}
                    footer={<span className="text-base-content/50">Esta semana</span>}
                />
                <StatCard
                    title="Ingresos del mes"
                    value="$45,230"
                    icon={TrendingUp}
                    iconBg="bg-accent/10"
                    iconColor="text-accent"
                    delay={300}
                    footer={
                        <span className="text-success flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" /> 8%{" "}
                            <span className="text-base-content/50">vs. mes anterior</span>
                        </span>
                    }
                />
                <StatCard
                    title="Productos en inventario"
                    value="142"
                    icon={Package}
                    iconBg="bg-success/10"
                    iconColor="text-success"
                    delay={400}
                    footer={<span className="text-error">3 productos bajos</span>}
                />
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base">Ventas de la semana</h3>
                        <div className="chart-container">
                            {isClient && (
                                <Line data={salesData} options={darkGridOptions as any} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base">Paquetes más vendidos</h3>
                        <div className="chart-container">
                            {isClient && (
                                <Doughnut
                                    data={packagesData}
                                    options={darkDoughnutOptions as any}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                SECCIÓN DE USUARIOS - SOLO ADMIN / MANAGER
            ═══════════════════════════════════════════════════ */}
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

            {/* Eventos próximos */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-base">Eventos próximos</h3>
                        <Link to="/dashboard/eventos" className="link link-primary text-sm">
                            Ver todos
                        </Link>
                    </div>
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
                                {events.slice(0, 3).map((ev) => (
                                    <tr key={ev.id} className="hover">
                                        <td>{ev.date}</td>
                                        <td>{ev.client}</td>
                                        <td>{ev.package}</td>
                                        <td>{ev.children}</td>
                                        <td>
                                            <StatusBadge status={ev.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}