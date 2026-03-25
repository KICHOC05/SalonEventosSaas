import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  UserPlus,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  AlertCircle,
  KeyRound,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Lock,
  X,
  Users,
  Building2,
  Mail,
  Calendar,
  MoreVertical,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
  changeUserPassword,
  fetchBranches,
  type UserResponse,
  type CreateUserRequest,
  type UpdateUserRequest,
  type BranchResponse,
} from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { buildMeta } from "~/lib/meta";

export function meta() {
  return buildMeta("Usuarios", "Gestión de usuarios");
}

type UserRole = "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: typeof Shield;
  }
> = {
  ADMIN: {
    label: "Administrador",
    color: "badge-error",
    bgColor: "bg-error/10",
    textColor: "text-error",
    icon: ShieldAlert,
  },
  MANAGER: {
    label: "Gerente",
    color: "badge-warning",
    bgColor: "bg-warning/10",
    textColor: "text-warning",
    icon: ShieldCheck,
  },
  CASHIER: {
    label: "Cajero",
    color: "badge-info",
    bgColor: "bg-info/10",
    textColor: "text-info",
    icon: Shield,
  },
  EMPLOYEE: {
    label: "Empleado",
    color: "badge-ghost",
    bgColor: "bg-base-200",
    textColor: "text-base-content/60",
    icon: User,
  },
};


