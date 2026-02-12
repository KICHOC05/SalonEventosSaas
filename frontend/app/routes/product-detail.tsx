import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Pencil,
  DollarSign,
  FileText,
  Tag,
} from "lucide-react";
import { productApi, type Product } from "../services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      productApi.getById(Number(id)).then(setProduct).catch(console.error);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* BREADCRUMB */}
      <div className="breadcrumbs text-sm mb-6">
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/products">Productos</Link></li>
          <li className="font-semibold">{product.name}</li>
        </ul>
      </div>

      {/* CARD */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-2">
            <div className="badge badge-ghost">#{product.id}</div>
            <div className="badge badge-primary badge-lg gap-1">
              <DollarSign className="w-3 h-3" />
              {product.price.toFixed(2)}
            </div>
          </div>

          <h1 className="card-title text-3xl flex items-center gap-2">
            <Tag className="w-7 h-7 text-primary" />
            {product.name}
          </h1>

          <div className="divider"></div>

          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-base-content/40 mt-0.5" />
            <p className="text-base-content/70 text-lg">
              {product.description || "Sin descripción"}
            </p>
          </div>

          <div className="card-actions justify-end mt-6">
            <Link to="/products" className="btn btn-ghost gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
            <Link
              to={`/products/${product.id}/edit`}
              className="btn btn-warning gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}