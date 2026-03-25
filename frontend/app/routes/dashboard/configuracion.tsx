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
    Sparkles,
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
    activeColor: string;
    bgColor: string;
}[] = [
        {
            value: "STRICT",
            label: "Estricto",
            description: "No permite vender sin stock disponible",
            icon: ShieldAlert,
            activeColor: "ring-error text-error",
            bgColor: "bg-error/5 hover:bg-error/10",
        },
        {
            value: "WARNING",
            label: "Advertencia",
            description: "Permite vender pero muestra advertencia",
            icon: ShieldCheck,
            activeColor: "ring-warning text-warning",
            bgColor: "bg-warning/5 hover:bg-warning/10",
        },
        {
            value: "DISABLED",
            label: "Desactivado",
            description: "Ignora el control de inventario",
            icon: ShieldOff,
            activeColor: "ring-base-content/30 text-base-content/50",
            bgColor: "bg-base-200/50 hover:bg-base-200",
        },
    ];

function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="card bg-base-100 shadow-sm border border-base-300/30 overflow-hidden">
            <div className="card-body p-6">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{title}</h3>
                        <p className="text-sm text-base-content/50 mt-0.5">{description}</p>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}

function SaveButton({
    saving,
    saved,
    onClick,
    label = "Guardar",
    savedLabel = "Guardado",
    className = "",
}: {
    saving: boolean;
    saved: boolean;
    onClick: () => void;
    label?: string;
    savedLabel?: string;
    className?: string;
}) {
    return (
        <button
            className={`btn gap-2 transition-all duration-300 ${saved ? "btn-success" : "btn-primary"
                } ${className}`}
            onClick={onClick}
            disabled={saving}
        >
            {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
                <Check className="w-4 h-4 animate-bounce-in" />
            ) : (
                <Save className="w-4 h-4" />
            )}
            {saved ? savedLabel : label}
        </button>
    );
}

