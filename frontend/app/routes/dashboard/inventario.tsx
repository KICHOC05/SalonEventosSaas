// app/routes/inventario.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Download,
    Package,
    AlertTriangle,
    XCircle,
    Loader2,
    RefreshCw,
    Search,
    Power,
    ShieldAlert,
    Eye,
} from "lucide-react";
import {
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    type ProductResponse,
    type ProductRequest,
    type ProductType,
} from "~/lib/api";
import { useAuth } from "~/lib/auth";

// ─── Tipo auxiliar para el formulario ───
interface ProductFormData {
    name: string;
    description: string;
    price: string;
    stock: string;
    type: ProductType;
}

const emptyForm: ProductFormData = {
    name: "",
    description: "",
    price: "",
    stock: "",
    type: "PRODUCT",
};

const typeLabels: Record<ProductType, string> = {
    PRODUCT: "Producto",
    SERVICE: "Servicio",
    PACKAGE: "Paquete",
};

const typeBadgeColors: Record<ProductType, string> = {
    PRODUCT: "badge-info",
    SERVICE: "badge-secondary",
    PACKAGE: "badge-accent",
};

export default function Inventario() {
    // ─── Auth y permisos ───
    const { role, canManageProducts } = useAuth();

    // ─── Estado ───
    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<ProductType | "ALL">("ALL");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

    // ─── Modal ───
    const modalRef = useRef<HTMLDialogElement>(null);
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);

    // ─── Modal de solo lectura ───
    const viewModalRef = useRef<HTMLDialogElement>(null);
    const [viewingProduct, setViewingProduct] = useState<ProductResponse | null>(null);

    // ─── Cargar productos ───
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchProducts();
            setProducts(data);
        } catch (err: any) {
            console.error("Error cargando productos:", err);
            setError(err.message || "Error al cargar productos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // ─── Abrir modal CREAR (solo ADMIN/MANAGER) ───
    const openCreateModal = () => {
        if (!canManageProducts) return;
        setEditingProduct(null);
        setFormData(emptyForm);
        setFormError(null);
        modalRef.current?.showModal();
    };

    // ─── Abrir modal EDITAR (solo ADMIN/MANAGER) ───
    const openEditModal = (product: ProductResponse) => {
        if (!canManageProducts) return;
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || "",
            price: product.price.toString(),
            stock: product.stock?.toString() || "",
            type: product.type,
        });
        setFormError(null);
        modalRef.current?.showModal();
    };

    // ─── Abrir modal VER (para EMPLOYEE/CASHIER) ───
    const openViewModal = (product: ProductResponse) => {
        setViewingProduct(product);
        viewModalRef.current?.showModal();
    };

    // ─── Manejar cambios del formulario ───
    const handleFormChange = (field: keyof ProductFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // ─── Toggle activar/desactivar ───
    const handleToggleStatus = async () => {
        if (!editingProduct || !canManageProducts) return;

        const action = editingProduct.active ? "desactivar" : "activar";
        if (!confirm(`¿Estás seguro de ${action} "${editingProduct.name}"?`)) {
            return;
        }

        try {
            setTogglingId(editingProduct.publicId);
            const updated = await toggleProductStatus(editingProduct.publicId);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === editingProduct.publicId ? updated : p
                )
            );
            setEditingProduct(updated);
        } catch (err: any) {
            console.error("Error cambiando estado:", err);
            setFormError(err.message || `Error al ${action} el producto`);
        } finally {
            setTogglingId(null);
        }
    };

    // ─── Guardar (crear o editar) ───
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canManageProducts) return;
        setFormError(null);

        if (!formData.name.trim()) {
            setFormError("El nombre es obligatorio");
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            setFormError("El precio debe ser mayor a 0");
            return;
        }
        if (!formData.type) {
            setFormError("Selecciona un tipo");
            return;
        }

        const request: ProductRequest = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            price: Number(formData.price),
            stock: formData.stock ? Number(formData.stock) : undefined,
            type: formData.type,
        };

        try {
            setSaving(true);
            if (editingProduct) {
                const updated = await updateProduct(editingProduct.publicId, request);
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === editingProduct.publicId ? updated : p
                    )
                );
            } else {
                const created = await createProduct(request);
                setProducts((prev) => [...prev, created]);
            }
            modalRef.current?.close();
            setFormData(emptyForm);
            setEditingProduct(null);
        } catch (err: any) {
            console.error("Error guardando producto:", err);
            setFormError(err.message || "Error al guardar el producto");
        } finally {
            setSaving(false);
        }
    };

    // ─── Eliminar producto ───
    const handleDelete = async (product: ProductResponse) => {
        if (!canManageProducts) return;
        if (!confirm(`¿Eliminar "${product.name}" permanentemente?`)) return;

        try {
            await deleteProduct(product.publicId);
            setProducts((prev) =>
                prev.filter((p) => p.publicId !== product.publicId)
            );
        } catch (err: any) {
            console.error("Error eliminando producto:", err);
            alert(err.message || "Error al eliminar el producto");
        }
    };

    // ─── Cerrar modales ───
    const closeModal = () => {
        modalRef.current?.close();
        setFormData(emptyForm);
        setEditingProduct(null);
        setFormError(null);
    };

    const closeViewModal = () => {
        viewModalRef.current?.close();
        setViewingProduct(null);
    };

    // ─── Productos filtrados ───
    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "ALL" || p.type === filterType;
        const matchesStatus =
            filterStatus === "ALL" ||
            (filterStatus === "ACTIVE" && p.active) ||
            (filterStatus === "INACTIVE" && !p.active);
        return matchesSearch && matchesType && matchesStatus;
    });

    // ─── Indicadores ───
    const getStockStatus = (stock: number | null) => {
        if (stock === null || stock === undefined) return "N/A";
        if (stock === 0) return "agotado";
        if (stock < 10) return "bajo";
        if (stock < 20) return "medio";
        return "optimo";
    };

    const activeProducts = products.filter((p) => p.active);
    const inactiveProducts = products.filter((p) => !p.active);
    const optimal = activeProducts.filter((p) => p.stock !== null && p.stock >= 20).length;
    const low = activeProducts.filter((p) => p.stock !== null && p.stock > 0 && p.stock < 10).length;
    const out = activeProducts.filter((p) => p.stock !== null && p.stock === 0).length;

    // ─── Loading ───
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Cargando inventario...</span>
            </div>
        );
    }

    // ─── Error ───
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="alert alert-error max-w-md">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
                <button className="btn btn-primary gap-2" onClick={loadProducts}>
                    <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ═══ Banner de permisos (solo lectura) ═══ */}
            {!canManageProducts && (
                <div className="alert alert-info">
                    <ShieldAlert className="w-5 h-5" />
                    <div>
                        <p className="font-semibold">Modo solo lectura</p>
                        <p className="text-sm">
                            Tu rol ({role}) solo permite consultar el inventario.
                            Contacta a un administrador para realizar cambios.
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Inventario de Productos</h2>
                    <p className="text-base-content/60 text-sm mt-1">
                        {activeProducts.length} activo{activeProducts.length !== 1 ? "s" : ""}
                        {inactiveProducts.length > 0 && (
                            <span className="text-warning">
                                {" "}· {inactiveProducts.length} inactivo{inactiveProducts.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="btn btn-outline btn-sm gap-2" onClick={loadProducts}>
                        <RefreshCw className="w-4 h-4" /> Actualizar
                    </button>
                    <button className="btn btn-outline btn-sm gap-2">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                    {/* ✅ Solo ADMIN y MANAGER ven el botón crear */}
                    {canManageProducts && (
                        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
                            <Plus className="w-4 h-4" /> Nuevo Producto
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ Indicadores ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { icon: Package, label: "Stock óptimo", value: `${optimal}`, color: "text-success", bg: "bg-success/10" },
                    { icon: AlertTriangle, label: "Stock bajo", value: `${low}`, color: "text-warning", bg: "bg-warning/10" },
                    { icon: XCircle, label: "Agotados", value: `${out}`, color: "text-error", bg: "bg-error/10" },
                    { icon: Power, label: "Inactivos", value: `${inactiveProducts.length}`, color: "text-base-content/40", bg: "bg-base-content/10" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="card bg-base-100 shadow-sm">
                        <div className="card-body flex-row items-center gap-4 py-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-base-content/50 text-sm">{label}</p>
                                <h3 className="text-xl font-bold">{value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ Filtros ═══ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="form-control flex-1">
                            <div className="input-group">
                                <span><Search className="w-4 h-4" /></span>
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    className="input input-bordered input-sm w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <select
                            className="select select-bordered select-sm"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as ProductType | "ALL")}
                        >
                            <option value="ALL">Todos los tipos</option>
                            <option value="PRODUCT">Producto</option>
                            <option value="SERVICE">Servicio</option>
                            <option value="PACKAGE">Paquete</option>
                        </select>
                        <select
                            className="select select-bordered select-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="ACTIVE">Activos</option>
                            <option value="INACTIVE">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ═══ Tabla ═══ */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Tipo</th>
                                    <th>Stock</th>
                                    <th>Precio</th>
                                    <th>Estado Stock</th>
                                    <th>Activo</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-base-content/50 py-8">
                                            {searchTerm || filterType !== "ALL" || filterStatus !== "ALL"
                                                ? "No se encontraron productos con esos filtros"
                                                : "No hay productos registrados"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => {
                                        const status = getStockStatus(p.stock);
                                        return (
                                            <tr key={p.publicId} className={`hover ${!p.active ? "opacity-50" : ""}`}>
                                                <td>
                                                    <div>
                                                        <div className="font-medium">{p.name}</div>
                                                        {p.description && (
                                                            <div className="text-xs text-base-content/50 max-w-xs truncate">
                                                                {p.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-sm ${typeBadgeColors[p.type]}`}>
                                                        {typeLabels[p.type]}
                                                    </span>
                                                </td>
                                                <td>
                                                    {p.stock !== null && p.stock !== undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <span>{p.stock}</span>
                                                            {p.stock === 0 && <span className="badge badge-error badge-xs">AGOTADO</span>}
                                                            {p.stock > 0 && p.stock < 10 && <span className="badge badge-warning badge-xs">BAJO</span>}
                                                            {p.stock >= 10 && p.stock < 20 && <span className="badge badge-info badge-xs">MEDIO</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/40">N/A</span>
                                                    )}
                                                </td>
                                                <td className="font-mono">${Number(p.price).toFixed(2)}</td>
                                                <td>
                                                    {status === "agotado" && <span className="badge badge-error badge-sm">Agotado</span>}
                                                    {status === "bajo" && <span className="badge badge-warning badge-sm">Bajo</span>}
                                                    {status === "medio" && <span className="badge badge-info badge-sm">Medio</span>}
                                                    {status === "optimo" && <span className="badge badge-success badge-sm">Óptimo</span>}
                                                    {status === "N/A" && <span className="badge badge-ghost badge-sm">Sin stock</span>}
                                                </td>
                                                <td>
                                                    {p.active ? (
                                                        <span className="badge badge-success badge-sm gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-success-content"></span>
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-error badge-sm gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-error-content"></span>
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                {/* ✅ ACCIONES SEGÚN ROL */}
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {canManageProducts ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                                    data-tip="Editar"
                                                                    onClick={() => openEditModal(p)}
                                                                >
                                                                    <Pencil className="w-4 h-4 text-warning" />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                                    data-tip="Eliminar"
                                                                    onClick={() => handleDelete(p)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-error" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="btn btn-ghost btn-xs btn-square tooltip"
                                                                data-tip="Ver detalle"
                                                                onClick={() => openViewModal(p)}
                                                            >
                                                                <Eye className="w-4 h-4 text-info" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ═══ Modal crear/editar (SOLO ADMIN/MANAGER) ═══ */}
            {canManageProducts && (
                <dialog ref={modalRef} className="modal">
                    <div className="modal-box">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                            onClick={closeModal}
                        >
                            ✕
                        </button>

                        <h3 className="font-bold text-lg mb-6">
                            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                        </h3>

                        {formError && (
                            <div className="alert alert-error mb-4">
                                <XCircle className="w-4 h-4" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {/* Toggle status */}
                        {editingProduct && (
                            <div className={`rounded-xl p-4 mb-6 flex items-center justify-between border-2 ${editingProduct.active
                                    ? "border-success/30 bg-success/5"
                                    : "border-error/30 bg-error/5"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editingProduct.active ? "bg-success/20" : "bg-error/20"
                                        }`}>
                                        <Power className={`w-5 h-5 ${editingProduct.active ? "text-success" : "text-error"
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Estado del producto</p>
                                        <p className="text-xs text-base-content/60">
                                            {editingProduct.active
                                                ? "Producto visible y disponible para venta"
                                                : "Producto oculto — actívalo para poder editarlo"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${editingProduct.active ? "badge-success" : "badge-error"}`}>
                                        {editingProduct.active ? "Activo" : "Inactivo"}
                                    </span>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${editingProduct.active ? "btn-error btn-outline" : "btn-success"
                                            }`}
                                        onClick={handleToggleStatus}
                                        disabled={togglingId === editingProduct.publicId}
                                    >
                                        {togglingId === editingProduct.publicId ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Power className="w-4 h-4" />
                                        )}
                                        {editingProduct.active ? "Desactivar" : "Activar"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Aviso inactivo */}
                        {editingProduct && !editingProduct.active && (
                            <div className="alert alert-warning mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                <div>
                                    <p className="font-semibold">Producto inactivo</p>
                                    <p className="text-sm">
                                        Debes activar el producto antes de poder modificar sus datos.
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text">Nombre <span className="text-error">*</span></span>
                                </div>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => handleFormChange("name", e.target.value)}
                                    placeholder="Ej: Hamburguesa clásica"
                                    required
                                    disabled={editingProduct !== null && !editingProduct.active}
                                />
                            </label>

                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text">Tipo <span className="text-error">*</span></span>
                                </div>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.type}
                                    onChange={(e) => handleFormChange("type", e.target.value)}
                                    required
                                    disabled={editingProduct !== null && !editingProduct.active}
                                >
                                    <option value="PRODUCT">Producto</option>
                                    <option value="SERVICE">Servicio</option>
                                    <option value="PACKAGE">Paquete</option>
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">Precio <span className="text-error">*</span></span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input input-bordered"
                                        value={formData.price}
                                        onChange={(e) => handleFormChange("price", e.target.value)}
                                        placeholder="0.00"
                                        required
                                        disabled={editingProduct !== null && !editingProduct.active}
                                    />
                                </label>
                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">Stock</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input input-bordered"
                                        value={formData.stock}
                                        onChange={(e) => handleFormChange("stock", e.target.value)}
                                        placeholder="0"
                                        disabled={editingProduct !== null && !editingProduct.active}
                                    />
                                </label>
                            </div>

                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text">Descripción</span>
                                </div>
                                <textarea
                                    className="textarea textarea-bordered h-24"
                                    value={formData.description}
                                    onChange={(e) => handleFormChange("description", e.target.value)}
                                    placeholder="Descripción opcional..."
                                    disabled={editingProduct !== null && !editingProduct.active}
                                />
                            </label>

                            <div className="modal-action">
                                <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving || (editingProduct !== null && !editingProduct.active)}
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingProduct ? "Guardar cambios" : "Crear producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={closeModal}>close</button>
                    </form>
                </dialog>
            )}

            {/* ═══ Modal solo lectura (EMPLOYEE/CASHIER) ═══ */}
            {!canManageProducts && (
                <dialog ref={viewModalRef} className="modal">
                    <div className="modal-box">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                            onClick={closeViewModal}
                        >
                            ✕
                        </button>

                        <h3 className="font-bold text-lg mb-6">Detalle del Producto</h3>

                        {viewingProduct && (
                            <div className="space-y-4">
                                {/* Estado */}
                                <div className={`rounded-xl p-4 flex items-center gap-3 border ${viewingProduct.active
                                        ? "border-success/30 bg-success/5"
                                        : "border-error/30 bg-error/5"
                                    }`}>
                                    <Power className={`w-5 h-5 ${viewingProduct.active ? "text-success" : "text-error"
                                        }`} />
                                    <span className="font-semibold">
                                        {viewingProduct.active ? "Producto activo" : "Producto inactivo"}
                                    </span>
                                </div>

                                {/* Datos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-base-content/50">Nombre</p>
                                        <p className="font-semibold">{viewingProduct.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-base-content/50">Tipo</p>
                                        <span className={`badge ${typeBadgeColors[viewingProduct.type]}`}>
                                            {typeLabels[viewingProduct.type]}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-base-content/50">Precio</p>
                                        <p className="font-semibold font-mono">
                                            ${Number(viewingProduct.price).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-base-content/50">Stock</p>
                                        <p className="font-semibold">
                                            {viewingProduct.stock !== null && viewingProduct.stock !== undefined
                                                ? viewingProduct.stock
                                                : "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {viewingProduct.description && (
                                    <div>
                                        <p className="text-sm text-base-content/50">Descripción</p>
                                        <p className="mt-1">{viewingProduct.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-xs text-base-content/40">
                                    <div>
                                        <p>Creado</p>
                                        <p>{new Date(viewingProduct.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p>Actualizado</p>
                                        <p>{new Date(viewingProduct.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={closeViewModal}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={closeViewModal}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
}