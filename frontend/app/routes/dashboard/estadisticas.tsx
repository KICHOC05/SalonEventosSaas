// app/routes/estadisticas.tsx
import { useState, useEffect } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "~/lib/chartSetup";
import { darkGridOptions, darkDoughnutOptions } from "~/lib/chartSetup";

export default function Estadisticas() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const dailyData = {
    labels: Array.from({ length: 15 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Ventas diarias",
        data: [1200, 1900, 3000, 5000, 2000, 3000, 4500, 3200, 2800, 4100, 3600, 4200, 3900, 4800, 5200],
        backgroundColor: "#06b6d4",
      },
    ],
  };

  const packageData = {
    labels: ["Cohete Básico", "Viaje Galáctico", "Misión Súper Space"],
    datasets: [
      {
        data: [30, 50, 20],
        backgroundColor: ["#06b6d4", "#8b5cf6", "#ec4899"],
        borderWidth: 0,
      },
    ],
  };

  const productData = {
    labels: ["Pizza", "Hot dogs", "Nuggets", "Refrescos", "Pastel", "Cupcakes", "Galletas", "Jugos", "Helado", "Palomitas"],
    datasets: [
      {
        label: "Unidades vendidas",
        data: [150, 120, 95, 200, 45, 80, 110, 90, 75, 60],
        borderColor: "#ec4899",
        backgroundColor: "rgba(236,72,153,0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const stats = [
    { label: "Total ventas", value: "$45,230" },
    { label: "Eventos realizados", value: "124" },
    { label: "Ticket promedio", value: "$1,850" },
    { label: "Crecimiento mensual", value: "+8.2%", color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Estadísticas de Ventas</h2>

      {/* Filtros */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row items-center justify-between flex-wrap gap-4">
          <h3 className="font-semibold">Filtros</h3>
          <div className="flex gap-3">
            <select className="select select-bordered select-sm">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
              <option>Este mes</option>
              <option>Mes anterior</option>
            </select>
            <button className="btn btn-primary btn-sm">Aplicar</button>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Ventas por día</h3>
            <div className="chart-container">
              {isClient && <Bar data={dailyData} options={darkGridOptions as any} />}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Ventas por paquete</h3>
            <div className="chart-container">
              {isClient && <Doughnut data={packageData} options={darkDoughnutOptions as any} />}
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title text-base">Ventas por producto (top 10)</h3>
            <div className="chart-container">
              {isClient && <Line data={productData} options={darkGridOptions as any} />}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <p className="text-base-content/50">{label}</p>
              <h3 className={`text-2xl font-bold ${color ?? ""}`}>{value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}