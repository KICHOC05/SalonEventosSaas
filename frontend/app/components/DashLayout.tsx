import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import {
  Rocket,
  BarChart3,
  Calendar,
  PackageSearch,
  Receipt,
  PieChart,
  Users,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  Building2,
  X,
  Moon,
  Sun,
  Clock,
} from "lucide-react";
import { useAuth } from "~/lib/auth";
import { useNotifications } from "~/context/NotificationContext";

import TimerNotificationWatcher from "~/components/TimerNotificationWatcher";

interface NavItem {
  to: string;
  icon: typeof BarChart3;
  label: string;
  description?: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", icon: BarChart3, label: "Dashboard", description: "Vista general" },
  { to: "/dashboard/timers", icon: Clock, label: "Timers", description: "Sesiones activas" },
  { to: "/dashboard/eventos", icon: Calendar, label: "Eventos", description: "Gestión de eventos" },
  { to: "/dashboard/inventario", icon: PackageSearch, label: "Inventario", description: "Productos y stock" },
  { to: "/dashboard/pos", icon: Receipt, label: "Punto de Venta", description: "Ventas rápidas" },
  { to: "/dashboard/estadisticas", icon: PieChart, label: "Estadísticas", description: "Métricas y análisis" },
  {
    to: "/dashboard/usuarios",
    icon: Users,
    label: "Usuarios",
    description: "Gestión de accesos",
    roles: ["ADMIN", "MANAGER"],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard General",
  "/dashboard/timers": "Timers Activos",
  "/dashboard/eventos": "Gestión de Eventos",
  "/dashboard/inventario": "Inventario de Menús",
  "/dashboard/pos": "Punto de Venta",
  "/dashboard/estadisticas": "Estadísticas de Ventas",
  "/dashboard/usuarios": "Gestión de Usuarios",
  "/dashboard/configuracion": "Configuración",
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrador", color: "badge-error" },
  MANAGER: { label: "Gerente", color: "badge-warning" },
  CASHIER: { label: "Cajero", color: "badge-info" },
  EMPLOYEE: { label: "Empleado", color: "badge-success" },
};

function UserAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";

  return (
    <div className="avatar placeholder">
      <div
        className={`bg-gradient-to-br from-primary via-secondary to-accent ${sizeClasses} rounded-xl flex items-center justify-center shadow-md`}
      >
        <span className="text-white font-bold tracking-wide">{initials}</span>
      </div>
    </div>
  );
}

function NotificationDropdown() {
  const { 
    notifications, 
    markAllAsRead, 
    removeNotification, 
    clearNotifications 
  } = useNotifications();
  
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative group">
        <Bell className="w-5 h-5 group-hover:animate-swing" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-error text-[10px] text-white items-center justify-center font-bold">
              {unreadCount}
            </span>
          </span>
        )}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content bg-base-100 rounded-2xl w-80 shadow-2xl border border-base-300/50 mt-3 z-50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-base-300/50 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          <div className="flex items-center gap-1">
            <button 
              className="btn btn-ghost btn-xs text-primary"
              onClick={clearNotifications}
            >
              Limpiar
            </button>
            <button 
              className="btn btn-ghost btn-xs text-primary"
              onClick={markAllAsRead}
            >
              Marcar todas
            </button>
          </div>
        </div>
        <ul className="divide-y divide-base-300/30 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <Bell className="w-12 h-12 text-base-content/20" />
              <p className="text-sm text-base-content/50 text-center">
                No hay notificaciones
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id} className="relative group/item">
                <button className="w-full text-left px-4 py-3 hover:bg-base-200/50 transition-colors flex items-start gap-3 pr-8">
                  <span className="text-xl mt-0.5">
                    {notification.type === "warning"
                      ? "⚠️"
                      : notification.type === "success"
                      ? "✅"
                      : "ℹ️"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity btn btn-ghost btn-xs btn-square"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="px-4 py-2.5 border-t border-base-300/50">
          <button className="btn btn-ghost btn-sm btn-block text-primary">Ver todas</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Space Kids";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/dashboard/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <span className="loading loading-spinner loading-lg text-primary" />
            <div className="absolute inset-0 animate-ping">
              <span className="loading loading-spinner loading-lg text-primary/20" />
            </div>
          </div>
          <p className="text-base-content/50 animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    navigate("/dashboard/login", { replace: true });
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role, color: "badge-ghost" };

  return (
    <div className="flex h-screen bg-base-200 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-base-100 border-r border-base-300/50
          flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-5 border-b border-base-300/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Rocket className="w-5 h-5 text-primary-content" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-base-100" />
              </div>
              <div>
                <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Space Kids
                </span>
                <p className="text-[10px] text-base-content/40 font-medium tracking-wide uppercase">
                  {user.businessName}
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-square lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {visibleNavItems.map(({ to, icon: Icon, label, description }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/dashboard"}
                className={({ isActive }) => `
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 relative
                  ${isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-200/80"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    <div
                      className={`
                        w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0
                        ${isActive ? "bg-primary/15" : "bg-base-200/60 group-hover:bg-base-300/60"}
                      `}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-tight">{label}</p>
                      {description && (
                        <p className="text-[10px] text-base-content/40 leading-tight mt-0.5 truncate">
                          {description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-base-300/50">
          <div className="bg-base-200/50 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <span className={`badge ${roleInfo.color} badge-xs mt-0.5`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <NavLink
                to="/dashboard/configuracion"
                className={({ isActive }) =>
                  `btn btn-sm flex-1 gap-1.5 ${isActive ? "btn-primary" : "btn-ghost"}`
                }
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="text-xs">Ajustes</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-1.5 flex-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-base-100/80 backdrop-blur-xl border-b border-base-300/50 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                className="btn btn-ghost btn-sm btn-square lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold leading-tight">{pageTitle}</h1>
                <div className="flex items-center gap-1.5 text-xs text-base-content/40">
                  <Building2 className="w-3 h-3" />
                  <span>{user.businessName}</span>
                  <span>•</span>
                  <span>{user.branchName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <NotificationDropdown />

              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost gap-2 pl-2 pr-3 rounded-xl hover:bg-base-200/80"
                >
                  <UserAvatar name={user.name} />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-[10px] text-base-content/40">{roleInfo.label}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-base-content/40" />
                </div>
                <div
                  tabIndex={0}
                  className="dropdown-content bg-base-100 rounded-2xl w-64 shadow-2xl border border-base-300/50 mt-2 z-50 overflow-hidden"
                >
                  <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-base-content/50 truncate">{user.email}</p>
                        <span className={`badge ${roleInfo.color} badge-xs mt-1`}>
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <NavLink
                      to="/dashboard/configuracion"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200/80 transition-colors text-sm"
                    >
                      <Settings className="w-4 h-4 text-base-content/50" />
                      Configuración
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-error/10 transition-colors text-sm text-error w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            <TimerNotificationWatcher />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}