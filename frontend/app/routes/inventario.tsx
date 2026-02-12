// app/routes/inventario.tsx
import { useState, useRef } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Download,
    Package,
    AlertTriangle,
    XCircle,
} from "lucide-react";
import { inventoryProducts as initial, type InventoryProduct } from "~/data/mockData";

export default function Inventario() {
    const [products, setProducts] = useState<InventoryProduct[]>(initial);
    const modalRef = useRef<HTMLDialogElement>(null);

    const handleDelete = (id: number) => {
        if (confirm("¿Eliminar este producto?")) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const stock = Number(fd.get("stock"));
        const newProduct: InventoryProduct = {
            id: Date.now(),
            name: fd.get("name") as string,
            category: fd.get("category") as string,
            price: Number(fd.get("price")),
            stock,
            status: stock < 10 ? "low" : "optimal",
        };
        setProducts((prev) => [...prev, newProduct]);
        modalRef.current?.close();
        e.currentTarget.reset();
    };

    const optimal = products.filter((p) => p.status === "optimal").length;
    const low = products.filter((p) => p.status === "low").length;
    const out = products.filter((p) => p.stock === 0).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Inventario de Menús</h2>
                <div className="flex gap-3">
                    <button className="btn btn-outline btn-sm gap-2">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                    <button className="btn btn-primary btn-sm gap-2" onClick={() => modalRef.current?.showModal()}>
                        <Plus className="w-4 h-4" /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                    <th>Precio</th>
                                    <th>Estado</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id} className="hover">
                                        <td className="font-medium">{p.name}</td>
                                        <td>{p.category}</td>
                                        <td>
                                            {p.stock}
                                            {p.stock < 10 && <span className="badge badge-error badge-xs ml-2">BAJO</span>}
                                            {p.stock >= 10 && p.stock < 20 && <span className="badge badge-warning badge-xs ml-2">MEDIO</span>}
                                        </td>
                                        <td>${p.price}</td>
                                        <td>
                                            <span className={`badge badge-sm ${p.status === "optimal" ? "badge-success" : "badge-warning"}`}>
                                                {p.status === "optimal" ? "Óptimo" : "Bajo"}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button className="btn btn-ghost btn-xs btn-square"><Pencil className="w-4 h-4 text-warning" /></button>
                                                <button className="btn btn-ghost btn-xs btn-square" onClick={() => handleDelete(p.id)}>
                                                    <Trash2 className="w-4 h-4 text-error" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Package, label: "Stock óptimo", value: `${optimal} productos`, color: "text-success", bg: "bg-success/10" },
                    { icon: AlertTriangle, label: "Stock bajo", value: `${low} productos`, color: "text-warning", bg: "bg-warning/10" },
                    { icon: XCircle, label: "Agotados", value: `${out} productos`, color: "text-error", bg: "bg-error/10" },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="card bg-base-100 shadow-sm">
                        <div className="card-body flex-row items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-base-content/50">{label}</p>
                                <h3 className="text-xl font-bold">{value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══ Modal nuevo producto ═══ */}
            <dialog ref={modalRef} className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
                    </form>
                    <h3 className="font-bold text-lg mb-6">Nuevo Producto</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Nombre</span></div>
                            <input name="name" type="text" className="input input-bordered w-full" required />
                        </label>
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Categoría</span></div>
                            <select name="category" className="select select-bordered w-full" required>
                                <option value="">Selecciona</option>
                                <option value="Comida">Comida</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Extras">Extras</option>
                                <option value="Decoración">Decoración</option>
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="form-control">
                                <div className="label"><span className="label-text">Precio</span></div>
                                <input name="price" type="number" step="0.01" className="input input-bordered" required />
                            </label>
                            <label className="form-control">
                                <div className="label"><span className="label-text">Stock inicial</span></div>
                                <input name="stock" type="number" className="input input-bordered" required />
                            </label>
                        </div>
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Descripción</span></div>
                            <textarea name="description" className="textarea textarea-bordered h-24" />
                        </label>
                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={() => modalRef.current?.close()}>Cancelar</button>
                            <button type="submit" className="btn btn-primary">Guardar producto</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
}