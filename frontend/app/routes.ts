import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
    // ── Sitio público ──
    layout("components/Layout.tsx", [
        index("routes/index.tsx"),
    ]),

    // ── Login del dashboard
    route("dashboard/login", "routes/dashboard/login.tsx"),

    // ── Dashboard protegido ──
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
] satisfies RouteConfig;