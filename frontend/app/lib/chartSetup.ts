// app/lib/chartSetup.ts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Opciones base para tema oscuro
export const darkGridOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#94a3b8" } },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#94a3b8" },
    },
    x: {
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "#94a3b8" },
    },
  },
};

export const darkDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { color: "#94a3b8", padding: 20 },
    },
  },
};