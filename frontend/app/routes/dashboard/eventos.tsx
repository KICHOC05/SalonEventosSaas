import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    Users,
    DollarSign,
    Clock,
    Ban,
    CheckCircle,
    RotateCcw,
} from "lucide-react";
import type { EventResponse, EventPaymentResponse } from "~/lib/api";
import {
    createEvent,
    getDayEvents,
    getMonthEvents,
    getEventDetail,
    cancelEvent,
    completeEvent,
    updateEvent,
    rescheduleEvent,
    registerEventPayment,
    fetchProducts,
    type ProductResponse,
} from "~/lib/api";
import { buildMeta } from "~/lib/meta";

export function meta() {
    return buildMeta("Eventos", "Gestión de eventos y reservaciones");
}

const STATUS_MAP: Record<string, { cls: string; label: string; dot: string }> = {
    PENDING: { cls: "bg-warning/10 text-warning border-warning/20", label: "Pendiente", dot: "bg-warning" },
    PARTIAL: { cls: "bg-info/10 text-info border-info/20", label: "Apartado", dot: "bg-info" },
    CONFIRMED: { cls: "bg-success/10 text-success border-success/20", label: "Confirmado", dot: "bg-success" },
    COMPLETED: { cls: "bg-accent/10 text-accent border-accent/20", label: "Completado", dot: "bg-accent" },
    CANCELLED: { cls: "bg-error/10 text-error border-error/20", label: "Cancelado", dot: "bg-error" },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? {
        cls: "bg-base-200 text-base-content/50",
        label: status,
        dot: "bg-base-content/30",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

function CalendarDay({
    day, count, isToday, isOtherMonth, onClick,
}: {
    day: number; count?: number; isToday?: boolean; isOtherMonth?: boolean; onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center py-2.5 rounded-xl text-sm transition-all cursor-pointer group
                ${isOtherMonth ? "opacity-30" : ""}
                ${isToday ? "bg-primary text-primary-content font-bold shadow-md shadow-primary/20" : "hover:bg-base-200/80"}
                ${count && !isToday ? "bg-primary/5 font-semibold text-primary" : ""}
            `}
        >
            {day}
            {count && count > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <span key={i} className={`w-1 h-1 rounded-full ${isToday ? "bg-primary-content" : "bg-primary"}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventCard({
    event, onCancel, onComplete, onView,
}: {
    event: EventResponse; onCancel: () => void; onComplete: () => void; onView: () => void;
}) {
    return (
        <div className="group flex items-center gap-4 p-4 rounded-xl border border-base-300/30 bg-base-100 hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-primary uppercase">
                    {new Date(event.eventDate + "T12:00:00").toLocaleDateString("es", { month: "short" })}
                </span>
                <span className="text-lg font-extrabold text-primary leading-none">
                    {new Date(event.eventDate + "T12:00:00").getDate()}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm truncate">{event.customerName}</h4>
                    <StatusBadge status={event.status} />
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-base-content/50">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.packageName}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.guestCount ?? 0} niños
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-base-content/70">
                        <DollarSign className="w-3 h-3" />
                        {event.totalAmount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.startTime} - {event.endTime}
                    </span>
                </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="btn btn-ghost btn-xs btn-square rounded-lg tooltip" data-tip="Ver detalle" onClick={onView}>
                    <Pencil className="w-3.5 h-3.5 text-warning" />
                </button>
                {event.status !== "CANCELLED" && event.status !== "COMPLETED" && (
                    <>
                        {event.status === "CONFIRMED" && (
                            <button className="btn btn-ghost btn-xs btn-square rounded-lg tooltip" data-tip="Completar" onClick={onComplete}>
                                <CheckCircle className="w-3.5 h-3.5 text-success" />
                            </button>
                        )}
                        <button className="btn btn-ghost btn-xs btn-square rounded-lg tooltip" data-tip="Cancelar" onClick={onCancel}>
                            <Ban className="w-3.5 h-3.5 text-error" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function PaymentModal({ event, onClose }: { event: EventResponse; onClose: () => void }) {
    const [amount, setAmount] = useState(event.pendingAmount.toString());
    const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [type, setType] = useState<"ADVANCE" | "FINAL">("ADVANCE");
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [payments, setPayments] = useState<EventPaymentResponse[]>([]);
    const [detail, setDetail] = useState(event);

    useEffect(() => {
        getEventDetail(event.publicId).then((d) => {
            setDetail(d);
            setPayments(d.payments);
        }).catch(() => {});
    }, [event.publicId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await registerEventPayment(event.publicId, {
                amount: Number(amount),
                paymentMethod: method,
                paymentType: type,
                reference: reference || undefined,
            });
            const d = await getEventDetail(event.publicId);
            setDetail(d);
            setPayments(d.payments);
            setAmount(d.pendingAmount.toString());
            if (d.pendingAmount <= 0) {
                alert("Evento confirmado. ¡Pago completado!");
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Error al registrar pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-lg">Pago - {detail.customerName}</h3>
                    <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}><X className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                        <p className="text-base-content/40 text-xs">Total</p>
                        <p className="font-bold text-lg">${detail.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                        <p className="text-base-content/40 text-xs">Pagado</p>
                        <p className="font-bold text-lg text-success">${detail.paidAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                        <p className="text-base-content/40 text-xs">Pendiente</p>
                        <p className="font-bold text-lg text-warning">${detail.pendingAmount.toLocaleString()}</p>
                    </div>
                </div>
                {payments.length > 0 && (
                    <div className="mb-4 space-y-1 max-h-32 overflow-y-auto">
                        <p className="text-xs font-bold text-base-content/40 uppercase mb-1">Historial de pagos</p>
                        {payments.map((p) => (
                            <div key={p.publicId} className="flex justify-between text-xs bg-base-200 rounded-lg px-3 py-2">
                                <span>{p.paymentType === "ADVANCE" ? "Anticipo" : "Liquidación"} - {p.paymentMethod}</span>
                                <span className="font-semibold">${p.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
                {detail.pendingAmount > 0 && (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Monto</legend>
                                <input type="number" step="0.01" min="0.01" max={detail.pendingAmount}
                                    className="input input-bordered w-full" value={amount}
                                    onChange={(e) => setAmount(e.target.value)} required />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Método</legend>
                                <select className="select select-bordered w-full" value={method}
                                    onChange={(e) => setMethod(e.target.value as any)}>
                                    <option value="CASH">Efectivo</option>
                                    <option value="CARD">Tarjeta</option>
                                    <option value="TRANSFER">Transferencia</option>
                                </select>
                            </fieldset>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Tipo</legend>
                                <select className="select select-bordered w-full" value={type}
                                    onChange={(e) => setType(e.target.value as any)}>
                                    <option value="ADVANCE">Anticipo</option>
                                    <option value="FINAL">Liquidación</option>
                                </select>
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Referencia</legend>
                                <input type="text" className="input input-bordered w-full" value={reference}
                                    onChange={(e) => setReference(e.target.value)} placeholder="Opcional" />
                            </fieldset>
                        </div>
                        {error && <p className="text-error text-xs">{error}</p>}
                        <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
                            {loading ? <span className="loading loading-spinner" /> : <DollarSign className="w-4 h-4" />}
                            Registrar pago
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function DetailModal({ event, onClose, onRefresh }: { event: EventResponse; onClose: () => void; onRefresh: () => void }) {
    const [detail, setDetail] = useState<EventResponse & { payments?: EventPaymentResponse[] }>(event);
    const [showPayment, setShowPayment] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ customerName: event.customerName, childName: event.childName || "", guestCount: event.guestCount ?? 0, notes: event.notes || "" });
    const [rescheduleData, setRescheduleData] = useState({ eventDate: event.eventDate, startTime: event.startTime, endTime: event.endTime });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getEventDetail(event.publicId).then(setDetail).catch(() => {});
    }, [event.publicId]);

    if (showPayment) {
        return <PaymentModal event={detail} onClose={() => { setShowPayment(false); onRefresh(); }} />;
    }

    const handleEdit = async () => {
        setSaving(true); setError("");
        try {
            const updated = await updateEvent(detail.publicId, editData);
            setDetail((prev) => ({ ...prev, ...updated }));
            setIsEditing(false);
            onRefresh();
        } catch (err: any) { setError(err.message || "Error al actualizar"); }
        finally { setSaving(false); }
    };

    const handleReschedule = async () => {
        setSaving(true); setError("");
        try {
            const updated = await rescheduleEvent(detail.publicId, rescheduleData);
            setDetail((prev) => ({ ...prev, ...updated }));
            setShowReschedule(false);
            onRefresh();
        } catch (err: any) { setError(err.message || "Error al reprogramar"); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl max-w-2xl w-full mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-lg">{detail.customerName}</h3>
                    <div className="flex items-center gap-2">
                        {detail.status !== "CANCELLED" && detail.status !== "COMPLETED" && (
                            <button className="btn btn-ghost btn-sm gap-1" onClick={() => setIsEditing(!isEditing)}>
                                <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                        )}
                        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}><X className="w-4 h-4" /></button>
                    </div>
                </div>
                <StatusBadge status={detail.status} />

                {isEditing ? (
                    <div className="space-y-3 mt-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del cliente</legend>
                            <input type="text" className="input input-bordered w-full" value={editData.customerName}
                                onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del niño</legend>
                            <input type="text" className="input input-bordered w-full" value={editData.childName}
                                onChange={(e) => setEditData({ ...editData, childName: e.target.value })} />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Invitados</legend>
                            <input type="number" className="input input-bordered w-full" value={editData.guestCount}
                                onChange={(e) => setEditData({ ...editData, guestCount: Number(e.target.value) })} />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Notas</legend>
                            <textarea className="textarea textarea-bordered w-full" value={editData.notes}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                        </fieldset>
                        {error && <p className="text-error text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <button className="btn btn-ghost flex-1" onClick={() => setIsEditing(false)}>Cancelar</button>
                            <button className="btn btn-primary flex-1" onClick={handleEdit} disabled={saving}>
                                {saving ? <span className="loading loading-spinner" /> : "Guardar"}
                            </button>
                        </div>
                    </div>
                ) : showReschedule ? (
                    <div className="space-y-3 mt-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nueva fecha</legend>
                            <input type="date" className="input input-bordered w-full" value={rescheduleData.eventDate}
                                onChange={(e) => setRescheduleData({ ...rescheduleData, eventDate: e.target.value })} />
                        </fieldset>
                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Hora inicio</legend>
                                <input type="time" className="input input-bordered w-full" value={rescheduleData.startTime}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, startTime: e.target.value })} />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Hora fin</legend>
                                <input type="time" className="input input-bordered w-full" value={rescheduleData.endTime}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, endTime: e.target.value })} />
                            </fieldset>
                        </div>
                        {error && <p className="text-error text-xs">{error}</p>}
                        <div className="flex gap-2">
                            <button className="btn btn-ghost flex-1" onClick={() => setShowReschedule(false)}>Cancelar</button>
                            <button className="btn btn-warning flex-1" onClick={handleReschedule} disabled={saving}>
                                {saving ? <span className="loading loading-spinner" /> : "Reprogramar"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                            <div><span className="text-base-content/40">Paquete:</span> <span className="font-semibold">{detail.packageName}</span></div>
                            <div><span className="text-base-content/40">Niño:</span> <span className="font-semibold">{detail.childName || "—"}</span></div>
                            <div><span className="text-base-content/40">Fecha:</span> <span className="font-semibold">{detail.eventDate}</span></div>
                            <div><span className="text-base-content/40">Horario:</span> <span className="font-semibold">{detail.startTime} - {detail.endTime}</span></div>
                            <div><span className="text-base-content/40">Invitados:</span> <span className="font-semibold">{detail.guestCount ?? 0}</span></div>
                            {detail.notes && <div className="col-span-2"><span className="text-base-content/40">Notas:</span> <span>{detail.notes}</span></div>}
                        </div>
                        <div className="flex gap-3 mt-4 text-sm">
                            <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                                <p className="text-base-content/40 text-xs">Total</p>
                                <p className="font-bold text-lg">${detail.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                                <p className="text-base-content/40 text-xs">Pagado</p>
                                <p className="font-bold text-lg text-success">${detail.paidAmount.toLocaleString()}</p>
                            </div>
                            <div className="flex-1 bg-base-200 rounded-xl p-3 text-center">
                                <p className="text-base-content/40 text-xs">Pendiente</p>
                                <p className="font-bold text-lg text-warning">${detail.pendingAmount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            {detail.status !== "CANCELLED" && detail.status !== "COMPLETED" && (
                                <>
                                    <button className="btn btn-primary flex-1 gap-2" onClick={() => setShowPayment(true)}>
                                        <DollarSign className="w-4 h-4" /> Pago
                                    </button>
                                    <button className="btn btn-warning flex-1 gap-2" onClick={() => setShowReschedule(true)}>
                                        <RotateCcw className="w-4 h-4" /> Reprogramar
                                    </button>
                                    {detail.status === "CONFIRMED" && (
                                        <button className="btn btn-success flex-1 gap-2" onClick={async () => {
                                            await completeEvent(detail.publicId); onRefresh(); onClose();
                                        }}>
                                            <CheckCircle className="w-4 h-4" /> Completar
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Eventos() {
    const [eventsList, setEventsList] = useState<EventResponse[]>([]);
    const [packages, setPackages] = useState<ProductResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const modalRef = useRef<HTMLDialogElement>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState<EventResponse | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [dayEvents, setDayEvents] = useState<EventResponse[]>([]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const today = new Date();

    const loadEvents = useCallback(async () => {
        try {
            const data = await getMonthEvents(year, month + 1);
            setEventsList(data);
        } catch { } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        loadEvents();
        fetchProducts().then((prods) => setPackages(prods.filter((p) => p.type === "PACKAGE"))).catch(() => {});
    }, [loadEvents]);

    const loadDayEvents = useCallback(async (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        try {
            const data = await getDayEvents(dateStr);
            setDayEvents(data);
            setSelectedDay(day);
        } catch { }
    }, [year, month]);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

    const eventsByDay: Record<number, number> = {};
    eventsList.forEach((ev) => {
        const d = new Date(ev.eventDate + "T12:00:00");
        if (d.getMonth() === month && d.getFullYear() === year) {
            const day = d.getDate();
            eventsByDay[day] = (eventsByDay[day] || 0) + 1;
        }
    });

    const filteredEvents = (selectedDay ? dayEvents : eventsList).filter((ev) => {
        const matchesSearch = ev.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ev.packageName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === "all" || ev.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const handleDelete = async (ev: EventResponse) => {
        if (!confirm(`¿Cancelar evento de ${ev.customerName}?`)) return;
        try {
            await cancelEvent(ev.publicId);
            loadEvents();
            if (selectedDay) loadDayEvents(selectedDay);
        } catch (err: any) {
            alert(err.message || "Error al cancelar");
        }
    };

    const handleComplete = async (ev: EventResponse) => {
        try {
            await completeEvent(ev.publicId);
            loadEvents();
            if (selectedDay) loadDayEvents(selectedDay);
        } catch (err: any) {
            alert(err.message || "Error al completar");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
            await createEvent({
                packagePublicId: fd.get("packagePublicId") as string,
                customerName: fd.get("customerName") as string,
                childName: (fd.get("childName") as string) || undefined,
                eventDate: fd.get("eventDate") as string,
                startTime: fd.get("startTime") as string + ":00",
                endTime: fd.get("endTime") as string + ":00",
                guestCount: Number(fd.get("guestCount")),
                notes: (fd.get("notes") as string) || undefined,
            });
            modalRef.current?.close();
            e.currentTarget.reset();
            loadEvents();
        } catch (err: any) {
            alert(err.message || "Error al crear evento");
        }
    };

    const stats = {
        total: eventsList.length,
        active: eventsList.filter((e) => e.status === "CONFIRMED" || e.status === "PARTIAL" || e.status === "PENDING").length,
        pending: eventsList.filter((e) => e.status === "PENDING").length,
        revenue: eventsList.reduce((s, e) => s + e.paidAmount, 0),
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold">Eventos</h2>
                        <p className="text-xs text-base-content/40">{eventsList.length} eventos este mes</p>
                    </div>
                </div>
                <button className="btn btn-primary gap-2 shadow-md shadow-primary/20" onClick={() => modalRef.current?.showModal()}>
                    <Plus className="w-4 h-4" /> Nuevo Evento
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, icon: Calendar, color: "text-primary bg-primary/10" },
                    { label: "Activos", value: stats.active, icon: Clock, color: "text-success bg-success/10" },
                    { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-warning bg-warning/10" },
                    { label: "Ingresos", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-accent bg-accent/10" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 bg-base-100 rounded-xl p-3 border border-base-300/30">
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
                <div className="card bg-base-100 shadow-sm border border-base-300/30">
                    <div className="card-body p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm">
                                {currentDate.toLocaleDateString("es", { month: "long", year: "numeric" })}
                            </h3>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost btn-xs btn-square rounded-lg"
                                    onClick={() => setCurrentDate(new Date(year, month - 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button className="btn btn-ghost btn-xs btn-square rounded-lg"
                                    onClick={() => setCurrentDate(new Date(year, month + 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                                <div key={d} className="py-1.5 text-[10px] font-bold text-base-content/30 uppercase">{d}</div>
                            ))}
                            {Array.from({ length: firstDayIndex }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                                <CalendarDay
                                    key={day}
                                    day={day}
                                    count={eventsByDay[day]}
                                    isToday={day === today.getDate() && month === today.getMonth() && year === today.getFullYear()}
                                    onClick={() => loadDayEvents(day)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {selectedDay && (
                            <button className="btn btn-ghost btn-sm gap-1" onClick={() => { setSelectedDay(null); setDayEvents([]); }}>
                                <RotateCcw className="w-3 h-3" /> Ver todo
                            </button>
                        )}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/30" />
                            <input type="text" placeholder="Buscar evento o cliente..."
                                className="input input-bordered w-full pl-10 rounded-xl" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                            {searchQuery && (
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
                                    onClick={() => setSearchQuery("")}>
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-1 bg-base-200/50 rounded-xl p-1 border border-base-300/30">
                            {[
                                { value: "all", label: "Todos" },
                                { value: "PENDING", label: "Pendientes" },
                                { value: "CONFIRMED", label: "Confirmados" },
                                { value: "COMPLETED", label: "Completados" },
                                { value: "CANCELLED", label: "Cancelados" },
                            ].map(({ value, label }) => (
                                <button key={value}
                                    className={`btn btn-sm rounded-lg ${filterStatus === value ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => setFilterStatus(value)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
                        ) : filteredEvents.length > 0 ? (
                            filteredEvents.map((ev) => (
                                <EventCard key={ev.publicId} event={ev}
                                    onCancel={() => handleDelete(ev)}
                                    onComplete={() => handleComplete(ev)}
                                    onView={() => setSelectedEvent(ev)} />
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

            {selectedEvent && !showPaymentModal && (
                <DetailModal event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onRefresh={() => { loadEvents(); if (selectedDay) loadDayEvents(selectedDay); }} />
            )}

            {showPaymentModal && (
                <PaymentModal event={showPaymentModal}
                    onClose={() => { setShowPaymentModal(null); loadEvents(); }} />
            )}

            <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
                <div className="modal-box rounded-t-3xl sm:rounded-2xl max-w-lg">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"><X className="w-4 h-4" /></button>
                    </form>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
                        <div>
                            <h3 className="font-extrabold text-lg">Nuevo Evento</h3>
                            <p className="text-xs text-base-content/40">Completa los datos de la reservación</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del cliente</legend>
                            <input name="customerName" type="text" className="input input-bordered w-full" placeholder="Juan Pérez" required />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Nombre del niño (opcional)</legend>
                            <input name="childName" type="text" className="input input-bordered w-full" placeholder="Pedrito" />
                        </fieldset>
                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Fecha</legend>
                                <input name="eventDate" type="date" className="input input-bordered w-full" required />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Paquete</legend>
                                <select name="packagePublicId" className="select select-bordered w-full" required>
                                    <option value="">Selecciona un paquete</option>
                                    {packages.map((p) => (
                                        <option key={p.publicId} value={p.publicId}>{p.name} - ${p.price}</option>
                                    ))}
                                </select>
                            </fieldset>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Hora inicio</legend>
                                <input name="startTime" type="time" className="input input-bordered w-full" required />
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend text-xs">Hora fin</legend>
                                <input name="endTime" type="time" className="input input-bordered w-full" required />
                            </fieldset>
                        </div>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Número de niños</legend>
                            <input name="guestCount" type="number" min="1" max="50" className="input input-bordered w-full" placeholder="15" required />
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend text-xs">Observaciones</legend>
                            <textarea name="notes" className="textarea textarea-bordered w-full h-20" placeholder="Alergias, decoración especial, etc." />
                        </fieldset>
                        <div className="flex gap-2 pt-2">
                            <button type="button" className="btn btn-ghost flex-1" onClick={() => modalRef.current?.close()}>Cancelar</button>
                            <button type="submit" className="btn btn-primary flex-1 gap-2 shadow-md shadow-primary/20">
                                <Plus className="w-4 h-4" /> Crear evento
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop"><button>close</button></form>
            </dialog>
        </div>
    );
}
