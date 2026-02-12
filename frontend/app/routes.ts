import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
    index("routes/dashboard.tsx"),

    route("eventos", "routes/eventos.tsx"),
    route("inventario", "routes/inventario.tsx"),
    route("pos", "routes/pos.tsx"),
    route("estadisticas", "routes/estadisticas.tsx"),
    route("usuarios", "routes/usuarios.tsx"),
    route("configuracion", "routes/configuracion.tsx"),

    route("products", "routes/product-list.tsx"),
    route("products/new", "routes/product-form.tsx", { id: "create-product" }),
    route("products/:id", "routes/product-detail.tsx"),
    route("products/:id/edit", "routes/product-form.tsx", { id: "edit-product" }),
] satisfies RouteConfig;