import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Check, AlertCircle, CalendarPlus } from "lucide-react";
import { createEvent, checkEventAvailability, fetchProducts, ApiError } from "~/lib/api";
import type { ProductResponse } from "~/types/product";
import type { CreateEventRequest } from "~/types/event";
import { toast } from "sonner";
import { formatCurrency } from "~/utils/eventHelpers";

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate?: string;
  onCreated: () => void;
}

type AvailStatus = "idle" | "checking" | "available" | "occupied" | "date_occupied";

export default function EventFormModal({
  open,
  onClose,
  selectedDate,
  onCreated,
}: EventFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<ProductResponse[]>([]);
  const [availStatus, setAvailStatus] = useState<AvailStatus>("idle");
  const [availMessage, setAvailMessage] = useState("");

  const [form, setForm] = useState<CreateEventRequest>({
    customerName: "",
    phone: "",
    childName: "",
    childAge: 1,
    eventDate: selectedDate || "",
    startTime: "10:00",
    endTime: "12:00",
    guestChildren: 0,
    guestAdults: 0,
    notes: "",
    packageProductPublicId: "",
    depositAmount: 0,
    initialPaymentMethod: "CASH",
    initialPaymentReference: "",
    initialPaymentNotes: "",
  });

  const selectedPackage = packages.find((p) => p.publicId === form.packageProductPublicId);
  const packagePrice = selectedPackage?.price ?? 0;
  const depositAmount = Number(form.depositAmount || 0);
  const remainingAmount = Math.max(0, packagePrice - depositAmount);
  const isDepositValid = depositAmount <= packagePrice && depositAmount >= 0;
  const isEndTimeValid = form.endTime > form.startTime;
  const today = new Date().toISOString().split("T")[0];
  const isPastDate = form.eventDate < today;

  const isFormComplete =
    form.customerName.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.childName.trim() !== "" &&
    form.eventDate !== "" &&
    form.startTime !== "" &&
    form.endTime !== "" &&
    form.packageProductPublicId !== "";

  const isSubmitDisabled =
    loading ||
    availStatus === "checking" ||
    availStatus === "occupied" ||
    availStatus === "date_occupied" ||
    !isDepositValid ||
    isPastDate ||
    !isEndTimeValid ||
    !isFormComplete ||
    packages.length === 0;

  const checkAvailability = useCallback(async () => {
    if (!form.eventDate || !form.startTime || !form.endTime || !isEndTimeValid || isPastDate) {
      setAvailStatus("idle");
      setAvailMessage("");
      return;
    }
    setAvailStatus("checking");
    setAvailMessage("Verificando disponibilidad...");
    try {
      const result = await checkEventAvailability(form.eventDate, form.startTime, form.endTime);
      if (result.available) {
        setAvailStatus("available");
        setAvailMessage("Horario disponible");
      } else {
        setAvailStatus("occupied");
        setAvailMessage("Horario ocupado");
      }
    } catch {
      setAvailStatus("idle");
      setAvailMessage("Error al verificar disponibilidad");
    }
  }, [form.eventDate, form.startTime, form.endTime, isEndTimeValid, isPastDate]);

  useEffect(() => {
    const t = setTimeout(checkAvailability, 500);
    return () => clearTimeout(t);
  }, [checkAvailability]);

  useEffect(() => {
    if (open) {
      fetchProducts()
        .then((products) => {
          const pkgs = products
            .filter((p) => p.type === "PACKAGE" && p.active)
            .sort((a, b) => a.price - b.price);
          setPackages(pkgs);
          if (pkgs.length > 0) {
            setForm((prev) => ({ ...prev, packageProductPublicId: pkgs[0].publicId }));
          }
        })
        .catch(() => toast.error("Error al cargar los paquetes disponibles"));
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate) setForm((prev) => ({ ...prev, eventDate: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    setAvailStatus("idle");
    setAvailMessage("");
  }, [form.eventDate, form.startTime, form.endTime]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availStatus !== "available") {
      toast.error("El horario no está disponible. Por favor selecciona otro.");
      return;
    }
    setLoading(true);
    try {
      await createEvent(form);
      toast.success("Evento creado correctamente");
      setForm({
        customerName: "",
        phone: "",
        childName: "",
        childAge: 1,
        eventDate: "",
        startTime: "10:00",
        endTime: "12:00",
        guestChildren: 0,
        guestAdults: 0,
        notes: "",
        packageProductPublicId: packages.length > 0 ? packages[0].publicId : "",
        depositAmount: 0,
        initialPaymentMethod: "CASH",
        initialPaymentReference: "",
        initialPaymentNotes: "",
      });
      onClose();
      onCreated();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || "Error al crear el evento");
        if (error.message?.includes("Solo se permite un evento por día")) {
          setAvailStatus("date_occupied");
          setAvailMessage("Ya existe un evento en esta fecha");
        }
      } else {
        toast.error("Error al crear el evento. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const renderAvailBadge = () => {
    switch (availStatus) {
      case "available":
        return <span className="badge badge-success gap-1"><Check className="w-3 h-3" /> {availMessage}</span>;
      case "occupied":
      case "date_occupied":
        return <span className="badge badge-error gap-1"><AlertCircle className="w-3 h-3" /> {availMessage}</span>;
      case "checking":
        return <span className="badge badge-warning gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {availMessage}</span>;
      default:
        return null;
    }
  };

  const inputCls = "input input-bordered w-full";
  const inputErrCls = "input input-bordered w-full input-error";
  const labelCls = "label-text font-medium";

  return (
    <dialog className="modal modal-open" open>
      <div className="modal-box max-w-3xl p-0 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-base-300/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Nuevo Evento</h3>
              <p className="text-xs text-base-content/50">Completa los datos de la reservaci&oacute;n</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {packages.length === 0 ? (
            <div className="p-6">
              <div className="alert alert-warning">
                <span>No existen paquetes activos para crear eventos</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                {/* ========== LEFT COLUMN — FORM FIELDS ========== */}
                <div className="md:col-span-3 p-6 space-y-6">

                  {/* Section 1: Customer */}
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                      Cliente
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Cliente *</span></label>
                        <input type="text" name="customerName" value={form.customerName} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Tel&eacute;fono *</span></label>
                        <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputCls} required />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Child / Event info */}
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                      Evento
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Nombre del ni&ntilde;o *</span></label>
                        <input type="text" name="childName" value={form.childName} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Edad</span></label>
                        <input type="number" name="childAge" value={form.childAge} onChange={handleChange} className={inputCls} min="0" max="18" />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Ni&ntilde;os invitados</span></label>
                        <input type="number" name="guestChildren" value={form.guestChildren} onChange={handleChange} className={inputCls} min="0" />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Adultos invitados</span></label>
                        <input type="number" name="guestAdults" value={form.guestAdults} onChange={handleChange} className={inputCls} min="0" />
                      </div>
                      <div className="form-control sm:col-span-2">
                        <label className="label py-1"><span className={labelCls}>Notas</span></label>
                        <textarea name="notes" value={form.notes} onChange={handleChange} className="textarea textarea-bordered" rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Date & Time */}
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                      Fecha y horario
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Fecha *</span></label>
                        <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} className={`${inputCls} ${isPastDate ? "input-error" : ""}`} required />
                        {isPastDate && <span className="text-error text-xs mt-1">Fecha inv&aacute;lida</span>}
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Hora inicio *</span></label>
                        <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={inputCls} required />
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Hora fin *</span></label>
                        <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className={`${inputCls} ${!isEndTimeValid ? "input-error" : ""}`} required />
                      </div>
                    </div>
                    {!isEndTimeValid && <p className="text-error text-xs mt-1">La hora final debe ser mayor a la inicial</p>}
                    <div className="mt-2">{renderAvailBadge()}</div>
                  </div>
                </div>

                {/* ========== RIGHT COLUMN — SUMMARY ========== */}
                <div className="md:col-span-2 bg-base-200/50 p-6 border-l border-base-300/20 space-y-6">
                  {/* Package */}
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                      Paquete
                    </h4>
                    <select
                      name="packageProductPublicId"
                      value={form.packageProductPublicId}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                      required
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.publicId} value={pkg.publicId}>
                          {pkg.name} &mdash; {formatCurrency(pkg.price)}
                        </option>
                      ))}
                    </select>
                    {selectedPackage && (
                      <div className="mt-2 p-3 bg-base-100 rounded-xl text-sm">
                        <p className="font-semibold">{selectedPackage.name}</p>
                        <p className="text-base-content/40 text-xs mt-1">{selectedPackage.description || ""}</p>
                      </div>
                    )}
                  </div>

                  {/* Financial summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                      Resumen financiero
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Precio del evento</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(packagePrice)}</span>
                      </div>
                      <div className="form-control">
                        <label className="label py-1"><span className={labelCls}>Anticipo</span></label>
                        <input
                          type="number"
                          name="depositAmount"
                          value={form.depositAmount}
                          onChange={handleChange}
                          className={`${inputCls} ${!isDepositValid ? "input-error" : ""}`}
                          min="0"
                          step="0.01"
                        />
                        {!isDepositValid && depositAmount > 0 && (
                          <span className="text-error text-xs mt-1">El anticipo no puede superar el precio</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-base-300/20">
                        <span className="text-sm text-base-content/60">Saldo pendiente</span>
                        <span className={`text-lg font-bold ${remainingAmount > 0 ? "text-warning" : "text-success"}`}>
                          {formatCurrency(remainingAmount)}
                        </span>
                      </div>
                      <progress
                        className="progress progress-primary w-full"
                        value={packagePrice > 0 ? Math.min((depositAmount / packagePrice) * 100, 100) : 0}
                        max="100"
                      />
                       <p className="text-xs text-base-content/40 text-right">
                        {packagePrice > 0 ? Math.min((depositAmount / packagePrice) * 100, 100).toFixed(0) : 0}% pagado
                      </p>

                      {depositAmount > 0 && (
                        <div className="space-y-3 pt-2 border-t border-base-300/20">
                          <h4 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider">
                            Pago inicial
                          </h4>
                          <div className="form-control">
                            <label className="label py-1"><span className={labelCls}>Método de pago *</span></label>
                            <select
                              name="initialPaymentMethod"
                              value={form.initialPaymentMethod || "CASH"}
                              onChange={handleChange}
                              className="select select-bordered w-full"
                              required
                            >
                              <option value="CASH">Efectivo</option>
                              <option value="CARD">Tarjeta</option>
                              <option value="TRANSFER">Transferencia</option>
                            </select>
                          </div>
                          <div className="form-control">
                            <label className="label py-1"><span className={labelCls}>Referencia</span></label>
                            <input
                              type="text"
                              name="initialPaymentReference"
                              value={form.initialPaymentReference || ""}
                              onChange={handleChange}
                              className={inputCls}
                              placeholder="Ej: SPEI-123456"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label py-1"><span className={labelCls}>Notas del pago</span></label>
                            <input
                              type="text"
                              name="initialPaymentNotes"
                              value={form.initialPaymentNotes || ""}
                              onChange={handleChange}
                              className={inputCls}
                              placeholder="Detalle adicional..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-full gap-2"
                    disabled={isSubmitDisabled}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
                    ) : (
                      <><CalendarPlus className="w-4 h-4" /> Crear Evento</>
                    )}
                  </button>

                  <div className="space-y-1">
                    {isPastDate && <p className="text-error text-xs">No se pueden registrar eventos en fechas pasadas</p>}
                    {availStatus === "occupied" && <p className="text-error text-xs">Ya existe un evento en ese horario</p>}
                    {availStatus === "date_occupied" && <p className="text-error text-xs">Solo se permite un evento por d&iacute;a</p>}
                    {!isDepositValid && depositAmount > 0 && <p className="text-error text-xs">El anticipo no puede ser mayor al precio del evento</p>}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-base-300/30 bg-base-200/30 flex-shrink-0">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Cerrar</button>
      </form>
    </dialog>
  );
}
