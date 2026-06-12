import { useEffect, useState, useCallback, useRef } from "react";
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    TimerReset,
    Baby,
    Zap,
    X,
    User,
    Calendar,
    Timer,
    Hourglass,
} from "lucide-react";

import {
    fetchActiveSessions,
    fetchTimerDashboard,
    fetchTimerHistory,
    type ActiveSessionResponse,
    type TimerDashboardResponse,
    type TimerHistoryResponse,
    type PageResponse,
} from "~/lib/api";

import { buildMeta } from "~/lib/meta";
import TimerRing from "~/components/TimerRing";
import { useNotifications } from "~/context/NotificationContext";

export function meta() {
    return buildMeta(
        "Timers",
        "Monitoreo de sesiones activas"
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
}) {
    return (
        <div className="card bg-base-100 shadow-sm border border-base-300/30">
            <div className="card-body p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-base-content/40">
                            {title}
                        </p>

                        <h3 className="text-3xl font-extrabold mt-1">
                            {value}
                        </h3>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRemainingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getCardStyle(timer: ActiveSessionResponse): string {
    if (timer.expired) return "border-error";
    if (timer.expiringSoon) return "border-warning animate-pulse";
    return "border-success";
}

function getProgressColor(timer: ActiveSessionResponse): string {
    if (timer.expired) return "bg-error";
    if (timer.expiringSoon) return "bg-warning";
    return "bg-success";
}

function getBadgeConfig(timer: ActiveSessionResponse): { label: string; color: string; icon: React.ElementType } {
    if (timer.expired) {
        return { label: "Finalizada", color: "bg-error/15 text-error border-error/20", icon: CheckCircle2 };
    }
    if (timer.expiringSoon) {
        return { label: "Expira pronto", color: "bg-warning/15 text-warning border-warning/20", icon: AlertTriangle };
    }
    return { label: "Activa", color: "bg-success/15 text-success border-success/20", icon: Zap };
}

function getHeaderConfig(timer: ActiveSessionResponse) {
    if (timer.expired) {
        return {
            icon: CheckCircle2,
            bg: "bg-error/15",
            text: "text-error",
            label: "Sesión finalizada"
        };
    }
    if (timer.expiringSoon) {
        return {
            icon: AlertTriangle,
            bg: "bg-warning/15",
            text: "text-warning",
            label: "Expira pronto"
        };
    }
    return {
        icon: Timer,
        bg: "bg-success/15",
        text: "text-success",
        label: "Sesión activa"
    };
}

function TimerCard({
    timer,
    onClick,
}: {
    timer: ActiveSessionResponse;
    onClick: () => void;
}) {
    const badgeConfig = getBadgeConfig(timer);
    const BadgeIcon = badgeConfig.icon;

    return (
        <div 
            className={`card bg-base-100 shadow-sm border hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] ${getCardStyle(timer)}`}
            onClick={onClick}
        >
            <div className="card-body items-center text-center">

                <TimerRing
                    percentage={timer.progressPercent}
                    minutesRemaining={timer.remainingMinutes}
                    status={timer.expired ? "FINISHED" : timer.expiringSoon ? "EXPIRING" : "RUNNING"}
                />

                <div className="text-3xl font-extrabold tabular-nums mt-2">
                    {formatTime(timer.remainingSeconds)}
                </div>

                <div className="space-y-2 mt-3 w-full">
                    <div className="flex items-center justify-center gap-1 font-bold text-lg">
                        <Baby className="w-4 h-4" />
                        {timer.childName || "Juego Libre"}
                    </div>

                    <div className="badge badge-outline">
                        {timer.productName}
                    </div>

                    <div className="w-full bg-base-300 rounded-full h-3 mt-2">
                        <div
                            className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(timer)}`}
                            style={{
                                width: `${timer.progressPercent}%`
                            }}
                        />
                    </div>

                    <div className="text-xs text-base-content/50 mt-2">
                        Finaliza:
                    </div>

                    <div className="font-semibold">
                        {new Date(timer.sessionEnd).toLocaleTimeString(
                            "es-MX",
                            {
                                hour: "2-digit",
                                minute: "2-digit",
                            }
                        )}
                    </div>

                    <div className="mt-2">
                        <span className={`badge gap-1 ${badgeConfig.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badgeConfig.label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TimersPage() {

    const [timers, setTimers] = useState<ActiveSessionResponse[]>([]);
    const [dashboard, setDashboard] = useState<TimerDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTimerId, setSelectedTimerId] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());
    const isFetchingRef = useRef(false);

    // Refs para evitar notificaciones duplicadas
    const warned5MinutesRef = useRef<Set<string>>(new Set());
    const warned1MinuteRef = useRef<Set<string>>(new Set());
    const finishedRef = useRef<Set<string>>(new Set());

    // Estado para las pestañas
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
    
    // Estado para el historial
    const [history, setHistory] = useState<TimerHistoryResponse[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const [historyStatus, setHistoryStatus] = useState("");
    const [historyDate, setHistoryDate] = useState("");
    const [historyPage, setHistoryPage] = useState(0);
    const [historyTotalPages, setHistoryTotalPages] = useState(0);

    const { addNotification } = useNotifications();

    // Selector derivado para obtener el timer más reciente
    const selectedTimer = timers.find(
        timer => timer.itemPublicId === selectedTimerId
    ) ?? null;

    // Contador local para actualización fluida del modal
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Calcular tiempo restante en vivo para el modal
    const liveRemainingSeconds = selectedTimer
        ? Math.max(0, Math.floor((new Date(selectedTimer.sessionEnd).getTime() - now) / 1000))
        : 0;

    const loadData = useCallback(async () => {
        // Evitar múltiples llamadas simultáneas
        if (isFetchingRef.current) return;
        
        isFetchingRef.current = true;
        
        try {
            const [activeSessions, dashboardData] = await Promise.all([
                fetchActiveSessions(),
                fetchTimerDashboard(),
            ]);

            setTimers(activeSessions);
            setDashboard(dashboardData);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Error al cargar timers");
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    // Cargar historial
    const loadHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const response = await fetchTimerHistory(
                historyPage,
                10,
                historySearch,
                historyStatus,
                historyDate || undefined
            );
            setHistory(response.content);
            setHistoryTotalPages(response.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al cargar historial");
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPage, historySearch, historyStatus, historyDate]);

    useEffect(() => {
        loadData();

        // Cambiar intervalo a 1000 ms
        const interval = setInterval(loadData, 1000);

        return () => clearInterval(interval);
    }, [loadData]);

    // Monitorear timers para notificaciones
    useEffect(() => {
        timers.forEach(timer => {
            const id = timer.itemPublicId;
            const remaining = timer.remainingSeconds;

            // MENOS DE 5 MINUTOS (entre 1 minuto y 5 minutos)
            if (remaining > 60 && remaining <= 300 && !warned5MinutesRef.current.has(id)) {
                warned5MinutesRef.current.add(id);
                addNotification({
                    title: "Timer próximo a finalizar",
                    message: `${timer.childName} termina en menos de 5 minutos`,
                    type: "warning"
                });
            }

            // MENOS DE 1 MINUTO (entre 1 segundo y 1 minuto)
            if (remaining > 0 && remaining <= 60 && !warned1MinuteRef.current.has(id)) {
                warned1MinuteRef.current.add(id);
                addNotification({
                    title: "Último minuto",
                    message: `${timer.childName} termina en menos de 1 minuto`,
                    type: "warning"
                });
            }

            // FINALIZADO (0 segundos o menos)
            if (remaining <= 0 && !finishedRef.current.has(id)) {
                finishedRef.current.add(id);
                addNotification({
                    title: "Sesión finalizada",
                    message: `${timer.childName} ha finalizado`,
                    type: "success"
                });
            }
        });
    }, [timers, addNotification]);

    // Cargar historial cuando se activa la pestaña
    useEffect(() => {
        if (activeTab === "HISTORY") {
            loadHistory();
        }
    }, [activeTab, loadHistory]);

    if (loading && !dashboard) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-base-content/40">
                    Cargando timers...
                </p>
            </div>
        );
    }

    if (error && !dashboard) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <AlertTriangle className="w-10 h-10 text-error" />

                <p className="text-error">
                    {error}
                </p>

                <button
                    className="btn btn-primary"
                    onClick={loadData}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            <div>
                <h1 className="text-2xl font-extrabold">
                    Timers
                </h1>

                <p className="text-sm text-base-content/50">
                    Monitoreo de sesiones de juego e historial
                </p>
            </div>

            {dashboard && activeTab === "ACTIVE" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <StatCard
                        title="Sesiones activas"
                        value={dashboard.activeSessions}
                        icon={Clock}
                    />

                    <StatCard
                        title="Expiran pronto"
                        value={dashboard.expiringSoon}
                        icon={AlertTriangle}
                    />

                    <StatCard
                        title="Finalizadas hoy"
                        value={dashboard.finishedToday}
                        icon={CheckCircle2}
                    />

                </div>
            )}

            {/* Tabs */}
            <div className="tabs tabs-boxed">
                <button
                    className={`tab ${activeTab === "ACTIVE" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("ACTIVE")}
                >
                    Timers Activos
                </button>
                <button
                    className={`tab ${activeTab === "HISTORY" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("HISTORY")}
                >
                    Historial
                </button>
            </div>

            {/* Tab Activos */}
            {activeTab === "ACTIVE" && (
                <>
                    {timers.length === 0 ? (
                        <div className="card bg-base-100 shadow-sm border border-base-300/30">
                            <div className="card-body py-20 text-center">

                                <Clock className="w-12 h-12 mx-auto text-base-content/20" />

                                <h3 className="font-bold mt-3">
                                    No hay sesiones activas
                                </h3>

                                <p className="text-base-content/40">
                                    Las nuevas sesiones aparecerán aquí automáticamente.
                                </p>

                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                            {timers.map((timer) => (
                                <TimerCard
                                    key={timer.itemPublicId}
                                    timer={timer}
                                    onClick={() => setSelectedTimerId(timer.itemPublicId)}
                                />
                            ))}

                        </div>
                    )}
                </>
            )}

            {/* Tab Historial */}
            {activeTab === "HISTORY" && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            className="input input-bordered w-full"
                            placeholder="Buscar cliente o niño..."
                            value={historySearch}
                            onChange={(e) => {
                                setHistorySearch(e.target.value);
                                setHistoryPage(0);
                            }}
                        />

                        <select
                            className="select select-bordered"
                            value={historyStatus}
                            onChange={(e) => {
                                setHistoryStatus(e.target.value);
                                setHistoryPage(0);
                            }}
                        >
                            <option value="">
                                Todos
                            </option>
                            <option value="ACTIVE">
                                Activos
                            </option>
                            <option value="FINISHED">
                                Finalizados
                            </option>
                            <option value="CANCELLED">
                                Cancelados
                            </option>
                        </select>

                        <input
                            type="date"
                            className="input input-bordered"
                            value={historyDate}
                            onChange={(e) => {
                                setHistoryDate(e.target.value);
                                setHistoryPage(0);
                            }}
                        />
                    </div>

                    {historyLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-base-content/40 text-sm">
                                Cargando historial...
                            </p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="card bg-base-100 shadow-sm border border-base-300/30">
                            <div className="card-body py-20 text-center">
                                <Clock className="w-12 h-12 mx-auto text-base-content/20" />
                                <h3 className="font-bold mt-3">
                                    No hay registros en el historial
                                </h3>
                                <p className="text-base-content/40">
                                    Las sesiones finalizadas aparecerán aquí.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto card bg-base-100 border border-base-300">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Niño</th>
                                            <th>Cliente</th>
                                            <th>Producto</th>
                                            <th>Inicio</th>
                                            <th>Fin</th>
                                            <th>Duración</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item) => (
                                            <tr key={item.itemPublicId}>
                                                <td>
                                                    {item.childName}
                                                </td>
                                                <td>
                                                    {item.customerName || "Consumidor final"}
                                                </td>
                                                <td>
                                                    {item.productName}
                                                </td>
                                                <td>
                                                    {new Date(item.sessionStart).toLocaleString("es-MX")}
                                                </td>
                                                <td>
                                                    {new Date(item.sessionEnd).toLocaleString("es-MX")}
                                                </td>
                                                <td>
                                                    {item.durationMinutes} min
                                                </td>
                                                <td>
                                                    <div className={`badge ${
                                                        item.status === "FINISHED" 
                                                            ? "badge-error" 
                                                            : item.status === "ACTIVE" 
                                                                ? "badge-info" 
                                                                : "badge-error"
                                                    }`}>
                                                        {item.status === "FINISHED" 
                                                            ? "Finalizado" 
                                                            : item.status === "ACTIVE" 
                                                                ? "Activo" 
                                                                : "Cancelado"}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="join">
                                <button
                                    className="join-item btn"
                                    disabled={historyPage === 0}
                                    onClick={() => setHistoryPage(historyPage - 1)}
                                >
                                    Anterior
                                </button>
                                <button className="join-item btn btn-disabled">
                                    Página {historyPage + 1} de {historyTotalPages}
                                </button>
                                <button
                                    className="join-item btn"
                                    disabled={historyPage + 1 >= historyTotalPages}
                                    onClick={() => setHistoryPage(historyPage + 1)}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Modal de detalle */}
            {selectedTimer && (
                <dialog className="modal modal-open" onClick={() => setSelectedTimerId(null)}>
                    <div className="modal-box rounded-2xl max-w-md p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header del modal rediseñado - sin TimerRing */}
                        {(() => {
                            const headerConfig = getHeaderConfig(selectedTimer);
                            const HeaderIcon = headerConfig.icon;
                            
                            return (
                                <div className={`p-4 bg-gradient-to-r ${
                                    selectedTimer.expired 
                                        ? "from-error/10 to-error/5 border-error/20" 
                                        : selectedTimer.expiringSoon 
                                            ? "from-warning/10 to-warning/5 border-warning/20"
                                            : "from-success/10 to-success/5 border-success/20"
                                } border-b`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${headerConfig.bg}`}>
                                                <HeaderIcon className={`w-5 h-5 ${headerConfig.text}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-extrabold">Detalle de Sesión</h3>
                                                <p className="text-[10px] text-base-content/40">{headerConfig.label}</p>
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-ghost btn-xs btn-circle"
                                            onClick={() => setSelectedTimerId(null)}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Contenido del modal */}
                        <div className="p-5 space-y-4">
                            {/* Nombre del niño y cliente */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-base-200/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                        <Baby className="w-3 h-3" />
                                        Niño(a)
                                    </div>
                                    <p className="font-bold text-base">
                                        {selectedTimer.childName || "Juego Libre"}
                                    </p>
                                </div>
                                <div className="bg-base-200/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                        <User className="w-3 h-3" />
                                        Cliente
                                    </div>
                                    <p className="font-bold text-base">
                                        {selectedTimer.customerName || "Consumidor final"}
                                    </p>
                                </div>
                            </div>

                            {/* Producto */}
                            <div className="bg-base-200/50 rounded-xl p-3">
                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                    <Zap className="w-3 h-3" />
                                    Producto
                                </div>
                                <p className="font-semibold">
                                    {selectedTimer.productName}
                                </p>
                            </div>

                            {/* Tiempo restante grande */}
                            <div className="text-center py-3">
                                <div className="text-5xl font-extrabold tabular-nums text-primary">
                                    {formatRemainingTime(liveRemainingSeconds)}
                                </div>
                                <p className="text-xs text-base-content/50 mt-1">Tiempo restante</p>
                            </div>

                            {/* Barra de progreso */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span>Progreso</span>
                                    <span className="font-mono">{Math.round(selectedTimer.progressPercent)}%</span>
                                </div>
                                <div className="w-full bg-base-300 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(selectedTimer)}`}
                                        style={{
                                            width: `${selectedTimer.progressPercent}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Horarios y duración */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-base-200/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                        <Calendar className="w-3 h-3" />
                                        Inicio
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {new Date(selectedTimer.sessionStart).toLocaleTimeString("es-MX", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </p>
                                    <p className="text-[10px] text-base-content/40">
                                        {new Date(selectedTimer.sessionStart).toLocaleDateString("es-MX")}
                                    </p>
                                </div>
                                <div className="bg-base-200/50 rounded-xl p-3">
                                    <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                        <Timer className="w-3 h-3" />
                                        Finalización
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {new Date(selectedTimer.sessionEnd).toLocaleTimeString("es-MX", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                    </p>
                                    <p className="text-[10px] text-base-content/40">
                                        {new Date(selectedTimer.sessionEnd).toLocaleDateString("es-MX")}
                                    </p>
                                </div>
                            </div>

                            {/* Duración total */}
                            <div className="bg-base-200/50 rounded-xl p-3">
                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                    <Hourglass className="w-3 h-3" />
                                    Duración total
                                </div>
                                <p className="font-semibold">
                                    {selectedTimer.durationMinutes} minutos
                                </p>
                            </div>

                            {/* Estado badge */}
                            <div className="flex justify-center pt-2">
                                <span className={`badge gap-2 px-3 py-3 text-sm ${getBadgeConfig(selectedTimer).color}`}>
                                    {(() => {
                                        const Icon = getBadgeConfig(selectedTimer).icon;
                                        return <Icon className="w-4 h-4" />;
                                    })()}
                                    {getBadgeConfig(selectedTimer).label}
                                </span>
                            </div>
                        </div>

                        {/* Footer del modal */}
                        <div className="p-5 pt-0">
                            <button 
                                className="btn btn-primary w-full rounded-xl gap-2"
                                onClick={() => setSelectedTimerId(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/50 backdrop-blur-sm" />
                </dialog>
            )}
        </div>
    );
}