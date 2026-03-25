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
    Clock,
    CalendarCheck,
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
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Inventario", "Gestión de inventario de productos y servicios");
}

interface ProductFormData {
    name: string;
    description: string;
    price: string;
    stock: string;
    type: ProductType;
    department: string;
    durationMinutes: string;
    requiresSchedule: boolean;
}

const emptyForm: ProductFormData = {
    name: "",
    description: "",
    price: "",
    stock: "",
    type: "PRODUCT",
    department: "",
    durationMinutes: "",
    requiresSchedule: false,
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
    const { role, canManageProducts } = useAuth();

    const [products, setProducts] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<ProductType | "ALL">("ALL");
    const [filterStatus, setFilterStatus] = useState<
        "ALL" | "ACTIVE" | "INACTIVE"
    >("ALL");

    const modalRef = useRef<HTMLDialogElement>(null);
    const [editingProduct, setEditingProduct] =
        useState<ProductResponse | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);

    const viewModalRef = useRef<HTMLDialogElement>(null);
    const [viewingProduct, setViewingProduct] =
        useState<ProductResponse | null>(null);

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

    const openCreateModal = () => {
        if (!canManageProducts) return;
        setEditingProduct(null);
        setFormData(emptyForm);
        setFormError(null);
        modalRef.current?.showModal();
    };

    const openEditModal = (product: ProductResponse) => {
        if (!canManageProducts) return;
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || "",
            price: product.price.toString(),
            stock: product.stock?.toString() || "",
            type: product.type,
            department: product.department || "",
            durationMinutes: product.durationMinutes?.toString() || "",
            requiresSchedule: product.requiresSchedule ?? false,
        });
        setFormError(null);
        modalRef.current?.showModal();
    };

    const openViewModal = (product: ProductResponse) => {
        setViewingProduct(product);
        viewModalRef.current?.showModal();
    };

    const handleFormChange = (
        field: keyof ProductFormData,
        value: string | boolean
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleToggleStatus = async () => {
        if (!editingProduct || !canManageProducts) return;

        const action = editingProduct.active ? "desactivar" : "activar";
        if (!confirm(`¿Estás seguro de ${action} "${editingProduct.name}"?`)) {
            return;
        }

        try {
            setTogglingId(editingProduct.publicId);
            const updated = await toggleProductStatus(
                editingProduct.publicId
            );
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === editingProduct.publicId ? updated : p
                )
            );
            setEditingProduct(updated);
        } catch (err: any) {
            console.error("Error cambiando estado:", err);
            setFormError(
                err.message || `Error al ${action} el producto`
            );
        } finally {
            setTogglingId(null);
        }
    };

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
        if (!formData.department.trim()) {
            setFormError("El departamento es obligatorio");
            return;
        }

        const request: ProductRequest = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            price: Number(formData.price),
            stock: formData.stock ? Number(formData.stock) : undefined,
            type: formData.type,
            department: formData.department.trim(),
            durationMinutes: formData.durationMinutes
                ? Number(formData.durationMinutes)
                : undefined,
            requiresSchedule:
                formData.type === "SERVICE" || formData.type === "PACKAGE"
                    ? formData.requiresSchedule
                    : undefined,
        };

        try {
            setSaving(true);
            if (editingProduct) {
                const updated = await updateProduct(
                    editingProduct.publicId,
                    request
                );
                setProducts((prev) =>
                    prev.map((p) =>
                        p.publicId === editingProduct.publicId
                            ? updated
                            : p
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
            setFormError(
                err.message || "Error al guardar el producto"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product: ProductResponse) => {
        if (!canManageProducts) return;
        if (
            !confirm(
                `¿Desactivar "${product.name}"? El producto no será eliminado permanentemente, solo quedará inactivo.`
            )
        )
            return;

        try {
            await deleteProduct(product.publicId);
            setProducts((prev) =>
                prev.map((p) =>
                    p.publicId === product.publicId
                        ? { ...p, active: false }
                        : p
                )
            );
        } catch (err: any) {
            console.error("Error eliminando producto:", err);
            alert(err.message || "Error al eliminar el producto");
        }
    };

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

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            (p.department || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        const matchesType =
            filterType === "ALL" || p.type === filterType;
        const matchesStatus =
            filterStatus === "ALL" ||
            (filterStatus === "ACTIVE" && p.active) ||
            (filterStatus === "INACTIVE" && !p.active);
        return matchesSearch && matchesType && matchesStatus;
    });

    const getStockStatus = (
        stock: number | null | undefined,
        type: ProductType
    ): string => {
        if (type === "SERVICE") return "N/A";
        if (stock === null || stock === undefined) return "N/A";
        if (stock === 0) return "agotado";
        if (stock < 10) return "bajo";
        if (stock < 20) return "medio";
        return "optimo";
    };

    const activeProducts = products.filter((p) => p.active);
    const inactiveProducts = products.filter((p) => !p.active);
    const optimal = activeProducts.filter(
        (p) => p.stock !== null && p.stock !== undefined && p.stock >= 20
    ).length;
    const low = activeProducts.filter(
        (p) =>
            p.stock !== null &&
            p.stock !== undefined &&
            p.stock > 0 &&
            p.stock < 10
    ).length;
    const out = activeProducts.filter(
        (p) =>
            p.stock !== null && p.stock !== undefined && p.stock === 0
    ).length;

    const isFormDisabled =
        editingProduct !== null && !editingProduct.active;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">
                    Cargando inventario...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="alert alert-error max-w-md">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
                <button
                    className="btn btn-primary gap-2"
                    onClick={loadProducts}
                >
                    <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!canManageProducts && (
                <div className="alert alert-info">
                    <ShieldAlert className="w-5 h-5" />
                    <div>
                        <p className="font-semibold">
                            Modo solo lectura
                        </p>
                        <p className="text-sm">
                            Tu rol ({role}) solo permite consultar el
                            inventario. Contacta a un administrador
                            para realizar cambios.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        Inventario de Productos
                    </h2>
                    <p className="text-base-content/60 text-sm mt-1">
                        {activeProducts.length} activo
                        {activeProducts.length !== 1 ? "s" : ""}
                        {inactiveProducts.length > 0 && (
                            <span className="text-warning">
                                {" "}
                                · {inactiveProducts.length} inactivo
                                {inactiveProducts.length !== 1
                                    ? "s"
                                    : ""}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        className="btn btn-outline btn-sm gap-2"
                        onClick={loadProducts}
                    >
                        <RefreshCw className="w-4 h-4" /> Actualizar
                    </button>
                    <button className="btn btn-outline btn-sm gap-2">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                    {canManageProducts && (
                        <button
                            className="btn btn-primary btn-sm gap-2"
                            onClick={openCreateModal}
                        >
                            <Plus className="w-4 h-4" /> Nuevo
                            Producto
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        icon: Package,
                        label: "Stock óptimo",
                        value: `${optimal}`,
                        color: "text-success",
                        bg: "bg-success/10",
                    },
                    {
                        icon: AlertTriangle,
                        label: "Stock bajo",
                        value: `${low}`,
                        color: "text-warning",
                        bg: "bg-warning/10",
                    },
                    {
                        icon: XCircle,
                        label: "Agotados",
                        value: `${out}`,
                        color: "text-error",
                        bg: "bg-error/10",
                    },
                    {
                        icon: Power,
                        label: "Inactivos",
                        value: `${inactiveProducts.length}`,
                        color: "text-base-content/40",
                        bg: "bg-base-content/10",
                    },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div
                        key={label}
                        className="card bg-base-100 shadow-sm"
                    >
                        <div className="card-body flex-row items-center gap-4 py-4">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}
                            >
                                <Icon
                                    className={`w-5 h-5 ${color}`}
                                />
                            </div>
                            <div>
                                <p className="text-base-content/50 text-sm">
                                    {label}
                                </p>
                                <h3 className="text-xl font-bold">
                                    {value}
                                </h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body py-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <label className="input input-bordered input-sm flex items-center gap-2 flex-1">
                            <Search className="w-4 h-4 opacity-50" />
                            <input
                                type="text"
                                className="grow"
                                placeholder="Buscar por nombre, descripción o departamento..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />
                        </label>
                        <select
                            className="select select-bordered select-sm"
                            value={filterType}
                            onChange={(e) =>
                                setFilterType(
                                    e.target.value as
                                    | ProductType
                                    | "ALL"
                                )
                            }
                        >
                            <option value="ALL">
                                Todos los tipos
                            </option>
                            <option value="PRODUCT">Producto</option>
                            <option value="SERVICE">Servicio</option>
                            <option value="PACKAGE">Paquete</option>
                        </select>
                        <select
                            className="select select-bordered select-sm"
                            value={filterStatus}
                            onChange={(e) =>
                                setFilterStatus(
                                    e.target.value as
                                    | "ALL"
                                    | "ACTIVE"
                                    | "INACTIVE"
                                )
                            }
                        >
                            <option value="ALL">
                                Todos los estados
                            </option>
                            <option value="ACTIVE">Activos</option>
                            <option value="INACTIVE">
                                Inactivos
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Tipo</th>
                                    <th>Departamento</th>
                                    <th>Stock</th>
                                    <th>Precio</th>
                                    <th>Estado</th>
                                    <th className="text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-base-content/50 py-8"
                                        >
                                            {searchTerm ||
                                                filterType !== "ALL" ||
                                                filterStatus !== "ALL"
                                                ? "No se encontraron productos con esos filtros"
                                                : "No hay productos registrados"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((p) => {
                                        const status =
                                            getStockStatus(
                                                p.stock,
                                                p.type
                                            );
                                        return (
                                            <tr
                                                key={p.publicId}
                                                className={`hover ${!p.active
                                                        ? "opacity-50"
                                                        : ""
                                                    }`}
                                            >
                                                <td>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {p.name}
                                                            {p.requiresSchedule && (
                                                                <span
                                                                    className="tooltip"
                                                                    data-tip="Requiere agendar"
                                                                >
                                                                    <CalendarCheck className="w-3.5 h-3.5 text-primary" />
                                                                </span>
                                                            )}
                                                            {p.durationMinutes && (
                                                                <span
                                                                    className="tooltip"
                                                                    data-tip={`${p.durationMinutes} min`}
                                                                >
                                                                    <Clock className="w-3.5 h-3.5 text-secondary" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        {p.description && (
                                                            <div className="text-xs text-base-content/50 max-w-xs truncate">
                                                                {
                                                                    p.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge badge-sm ${typeBadgeColors[
                                                            p
                                                                .type
                                                            ]
                                                            }`}
                                                    >
                                                        {
                                                            typeLabels[
                                                            p
                                                                .type
                                                            ]
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-sm">
                                                        {p.department ||
                                                            "—"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {p.stock !==
                                                        null &&
                                                        p.stock !==
                                                        undefined ? (
                                                        <div className="flex items-center gap-2">
                                                            <span>
                                                                {
                                                                    p.stock
                                                                }
                                                            </span>
                                                            {p.stock ===
                                                                0 && (
                                                                    <span className="badge badge-error badge-xs">
                                                                        AGOTADO
                                                                    </span>
                                                                )}
                                                            {p.stock >
                                                                0 &&
                                                                p.stock <
                                                                10 && (
                                                                    <span className="badge badge-warning badge-xs">
                                                                        BAJO
                                                                    </span>
                                                                )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/40">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="font-mono">
                                                    $
                                                    {Number(
                                                        p.price
                                                    ).toFixed(2)}
                                                </td>
                                                <td>
                                                    {p.active ? (
                                                        <span className="badge badge-success badge-sm gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-success-content" />
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-error badge-sm gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-error-content" />
                                                            Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        {canManageProducts ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                                    data-tip="Ver"
                                                                    onClick={() =>
                                                                        openViewModal(
                                                                            p
                                                                        )
                                                                    }
                                                                >
                                                                    <Eye className="w-4 h-4 text-info" />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                                    data-tip="Editar"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            p
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="w-4 h-4 text-warning" />
                                                                </button>
                                                                <button
                                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                                    data-tip="Desactivar"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            p
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-error" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="btn btn-ghost btn-xs btn-square tooltip"
                                                                data-tip="Ver detalle"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        p
                                                                    )
                                                                }
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

            {canManageProducts && (
                <dialog ref={modalRef} className="modal">
                    <div className="modal-box max-w-lg">
                        <button
                            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                            onClick={closeModal}
                            type="button"
                        >
                            ✕
                        </button>

                        <h3 className="font-bold text-lg mb-6">
                            {editingProduct
                                ? "Editar Producto"
                                : "Nuevo Producto"}
                        </h3>

                        {formError && (
                            <div className="alert alert-error mb-4">
                                <XCircle className="w-4 h-4" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {editingProduct && (
                            <div
                                className={`rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 ${editingProduct.active
                                        ? "border-success/30 bg-success/5"
                                        : "border-error/30 bg-error/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${editingProduct.active
                                                ? "bg-success/20"
                                                : "bg-error/20"
                                            }`}
                                    >
                                        <Power
                                            className={`w-5 h-5 ${editingProduct.active
                                                    ? "text-success"
                                                    : "text-error"
                                                }`}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">
                                            Estado del producto
                                        </p>
                                        <p className="text-xs text-base-content/60">
                                            {editingProduct.active
                                                ? "Visible y disponible para venta"
                                                : "Oculto — actívalo para poder editarlo"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`badge ${editingProduct.active
                                                ? "badge-success"
                                                : "badge-error"
                                            }`}
                                    >
                                        {editingProduct.active
                                            ? "Activo"
                                            : "Inactivo"}
                                    </span>
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${editingProduct.active
                                                ? "btn-error btn-outline"
                                                : "btn-success"
                                            }`}
                                        onClick={handleToggleStatus}
                                        disabled={
                                            togglingId ===
                                            editingProduct.publicId
                                        }
                                    >
                                        {togglingId ===
                                            editingProduct.publicId ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Power className="w-4 h-4" />
                                        )}
                                        {editingProduct.active
                                            ? "Desactivar"
                                            : "Activar"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isFormDisabled && (
                            <div className="alert alert-warning mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                <div>
                                    <p className="font-semibold">
                                        Producto inactivo
                                    </p>
                                    <p className="text-sm">
                                        Debes activar el producto
                                        antes de poder modificar sus
                                        datos.
                                    </p>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text">
                                        Nombre{" "}
                                        <span className="text-error">
                                            *
                                        </span>
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej: Hamburguesa clásica"
                                    required
                                    disabled={isFormDisabled}
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">
                                            Tipo{" "}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </span>
                                    </div>
                                    <select
                                        className="select select-bordered w-full"
                                        value={formData.type}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "type",
                                                e.target.value
                                            )
                                        }
                                        required
                                        disabled={isFormDisabled}
                                    >
                                        <option value="PRODUCT">
                                            Producto
                                        </option>
                                        <option value="SERVICE">
                                            Servicio
                                        </option>
                                        <option value="PACKAGE">
                                            Paquete
                                        </option>
                                    </select>
                                </label>

                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">
                                            Departamento{" "}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={formData.department}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "department",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ej: Cocina, Bebidas"
                                        required
                                        disabled={isFormDisabled}
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">
                                            Precio{" "}
                                            <span className="text-error">
                                                *
                                            </span>
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="input input-bordered"
                                        value={formData.price}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "price",
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                        disabled={isFormDisabled}
                                    />
                                </label>
                                <label className="form-control">
                                    <div className="label">
                                        <span className="label-text">
                                            Stock
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input input-bordered"
                                        value={formData.stock}
                                        onChange={(e) =>
                                            handleFormChange(
                                                "stock",
                                                e.target.value
                                            )
                                        }
                                        placeholder="0"
                                        disabled={isFormDisabled}
                                    />
                                </label>
                            </div>

                            {(formData.type === "SERVICE" ||
                                formData.type === "PACKAGE") && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text">
                                                    Duración (min)
                                                </span>
                                            </div>
                                            <input
                                                type="number"
                                                min="1"
                                                className="input input-bordered"
                                                value={
                                                    formData.durationMinutes
                                                }
                                                onChange={(e) =>
                                                    handleFormChange(
                                                        "durationMinutes",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="60"
                                                disabled={isFormDisabled}
                                            />
                                        </label>
                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text">
                                                    ¿Requiere agendar?
                                                </span>
                                            </div>
                                            <div className="flex items-center h-12">
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary"
                                                    checked={
                                                        formData.requiresSchedule
                                                    }
                                                    onChange={(e) =>
                                                        handleFormChange(
                                                            "requiresSchedule",
                                                            e.target
                                                                .checked
                                                        )
                                                    }
                                                    disabled={
                                                        isFormDisabled
                                                    }
                                                />
                                                <span className="ml-3 text-sm text-base-content/60">
                                                    {formData.requiresSchedule
                                                        ? "Sí"
                                                        : "No"}
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                )}

                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text">
                                        Descripción
                                    </span>
                                </div>
                                <textarea
                                    className="textarea textarea-bordered h-24"
                                    value={formData.description}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Descripción opcional..."
                                    disabled={isFormDisabled}
                                />
                            </label>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        saving || isFormDisabled
                                    }
                                >
                                    {saving && (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    )}
                                    {editingProduct
                                        ? "Guardar cambios"
                                        : "Crear producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <form
                        method="dialog"
                        className="modal-backdrop"
                    >
                        <button type="button" onClick={closeModal}>
                            close
                        </button>
                    </form>
                </dialog>
            )}

            <dialog ref={viewModalRef} className="modal">
                <div className="modal-box">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                        onClick={closeViewModal}
                        type="button"
                    >
                        ✕
                    </button>

                    <h3 className="font-bold text-lg mb-6">
                        Detalle del Producto
                    </h3>

                    {viewingProduct && (
                        <div className="space-y-4">
                            <div
                                className={`rounded-xl p-4 flex items-center gap-3 border ${viewingProduct.active
                                        ? "border-success/30 bg-success/5"
                                        : "border-error/30 bg-error/5"
                                    }`}
                            >
                                <Power
                                    className={`w-5 h-5 ${viewingProduct.active
                                            ? "text-success"
                                            : "text-error"
                                        }`}
                                />
                                <span className="font-semibold">
                                    {viewingProduct.active
                                        ? "Producto activo"
                                        : "Producto inactivo"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Nombre
                                    </p>
                                    <p className="font-semibold">
                                        {viewingProduct.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Tipo
                                    </p>
                                    <span
                                        className={`badge ${typeBadgeColors[
                                            viewingProduct.type
                                            ]
                                            }`}
                                    >
                                        {
                                            typeLabels[
                                            viewingProduct.type
                                            ]
                                        }
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Precio
                                    </p>
                                    <p className="font-semibold font-mono">
                                        $
                                        {Number(
                                            viewingProduct.price
                                        ).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Stock
                                    </p>
                                    <p className="font-semibold">
                                        {viewingProduct.stock !==
                                            null &&
                                            viewingProduct.stock !==
                                            undefined
                                            ? viewingProduct.stock
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Departamento
                                    </p>
                                    <p className="font-semibold">
                                        {viewingProduct.department ||
                                            "—"}
                                    </p>
                                </div>
                                {viewingProduct.durationMinutes && (
                                    <div>
                                        <p className="text-sm text-base-content/50">
                                            Duración
                                        </p>
                                        <p className="font-semibold">
                                            {
                                                viewingProduct.durationMinutes
                                            }{" "}
                                            min
                                        </p>
                                    </div>
                                )}
                                {viewingProduct.requiresSchedule !==
                                    null &&
                                    viewingProduct.requiresSchedule !==
                                    undefined && (
                                        <div>
                                            <p className="text-sm text-base-content/50">
                                                Requiere agendar
                                            </p>
                                            <p className="font-semibold">
                                                {viewingProduct.requiresSchedule
                                                    ? "Sí"
                                                    : "No"}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {viewingProduct.description && (
                                <div>
                                    <p className="text-sm text-base-content/50">
                                        Descripción
                                    </p>
                                    <p className="mt-1">
                                        {viewingProduct.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-xs text-base-content/40 pt-2 border-t border-base-200">
                                <div>
                                    <p>Creado</p>
                                    <p>
                                        {new Date(
                                            viewingProduct.createdAt
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p>Actualizado</p>
                                    <p>
                                        {new Date(
                                            viewingProduct.updatedAt
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-action">
                        <button
                            className="btn btn-ghost"
                            onClick={closeViewModal}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
                <form
                    method="dialog"
                    className="modal-backdrop"
                >
                    <button
                        type="button"
                        onClick={closeViewModal}
                    >
                        close
                    </button>
                </form>
            </dialog>
        </div>
    );
}