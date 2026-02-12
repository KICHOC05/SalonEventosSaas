import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Save,
  ArrowLeft,
  PlusCircle,
  Pencil,
  Type,
  FileText,
  DollarSign,
} from "lucide-react";
import { productApi, type ProductRequest } from "../services/api";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<ProductRequest>({
    name: "",
    description: "",
    price: 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      productApi.getById(Number(id)).then((p) =>
        setForm({ name: p.name, description: p.description, price: p.price })
      );
    }
  }, [id, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && id) {
        await productApi.update(Number(id), form);
      } else {
        await productApi.create(form);
      }
      navigate("/products");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* BREADCRUMB */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/products">Productos</Link></li>
          <li className="font-semibold">
            {isEditing ? "Editar" : "Nuevo"}
          </li>
        </ul>
      </div>

      {/* CARD */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl gap-2">
            {isEditing ? (
              <>
                <Pencil className="w-6 h-6 text-warning" />
                Editar Producto
              </>
            ) : (
              <>
                <PlusCircle className="w-6 h-6 text-primary" />
                Nuevo Producto
              </>
            )}
          </h1>

          <div className="divider"></div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* NOMBRE */}
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text flex items-center gap-1">
                  <Type className="w-4 h-4" /> Nombre
                </span>
              </div>
              <input
                name="name"
                type="text"
                placeholder="Ej: Laptop Gamer"
                className="input input-bordered w-full"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            {/* DESCRIPCIÓN */}
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Descripción
                </span>
              </div>
              <textarea
                name="description"
                placeholder="Descripción del producto..."
                className="textarea textarea-bordered w-full h-28"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            {/* PRECIO */}
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Precio
                </span>
              </div>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="input input-bordered w-full"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            {/* BOTONES */}
            <div className="flex justify-end gap-2 mt-4">
              <Link to="/products" className="btn btn-ghost gap-2">
                <ArrowLeft className="w-4 h-4" />
                Cancelar
              </Link>
              <button
                type="submit"
                className={`btn ${isEditing ? "btn-warning" : "btn-primary"} gap-2`}
                disabled={saving}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEditing ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}