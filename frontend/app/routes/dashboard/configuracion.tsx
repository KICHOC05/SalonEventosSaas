import { useState, useEffect, useRef } from "react";
import {
    Settings,
    Building2,
    Package,
    Receipt,
    Upload,
    Save,
    Check,
    AlertTriangle,
    X,
    Image,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Loader2,
    Globe,
    Phone,
} from "lucide-react";
import {
    getCompanySettings,
    updateCompanySettings,
    uploadLogo,
    getTenantSettings,
    updateInventoryMode,
    getTaxSettings,
    updateTaxSettings,
    type CompanySettingsResponse,
    type TenantSettingsResponse,
    type TaxSettingsResponse as TaxSettingsRes,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Configuración", "Gestión de configuración del sistema");
}

type InventoryMode = "STRICT" | "WARNING" | "DISABLED";

const INVENTORY_MODES: {
    value: InventoryMode;
    label: string;
    description: string;
    icon: typeof ShieldAlert;
    color: string;
}[] = [
        {
            value: "STRICT",
            label: "Estricto",
            description: "No permite vender sin stock disponible",
            icon: ShieldAlert,
            color: "text-error",
        },
        {
            value: "WARNING",
            label: "Advertencia",
            description: "Permite vender pero muestra advertencia de stock bajo",
            icon: ShieldCheck,
            color: "text-warning",
        },
        {
            value: "DISABLED",
            label: "Desactivado",
            description: "Ignora el control de inventario completamente",
            icon: ShieldOff,
            color: "text-base-content/50",
        },
    ];

