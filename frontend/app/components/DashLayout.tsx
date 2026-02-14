import { Outlet, Link, NavLink, useLocation } from "react-router";
import {
  Rocket,
  BarChart3,
  Calendar,
  UtensilsCrossed,
  Receipt,
  PieChart,
  Users,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
} from "lucide-react";

/* ── Navegación del sidebar ── */
const NAV_ITEMS = [
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/dashboard/eventos", icon: Calendar, label: "Gestión de Eventos" },
  { to: "/dashboard/inventario", icon: UtensilsCrossed, label: "Inventario de Menús" },
  { to: "/dashboard/pos", icon: Receipt, label: "Punto de Venta" },
  { to: "/dashboard/estadisticas", icon: PieChart, label: "Estadísticas" },
  { to: "/dashboard/usuarios", icon: Users, label: "Usuarios" },
];

/* ── Títulos por ruta ── */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard General",
  "/dashboard/eventos": "Gestión de Eventos",
  "/dashboard/inventario": "Inventario de Menús",
  "/dashboard/pos": "Punto de Venta",
  "/dashboard/estadisticas": "Estadísticas de Ventas",
  "/dashboard/usuarios": "Gestión de Usuarios",
  "/dashboard/configuracion": "Configuración",
};

export default function DashboardLayout() {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Space Kids";

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar" type="checkbox" className="drawer-toggle" />

      {/* ═══ CONTENIDO PRINCIPAL ═══ */}
      <div className="drawer-content flex flex-col bg-base-200">
        {/* Topbar */}
        <div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-40">
          <div className="navbar-start">
            <label
              htmlFor="sidebar"
              className="btn btn-ghost btn-square lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </label>
            <div className="ml-2">
              <h2 className="text-lg font-semibold">{pageTitle}</h2>
              <p className="text-xs text-base-content/50 hidden sm:block">
                Panel de administración de Space Kids
              </p>
            </div>
          </div>

          <div className="navbar-end gap-2">
            {/* Notificaciones */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle indicator"
              >
                <Bell className="w-5 h-5" />
                <span className="indicator-item badge badge-error badge-xs">
                  3
                </span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box w-72 p-2 shadow-lg border border-base-300 mt-2 z-50"
              >
                <li className="menu-title">Notificaciones</li>
                <li>
                  <a>📅 Evento mañana a las 14:00</a>
                </li>
                <li>
                  <a>⚠️ Stock bajo de cupcakes</a>
                </li>
                <li>
                  <a>💬 Nuevo mensaje de cliente</a>
                </li>
              </ul>
            </div>

            {/* Perfil */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost gap-2"
              >
                <div className="avatar placeholder">
                  <div className="bg-gradient-to-r from-primary to-secondary w-8 rounded-full" />
                </div>
                <span className="hidden sm:inline text-sm">
                  María González
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow-lg border border-base-300 mt-2 z-50"
              >
                <li>
                  <a>
                    <Settings className="w-4 h-4" /> Configuración
                  </a>
                </li>
                <li>
                  <a className="text-error">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contenido de la ruta */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* ═══ SIDEBAR ═══ */}
      <div className="drawer-side z-50">
        <label
          htmlFor="sidebar"
          aria-label="cerrar sidebar"
          className="drawer-overlay"
        />
        <aside className="bg-base-100 border-r border-base-300 w-64 min-h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-base-300 flex items-center gap-3">
            <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-content" />
            </div>
            <span className="text-xl font-bold text-primary">Space Kids</span>
          </div>

          {/* Menú */}
          <ul className="menu menu-lg flex-1 p-4 gap-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/dashboard"}
                  className={({ isActive }) =>
                    isActive ? "active font-semibold" : ""
                  }
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-base-300">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="avatar placeholder">
                <div className="bg-gradient-to-r from-primary to-secondary w-8 rounded-full" />
              </div>
              <div>
                <p className="text-sm font-medium">Admin Space Kids</p>
                <p className="text-xs text-base-content/50">Administrador</p>
              </div>
            </div>
            <ul className="menu menu-sm p-0 gap-1">
              <li>
                <NavLink
                  to="/dashboard/configuracion"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <Settings className="w-4 h-4" /> Configuración
                </NavLink>
              </li>
              <li>
                <Link to="/" className="text-error">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}