// app/routes/eventos.tsx
import { useState, useRef } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { events as initialEvents, type Event } from "~/data/mockData";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; label: string }> = {
        active: { cls: "badge-success", label: "Activo" },
        pending: { cls: "badge-warning", label: "Pendiente" },
        cancelled: { cls: "badge-error", label: "Cancelado" },
    };
    const { cls, label } = map[status] ?? { cls: "badge-ghost", label: status };
    return <span className={`badge badge-sm ${cls}`}>{label}</span>;
}

export default function Eventos() {
    const [eventsList, setEventsList] = useState<Event[]>(initialEvents);
    const modalRef = useRef<HTMLDialogElement>(null);

    const handleDelete = (id: number) => {
        if (confirm("¿Eliminar este evento?")) {
            setEventsList((prev) => prev.filter((e) => e.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newEvent: Event = {
            id: Date.now(),
            date: fd.get("date") as string,
            client: fd.get("client") as string,
            package: fd.get("package") as string,
            children: Number(fd.get("children")),
            total: 1999,
            status: "pending",
        };
        setEventsList((prev) => [...prev, newEvent]);
        modalRef.current?.close();
        e.currentTarget.reset();
    };

    /* ── Días del calendario (simplificado) ── */
    const calendarHighlights: Record<number, { count: number; color: string }> = {
        4: { count: 3, color: "bg-primary/20 text-primary" },
        8: { count: 2, color: "bg-secondary/20 text-secondary" },
        13: { count: 1, color: "bg-accent/20 text-accent" },
        19: { count: 2, color: "bg-primary/20 text-primary" },
        25: { count: 1, color: "bg-secondary/20 text-secondary" },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Gestión de Eventos</h2>
                <button className="btn btn-primary gap-2" onClick={() => modalRef.current?.showModal()}>
                    <Plus className="w-4 h-4" /> Nuevo Evento
                </button>
            </div>

            {/* Calendario visual */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Calendario de eventos</h3>
                    <div className="grid grid-cols-7 gap-2 text-center text-sm">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                            <div key={d} className="py-2 font-semibold text-base-content/50">{d}</div>
                        ))}
                        {/* 2 espacios vacíos para que el mes empiece en miércoles */}
                        <div /><div />
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                            const hl = calendarHighlights[day];
                            return (
                                <div
                                    key={day}
                                    className={`py-2 rounded-lg text-sm ${hl ? hl.color + " font-semibold cursor-pointer" : "text-base-content/50"
                                        }`}
                                >
                                    {day}
                                    {hl && <span className="block text-[10px]">{hl.count} evento{hl.count > 1 && "s"}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tabla de eventos */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Lista de eventos</h3>
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Paquete</th>
                                    <th>Niños</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th className="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventsList.map((ev) => (
                                    <tr key={ev.id} className="hover">
                                        <td>{ev.date}</td>
                                        <td>{ev.client}</td>
                                        <td>{ev.package}</td>
                                        <td>{ev.children}</td>
                                        <td>${ev.total.toLocaleString()}</td>
                                        <td><StatusBadge status={ev.status} /></td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button className="btn btn-ghost btn-xs btn-square tooltip" data-tip="Editar">
                                                    <Pencil className="w-4 h-4 text-warning" />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-xs btn-square tooltip"
                                                    data-tip="Eliminar"
                                                    onClick={() => handleDelete(ev.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-error" />
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

            {/* ═══ Modal de nuevo evento ═══ */}
            <dialog ref={modalRef} className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
                    </form>
                    <h3 className="font-bold text-lg mb-6">Nuevo Evento</h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Nombre del cliente</span></div>
                            <input name="client" type="text" className="input input-bordered w-full" required />
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="form-control">
                                <div className="label"><span className="label-text">Fecha</span></div>
                                <input name="date" type="date" className="input input-bordered" required />
                            </label>
                            <label className="form-control">
                                <div className="label"><span className="label-text">Hora</span></div>
                                <input name="time" type="time" className="input input-bordered" required />
                            </label>
                        </div>

                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Paquete</span></div>
                            <select name="package" className="select select-bordered w-full" required>
                                <option value="">Selecciona un paquete</option>
                                <option value="Cohete Básico">Cohete Básico</option>
                                <option value="Viaje Galáctico">Viaje Galáctico</option>
                                <option value="Misión Súper Space">Misión Súper Space</option>
                            </select>
                        </label>

                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Número de niños</span></div>
                            <input name="children" type="number" min="1" max="50" className="input input-bordered w-full" required />
                        </label>

                        <label className="form-control w-full">
                            <div className="label"><span className="label-text">Observaciones</span></div>
                            <textarea name="notes" className="textarea textarea-bordered w-full h-24" />
                        </label>

                        <div className="modal-action">
                            <button type="button" className="btn btn-ghost" onClick={() => modalRef.current?.close()}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">Guardar evento</button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
}