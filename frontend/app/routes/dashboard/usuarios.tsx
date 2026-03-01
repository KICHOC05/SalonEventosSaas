// app/routes/usuarios.tsx
import { useState, useRef, useEffect, useCallback } from "react";
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

type UserRole = "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  CASHIER: "Cajero",
  EMPLOYEE: "Empleado",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "badge-error",
  MANAGER: "badge-warning",
  CASHIER: "badge-info",
  EMPLOYEE: "badge-ghost",
};

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  ADMIN: ShieldAlert,
  MANAGER: ShieldCheck,
  CASHIER: Shield,
  EMPLOYEE: User,
};

// ─── Componente de input con toggle de visibilidad ───
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
  return (
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
        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Toast notification ───
type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export default function Usuarios() {
  // ─── State ───
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // ─── Toasts ───
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ─── Modal refs ───
  const createModalRef = useRef<HTMLDialogElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const passwordModalRef = useRef<HTMLDialogElement>(null);
  const confirmModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  // ─── Modal data state ───
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserResponse | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    user: UserResponse;
    action: "activate" | "deactivate";
  } | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Password field state (controlled) ───
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // ─── Reset helpers ───
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

  // ─── Load data ───
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, branchesData] = await Promise.all([
        fetchUsers(),
        fetchBranches(),
      ]);
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

  // ─── Filtered users ───
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

  // ─── Create user ───
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
      // ✅ Usar ref en vez de e.currentTarget (que puede ser null después del await)
      createFormRef.current?.reset();
      resetCreateForm();
      createModalRef.current?.close();
      showToast("success", `Usuario "${newUser.name}" creado exitosamente`);
    } catch {
      setFormError(
        "No se pudo crear el usuario. Verifica los datos e intenta de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Update user ───
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
      setUsers((prev) =>
        prev.map((u) => (u.publicId === updated.publicId ? updated : u))
      );
      editModalRef.current?.close();
      setEditingUser(null);
      showToast(
        "success",
        `Usuario "${updated.name}" actualizado exitosamente`
      );
    } catch (err: any) {
      setFormError("No se pudo actualizar el usuario. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle status ───
  const handleToggleStatus = async () => {
    if (!confirmAction) return;
    setSubmitting(true);

    try {
      const { user, action } = confirmAction;

      if (action === "deactivate") {
        await deactivateUser(user.publicId);
        setUsers((prev) =>
          prev.map((u) =>
            u.publicId === user.publicId ? { ...u, active: false } : u
          )
        );
        showToast("success", `Usuario "${user.name}" desactivado`);
      } else {
        const updated = await updateUser(user.publicId, { active: true });
        setUsers((prev) =>
          prev.map((u) => (u.publicId === updated.publicId ? updated : u))
        );
        showToast("success", `Usuario "${user.name}" activado`);
      }

      confirmModalRef.current?.close();
      setConfirmAction(null);
    } catch (err: any) {
      showToast("error", "No se pudo cambiar el estado del usuario");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Change password ───
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
    } catch (err: any) {
      setFormError("No se pudo cambiar la contraseña. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete user ───
  const handleDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);

    try {
      await deleteUser(deletingUser.publicId);
      setUsers((prev) =>
        prev.filter((u) => u.publicId !== deletingUser.publicId)
      );
      deleteModalRef.current?.close();
      showToast("success", `Usuario "${deletingUser.name}" eliminado`);
      setDeletingUser(null);
    } catch (err: any) {
      showToast("error", "No se pudo eliminar el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Open modals ───
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
    setConfirmAction({
      user,
      action: user.active ? "deactivate" : "activate",
    });
    confirmModalRef.current?.showModal();
  };

  const openDelete = (user: UserResponse) => {
    setDeletingUser(user);
    deleteModalRef.current?.showModal();
  };

  // ─── Stats ───
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  // ─── Render ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Cargando usuarios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-lg text-error">{error}</p>
        <button className="btn btn-primary" onClick={loadData}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ Toast notifications ═══ */}
      <div className="toast toast-top toast-end z-[100]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"
              } shadow-lg`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-base-content/60 text-sm mt-1">
            Administra los usuarios de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm gap-2" onClick={loadData}>
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
          <button className="btn btn-primary gap-2" onClick={openCreate}>
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow-sm rounded-box p-4">
          <div className="stat-title text-xs">Total</div>
          <div className="stat-value text-2xl">{totalUsers}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box p-4">
          <div className="stat-title text-xs">Activos</div>
          <div className="stat-value text-2xl text-success">{activeUsers}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box p-4">
          <div className="stat-title text-xs">Inactivos</div>
          <div className="stat-value text-2xl text-error">{inactiveUsers}</div>
        </div>
        <div className="stat bg-base-100 shadow-sm rounded-box p-4">
          <div className="stat-title text-xs">Admins</div>
          <div className="stat-value text-2xl text-warning">{adminCount}</div>
        </div>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="input input-bordered flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 opacity-50" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o sucursal..."
                className="grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
            <select
              className="select select-bordered w-full sm:w-40"
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as UserRole | "ALL")
              }
            >
              <option value="ALL">Todos los roles</option>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="select select-bordered w-full sm:w-40"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "ALL" | "ACTIVE" | "INACTIVE"
                )
              }
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-base-content/50">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No se encontraron usuarios</p>
              <p className="text-sm">
                Intenta cambiar los filtros o crea un nuevo usuario
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Sucursal</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const RoleIcon = ROLE_ICONS[u.role];
                    return (
                      <tr key={u.publicId} className="hover">
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              className={`avatar placeholder ${u.active ? "" : "opacity-50"
                                }`}
                            >
                              <div className="bg-gradient-to-r from-primary to-secondary w-9 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-bold">
                                  {u.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`font-medium ${!u.active ? "opacity-50 line-through" : ""
                                }`}
                            >
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className={!u.active ? "opacity-50" : ""}>
                          {u.email}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span
                              className={`badge badge-sm ${ROLE_COLORS[u.role]}`}
                            >
                              {ROLE_LABELS[u.role]}
                            </span>
                          </div>
                        </td>
                        <td className={!u.active ? "opacity-50" : ""}>
                          {u.branchName}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${u.active ? "badge-success" : "badge-error"
                              }`}
                          >
                            {u.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-sm text-base-content/60">
                          {new Date(u.createdAt).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs btn-square tooltip"
                              data-tip="Editar"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="w-4 h-4 text-warning" />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs btn-square tooltip"
                              data-tip="Cambiar contraseña"
                              onClick={() => openPasswordChange(u)}
                            >
                              <KeyRound className="w-4 h-4 text-info" />
                            </button>
                            <button
                              className="btn btn-ghost btn-xs btn-square tooltip"
                              data-tip={u.active ? "Desactivar" : "Activar"}
                              onClick={() => openConfirmToggle(u)}
                            >
                              {u.active ? (
                                <UserX className="w-4 h-4 text-error" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-success" />
                              )}
                            </button>
                            <button
                              className="btn btn-ghost btn-xs btn-square tooltip"
                              data-tip="Eliminar"
                              onClick={() => openDelete(u)}
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="text-sm text-base-content/50 mt-3">
              Mostrando {filteredUsers.length} de {totalUsers} usuarios
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODAL: CREAR USUARIO ═══ */}
      <dialog ref={createModalRef} className="modal">
        <div className="modal-box max-w-lg">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Nuevo Usuario
          </h3>

          {formError && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Nombre completo</span>
              </div>
              <input
                name="name"
                type="text"
                placeholder="Ej: Juan Pérez"
                className="input input-bordered w-full"
                required
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Email</span>
              </div>
              <input
                name="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                className="input input-bordered w-full"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Rol</span>
                </div>
                <select
                  name="role"
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Selecciona...</option>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Sucursal</span>
                </div>
                <select
                  name="branchId"
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Selecciona...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-control w-full">
              <div className="label">
                <span className="label-text">Contraseña</span>
              </div>
              <PasswordInput
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={createPassword}
                onChange={setCreatePassword}
              />
            </div>

            <div className="form-control w-full">
              <div className="label">
                <span className="label-text">Confirmar contraseña</span>
              </div>
              <PasswordInput
                name="confirmPassword"
                placeholder="Repite la contraseña"
                value={createConfirmPassword}
                onChange={setCreateConfirmPassword}
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
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
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear usuario
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ═══ MODAL: EDITAR USUARIO ═══ */}
      <dialog ref={editModalRef} className="modal">
        <div className="modal-box max-w-lg">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-warning" />
            Editar Usuario
          </h3>

          {formError && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          {editingUser && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Nombre completo</span>
                </div>
                <input
                  name="name"
                  type="text"
                  className="input input-bordered w-full"
                  defaultValue={editingUser.name}
                  required
                />
              </label>

              <div className="form-control w-full">
                <div className="label">
                  <span className="label-text">Email</span>
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full input-disabled"
                  value={editingUser.email}
                  disabled
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/50">
                    El email no se puede modificar
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Rol</span>
                  </div>
                  <select
                    name="role"
                    className="select select-bordered w-full"
                    defaultValue={editingUser.role}
                    required
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">Sucursal</span>
                  </div>
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
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
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
                  className="btn btn-warning"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ═══ MODAL: CAMBIAR CONTRASEÑA ═══ */}
      <dialog ref={passwordModalRef} className="modal">
        <div className="modal-box max-w-sm">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-info" />
            Cambiar Contraseña
          </h3>

          {passwordUser && (
            <p className="text-sm text-base-content/60 mb-6">
              Usuario: <strong>{passwordUser.name}</strong>
            </p>
          )}

          {formError && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="form-control w-full">
              <div className="label">
                <span className="label-text">Nueva contraseña</span>
              </div>
              <PasswordInput
                name="newPassword"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={setNewPassword}
              />
            </div>

            <div className="form-control w-full">
              <div className="label">
                <span className="label-text">Confirmar contraseña</span>
              </div>
              <PasswordInput
                name="confirmNewPassword"
                placeholder="Repite la contraseña"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
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
                className="btn btn-info"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Cambiar contraseña
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ═══ MODAL: CONFIRMAR ACTIVAR/DESACTIVAR ═══ */}
      <dialog ref={confirmModalRef} className="modal">
        <div className="modal-box max-w-sm">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
              ✕
            </button>
          </form>

          {confirmAction && (
            <>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                {confirmAction.action === "deactivate" ? (
                  <UserX className="w-5 h-5 text-error" />
                ) : (
                  <UserCheck className="w-5 h-5 text-success" />
                )}
                {confirmAction.action === "deactivate"
                  ? "Desactivar Usuario"
                  : "Activar Usuario"}
              </h3>

              <p className="text-base-content/70">
                ¿Estás seguro de que deseas{" "}
                <strong>
                  {confirmAction.action === "deactivate"
                    ? "desactivar"
                    : "activar"}
                </strong>{" "}
                al usuario <strong>{confirmAction.user.name}</strong>?
              </p>

              {confirmAction.action === "deactivate" && (
                <div className="alert alert-warning mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    El usuario no podrá iniciar sesión mientras esté
                    desactivado.
                  </span>
                </div>
              )}

              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    confirmModalRef.current?.close();
                    setConfirmAction(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  className={`btn ${confirmAction.action === "deactivate"
                    ? "btn-error"
                    : "btn-success"
                    }`}
                  onClick={handleToggleStatus}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {confirmAction.action === "deactivate"
                    ? "Desactivar"
                    : "Activar"}
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ═══ MODAL: CONFIRMAR ELIMINAR ═══ */}
      <dialog ref={deleteModalRef} className="modal">
        <div className="modal-box max-w-sm">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
              ✕
            </button>
          </form>

          {deletingUser && (
            <>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-error" />
                Eliminar Usuario
              </h3>

              <p className="text-base-content/70">
                ¿Estás seguro de que deseas eliminar permanentemente al usuario{" "}
                <strong>{deletingUser.name}</strong>?
              </p>

              <div className="alert alert-error mt-4">
                <AlertCircle className="w-4 h-4" />
                <div>
                  <p className="text-sm font-semibold">
                    Esta acción no se puede deshacer
                  </p>
                  <p className="text-xs">
                    Se eliminarán todos los datos asociados a este usuario.
                  </p>
                </div>
              </div>

              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    deleteModalRef.current?.close();
                    setDeletingUser(null);
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}