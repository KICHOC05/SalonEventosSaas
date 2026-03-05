// app/components/DashLayout.tsx
import { useEffect } from "react";
import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router";
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
  Building2,
} from "lucide-react";
import { useAuth } from "~/lib/auth";

/* ── Tipo para items de navegación ── */
interface NavItem {
  to: string;
  icon: typeof BarChart3;
  label: string;
  roles?: string[]; // Si no se define, todos pueden ver
}

/* ── Navegación del sidebar con roles ── */
const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/dashboard/eventos", icon: Calendar, label: "Gestión de Eventos" },
  { to: "/dashboard/inventario", icon: UtensilsCrossed, label: "Inventario de Menús" },
  { to: "/dashboard/pos", icon: Receipt, label: "Punto de Venta" },
  { to: "/dashboard/estadisticas", icon: PieChart, label: "Estadísticas" },
  {
    to: "/dashboard/usuarios",
    icon: Users,
    label: "Usuarios",
    roles: ["ADMIN", "MANAGER"], // ← Solo ADMIN y MANAGER
  },
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

/* ── Etiquetas de rol ── */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  CASHIER: "Cajero",
  EMPLOYEE: "Empleado",
};

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Space Kids";

  // ── Protección de ruta ──
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/dashboard/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-4 text-base-content/50">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/dashboard/login", { replace: true });
  };

  // ═══════════════════════════════════════════════════
  // FILTRAR ITEMS DE NAVEGACIÓN SEGÚN EL ROL
  // ═══════════════════════════════════════════════════
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    // Si no tiene restricción de roles, todos pueden ver
    if (!item.roles) return true;
    // Si tiene roles definidos, verificar que el usuario tenga uno de ellos
    return item.roles.includes(role);
  });

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
                {user.businessName} — {user.branchName}
              </p>
            </div>
          </div>

          <div className="navbar-end gap-2">
            {/* Sucursal actual */}
            <div className="hidden md:flex items-center gap-1 text-sm text-base-content/60 mr-2">
              <Building2 className="w-4 h-4" />
              <span>{user.branchName}</span>
            </div>

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
                  <div className="bg-gradient-to-r from-primary to-secondary w-8 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="hidden sm:inline text-sm">{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box w-56 p-2 shadow-lg border border-base-300 mt-2 z-50"
              >
                <li className="menu-title">
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs font-normal opacity-60">
                      {user.email}
                    </span>
                    <span className="badge badge-primary badge-xs mt-1">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                </li>
                <div className="divider my-0" />
                <li>
                  <NavLink to="/dashboard/configuracion">
                    <Settings className="w-4 h-4" /> Configuración
                  </NavLink>
                </li>
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
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
            <div>
              <span className="text-xl font-bold text-primary">Space Kids</span>
              <p className="text-[10px] text-base-content/40 -mt-1">
                {user.businessName}
              </p>
            </div>
          </div>

          {/* ═══ MENÚ FILTRADO POR ROL ═══ */}
          <ul className="menu menu-lg flex-1 p-4 gap-1">
            {visibleNavItems.map(({ to, icon: Icon, label }) => (
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
                <div className="bg-gradient-to-r from-primary to-secondary w-8 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-base-content/50">
                  {ROLE_LABELS[user.role] || user.role}
                </p>
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
                <button onClick={handleLogout} className="text-error">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}