import { Link } from "react-router";
import { Package, PlusCircle, ArrowRight } from "lucide-react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Mi Tienda — Inicio" },
    { name: "description", content: "Bienvenido a la tienda" },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* HERO */}
      <div className="hero min-h-[60vh] bg-base-100 rounded-box shadow-sm">
        <div className="hero-content text-center">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold">
              Bienvenido a{" "}
              <span className="text-primary">Mi Tienda</span>
            </h1>
            <p className="py-6 text-lg text-base-content/70">
              Gestiona tus productos de forma rápida y sencilla.
              Crea, edita y elimina productos con facilidad.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/products" className="btn btn-primary gap-2">
                <Package className="w-5 h-5" />
                Ver Productos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products/new" className="btn btn-outline gap-2">
                <PlusCircle className="w-5 h-5" />
                Crear Producto
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full">
        {[
          {
            title: "Crear",
            desc: "Agrega nuevos productos con nombre, descripción y precio.",
            icon: "📦",
          },
          {
            title: "Editar",
            desc: "Modifica la información de tus productos existentes.",
            icon: "✏️",
          },
          {
            title: "Eliminar",
            desc: "Elimina productos que ya no necesites en tu catálogo.",
            icon: "🗑️",
          },
        ].map((f) => (
          <div key={f.title} className="card bg-base-100 shadow-sm">
            <div className="card-body items-center text-center">
              <span className="text-4xl">{f.icon}</span>
              <h2 className="card-title">{f.title}</h2>
              <p className="text-base-content/60">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}