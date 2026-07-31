import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertTriangle, FileText, Download, BarChart3 } from "lucide-react";
import { getSalesReportTicket } from "~/lib/api";
import { buildMeta } from "~/lib/meta";
import { useAuth } from "~/lib/auth";

export function meta() {
    return buildMeta("Reportes de Venta", "Reportes administrativos de ventas");
}

export default function Reportes() {
    const [reportPeriod, setReportPeriod] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("WEEKLY");
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin, isManager, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAdmin && !isManager) {
            navigate("/dashboard/pos", { replace: true });
        }
    }, [isLoading, isAdmin, isManager, navigate]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-base-content/40 text-sm">Cargando...</p>
            </div>
        );
    }

    if (!isAdmin && !isManager) return null;

    async function handleGenerateReport() {
        setReportLoading(true);
        setError(null);
        try {
            const html = await getSalesReportTicket(reportPeriod);
            const win = window.open("", "_blank", "width=420,height=800,scrollbars=yes,resizable=yes");
            if (win) {
                win.document.write(html);
                win.document.close();
                win.focus();
            } else {
                setError("No se pudo abrir la ventana. Revisa el bloqueador de popups.");
            }
        } catch (err: any) {
            setError(err.message || "Error al generar reporte");
        } finally {
            setReportLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Reportes de Venta</h2>
                        <p className="text-xs text-base-content/40">Reportes administrativos imprimibles</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>
                        Cerrar
                    </button>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300/30">
                <div className="card-body p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Generar ticket de ventas</h3>
                            <p className="text-xs text-base-content/40">
                                Genera un ticket imprimible con ventas por periodo, productos m&aacute;s vendidos y desglose de pagos.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
                            {[
                                { value: "WEEKLY" as const, label: "Semanal" },
                                { value: "BIWEEKLY" as const, label: "Quincenal" },
                                { value: "MONTHLY" as const, label: "Mensual" },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={`btn btn-sm px-4 rounded-lg transition-all ${reportPeriod === value
                                        ? "btn-warning shadow-md"
                                        : "btn-ghost text-base-content/50 hover:text-base-content"
                                        }`}
                                    onClick={() => setReportPeriod(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn-warning btn-sm gap-2 rounded-xl shadow-md"
                            onClick={handleGenerateReport}
                            disabled={reportLoading}
                        >
                            {reportLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Generar reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
