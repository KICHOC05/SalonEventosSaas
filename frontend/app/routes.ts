import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [

    layout("components/Layout.tsx", [
        index("routes/index.tsx"),
    ]),


    layout("components/DashLayout.tsx", [
        route("dashboard", "routes/dashboard/dashboard.tsx"),
        route("dashboard/eventos", "routes/dashboard/eventos.tsx"),
        route("dashboard/inventario", "routes/dashboard/inventario.tsx"),
        route("dashboard/pos", "routes/dashboard/pos.tsx"),
        route("dashboard/estadisticas", "routes/dashboard/estadisticas.tsx"),
        route("dashboard/usuarios", "routes/dashboard/usuarios.tsx"),
        route("dashboard/configuracion", "routes/dashboard/configuracion.tsx"),
    ]),

    route("/galeria", "routes/galeria.tsx"),

    route("products", "routes/product-list.tsx"),
    route("products/new", "routes/product-form.tsx", { id: "create-product" }),
    route("products/:id", "routes/product-detail.tsx"),
    route("products/:id/edit", "routes/product-form.tsx", { id: "edit-product" }),
] satisfies RouteConfig;