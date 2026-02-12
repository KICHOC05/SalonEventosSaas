import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Package,
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  Search,
  PackageOpen,
} from "lucide-react";
import { productApi, type Product } from "../services/api";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .getAll()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await productApi.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            Productos
          </h1>
          <p className="text-base-content/60 mt-1">
            {products.length} producto{products.length !== 1 && "s"} registrado
            {products.length !== 1 && "s"}
          </p>
        </div>
        <Link to="/products/new" className="btn btn-primary gap-2">
          <PlusCircle className="w-5 h-5" />
          Nuevo Producto
        </Link>
      </div>

      {/* TABLA O EMPTY STATE */}
      {products.length === 0 ? (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-16">
            <PackageOpen className="w-16 h-16 text-base-content/30" />
            <h2 className="card-title mt-4">No hay productos</h2>
            <p className="text-base-content/60">
              Comienza creando tu primer producto
            </p>
            <Link to="/products/new" className="btn btn-primary mt-4 gap-2">
              <PlusCircle className="w-5 h-5" />
              Crear Producto
            </Link>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover">
                  <td>
                    <div className="badge badge-ghost">#{p.id}</div>
                  </td>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-base-content/60 max-w-xs truncate">
                    {p.description || "—"}
                  </td>
                  <td>
                    <div className="badge badge-primary badge-lg">
                      ${p.price.toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-center gap-1">
                      <Link
                        to={`/products/${p.id}`}
                        className="btn btn-ghost btn-sm btn-square tooltip"
                        data-tip="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/products/${p.id}/edit`}
                        className="btn btn-ghost btn-sm btn-square tooltip"
                        data-tip="Editar"
                      >
                        <Pencil className="w-4 h-4 text-warning" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-ghost btn-sm btn-square tooltip"
                        data-tip="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}