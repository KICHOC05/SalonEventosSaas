// app/routes/eventos.tsx
import { useState, useRef } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Users,
    DollarSign,
    Clock,
    X,
} from "lucide-react";
import { events as initialEvents, type Event } from "~/data/mockData";
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Eventos", "Gestión de eventos y reservaciones");
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; label: string; dot: string }> = {
        active: { cls: "bg-success/10 text-success border-success/20", label: "Activo", dot: "bg-success" },
        pending: { cls: "bg-warning/10 text-warning border-warning/20", label: "Pendiente", dot: "bg-warning" },
        cancelled: { cls: "bg-error/10 text-error border-error/20", label: "Cancelado", dot: "bg-error" },
    };
    const { cls, label, dot } = map[status] ?? {
        cls: "bg-base-200 text-base-content/50",
        label: status,
        dot: "bg-base-content/30",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

function CalendarDay({
    day,
    events,
    isToday,
    isOtherMonth,
}: {
    day: number;
    events?: number;
    isToday?: boolean;
    isOtherMonth?: boolean;
}) {
    return (
        <div
            className={`
        relative flex flex-col items-center justify-center py-2.5 rounded-xl text-sm
        transition-all cursor-pointer group
        ${isOtherMonth ? "opacity-30" : ""}
        ${isToday ? "bg-primary text-primary-content font-bold shadow-md shadow-primary/20" : "hover:bg-base-200/80"}
        ${events && !isToday ? "bg-primary/5 font-semibold text-primary" : ""}
      `}
        >
            {day}
            {events && events > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(events, 3) }).map((_, i) => (
                        <span
                            key={i}
                            className={`w-1 h-1 rounded-full ${isToday ? "bg-primary-content" : "bg-primary"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventCard({ event, onDelete }: { event: Event; onDelete: () => void }) {
    return (
        <div className="group flex items-center gap-4 p-4 rounded-xl border border-base-300/30 bg-base-100 hover:shadow-md hover:border-primary/20 transition-all">
            {/* Date badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-primary uppercase">
                    {new Date(event.date).toLocaleDateString("es", { month: "short" })}
                </span>
                <span className="text-lg font-extrabold text-primary leading-none">
                    {new Date(event.date).getDate()}
                </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm truncate">{event.client}</h4>
                    <StatusBadge status={event.status} />
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-base-content/50">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.package}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.children} niños
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-base-content/70">
                        <DollarSign className="w-3 h-3" />
                        {event.total.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="btn btn-ghost btn-xs btn-square rounded-lg tooltip" data-tip="Editar">
                    <Pencil className="w-3.5 h-3.5 text-warning" />
                </button>
                <button
                    className="btn btn-ghost btn-xs btn-square rounded-lg tooltip"
                    data-tip="Eliminar"
                    onClick={onDelete}
                >
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                </button>
            </div>
        </div>
    );
}

export default function Eventos() {
    const [eventsList, setEventsList] = useState<Event[]>(initialEvents);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
    const modalRef = useRef<HTMLDialogElement>(null);

    const filteredEvents = eventsList.filter((ev) => {
        const matchesSearch =
            ev.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.package.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || ev.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

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

    const calendarHighlights: Record<number, number> = {
        4: 3,
        8: 2,
        13: 1,
        19: 2,
        25: 1,
    };

    // Stats
    const totalEvents = eventsList.length;
    const activeEvents = eventsList.filter((e) => e.status === "active").length;
    const pendingEvents = eventsList.filter((e) => e.status === "pending").length;
    const totalRevenue = eventsList.reduce((sum, e) => sum + e.total, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Eventos</h2>
                        <p className="text-xs text-base-content/40">{totalEvents} eventos registrados</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary gap-2 shadow-md shadow-primary/20"
                    onClick={() => modalRef.current?.showModal()}
                >
                    <Plus className="w-4 h-4" /> Nuevo Evento
                </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: totalEvents, icon: Calendar, color: "text-primary bg-primary/10" },
                    { label: "Activos", value: activeEvents, icon: Clock, color: "text-success bg-success/10" },
                    { label: "Pendientes", value: pendingEvents, icon: Clock, color: "text-warning bg-warning/10" },
                    {
                        label: "Ingresos",
                        value: `$${totalRevenue.toLocaleString()}`,
                        icon: DollarSign,
                        color: "text-accent bg-accent/10",
                    },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 bg-base-100 rounded-xl p-3 border border-base-300/30"
                    >
                        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[10px] text-base-content/40 uppercase font-medium">{label}</p>
                            <p className="text-lg font-extrabold leading-tight">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="card bg-base-100 shadow-sm border border-base-300/30">
                    <div className="card-body p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm">Enero 2025</h3>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost btn-xs btn-square rounded-lg">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="btn btn-ghost btn-xs btn-square rounded-lg">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                                <div key={d} className="py-1.5 text-[10px] font-bold text-base-content/30 uppercase">
                                    {d}
                                </div>
                            ))}
                            {/* Empty cells for alignment */}
                            <div />
                            <div />
                            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                                <CalendarDay
                                    key={day}
                                    day={day}
                                    events={calendarHighlights[day]}
                                    isToday={day === 13}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events list */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Search & filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                            <input
                                type="text"
                                placeholder="Buscar evento o cliente..."
                                className="input input-bordered w-full pl-10 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
                            {[
                                { value: "all", label: "Todos" },
                                { value: "active", label: "Activos" },
                                { value: "pending", label: "Pendientes" },
                                { value: "cancelled", label: "Cancelados" },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={`btn btn-sm rounded-lg ${filterStatus === value ? "btn-primary" : "btn-ghost"
                                        }`}
                                    onClick={() => setFilterStatus(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Events cards */}
                    <div className="space-y-3">
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map((ev) => (
                                <EventCard key={ev.id} event={ev} onDelete={() => handleDelete(ev.id)} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
                                <Calendar className="w-12 h-12 mb-3" />
                                <p className="font-medium">No se encontraron eventos</p>
                                <p className="text-sm mt-1">
                                    {searchQuery ? "Intenta con otra búsqueda" : "Crea tu primer evento"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
                <div className="modal-box rounded-t-3xl sm:rounded-2xl max-w-lg">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                            <X className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-lg">Nuevo Evento</h3>
                            <p className="text-xs text-base-content/40">Completa los datos de la reservación</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del cliente</legend>
                            <input
                                name="client"
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Juan Pérez"
                                required
                            />
                        </fieldset>

                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Fecha</legend>
                                <input name="date" type="date" className="input input-bordered w-full" required />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Hora</legend>
                                <input name="time" type="time" className="input input-bordered w-full" required />
                            </fieldset>
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Paquete</legend>
                            <select name="package" className="select select-bordered w-full" required>
                                <option value="">Selecciona un paquete</option>
                                <option value="Cohete Básico">🚀 Cohete Básico</option>
                                <option value="Viaje Galáctico">🌌 Viaje Galáctico</option>
                                <option value="Misión Súper Space">⭐ Misión Súper Space</option>
                            </select>
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Número de niños</legend>
                            <input
                                name="children"
                                type="number"
                                min="1"
                                max="50"
                                className="input input-bordered w-full"
                                placeholder="15"
                                required
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Observaciones</legend>
                            <textarea
                                name="notes"
                                className="textarea textarea-bordered w-full h-20"
                                placeholder="Alergias, decoración especial, etc."
                            />
                        </fieldset>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={() => modalRef.current?.close()}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary flex-1 gap-2 shadow-md shadow-primary/20">
                                <Plus className="w-4 h-4" />
                                Crear evento
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}