function UserAvatar({
  name,
  active = true,
  size = "sm",
}: {
  name: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div className={`avatar placeholder ${!active ? "opacity-50" : ""}`}>
      <div
        className={`
          bg-gradient-to-br from-primary via-secondary to-accent
          ${sizeClasses[size]} rounded-xl flex items-center justify-center
          shadow-md shadow-primary/10
        `}
      >
        <span className="text-white font-bold tracking-wide">{initials}</span>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
        border ${config.bgColor} ${config.textColor} border-current/10
      `}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border
        ${active
          ? "bg-success/10 text-success border-success/20"
          : "bg-error/10 text-error border-error/20"
        }
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-success animate-pulse" : "bg-error"}`}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function PasswordInput({
  name,
  placeholder,
  required = true,
  minLength = 6,
  value,
  onChange,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  value: string;
  onChange: (val: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  const strength =
    value.length === 0
      ? 0
      : value.length < 6
        ? 1
        : value.length < 10
          ? 2
          : 3;
  const strengthColors = ["", "bg-error", "bg-warning", "bg-success"];
  const strengthLabels = ["", "Débil", "Media", "Fuerte"];

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          name={name}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="input input-bordered w-full pr-10"
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/60 transition-colors"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? strengthColors[strength] : "bg-base-300/50"
                  }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-base-content/40 font-medium">
            {strengthLabels[strength]}
          </span>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 bg-base-100 rounded-xl p-3.5 border border-base-300/30 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] text-base-content/40 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-xl font-extrabold leading-tight">{value}</p>
      </div>
    </div>
  );
}

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast toast-top toast-end z-[100] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border animate-slide-up
            ${toast.type === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-error/10 border-error/20 text-error"
            }
          `}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function Modal({
  dialogRef,
  children,
  maxWidth = "max-w-lg",
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className={`modal-box rounded-t-3xl sm:rounded-2xl ${maxWidth} p-0 overflow-hidden`}>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

function ModalHeader({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 pb-0">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg">{title}</h3>
          {subtitle && <p className="text-xs text-base-content/40">{subtitle}</p>}
        </div>
      </div>
      <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}


export default function Usuarios() {
  const { role, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin && !isManager) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAdmin, isManager, navigate]);

  if (!isAdmin && !isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-20 h-20 rounded-2xl bg-error/10 flex items-center justify-center">
          <Lock className="w-10 h-10 text-error" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-error">Acceso Denegado</h2>
          <p className="text-base-content/50 max-w-md text-sm">
            Necesitas rol de <strong>Administrador</strong> o <strong>Gerente</strong> para
            acceder a esta sección.
          </p>
        </div>
        <button className="btn btn-primary gap-2" onClick={() => navigate("/dashboard")}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const canCreate = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canChangePassword = isAdmin;
  const canToggleStatus = isAdmin;

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const createModalRef = useRef<HTMLDialogElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const passwordModalRef = useRef<HTMLDialogElement>(null);
  const confirmModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: UserResponse;
    action: "activate" | "deactivate";
  } | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const resetCreateForm = () => {
    setCreatePassword("");
    setCreateConfirmPassword("");
    setFormError(null);
  };

  const resetPasswordForm = () => {
    setNewPassword("");
    setConfirmNewPassword("");
    setFormError(null);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, branchesData] = await Promise.all([fetchUsers(), fetchBranches()]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branchName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && u.active) ||
      (filterStatus === "INACTIVE" && !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });


  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (createPassword !== createConfirmPassword) {
      setFormError("Las contraseñas no coinciden");
      setSubmitting(false);
      return;
    }
    if (createPassword.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      setSubmitting(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    const request: CreateUserRequest = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password: createPassword,
      branchId: Number(fd.get("branchId")),
      role: fd.get("role") as UserRole,
    };

    try {
      const newUser = await createUser(request);
      setUsers((prev) => [...prev, newUser]);
      createFormRef.current?.reset();
      resetCreateForm();
      createModalRef.current?.close();
      showToast("success", `Usuario "${newUser.name}" creado exitosamente`);
    } catch {
      setFormError("No se pudo crear el usuario. Verifica los datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const request: UpdateUserRequest = {
      name: fd.get("name") as string,
      branchId: Number(fd.get("branchId")),
      role: fd.get("role") as UserRole,
    };

    try {
      const updated = await updateUser(editingUser.publicId, request);
      setUsers((prev) => prev.map((u) => (u.publicId === updated.publicId ? updated : u)));
      editModalRef.current?.close();
      setEditingUser(null);
      showToast("success", `Usuario "${updated.name}" actualizado`);
    } catch {
      setFormError("No se pudo actualizar el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    setSubmitting(true);
    try {
      const { user, action } = confirmAction;
      if (action === "deactivate") {
        await deactivateUser(user.publicId);
        setUsers((prev) =>
          prev.map((u) => (u.publicId === user.publicId ? { ...u, active: false } : u))
        );
        showToast("success", `Usuario "${user.name}" desactivado`);
      } else {
        const updated = await updateUser(user.publicId, { active: true });
        setUsers((prev) => prev.map((u) => (u.publicId === updated.publicId ? updated : u)));
        showToast("success", `Usuario "${user.name}" activado`);
      }
      confirmModalRef.current?.close();
      setConfirmAction(null);
    } catch {
      showToast("error", "No se pudo cambiar el estado del usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordUser) return;
    setSubmitting(true);
    setFormError(null);

    if (newPassword !== confirmNewPassword) {
      setFormError("Las contraseñas no coinciden");
      setSubmitting(false);
      return;
    }
    if (newPassword.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      setSubmitting(false);
      return;
    }

    try {
      await changeUserPassword(passwordUser.publicId, newPassword);
      passwordModalRef.current?.close();
      setPasswordUser(null);
      resetPasswordForm();
      showToast("success", "Contraseña actualizada exitosamente");
    } catch {
      setFormError("No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await deleteUser(deletingUser.publicId);
      setUsers((prev) => prev.filter((u) => u.publicId !== deletingUser.publicId));
      deleteModalRef.current?.close();
      showToast("success", `Usuario "${deletingUser.name}" eliminado`);
      setDeletingUser(null);
    } catch {
      showToast("error", "No se pudo eliminar el usuario");
    } finally {
      setSubmitting(false);
    }
  };


  const openCreate = () => {
    resetCreateForm();
    createModalRef.current?.showModal();
  };
  const openEdit = (user: UserResponse) => {
    setEditingUser(user);
    setFormError(null);
    editModalRef.current?.showModal();
  };
  const openPasswordChange = (user: UserResponse) => {
    setPasswordUser(user);
    resetPasswordForm();
    passwordModalRef.current?.showModal();
  };
  const openConfirmToggle = (user: UserResponse) => {
    setConfirmAction({ user, action: user.active ? "deactivate" : "activate" });
    confirmModalRef.current?.showModal();
  };
  const openDelete = (user: UserResponse) => {
    setDeletingUser(user);
    deleteModalRef.current?.showModal();
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <p className="text-base-content/40 text-sm animate-pulse">Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <p className="text-error font-medium">{error}</p>
        <button className="btn btn-primary btn-sm gap-2" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Usuarios</h2>
            <p className="text-xs text-base-content/40">
              {isAdmin ? "Administra los accesos de tu equipo" : "Vista de usuarios (solo lectura)"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm gap-1.5 rounded-xl"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          {canCreate && (
            <button
              className="btn btn-primary gap-2 shadow-md shadow-primary/20"
              onClick={openCreate}
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={totalUsers}
          color="bg-primary/10 text-primary"
          icon={Users}
        />
        <StatCard
          label="Activos"
          value={activeUsers}
          color="bg-success/10 text-success"
          icon={UserCheck}
        />
        <StatCard
          label="Inactivos"
          value={inactiveUsers}
          color="bg-error/10 text-error"
          icon={UserX}
        />
        <StatCard
          label="Administradores"
          value={adminCount}
          color="bg-warning/10 text-warning"
          icon={ShieldAlert}
        />
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30">
        <div className="card-body p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o sucursal..."
                className="input input-bordered w-full pl-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
              {(["ALL", "ADMIN", "MANAGER", "CASHIER", "EMPLOYEE"] as const).map((r) => (
                <button
                  key={r}
                  className={`btn btn-sm rounded-lg text-xs ${filterRole === r ? "btn-primary" : "btn-ghost"
                    }`}
                  onClick={() => setFilterRole(r)}
                >
                  {r === "ALL" ? "Todos" : ROLE_CONFIG[r].label.substring(0, 5)}
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm rounded-lg text-xs ${filterStatus === s ? "btn-primary" : "btn-ghost"
                    }`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === "ALL" ? "Todos" : s === "ACTIVE" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-300/30">
        <div className="card-body p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-base-content/30 gap-3">
              <Sparkles className="w-12 h-12" />
              <p className="font-semibold text-lg">No se encontraron usuarios</p>
              <p className="text-sm">
                {searchTerm ? "Intenta con otra búsqueda" : canCreate ? "Crea tu primer usuario" : ""}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="text-[11px] uppercase text-base-content/40">
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Sucursal</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      {isAdmin && <th className="text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.publicId}
                        className="hover:bg-base-200/30 transition-colors group"
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.name} active={u.active} />
                            <div className="min-w-0">
                              <p
                                className={`font-semibold text-sm truncate ${!u.active ? "opacity-50 line-through" : ""
                                  }`}
                              >
                                {u.name}
                              </p>
                              <p className="text-xs text-base-content/40 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>
                          <span
                            className={`text-sm flex items-center gap-1 ${!u.active ? "opacity-50" : ""
                              }`}
                          >
                            <Building2 className="w-3 h-3 text-base-content/30" />
                            {u.branchName}
                          </span>
                        </td>
                        <td>
                          <StatusIndicator active={u.active} />
                        </td>
                        <td>
                          <span className="text-xs text-base-content/40 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(u.createdAt).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {canEdit && (
                                <button
                                  className="btn btn-ghost btn-xs btn-square rounded-lg tooltip tooltip-left"
                                  data-tip="Editar"
                                  onClick={() => openEdit(u)}
                                >
                                  <Pencil className="w-3.5 h-3.5 text-warning" />
                                </button>
                              )}
                              {canChangePassword && (
                                <button
                                  className="btn btn-ghost btn-xs btn-square rounded-lg tooltip tooltip-left"
                                  data-tip="Contraseña"
                                  onClick={() => openPasswordChange(u)}
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-info" />
                                </button>
                              )}
                              {canToggleStatus && (
                                <button
                                  className="btn btn-ghost btn-xs btn-square rounded-lg tooltip tooltip-left"
                                  data-tip={u.active ? "Desactivar" : "Activar"}
                                  onClick={() => openConfirmToggle(u)}
                                >
                                  {u.active ? (
                                    <UserX className="w-3.5 h-3.5 text-error" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5 text-success" />
                                  )}
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="btn btn-ghost btn-xs btn-square rounded-lg tooltip tooltip-left"
                                  data-tip="Eliminar"
                                  onClick={() => openDelete(u)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-error" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden divide-y divide-base-300/30">
                {filteredUsers.map((u) => (
                  <div key={u.publicId} className="p-4 hover:bg-base-200/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <UserAvatar name={u.name} active={u.active} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`font-bold text-sm truncate ${!u.active ? "opacity-50 line-through" : ""
                              }`}
                          >
                            {u.name}
                          </p>
                          {isAdmin && (
                            <div className="dropdown dropdown-end">
                              <div tabIndex={0} role="button" className="btn btn-ghost btn-xs btn-circle">
                                <MoreVertical className="w-4 h-4" />
                              </div>
                              <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-xl w-48 p-1.5 shadow-xl border border-base-300/50 z-50"
                              >
                                {canEdit && (
                                  <li>
                                    <button
                                      onClick={() => openEdit(u)}
                                      className="text-sm gap-2"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-warning" />
                                      Editar
                                    </button>
                                  </li>
                                )}
                                {canChangePassword && (
                                  <li>
                                    <button
                                      onClick={() => openPasswordChange(u)}
                                      className="text-sm gap-2"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-info" />
                                      Contraseña
                                    </button>
                                  </li>
                                )}
                                {canToggleStatus && (
                                  <li>
                                    <button
                                      onClick={() => openConfirmToggle(u)}
                                      className="text-sm gap-2"
                                    >
                                      {u.active ? (
                                        <>
                                          <UserX className="w-3.5 h-3.5 text-error" />
                                          Desactivar
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-3.5 h-3.5 text-success" />
                                          Activar
                                        </>
                                      )}
                                    </button>
                                  </li>
                                )}
                                {canDelete && (
                                  <>
                                    <div className="divider my-0.5" />
                                    <li>
                                      <button
                                        onClick={() => openDelete(u)}
                                        className="text-sm gap-2 text-error"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar
                                      </button>
                                    </li>
                                  </>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-base-content/40 truncate mt-0.5">{u.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <RoleBadge role={u.role} />
                          <StatusIndicator active={u.active} />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-base-content/40">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {u.branchName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(u.createdAt).toLocaleDateString("es-MX", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {filteredUsers.length > 0 && (
            <div className="px-5 py-3 border-t border-base-300/30 text-xs text-base-content/40">
              Mostrando {filteredUsers.length} de {totalUsers} usuarios
            </div>
          )}
        </div>
      </div>


      {isAdmin && (
        <>
          <Modal dialogRef={createModalRef}>
            <ModalHeader
              icon={UserPlus}
              iconColor="bg-primary/10 text-primary"
              title="Nuevo Usuario"
              subtitle="Completa los datos del nuevo integrante"
              onClose={() => {
                createModalRef.current?.close();
                createFormRef.current?.reset();
                resetCreateForm();
              }}
            />
            <div className="p-6 pt-4">
              {formError && <FormAlert message={formError} />}
              <form
                ref={createFormRef}
                onSubmit={handleCreate}
                className="space-y-4 mt-3"
              >
                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs">Nombre completo</legend>
                  <input
                    name="name"
                    type="text"
                    placeholder="Juan Pérez"
                    className="input input-bordered w-full"
                    required
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </legend>
                  <input
                    name="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    className="input input-bordered w-full"
                    required
                  />
                </fieldset>

                <div className="grid grid-cols-2 gap-3">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend text-xs flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Rol
                    </legend>
                    <select name="role" className="select select-bordered w-full" required>
                      <option value="">Selecciona...</option>
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend text-xs flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Sucursal
                    </legend>
                    <select name="branchId" className="select select-bordered w-full" required>
                      <option value="">Selecciona...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs">Contraseña</legend>
                  <PasswordInput
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={createPassword}
                    onChange={setCreatePassword}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs">Confirmar contraseña</legend>
                  <PasswordInput
                    name="confirmPassword"
                    placeholder="Repite la contraseña"
                    value={createConfirmPassword}
                    onChange={setCreateConfirmPassword}
                  />
                </fieldset>

                {createPassword && createConfirmPassword && (
                  <div
                    className={`flex items-center gap-1.5 text-xs ${createPassword === createConfirmPassword
                      ? "text-success"
                      : "text-error"
                      }`}
                  >
                    {createPassword === createConfirmPassword ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Las contraseñas no coinciden
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={() => {
                      createModalRef.current?.close();
                      createFormRef.current?.reset();
                      resetCreateForm();
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 gap-2 shadow-md shadow-primary/20"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Crear usuario
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <Modal dialogRef={editModalRef}>
            <ModalHeader
              icon={Pencil}
              iconColor="bg-warning/10 text-warning"
              title="Editar Usuario"
              subtitle={editingUser?.email}
              onClose={() => {
                editModalRef.current?.close();
                setEditingUser(null);
                setFormError(null);
              }}
            />
            <div className="p-6 pt-4">
              {formError && <FormAlert message={formError} />}
              {editingUser && (
                <form onSubmit={handleUpdate} className="space-y-4 mt-3">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend text-xs">Nombre completo</legend>
                    <input
                      name="name"
                      type="text"
                      className="input input-bordered w-full"
                      defaultValue={editingUser.name}
                      required
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </legend>
                    <input
                      type="email"
                      className="input input-bordered w-full bg-base-200/50 cursor-not-allowed"
                      value={editingUser.email}
                      disabled
                    />
                    <p className="text-[10px] text-base-content/30 mt-1 ml-1">
                      El email no se puede modificar
                    </p>
                  </fieldset>

                  <div className="grid grid-cols-2 gap-3">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend text-xs flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Rol
                      </legend>
                      <select
                        name="role"
                        className="select select-bordered w-full"
                        defaultValue={editingUser.role}
                        required
                      >
                        {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend text-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Sucursal
                      </legend>
                      <select
                        name="branchId"
                        className="select select-bordered w-full"
                        defaultValue={editingUser.branchId}
                        required
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost flex-1"
                      onClick={() => {
                        editModalRef.current?.close();
                        setEditingUser(null);
                        setFormError(null);
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-warning flex-1 gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Guardar cambios
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Modal>

          <Modal dialogRef={passwordModalRef} maxWidth="max-w-sm">
            <ModalHeader
              icon={KeyRound}
              iconColor="bg-info/10 text-info"
              title="Cambiar Contraseña"
              subtitle={passwordUser?.name}
              onClose={() => {
                passwordModalRef.current?.close();
                setPasswordUser(null);
                resetPasswordForm();
              }}
            />
            <div className="p-6 pt-4">
              {formError && <FormAlert message={formError} />}

              {passwordUser && (
                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl mt-1 mb-4">
                  <UserAvatar name={passwordUser.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{passwordUser.name}</p>
                    <p className="text-xs text-base-content/40 truncate">{passwordUser.email}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs">Nueva contraseña</legend>
                  <PasswordInput
                    name="newPassword"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend text-xs">Confirmar contraseña</legend>
                  <PasswordInput
                    name="confirmNewPassword"
                    placeholder="Repite la contraseña"
                    value={confirmNewPassword}
                    onChange={setConfirmNewPassword}
                  />
                </fieldset>

                {newPassword && confirmNewPassword && (
                  <div
                    className={`flex items-center gap-1.5 text-xs ${newPassword === confirmNewPassword ? "text-success" : "text-error"
                      }`}
                  >
                    {newPassword === confirmNewPassword ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Las contraseñas no coinciden
                      </>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={() => {
                      passwordModalRef.current?.close();
                      setPasswordUser(null);
                      resetPasswordForm();
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-info flex-1 gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    Cambiar
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          <Modal dialogRef={confirmModalRef} maxWidth="max-w-sm">
            {confirmAction && (
              <>
                <div className="p-6 pb-0 flex justify-end">
                  <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => {
                      confirmModalRef.current?.close();
                      setConfirmAction(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 pb-6 text-center space-y-4">
                  <div
                    className={`
                      w-16 h-16 rounded-2xl mx-auto flex items-center justify-center
                      ${confirmAction.action === "deactivate"
                        ? "bg-error/10"
                        : "bg-success/10"
                      }
                    `}
                  >
                    {confirmAction.action === "deactivate" ? (
                      <UserX className="w-8 h-8 text-error" />
                    ) : (
                      <UserCheck className="w-8 h-8 text-success" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg">
                      {confirmAction.action === "deactivate"
                        ? "Desactivar Usuario"
                        : "Activar Usuario"}
                    </h3>
                    <p className="text-sm text-base-content/50 mt-2">
                      ¿Estás seguro de{" "}
                      <strong>
                        {confirmAction.action === "deactivate" ? "desactivar" : "activar"}
                      </strong>{" "}
                      a <strong>{confirmAction.user.name}</strong>?
                    </p>
                  </div>

                  {confirmAction.action === "deactivate" && (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-warning text-xs text-left">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>El usuario no podrá iniciar sesión mientras esté desactivado.</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-ghost flex-1"
                      onClick={() => {
                        confirmModalRef.current?.close();
                        setConfirmAction(null);
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className={`btn flex-1 gap-2 ${confirmAction.action === "deactivate"
                        ? "btn-error"
                        : "btn-success"
                        }`}
                      onClick={handleToggleStatus}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : confirmAction.action === "deactivate" ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      {confirmAction.action === "deactivate" ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </Modal>

          <Modal dialogRef={deleteModalRef} maxWidth="max-w-sm">
            {deletingUser && (
              <>
                <div className="p-6 pb-0 flex justify-end">
                  <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => {
                      deleteModalRef.current?.close();
                      setDeletingUser(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 pb-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-error/10 mx-auto flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-error" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg">Eliminar Usuario</h3>
                    <p className="text-sm text-base-content/50 mt-2">
                      ¿Estás seguro de eliminar permanentemente a{" "}
                      <strong>{deletingUser.name}</strong>?
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl text-left">
                    <UserAvatar name={deletingUser.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{deletingUser.name}</p>
                      <p className="text-xs text-base-content/40 truncate">{deletingUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs text-left">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Esta acción no se puede deshacer</p>
                      <p className="text-error/70 mt-0.5">
                        Se eliminarán todos los datos asociados.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-ghost flex-1"
                      onClick={() => {
                        deleteModalRef.current?.close();
                        setDeletingUser(null);
                      }}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-error flex-1 gap-2"
                      onClick={handleDelete}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Eliminar
                    </button>
                  </div>
                </div>
              </>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}