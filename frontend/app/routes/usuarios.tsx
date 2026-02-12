// app/routes/usuarios.tsx
import { useState, useRef } from "react";
import { UserPlus, Pencil, UserX, UserCheck } from "lucide-react";
import { users as initialUsers, type User } from "~/data/mockData";

export default function Usuarios() {
  const [userList, setUserList] = useState<User[]>(initialUsers);
  const modalRef = useRef<HTMLDialogElement>(null);

  const toggleStatus = (id: number) => {
    setUserList((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newUser: User = {
      id: Date.now(),
      name: `${fd.get("firstName")} ${fd.get("lastName")}`,
      email: fd.get("email") as string,
      role: fd.get("role") as string,
      lastAccess: new Date().toISOString().split("T")[0],
      status: "active",
    };
    setUserList((prev) => [...prev, newUser]);
    modalRef.current?.close();
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <button className="btn btn-primary gap-2" onClick={() => modalRef.current?.showModal()}>
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id} className="hover">
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.lastAccess}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          u.status === "active" ? "badge-success" : "badge-error"
                        }`}
                      >
                        {u.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-xs btn-square tooltip" data-tip="Editar">
                          <Pencil className="w-4 h-4 text-warning" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs btn-square tooltip"
                          data-tip={u.status === "active" ? "Desactivar" : "Activar"}
                          onClick={() => toggleStatus(u.id)}
                        >
                          {u.status === "active" ? (
                            <UserX className="w-4 h-4 text-error" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-success" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ Modal ═══ */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-6">Nuevo Usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label"><span className="label-text">Nombre</span></div>
                <input name="firstName" type="text" className="input input-bordered" required />
              </label>
              <label className="form-control">
                <div className="label"><span className="label-text">Apellido</span></div>
                <input name="lastName" type="text" className="input input-bordered" required />
              </label>
            </div>
            <label className="form-control w-full">
              <div className="label"><span className="label-text">Email</span></div>
              <input name="email" type="email" className="input input-bordered w-full" required />
            </label>
            <label className="form-control w-full">
              <div className="label"><span className="label-text">Rol</span></div>
              <select name="role" className="select select-bordered w-full" required>
                <option value="">Selecciona un rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Empleado">Empleado</option>
                <option value="Gerente">Gerente</option>
              </select>
            </label>
            <label className="form-control w-full">
              <div className="label"><span className="label-text">Contraseña</span></div>
              <input name="password" type="password" className="input input-bordered w-full" required />
            </label>
            <label className="form-control w-full">
              <div className="label"><span className="label-text">Confirmar contraseña</span></div>
              <input name="confirmPassword" type="password" className="input input-bordered w-full" required />
            </label>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => modalRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Crear usuario</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </div>
  );
}