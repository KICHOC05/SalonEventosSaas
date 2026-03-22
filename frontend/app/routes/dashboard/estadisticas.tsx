// app/routes/estadisticas.tsx
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
} from "lucide-react";

export function meta() {
  return buildMeta("Estadisticas", "Analisis y metricas de ventas y eventos");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    loadStats(selectedRange);
  }, [selectedRange, loadStats]);

  const handleRangeChange = (range: number) => {
    setSelectedRange(range);
  };

  // ── Chart data ──
  const dailyChartData = data
    ? {
      labels: data.dailySales.labels,
      datasets: [
        {
          label: "Ventas diarias",
          data: data.dailySales.data,
          backgroundColor: "#06b6d4",
          borderColor: "#06b6d4",
          borderWidth: 1,
        },
      ],
    }
    : null;

  const packageChartData =
    data && data.salesByPackage.length > 0
      ? {
        labels: data.salesByPackage.map((p) => p.name),
        datasets: [
          {
            data: data.salesByPackage.map((p) => p.quantitySold),
            backgroundColor: [
              "#06b6d4",
              "#8b5cf6",
              "#ec4899",
              "#f59e0b",
              "#10b981",
              "#ef4444",
            ],
            borderWidth: 0,
          },
        ],
      }
      : null;

  const topProductsChartData =
    data && data.topProducts.length > 0
      ? {
        labels: data.topProducts.map((p) => p.name),
        datasets: [
          {
            label: "Unidades vendidas",
            data: data.topProducts.map((p) => p.quantitySold),
            borderColor: "#ec4899",
            backgroundColor: "rgba(236,72,153,0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      }
      : null;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-base-content/60">
          Cargando estadísticas...
        </span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-error" />
        <p className="text-error">{error}</p>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => loadStats(selectedRange)}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const stats = data
    ? [
      {
        label: "Total ventas",
        value: formatCurrency(data.totalSales),
        icon: DollarSign,
        iconColor: "text-primary",
      },
      {
        label: "Órdenes cerradas",
        value: String(data.totalOrders),
        icon: ShoppingCart,
        iconColor: "text-secondary",
      },
      {
        label: "Ticket promedio",
        value: formatCurrency(data.averageTicket),
        icon: Receipt,
        iconColor: "text-accent",
      },
      {
        label: "Crecimiento",
        value: `${data.growthPercentage >= 0 ? "+" : ""}${data.growthPercentage.toFixed(1)}%`,
        icon: data.growthPercentage >= 0 ? TrendingUp : TrendingDown,
        iconColor:
          data.growthPercentage >= 0 ? "text-success" : "text-error",
        valueColor:
          data.growthPercentage >= 0 ? "text-success" : "text-error",
      },
    ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Estadísticas de Ventas</h2>
        {loading && (
          <Loader2 className="w-5 h-5 animate-spin text-base-content/30" />
        )}
      </div>

      {/* ═══ FILTROS ═══ */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Periodo</h3>
            {data && (
              <span className="text-sm text-base-content/50">
                ({data.dateFrom} → {data.dateTo})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {[7, 15, 30].map((range) => (
              <button
                key={range}
                className={`btn btn-sm ${selectedRange === range
                    ? "btn-primary"
                    : "btn-ghost"
                  }`}
                onClick={() => handleRangeChange(range)}
                disabled={loading}
              >
                {range} días
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RESUMEN ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, iconColor, valueColor }) => (
          <div key={label} className="card bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <p className="text-base-content/50 text-sm">{label}</p>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3
                className={`text-2xl font-bold ${valueColor ?? ""}`}
              >
                {value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ DESGLOSE POR MÉTODO DE PAGO ═══ */}
      {data && data.paymentBreakdown && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base mb-4">
              Desglose por método de pago
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Efectivo</div>
                <div className="stat-value text-lg text-success">
                  {formatCurrency(data.paymentBreakdown.cashTotal)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Tarjeta</div>
                <div className="stat-value text-lg text-info">
                  {formatCurrency(data.paymentBreakdown.cardTotal)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">Transferencia</div>
                <div className="stat-value text-lg text-warning">
                  {formatCurrency(
                    data.paymentBreakdown.transferTotal
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GRÁFICAS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Ventas por día</h3>
            <div className="chart-container">
              {isClient && dailyChartData ? (
                <Bar
                  data={dailyChartData}
                  options={darkGridOptions as any}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-base-content/30">
                  Sin datos
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">
              Ventas por paquete
            </h3>
            <div className="chart-container">
              {isClient && packageChartData ? (
                <Doughnut
                  data={packageChartData}
                  options={darkDoughnutOptions as any}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-base-content/30">
                  Sin datos de paquetes
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-base">
              Top productos vendidos
            </h3>
            <div className="chart-container">
              {isClient && topProductsChartData ? (
                <Line
                  data={topProductsChartData}
                  options={darkGridOptions as any}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-base-content/30">
                  Sin datos de productos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABLA TOP PRODUCTOS ═══ */}
      {data && data.topProducts.length > 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base mb-4">
              Top 10 Productos
            </h3>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th className="text-right">
                      Unidades vendidas
                    </th>
                    <th className="text-right">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product, idx) => (
                    <tr key={product.publicId} className="hover">
                      <td>
                        <span
                          className={`badge badge-sm ${idx < 3
                              ? "badge-primary"
                              : "badge-ghost"
                            }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="font-medium">
                        {product.name}
                      </td>
                      <td className="text-right">
                        {product.quantitySold}
                      </td>
                      <td className="text-right">
                        {formatCurrency(
                          product.totalRevenue
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}