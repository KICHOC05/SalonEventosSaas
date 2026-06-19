import { useState } from "react";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Ban,
  CheckCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { buildMeta } from "~/lib/meta";
import { getEventReport, fetchBranches } from "~/lib/api";
import type { EventReportResponse, BranchResponse } from "~/lib/api";
import { useEffect } from "react";

export function meta() {
  return buildMeta("Reportes de Eventos", "Métricas y reportes de eventos");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(amount);
}

export default function ReportesEventos() {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState("");
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [report, setReport] = useState<EventReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBranches().then(setBranches).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true); setError("");
    try {
      const data = await getEventReport(
        startDate || undefined,
        endDate || undefined,
        (status as any) || undefined,
        branchId
      );
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener reporte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold">Reportes de Eventos</h2>
          <p className="text-xs text-base-content/40">Métricas y estadísticas de eventos</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30">
        <div className="card-body p-5">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-xs">Fecha inicio</legend>
              <input type="date" className="input input-bordered w-full" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-xs">Fecha fin</legend>
              <input type="date" className="input input-bordered w-full" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-xs">Estado</legend>
              <select className="select select-bordered w-full" value={status}
                onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="PARTIAL">Apartado</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="COMPLETED">Completado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-xs">Sucursal</legend>
              <select className="select select-bordered w-full" value={branchId ?? ""}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Todas</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </fieldset>
            <div className="flex items-end">
              <button className="btn btn-primary w-full gap-2" onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Consultar
              </button>
            </div>
          </div>
          {error && <p className="text-error text-xs mt-2">{error}</p>}
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total eventos", value: report.totalEvents, icon: Calendar, color: "text-primary bg-primary/10" },
              { label: "Confirmados", value: report.confirmedEvents, icon: CheckCircle, color: "text-success bg-success/10" },
              { label: "Cancelados", value: report.cancelledEvents, icon: Ban, color: "text-error bg-error/10" },
              { label: "Saldo pendiente", value: formatCurrency(report.pendingBalance), icon: DollarSign, color: "text-warning bg-warning/10" },
              { label: "Ingresos", value: formatCurrency(report.revenue), icon: TrendingUp, color: "text-accent bg-accent/10" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 bg-base-100 rounded-xl p-3 border border-base-300/30">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-base-content/40 uppercase font-medium">{label}</p>
                  <p className="text-lg font-extrabold leading-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300/30">
            <div className="card-body p-5">
              <h3 className="font-bold text-sm mb-4">Resumen del período</h3>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/40">
                      <th>Métrica</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-base-200/50">
                      <td className="font-medium">Total de eventos</td>
                      <td className="text-right font-bold">{report.totalEvents}</td>
                    </tr>
                    <tr className="hover:bg-base-200/50">
                      <td className="font-medium">Eventos confirmados/completados</td>
                      <td className="text-right font-bold text-success">{report.confirmedEvents}</td>
                    </tr>
                    <tr className="hover:bg-base-200/50">
                      <td className="font-medium">Eventos cancelados</td>
                      <td className="text-right font-bold text-error">{report.cancelledEvents}</td>
                    </tr>
                    <tr className="hover:bg-base-200/50">
                      <td className="font-medium">Saldo pendiente total</td>
                      <td className="text-right font-bold text-warning">{formatCurrency(report.pendingBalance)}</td>
                    </tr>
                    <tr className="hover:bg-base-200/50">
                      <td className="font-medium">Ingresos del período</td>
                      <td className="text-right font-bold text-accent">{formatCurrency(report.revenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
