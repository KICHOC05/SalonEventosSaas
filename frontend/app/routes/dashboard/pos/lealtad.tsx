import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2, AlertTriangle, Gift, Save, Sparkles } from "lucide-react";
import {
    fetchLoyaltyProgram,
    updateLoyaltyProgram,
    fetchProducts,
    type LoyaltyProgramResponse,
    type ProductResponse,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";
import { useAuth } from "~/lib/auth";

export function meta() {
    return buildMeta("Programa de Lealtad", "Configuración del programa de cliente frecuente");
}

export default function Lealtad() {
    const [program, setProgram] = useState<LoyaltyProgramResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [serviceProducts, setServiceProducts] = useState<ProductResponse[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [qualifyingProductId, setQualifyingProductId] = useState("");
    const [requiredPurchases, setRequiredPurchases] = useState(5);
    const [rewardQuantity, setRewardQuantity] = useState(1);
    const [rewardDescription, setRewardDescription] = useState("");
    const [active, setActive] = useState(false);

    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate("/dashboard/pos", { replace: true });
        }
    }, [isLoading, isAdmin, navigate]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [prog, prods] = await Promise.all([
                fetchLoyaltyProgram(),
                fetchProducts(),
            ]);
            setProgram(prog);
            setName(prog.name || "");
            setDescription(prog.description || "");
            setQualifyingProductId(prog.qualifyingProductPublicId || "");
            setRequiredPurchases(prog.requiredPurchases);
            setRewardQuantity(prog.rewardQuantity);
            setRewardDescription(prog.rewardDescription || "");
            setActive(prog.active);

            setServiceProducts(
                prods.filter((p) => p.type === "SERVICE" && p.active)
            );
        } catch (err: any) {
            setError(err.message || "Error al cargar configuración");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!qualifyingProductId) {
            setError("Selecciona un producto calificador");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const updated = await updateLoyaltyProgram({
                name,
                description,
                qualifyingProductPublicId: qualifyingProductId,
                requiredPurchases,
                rewardQuantity,
                rewardDescription,
                active,
            });
            setProgram(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-base-content/40 text-sm">Cargando...</p>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Programa de Lealtad</h2>
                        <p className="text-xs text-base-content/40">
                            Configura el programa de cliente frecuente
                        </p>
                    </div>
                </div>
                {program && (
                    <div className="flex items-center gap-2">
                        <span className={`badge ${program.active ? "badge-success" : "badge-ghost"} badge-sm`}>
                            {program.active ? "Activo" : "Inactivo"}
                        </span>
                    </div>
                )}
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

            {success && (
                <div className="alert alert-success border-0 bg-success/10">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Configuraci&oacute;n guardada correctamente</span>
                </div>
            )}

            {!loading && program && program.active && !program.qualifyingProductPublicId && (
                <div className="alert alert-warning border-0 bg-warning/10">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                        El programa est&aacute; activo pero no tiene un producto calificador configurado.
                        Las visitas no se registrar&aacute;n hasta que selecciones un producto.
                    </span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-base-content/40 text-sm">Cargando programa...</p>
                </div>
            ) : (
                <div className="card bg-base-100 shadow-sm border border-base-300/30">
                    <div className="card-body p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Gift className="w-4 h-4 text-pink-500" />
                                <h3 className="font-bold text-sm">Reglas del programa</h3>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-base-content/50">Activo</span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-sm toggle-success"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                />
                            </label>
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del programa</legend>
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Descripción</legend>
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Producto calificador (servicio que cuenta visitas)</legend>
                            <select
                                className="select select-bordered select-sm w-full"
                                value={qualifyingProductId}
                                onChange={(e) => setQualifyingProductId(e.target.value)}
                            >
                                <option value="">Seleccionar producto...</option>
                                {serviceProducts.map((p) => (
                                    <option key={p.publicId} value={p.publicId}>
                                        {p.name} - ${p.price}
                                    </option>
                                ))}
                            </select>
                        </fieldset>

                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Compras requeridas</legend>
                                <input
                                    type="number"
                                    min="1"
                                    className="input input-bordered input-sm w-full"
                                    value={requiredPurchases}
                                    onChange={(e) => setRequiredPurchases(parseInt(e.target.value) || 1)}
                                />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Cantidad de recompensa</legend>
                                <input
                                    type="number"
                                    min="1"
                                    className="input input-bordered input-sm w-full"
                                    value={rewardQuantity}
                                    onChange={(e) => setRewardQuantity(parseInt(e.target.value) || 1)}
                                />
                            </fieldset>
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Descripción de la recompensa</legend>
                            <input
                                type="text"
                                placeholder="Ej: 1 hora de juego gratis"
                                className="input input-bordered input-sm w-full"
                                value={rewardDescription}
                                onChange={(e) => setRewardDescription(e.target.value)}
                            />
                        </fieldset>

                        <button
                            className="btn btn-primary gap-2 shadow-md shadow-primary/20"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Guardar configuración
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