export default function Configuracion() {
    // ─── Company state ───
    const [company, setCompany] = useState<CompanySettingsResponse>({
        businessName: "",
        phone: null,
        website: null,
        logoUrl: null,
    });
    const [companySaving, setCompanySaving] = useState(false);
    const [companySaved, setCompanySaved] = useState(false);

    // ─── Logo state ───
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Inventory state ───
    const [inventoryMode, setInventoryMode] = useState<InventoryMode>("WARNING");
    const [inventorySaving, setInventorySaving] = useState(false);
    const [inventorySaved, setInventorySaved] = useState(false);

    // ─── Tax state ───
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxRate, setTaxRate] = useState("0.16");
    const [taxSaving, setTaxSaving] = useState(false);
    const [taxSaved, setTaxSaved] = useState(false);

    // ─── General state ───
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadAllSettings();
    }, []);

    async function loadAllSettings() {
        setLoading(true);
        try {
            const [companyData, tenantData, taxData] = await Promise.all([
                getCompanySettings(),
                getTenantSettings(),
                getTaxSettings(),
            ]);

            setCompany(companyData);
            setInventoryMode(tenantData.inventoryMode);
            setTaxEnabled(taxData.taxEnabled ?? true);
            setTaxRate(String(taxData.taxRate ?? 0.16));
        } catch (e: any) {
            setError(e.message || "Error cargando configuración");
        } finally {
            setLoading(false);
        }
    }

    // ═══════════════════════════════════
    // COMPANY HANDLERS
    // ═══════════════════════════════════

    async function handleSaveCompany() {
        setCompanySaving(true);
        setError(null);
        try {
            const updated = await updateCompanySettings({
                businessName: company.businessName,
                phone: company.phone ?? undefined,
                website: company.website ?? undefined,
            });
            setCompany(updated);
            setCompanySaved(true);
            setSuccess("Datos de empresa guardados");
            setTimeout(() => {
                setCompanySaved(false);
                setSuccess(null);
            }, 3000);
        } catch (e: any) {
            setError(e.message || "Error al guardar datos de empresa");
        } finally {
            setCompanySaving(false);
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Solo se permiten archivos de imagen");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError("La imagen no debe exceder 2MB");
            return;
        }

        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    async function handleUploadLogo() {
        if (!logoFile) return;
        setLogoUploading(true);
        setError(null);
        try {
            const result = await uploadLogo(logoFile);
            setCompany((prev) => ({ ...prev, logoUrl: result.logoUrl }));
            setLogoFile(null);
            setLogoPreview(null);
            setSuccess("Logo actualizado correctamente");
            setTimeout(() => setSuccess(null), 3000);
        } catch (e: any) {
            setError(e.message || "Error al subir logo");
        } finally {
            setLogoUploading(false);
        }
    }

    // ═══════════════════════════════════
    // INVENTORY HANDLER
    // ═══════════════════════════════════

    async function handleSaveInventory(mode: InventoryMode) {
        setInventorySaving(true);
        setError(null);
        try {
            const result = await updateInventoryMode(mode);
            setInventoryMode(result.inventoryMode);
            setInventorySaved(true);
            setSuccess("Modo de inventario actualizado");
            setTimeout(() => {
                setInventorySaved(false);
                setSuccess(null);
            }, 3000);
        } catch (e: any) {
            setError(e.message || "Error al actualizar inventario");
        } finally {
            setInventorySaving(false);
        }
    }

    // ═══════════════════════════════════
    // TAX HANDLER
    // ═══════════════════════════════════

    async function handleSaveTax() {
        const rate = parseFloat(taxRate);
        if (isNaN(rate) || rate < 0 || rate > 1) {
            setError("La tasa debe ser un valor entre 0 y 1 (ej: 0.16)");
            return;
        }
        setTaxSaving(true);
        setError(null);
        try {
            const result = await updateTaxSettings({
                taxEnabled,
                taxRate: rate,
            });
            setTaxEnabled(result.taxEnabled ?? true);
            setTaxRate(String(result.taxRate ?? 0.16));
            setTaxSaved(true);
            setSuccess("Configuración de impuestos guardada");
            setTimeout(() => {
                setTaxSaved(false);
                setSuccess(null);
            }, 3000);
        } catch (e: any) {
            setError(e.message || "Error al guardar impuestos");
        } finally {
            setTaxSaving(false);
        }
    }

    // ═══════════════════════════════════
    // RENDER
    // ═══════════════════════════════════

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Settings className="w-7 h-7 text-primary" />
                <h2 className="text-2xl font-bold">Configuración</h2>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error shadow-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{error}</span>
                    <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setError(null)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="alert alert-success shadow-lg">
                    <Check className="w-4 h-4" />
                    <span>{success}</span>
                </div>
            )}

            {/* ═══════════════════════════════
                SECCIÓN 1: EMPRESA
            ═══════════════════════════════ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-lg gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Empresa
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                        Información general de tu empresa. Se mostrará en
                        tickets y documentos.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo section */}
                        <div className="space-y-4">
                            <label className="label">
                                <span className="label-text font-medium">
                                    Logo de la empresa
                                </span>
                            </label>

                            <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-base-300 rounded-xl">
                                {/* Current logo or preview */}
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="w-32 h-32 object-contain rounded-lg bg-base-200 p-2"
                                    />
                                ) : company.logoUrl ? (
                                    <img
                                        src={company.logoUrl}
                                        alt="Logo actual"
                                        className="w-32 h-32 object-contain rounded-lg bg-base-200 p-2"
                                    />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center bg-base-200 rounded-lg">
                                        <Image className="w-12 h-12 text-base-content/20" />
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-outline gap-1"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Upload className="w-3 h-3" />
                                        Seleccionar imagen
                                    </button>

                                    {logoFile && (
                                        <button
                                            className="btn btn-sm btn-primary gap-1"
                                            onClick={handleUploadLogo}
                                            disabled={logoUploading}
                                        >
                                            {logoUploading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Save className="w-3 h-3" />
                                            )}
                                            Subir
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-base-content/40">
                                    PNG, JPG o SVG. Máx 2MB.
                                </p>
                            </div>
                        </div>

                        {/* Company info form */}
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">
                                        Nombre del negocio
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={company.businessName}
                                    onChange={(e) =>
                                        setCompany((prev) => ({
                                            ...prev,
                                            businessName: e.target.value,
                                        }))
                                    }
                                    placeholder="Mi Empresa S.A. de C.V."
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        Teléfono
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={company.phone ?? ""}
                                    onChange={(e) =>
                                        setCompany((prev) => ({
                                            ...prev,
                                            phone: e.target.value || null,
                                        }))
                                    }
                                    placeholder="55 1234 5678"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        Sitio web
                                    </span>
                                </label>
                                <input
                                    type="url"
                                    className="input input-bordered"
                                    value={company.website ?? ""}
                                    onChange={(e) =>
                                        setCompany((prev) => ({
                                            ...prev,
                                            website: e.target.value || null,
                                        }))
                                    }
                                    placeholder="https://mi-empresa.com"
                                />
                            </div>

                            <button
                                className={`btn w-full gap-2 ${companySaved
                                        ? "btn-success"
                                        : "btn-primary"
                                    }`}
                                onClick={handleSaveCompany}
                                disabled={companySaving}
                            >
                                {companySaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : companySaved ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {companySaved
                                    ? "Guardado"
                                    : "Guardar datos de empresa"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════
                SECCIÓN 2: INVENTARIO
            ═══════════════════════════════ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-lg gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        Control de Inventario
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                        Define cómo se comporta el sistema cuando un producto no
                        tiene stock suficiente.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {INVENTORY_MODES.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected =
                                inventoryMode === mode.value;

                            return (
                                <div
                                    key={mode.value}
                                    onClick={() => {
                                        if (!inventorySaving) {
                                            setInventoryMode(mode.value);
                                            handleSaveInventory(mode.value);
                                        }
                                    }}
                                    className={`
                                        card cursor-pointer transition-all
                                        hover:shadow-md hover:-translate-y-0.5
                                        ${isSelected
                                            ? "ring-2 ring-primary bg-primary/5"
                                            : "bg-base-200/50 hover:bg-base-200"
                                        }
                                        ${inventorySaving ? "opacity-60 pointer-events-none" : ""}
                                    `}
                                >
                                    <div className="card-body items-center text-center p-5">
                                        <Icon
                                            className={`w-8 h-8 ${isSelected
                                                    ? "text-primary"
                                                    : mode.color
                                                }`}
                                        />
                                        <h4 className="font-semibold mt-2">
                                            {mode.label}
                                        </h4>
                                        <p className="text-xs text-base-content/60">
                                            {mode.description}
                                        </p>
                                        {isSelected && (
                                            <div className="badge badge-primary badge-sm mt-2 gap-1">
                                                <Check className="w-3 h-3" />
                                                Activo
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {inventorySaving && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-base-content/60">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Guardando...
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════
                SECCIÓN 3: IMPUESTOS
            ═══════════════════════════════ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-lg gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        Impuestos (IVA)
                    </h3>
                    <p className="text-sm text-base-content/60 mb-4">
                        Configura si se aplica IVA a las ventas y la tasa
                        correspondiente.
                    </p>

                    <div className="space-y-6">
                        {/* Toggle IVA */}
                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-4">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-lg"
                                    checked={taxEnabled}
                                    onChange={(e) =>
                                        setTaxEnabled(e.target.checked)
                                    }
                                />
                                <div>
                                    <span className="label-text font-medium text-base">
                                        {taxEnabled
                                            ? "IVA habilitado"
                                            : "IVA deshabilitado"}
                                    </span>
                                    <p className="text-xs text-base-content/50">
                                        {taxEnabled
                                            ? "Se aplicará IVA a todas las ventas"
                                            : "Las ventas no incluirán IVA"}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Tax rate */}
                        <div
                            className={`form-control transition-opacity ${taxEnabled ? "" : "opacity-40 pointer-events-none"
                                }`}
                        >
                            <label className="label">
                                <span className="label-text font-medium">
                                    Tasa de IVA
                                </span>
                                <span className="label-text-alt">
                                    Valor decimal (ej: 0.16 = 16%)
                                </span>
                            </label>
                            <div className="join">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    className="input input-bordered join-item w-full"
                                    value={taxRate}
                                    onChange={(e) =>
                                        setTaxRate(e.target.value)
                                    }
                                />
                                <span className="btn join-item btn-disabled">
                                    {(parseFloat(taxRate || "0") * 100).toFixed(
                                        0
                                    )}
                                    %
                                </span>
                            </div>

                            {/* Quick buttons */}
                            <div className="flex gap-2 mt-3">
                                {[
                                    { label: "8%", value: "0.08" },
                                    { label: "16%", value: "0.16" },
                                    { label: "0%", value: "0" },
                                ].map((preset) => (
                                    <button
                                        key={preset.value}
                                        className={`btn btn-sm ${taxRate === preset.value
                                                ? "btn-primary"
                                                : "btn-outline"
                                            }`}
                                        onClick={() =>
                                            setTaxRate(preset.value)
                                        }
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save button */}
                        <button
                            className={`btn w-full md:w-auto gap-2 ${taxSaved ? "btn-success" : "btn-primary"
                                }`}
                            onClick={handleSaveTax}
                            disabled={taxSaving}
                        >
                            {taxSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : taxSaved ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {taxSaved
                                ? "Guardado"
                                : "Guardar configuración de impuestos"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}