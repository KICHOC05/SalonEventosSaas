import { useState, useEffect, useCallback } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "~/lib/chartSetup";
import { darkGridOptions, darkDoughnutOptions } from "~/lib/chartSetup";
import { buildMeta } from "~/lib/meta";
import { fetchStats, type StatsData } from "~/lib/api";
import {
    Loader2,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Receipt,
    BarChart3,
    Calendar,
    Sparkles,
    ArrowUp,
    ArrowDown,
    Banknote,
    CreditCard,
    Building,
} from "lucide-react";

export function meta() {
    return buildMeta("Estadísticas", "Análisis y métricas de ventas y eventos");
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

function MiniStatCard({
    label,
    value,
    icon: Icon,
    iconColor,
    bgColor,
    valueColor,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    valueColor?: string;
}) {
    return (
        <div className="card bg-base-100 shadow-sm border border-base-300/30 hover:shadow-md transition-shadow">
            <div className="card-body p-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-base-content/40 uppercase tracking-wider truncate">
                            {label}
                        </p>
                        <p className={`text-xl font-extrabold tracking-tight ${valueColor ?? ""}`}>{value}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaymentCard({
    icon: Icon,
    label,
    amount,
    color,
    percentage,
}: {
    icon: React.ElementType;
    label: string;
    amount: number;
    color: string;
    percentage: number;
}) {
    return (
        <div className="bg-base-200/50 rounded-xl p-4 space-y-3 border border-base-300/30">
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium text-base-content/60">{label}</span>
            </div>
            <p className={`text-xl font-extrabold ${color}`}>{formatCurrency(amount)}</p>
            <div className="w-full bg-base-300/50 rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${color.includes("success")
                        ? "bg-success"
                        : color.includes("info")
                            ? "bg-info"
                            : "bg-warning"
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-[10px] text-base-content/40 font-medium">{percentage.toFixed(1)}% del total</p>
        </div>
    );
}

function ChartCard({
    title,
    children,
    className = "",
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`card bg-base-100 shadow-sm border border-base-300/30 ${className}`}>
            <div className="card-body p-5">
                <h3 className="font-bold text-sm mb-2">{title}</h3>
                {children}
            </div>
        </div>
    );
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-base-content/20 gap-2 min-h-[200px]">
            <Sparkles className="w-8 h-8" />
            <p className="text-sm text-center">{message}</p>
        </div>
    );
}

export default function Estadisticas() {
    const [isClient, setIsClient] = useState(false);
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRange, setSelectedRange] = useState(7);

    const loadStats = useCallback(async (range: number) => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchStats(range);

            if (result) {
                result.totalSales = toNumber(result.totalSales);
                result.totalOrders = toNumber(result.totalOrders);
                result.averageTicket = toNumber(result.averageTicket);
                result.growthPercentage = toNumber(result.growthPercentage);

                if (result.dailySales?.data) {
                    result.dailySales.data = result.dailySales.data.map(toNumber);
                }
                if (result.paymentBreakdown) {
                    result.paymentBreakdown.cashTotal = toNumber(result.paymentBreakdown.cashTotal);
                    result.paymentBreakdown.cardTotal = toNumber(result.paymentBreakdown.cardTotal);
                    result.paymentBreakdown.transferTotal = toNumber(result.paymentBreakdown.transferTotal);
                }
                if (result.topProducts) {
                    result.topProducts = result.topProducts.map((p) => ({
                        ...p,
                        quantitySold: toNumber(p.quantitySold),
                        totalRevenue: toNumber(p.totalRevenue),
                    }));
                }
                if (result.salesByPackage) {
                    result.salesByPackage = result.salesByPackage.map((p) => ({
                        ...p,
                        quantitySold: toNumber(p.quantitySold),
                        totalRevenue: toNumber(p.totalRevenue),
                    }));
                }
            }

            setData(result);
        } catch (err: any) {
            setError(err.message || "Error al cargar estadísticas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        loadStats(selectedRange);
    }, [selectedRange, loadStats]);

    const dailyChartData =
        data?.dailySales?.labels?.length && data.dailySales.data?.length
            ? {
                labels: data.dailySales.labels,
                datasets: [
                    {
                        label: "Ventas ($)",
                        data: data.dailySales.data,
                        backgroundColor: "rgba(6, 182, 212, 0.6)",
                        borderColor: "#06b6d4",
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: "#06b6d4",
                    },
                ],
            }
            : null;

    const packageChartData =
        data?.salesByPackage?.length && data.salesByPackage.some((p) => p.quantitySold > 0)
            ? {
                labels: data.salesByPackage.map((p) => p.name),
                datasets: [
                    {
                        data: data.salesByPackage.map((p) => p.quantitySold),
                        backgroundColor: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"],
                        borderWidth: 0,
                        hoverOffset: 8,
                    },
                ],
            }
            : null;

    const topProductsChartData =
        data?.topProducts?.length && data.topProducts.some((p) => p.quantitySold > 0)
            ? {
                labels: data.topProducts.map((p) => p.name),
                datasets: [
                    {
                        label: "Unidades",
                        data: data.topProducts.map((p) => p.quantitySold),
                        borderColor: "#ec4899",
                        backgroundColor: "rgba(236, 72, 153, 0.08)",
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: "#ec4899",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        borderWidth: 2.5,
                    },
                ],
            }
            : null;

    const paymentMethodChartData = (() => {
        if (!data?.paymentBreakdown) return null;
        const { cashTotal, cardTotal, transferTotal } = data.paymentBreakdown;
        const total = cashTotal + cardTotal + transferTotal;
        if (total <= 0) return null;

        const items: { label: string; value: number; color: string }[] = [];
        if (cashTotal > 0) items.push({ label: "Efectivo", value: cashTotal, color: "#10b981" });
        if (cardTotal > 0) items.push({ label: "Tarjeta", value: cardTotal, color: "#06b6d4" });
        if (transferTotal > 0) items.push({ label: "Transferencia", value: transferTotal, color: "#f59e0b" });
        if (items.length === 0) return null;

        return {
            labels: items.map((i) => i.label),
            datasets: [
                {
                    data: items.map((i) => i.value),
                    backgroundColor: items.map((i) => i.color),
                    borderWidth: 0,
                    hoverOffset: 8,
                },
            ],
        };
    })();

    const barOptions = {
        ...darkGridOptions,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            ...(darkGridOptions as any)?.plugins,
            tooltip: {
                callbacks: {
                    label: (context: any) => ` ${formatCurrency(context.parsed.y)}`,
                },
            },
        },
        scales: {
            ...(darkGridOptions as any)?.scales,
            y: {
                ...(darkGridOptions as any)?.scales?.y,
                ticks: {
                    ...(darkGridOptions as any)?.scales?.y?.ticks,
                    callback: (value: any) => formatCurrency(value),
                },
            },
        },
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
                <p className="text-base-content/40 text-sm animate-pulse">Cargando estadísticas...</p>
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
                <button className="btn btn-primary btn-sm" onClick={() => loadStats(selectedRange)}>
                    Reintentar
                </button>
            </div>
        );
    }

    const growthValue = data?.growthPercentage ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Estadísticas</h2>
                        {data && (
                            <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {data.dateFrom} → {data.dateTo}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
                    {[
                        { days: 7, label: "7D" },
                        { days: 15, label: "15D" },
                        { days: 30, label: "30D" },
                    ].map(({ days, label }) => (
                        <button
                            key={days}
                            className={`btn btn-sm px-4 rounded-lg transition-all ${selectedRange === days
                                ? "btn-primary shadow-md"
                                : "btn-ghost text-base-content/50 hover:text-base-content"
                                }`}
                            onClick={() => setSelectedRange(days)}
                            disabled={loading}
                        >
                            {label}
                        </button>
                    ))}
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-base-content/30 ml-1" />}
                </div>
            </div>

            {error && data && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => loadStats(selectedRange)}>
                        Reintentar
                    </button>
                </div>
            )}

            {data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MiniStatCard
                        label="Total ventas"
                        value={formatCurrency(data.totalSales)}
                        icon={DollarSign}
                        iconColor="text-cyan-500"
                        bgColor="bg-cyan-500/10"
                    />
                    <MiniStatCard
                        label="Órdenes cerradas"
                        value={String(data.totalOrders)}
                        icon={ShoppingCart}
                        iconColor="text-violet-500"
                        bgColor="bg-violet-500/10"
                    />
                    <MiniStatCard
                        label="Ticket promedio"
                        value={formatCurrency(data.averageTicket)}
                        icon={Receipt}
                        iconColor="text-pink-500"
                        bgColor="bg-pink-500/10"
                    />
                    <MiniStatCard
                        label="Crecimiento"
                        value={`${growthValue >= 0 ? "+" : ""}${growthValue.toFixed(1)}%`}
                        icon={growthValue >= 0 ? TrendingUp : TrendingDown}
                        iconColor={growthValue >= 0 ? "text-emerald-500" : "text-red-500"}
                        bgColor={growthValue >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
                        valueColor={growthValue >= 0 ? "text-success" : "text-error"}
                    />
                </div>
            )}

            {data?.paymentBreakdown && (() => {
                const { cashTotal, cardTotal, transferTotal } = data.paymentBreakdown;
                const total = cashTotal + cardTotal + transferTotal;
                if (total <= 0) return null;

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <PaymentCard
                            icon={Banknote}
                            label="Efectivo"
                            amount={cashTotal}
                            color="text-success"
                            percentage={total > 0 ? (cashTotal / total) * 100 : 0}
                        />
                        <PaymentCard
                            icon={CreditCard}
                            label="Tarjeta"
                            amount={cardTotal}
                            color="text-info"
                            percentage={total > 0 ? (cardTotal / total) * 100 : 0}
                        />
                        <PaymentCard
                            icon={Building}
                            label="Transferencia"
                            amount={transferTotal}
                            color="text-warning"
                            percentage={total > 0 ? (transferTotal / total) * 100 : 0}
                        />
                    </div>
                );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Ventas por día">
                    <div className="h-72">
                        {isClient && dailyChartData ? (
                            <Bar data={dailyChartData} options={barOptions as any} />
                        ) : (
                            <EmptyChart message="Sin datos de ventas en este periodo" />
                        )}
                    </div>
                </ChartCard>

                <ChartCard title="Métodos de pago">
                    <div className="h-72 flex items-center justify-center">
                        {isClient && paymentMethodChartData ? (
                            <Doughnut
                                data={paymentMethodChartData}
                                options={{ ...darkDoughnutOptions, maintainAspectRatio: false, responsive: true } as any}
                            />
                        ) : (
                            <EmptyChart message="Sin datos de pagos" />
                        )}
                    </div>
                </ChartCard>

                <ChartCard title="Ventas por paquete">
                    <div className="h-72 flex items-center justify-center">
                        {isClient && packageChartData ? (
                            <Doughnut
                                data={packageChartData}
                                options={{ ...darkDoughnutOptions, maintainAspectRatio: false, responsive: true } as any}
                            />
                        ) : (
                            <EmptyChart message="Sin datos de paquetes" />
                        )}
                    </div>
                </ChartCard>

                <ChartCard title="Top productos vendidos">
                    <div className="h-72">
                        {isClient && topProductsChartData ? (
                            <Line
                                data={topProductsChartData}
                                options={{ ...darkGridOptions, maintainAspectRatio: false, responsive: true } as any}
                            />
                        ) : (
                            <EmptyChart message="Sin datos de productos" />
                        )}
                    </div>
                </ChartCard>
            </div>

            {data?.topProducts?.length ? (
                <div className="card bg-base-100 shadow-sm border border-base-300/30">
                    <div className="card-body p-5">
                        <h3 className="font-bold text-sm mb-4">Top 10 Productos</h3>
                        <div className="overflow-x-auto -mx-5">
                            <table className="table table-sm">
                                <thead>
                                    <tr className="text-[11px] uppercase text-base-content/40">
                                        <th className="w-12">#</th>
                                        <th>Producto</th>
                                        <th className="text-right">Unidades</th>
                                        <th className="text-right">Ingresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topProducts.map((product, idx) => {
                                        const maxQty = Math.max(...data.topProducts.map((p) => p.quantitySold));
                                        const barWidth = maxQty > 0 ? (product.quantitySold / maxQty) * 100 : 0;

                                        return (
                                            <tr key={product.publicId} className="hover:bg-base-200/50 transition-colors">
                                                <td>
                                                    <span
                                                        className={`
                              inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold
                              ${idx === 0
                                                                ? "bg-amber-500/15 text-amber-500"
                                                                : idx === 1
                                                                    ? "bg-gray-400/15 text-gray-400"
                                                                    : idx === 2
                                                                        ? "bg-orange-600/15 text-orange-600"
                                                                        : "bg-base-200 text-base-content/40"
                                                            }
                            `}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm">{product.name}</p>
                                                        <div className="w-full max-w-[120px] bg-base-300/30 rounded-full h-1">
                                                            <div
                                                                className="h-1 rounded-full bg-primary/50 transition-all duration-500"
                                                                style={{ width: `${barWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right font-bold text-sm">{product.quantitySold}</td>
                                                <td className="text-right font-semibold text-sm text-primary">
                                                    {formatCurrency(product.totalRevenue)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}