function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}) {
    useEffect(() => {
        if (type === "success") {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [type, onClose]);

    return (
        <div
            className={`
        alert shadow-lg animate-slide-up border-0
        ${type === "success" ? "alert-success" : "alert-error"}
      `}
        >
            {type === "success" ? (
                <Check className="w-4 h-4" />
            ) : (
                <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-sm">{message}</span>
            <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
                <X className="w-3 h-3" />
            </button>
        </div>
    );
}

export default function Configuracion() {
    const [company, setCompany] = useState<CompanySettingsResponse>({
        businessName: "",
        phone: null,
        website: null,
        logoUrl: null,
    });
    const [companySaving, setCompanySaving] = useState(false);
    const [companySaved, setCompanySaved] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [inventoryMode, setInventoryMode] = useState<InventoryMode>("WARNING");
    const [inventorySaving, setInventorySaving] = useState(false);

    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxRate, setTaxRate] = useState("0.16");
    const [taxSaving, setTaxSaving] = useState(false);
    const [taxSaved, setTaxSaved] = useState(false);

    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
            setToast({ message: e.message || "Error cargando configuración", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    function showToast(message: string, type: "success" | "error" = "success") {
        setToast({ message, type });
    }

    async function handleSaveCompany() {
        setCompanySaving(true);
        try {
            const updated = await updateCompanySettings({
                businessName: company.businessName,
                phone: company.phone ?? undefined,
                website: company.website ?? undefined,
            });
            setCompany(updated);
            setCompanySaved(true);
            showToast("Datos de empresa guardados");
            setTimeout(() => setCompanySaved(false), 3000);
        } catch (e: any) {
            showToast(e.message || "Error al guardar", "error");
        } finally {
            setCompanySaving(false);
        }
    }

    function handleDrag(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }

    function processFile(file: File) {
        if (!file.type.startsWith("image/")) {
            showToast("Solo se permiten archivos de imagen", "error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast("La imagen no debe exceder 2MB", "error");
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
        try {
            const result = await uploadLogo(logoFile);
            setCompany((prev) => ({ ...prev, logoUrl: result.logoUrl }));
            setLogoFile(null);
            setLogoPreview(null);
            showToast("Logo actualizado correctamente");
        } catch (e: any) {
            showToast(e.message || "Error al subir logo", "error");
        } finally {
            setLogoUploading(false);
        }
    }

    async function handleSaveInventory(mode: InventoryMode) {
        setInventorySaving(true);
        try {
            const result = await updateInventoryMode(mode);
            setInventoryMode(result.inventoryMode);
            showToast("Modo de inventario actualizado");
        } catch (e: any) {
            showToast(e.message || "Error al actualizar inventario", "error");
        } finally {
            setInventorySaving(false);
        }
    }

    async function handleSaveTax() {
        const rate = parseFloat(taxRate);
        if (isNaN(rate) || rate < 0 || rate > 1) {
            showToast("La tasa debe ser entre 0 y 1 (ej: 0.16)", "error");
            return;
        }
        setTaxSaving(true);
        try {
            const result = await updateTaxSettings({ taxEnabled, taxRate: rate });
            setTaxEnabled(result.taxEnabled ?? true);
            setTaxRate(String(result.taxRate ?? 0.16));
            setTaxSaved(true);
            showToast("Configuración de impuestos guardada");
            setTimeout(() => setTaxSaved(false), 3000);
        } catch (e: any) {
            showToast(e.message || "Error al guardar impuestos", "error");
        } finally {
            setTaxSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
                <div className="relative">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
                <p className="text-sm text-base-content/40">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold">Configuración</h2>
                    <p className="text-sm text-base-content/40">Personaliza tu sistema</p>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <SettingsSection
                icon={Building2}
                title="Empresa"
                description="Información general. Se mostrará en tickets y documentos."
            >
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                        <label className="text-sm font-medium text-base-content/70">Logo de la empresa</label>
                        <div
                            className={`
                relative flex flex-col items-center gap-4 p-8
                border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer
                ${dragActive
                                    ? "border-primary bg-primary/5 scale-[1.02]"
                                    : "border-base-300 hover:border-primary/50 hover:bg-base-200/30"
                                }
              `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <div className="relative group">
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="w-28 h-28 object-contain rounded-xl bg-base-200 p-2 shadow-sm"
                                    />
                                    <button
                                        className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLogoFile(null);
                                            setLogoPreview(null);
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : company.logoUrl ? (
                                <img
                                    src={company.logoUrl}
                                    alt="Logo"
                                    className="w-28 h-28 object-contain rounded-xl bg-base-200 p-2 shadow-sm"
                                />
                            ) : (
                                <div className="w-28 h-28 flex flex-col items-center justify-center bg-base-200/50 rounded-xl">
                                    <Image className="w-10 h-10 text-base-content/15" />
                                    <p className="text-[10px] text-base-content/30 mt-1">Sin logo</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <div className="text-center">
                                <p className="text-xs font-medium text-base-content/50">
                                    {dragActive ? "Suelta la imagen aquí" : "Arrastra o haz clic"}
                                </p>
                                <p className="text-[10px] text-base-content/30 mt-1">PNG, JPG, SVG · Máx 2MB</p>
                            </div>
                        </div>

                        {logoFile && (
                            <button
                                className="btn btn-primary btn-sm w-full gap-2"
                                onClick={handleUploadLogo}
                                disabled={logoUploading}
                            >
                                {logoUploading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                )}
                                Subir logo
                            </button>
                        )}
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del negocio</legend>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={company.businessName}
                                onChange={(e) =>
                                    setCompany((prev) => ({ ...prev, businessName: e.target.value }))
                                }
                                placeholder="Mi Empresa S.A. de C.V."
                            />
                        </fieldset>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Teléfono
                                </legend>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={company.phone ?? ""}
                                    onChange={(e) =>
                                        setCompany((prev) => ({ ...prev, phone: e.target.value || null }))
                                    }
                                    placeholder="55 1234 5678"
                                />
                            </fieldset>

                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Sitio web
                                </legend>
                                <input
                                    type="url"
                                    className="input input-bordered w-full"
                                    value={company.website ?? ""}
                                    onChange={(e) =>
                                        setCompany((prev) => ({ ...prev, website: e.target.value || null }))
                                    }
                                    placeholder="https://mi-empresa.com"
                                />
                            </fieldset>
                        </div>

                        <SaveButton
                            saving={companySaving}
                            saved={companySaved}
                            onClick={handleSaveCompany}
                            label="Guardar empresa"
                            savedLabel="¡Guardado!"
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection
                icon={Package}
                title="Control de Inventario"
                description="Define el comportamiento cuando un producto no tiene stock suficiente."
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {INVENTORY_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = inventoryMode === mode.value;

                        return (
                            <button
                                key={mode.value}
                                onClick={() => {
                                    if (!inventorySaving && !isSelected) {
                                        setInventoryMode(mode.value);
                                        handleSaveInventory(mode.value);
                                    }
                                }}
                                disabled={inventorySaving}
                                className={`
                  relative flex flex-col items-center text-center p-5 rounded-2xl
                  border-2 transition-all duration-300 cursor-pointer group
                  ${isSelected
                                        ? `${mode.activeColor} ring-2 border-transparent shadow-md scale-[1.02]`
                                        : `border-base-300/50 ${mode.bgColor}`
                                    }
                  ${inventorySaving ? "opacity-50 cursor-wait" : "hover:scale-[1.01]"}
                `}
                            >
                                <div
                                    className={`
                    w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-colors
                    ${isSelected ? "bg-current/10" : "bg-base-200/80"}
                  `}
                                >
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h4 className="font-bold text-sm">{mode.label}</h4>
                                <p className="text-[11px] text-base-content/50 mt-1 leading-relaxed">
                                    {mode.description}
                                </p>
                                {isSelected && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {inventorySaving && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-base-content/50">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando modo de inventario...
                    </div>
                )}
            </SettingsSection>

            <SettingsSection
                icon={Receipt}
                title="Impuestos (IVA)"
                description="Configura si se aplica IVA a las ventas y la tasa correspondiente."
            >
                <div className="space-y-6">
                    <div
                        className={`
              flex items-center gap-4 p-4 rounded-xl border transition-colors
              ${taxEnabled ? "bg-primary/5 border-primary/20" : "bg-base-200/30 border-base-300/50"}
            `}
                    >
                        <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-lg"
                            checked={taxEnabled}
                            onChange={(e) => setTaxEnabled(e.target.checked)}
                        />
                        <div>
                            <p className="font-semibold text-sm">
                                {taxEnabled ? "IVA habilitado" : "IVA deshabilitado"}
                            </p>
                            <p className="text-xs text-base-content/50">
                                {taxEnabled
                                    ? "Se aplicará IVA a todas las ventas"
                                    : "Las ventas no incluirán IVA"}
                            </p>
                        </div>
                        {taxEnabled && <Sparkles className="w-5 h-5 text-primary ml-auto" />}
                    </div>

                    <div
                        className={`space-y-4 transition-all duration-300 ${taxEnabled ? "opacity-100" : "opacity-30 pointer-events-none"
                            }`}
                    >
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Tasa de IVA (valor decimal)</legend>
                            <div className="join w-full">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    className="input input-bordered join-item flex-1"
                                    value={taxRate}
                                    onChange={(e) => setTaxRate(e.target.value)}
                                />
                                <div className="join-item bg-base-200 px-4 flex items-center font-bold text-lg min-w-[5rem] justify-center">
                                    {(parseFloat(taxRate || "0") * 100).toFixed(0)}%
                                </div>
                            </div>
                        </fieldset>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-base-content/40">Presets:</span>
                            {[
                                { label: "0%", value: "0" },
                                { label: "8%", value: "0.08" },
                                { label: "16%", value: "0.16" },
                            ].map((preset) => (
                                <button
                                    key={preset.value}
                                    className={`btn btn-xs rounded-lg ${taxRate === preset.value ? "btn-primary" : "btn-ghost"
                                        }`}
                                    onClick={() => setTaxRate(preset.value)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <SaveButton
                        saving={taxSaving}
                        saved={taxSaved}
                        onClick={handleSaveTax}
                        label="Guardar impuestos"
                        savedLabel="¡Guardado!"
                        className="w-full sm:w-auto"
                    />
                </div>
            </SettingsSection>
        </div>
    );
}