import React, { useState, useEffect, useCallback } from "react";
import {
  fetchEventByPublicId, cancelEvent, updateEvent, checkEventAvailability,
  confirmEvent, startEvent, completeEvent,
} from "~/lib/api";
import type {
  EventResponse, UpdateEventRequest,
} from "~/types/event";

import {
  Pencil, X, Check, Loader2, Calendar, AlertTriangle,
  Play, DollarSign,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStatusBadge, formatCurrency, formatDate, formatEventNumber, formatTime,
  canEdit, canConfirm, canStart, canComplete, canCancel,
} from "~/utils/eventHelpers";
import ConfirmCancelEventModal from "./ConfirmCancelEventModal";
import EventTimeline from "./EventTimeline";
import EventPaymentFlowModal from "./EventPaymentFlowModal";

interface EventsDetailsModalProps {
  publicId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EventsDetailsModal({
  publicId,
  open,
  onClose,
  onUpdated,
}: EventsDetailsModalProps) {
  // ✅ TODOS LOS HOOKS DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [editForm, setEditForm] = useState<UpdateEventRequest>({});
  const [originalForm, setOriginalForm] = useState<UpdateEventRequest>({});

  // Workflow
  const [workflowLoading, setWorkflowLoading] = useState<string | null>(null);

  // =====================================================
  // CARGAR EVENTO
  // =====================================================

  useEffect(() => {
    if (!open || !publicId) {
      setLoading(false);
      setEvent(null);
      return;
    }

    setLoading(true);

    fetchEventByPublicId(publicId)
      .then((data) => {
        setEvent(data);
        const formData = {
          customerName: data.customerName,
          phone: data.phone,
          childName: data.childName,
          childAge: data.childAge,
          eventDate: data.eventDate,
          startTime: data.startTime,
          endTime: data.endTime,
          guestChildren: data.guestChildren,
          guestAdults: data.guestAdults,
          notes: data.notes,
          packageProductPublicId: data.packageProductPublicId,
          depositAmount: data.depositAmount,
        };
        setEditForm(formData);
        setOriginalForm(formData);
      })
      .catch((error) => {
        console.error("Error al cargar evento:", error);
        toast.error("Error al cargar los detalles del evento");
        setEvent(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, publicId]);

  // =====================================================
  // VALIDACIONES
  // =====================================================

  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!editForm.eventDate) {
      toast.error("La fecha del evento es obligatoria");
      return false;
    }

    if (!editForm.startTime) {
      toast.error("La hora de inicio es obligatoria");
      return false;
    }

    if (!editForm.endTime) {
      toast.error("La hora de finalización es obligatoria");
      return false;
    }

    if (editForm.endTime <= editForm.startTime) {
      toast.error("La hora de finalización debe ser mayor a la hora de inicio");
      return false;
    }

    const age = editForm.childAge ?? 0;
    if (age < 0 || age > 18) {
      toast.error("La edad del niño debe estar entre 0 y 18 años");
      return false;
    }

    if ((editForm.guestChildren ?? 0) < 0) {
      toast.error("La cantidad de niños invitados no puede ser negativa");
      return false;
    }
    if ((editForm.guestAdults ?? 0) < 0) {
      toast.error("La cantidad de adultos invitados no puede ser negativa");
      return false;
    }

    if (event) {
      const deposit = editForm.depositAmount ?? 0;
      if (deposit > event.eventPrice) {
        toast.error("El anticipo no puede ser mayor al precio total del evento");
        return false;
      }
    }

    const hasTimeChanged =
      editForm.eventDate !== originalForm.eventDate ||
      editForm.startTime !== originalForm.startTime ||
      editForm.endTime !== originalForm.endTime;

    if (hasTimeChanged && publicId) {
      setAvailabilityChecking(true);
      try {
        const availability = await checkEventAvailability(
          editForm.eventDate!,
          editForm.startTime!,
          editForm.endTime!
        );
        if (!availability.available) {
          toast.error("Ya existe un evento reservado en ese horario");
          setAvailabilityChecking(false);
          return false;
        }
      } catch (error) {
        console.error("Error al verificar disponibilidad:", error);
        toast.error("Error al verificar disponibilidad");
        setAvailabilityChecking(false);
        return false;
      }
      setAvailabilityChecking(false);
    }

    return true;
  }, [editForm, originalForm, event, publicId]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleClose = () => {
    setEvent(null);
    setIsEditing(false);
    setSaving(false);
    setCancelling(false);
    setAvailabilityChecking(false);
    setShowConfirmCancel(false);
    setShowPaymentModal(false);
    setWorkflowLoading(null);
    setLoading(false);
    onClose();
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!publicId) return;

    const isValid = await validateForm();
    if (!isValid) return;

    setSaving(true);
    try {
      await updateEvent(publicId, editForm);
      toast.success("✅ Evento actualizado correctamente");
      setIsEditing(false);

      const updated = await fetchEventByPublicId(publicId);
      setEvent(updated);
      const formData = {
        customerName: updated.customerName,
        phone: updated.phone,
        childName: updated.childName,
        childAge: updated.childAge,
        eventDate: updated.eventDate,
        startTime: updated.startTime,
        endTime: updated.endTime,
        guestChildren: updated.guestChildren,
        guestAdults: updated.guestAdults,
        notes: updated.notes,
        packageProductPublicId: updated.packageProductPublicId,
        depositAmount: updated.depositAmount,
      };
      setEditForm(formData);
      setOriginalForm(formData);
      onUpdated();
    } catch (error: any) {
      console.error("Error al actualizar evento:", error);
      toast.error(error.message || "Error al actualizar el evento");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!publicId) return;

    setCancelling(true);
    try {
      await cancelEvent(publicId);
      toast.success("✅ Evento cancelado correctamente");
      setShowConfirmCancel(false);
      handleClose();
      onUpdated();
    } catch (error: any) {
      console.error("Error al cancelar evento:", error);
      toast.error(error.message || "Error al cancelar el evento");
    } finally {
      setCancelling(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(originalForm);
  };

  // =====================================================
  // WORKFLOW HANDLERS
  // =====================================================

  const handleWorkflowAction = async (action: string, apiCall: () => Promise<any>) => {
    setWorkflowLoading(action);
    try {
      await apiCall();
      toast.success(`Evento ${action === "confirm" ? "confirmado" : action === "start" ? "iniciado" : "completado"} correctamente`);
      const updated = await fetchEventByPublicId(event!.publicId);
      setEvent(updated);
      onUpdated();
    } catch (error: any) {
      toast.error(error.message || `Error al ${action === "confirm" ? "confirmar" : action === "start" ? "iniciar" : "completar"} el evento`);
    } finally {
      setWorkflowLoading(null);
    }
  };

  const handleConfirm = () => handleWorkflowAction("confirm", () => confirmEvent(event!.publicId));
  const handleStart = () => handleWorkflowAction("start", () => startEvent(event!.publicId));
  const handleComplete = () => handleWorkflowAction("complete", () => completeEvent(event!.publicId));

  // ✅ DESPUÉS DE TODOS LOS HOOKS, AQUÍ VAN LOS RETURNS CONDICIONALES

  // Si el modal está cerrado, NO renderizar nada
  if (!open) {
    return null;
  }

  // Debug temporal
  console.log("🔍 EventsDetailsModal:", {
    open,
    publicId,
    loading,
    hasEvent: !!event,
  });

  // =====================================================
  // SKELETON LOADER
  // =====================================================

  if (loading) {
    return (
      <dialog className="modal modal-open" open>
        <div className="modal-box max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-base-content/20">
          <div className="flex items-center justify-between mb-4">
            <div className="skeleton h-6 w-32" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="skeleton h-6 w-24" />
              <div className="skeleton h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-5 w-full" />
                </div>
              ))}
            </div>
            <div className="skeleton h-20 w-full" />
            <div className="flex justify-end gap-2">
              <div className="skeleton h-10 w-20" />
              <div className="skeleton h-10 w-28" />
            </div>
          </div>
        </div>
      </dialog>
    );
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!loading && !event) {
    return (
      <dialog className="modal modal-open" open>
        <div className="modal-box max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-base-content/20">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-16 h-16 text-warning mb-4" />
            <h3 className="text-lg font-semibold text-base-content/60">
              No se encontró información del evento
            </h3>
            <p className="text-sm text-base-content/40 mt-2">
              El evento pudo haber sido eliminado o el ID es inválido.
            </p>
            <button className="btn btn-primary mt-4" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  const badge = getStatusBadge(event!.status);
  const isCancelled = event!.status === "CANCELLED";
  const deposit = editForm.depositAmount ?? 0;
  const depositPercent = event!.eventPrice > 0 ? (deposit / event!.eventPrice) * 100 : 0;

  return (
    <>
      {!showPaymentModal && (
        <dialog className="modal modal-open" open>
        <div className="modal-box max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-base-content/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {isEditing ? "Editar Evento" : event!.customerName}
                </h3>
                <p className="text-xs text-base-content/50">
                  {isEditing
                    ? "Modifica los datos del evento"
                    : `${formatEventNumber(event!.eventNumber)} · Detalle de la reservación`}
                </p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm btn-square" onClick={handleClose}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Estado */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-base-content/60">Estado</p>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: badge.bgColor,
                  color: badge.dotColor,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.dotColor }} />
                {badge.label}
              </span>
            </div>
            <div className="text-right text-sm text-base-content/60">
              <p>Creado: {formatDate(event!.createdAt)}</p>
              <p>Actualizado: {formatDate(event!.updatedAt)}</p>
            </div>
          </div>

          {isEditing ? (
            // ========== FORMULARIO DE EDICIÓN ==========
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Cliente *</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={editForm.customerName || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Teléfono *</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nombre del niño *</span>
                </label>
                <input
                  type="text"
                  name="childName"
                  value={editForm.childName || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Edad del niño</span>
                </label>
                <input
                  type="number"
                  name="childAge"
                  value={editForm.childAge || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                  min="0"
                  max="18"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Fecha *</span>
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={editForm.eventDate || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Hora inicio *</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={editForm.startTime || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Hora fin *</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={editForm.endTime || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Anticipo ($)</span>
                </label>
                <input
                  type="number"
                  name="depositAmount"
                  value={editForm.depositAmount || ""}
                  onChange={handleEditChange}
                  className="input input-bordered"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Notas</span>
                </label>
                <textarea
                  name="notes"
                  value={editForm.notes || ""}
                  onChange={handleEditChange}
                  className="textarea textarea-bordered"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            // ========== VISTA DE DETALLE ==========
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-base-content/60">Cliente</p>
                  <p className="font-medium">{event!.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Teléfono</p>
                  <p className="font-medium">{event!.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Nombre del niño</p>
                  <p className="font-medium">{event!.childName}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Edad</p>
                  <p className="font-medium">{event!.childAge} años</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Fecha</p>
                  <p className="font-medium">{formatDate(event!.eventDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Horario</p>
                  <p className="font-medium">
                    {formatTime(event!.startTime)} - {formatTime(event!.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Niños invitados</p>
                  <p className="font-medium">{event!.guestChildren}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Adultos invitados</p>
                  <p className="font-medium">{event!.guestAdults}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Paquete</p>
                  <p className="font-medium">{event!.packageName}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Precio total</p>
                  <p className="font-medium">{formatCurrency(event!.eventPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Total pagado</p>
                  <p className="font-medium">{formatCurrency(event!.depositAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-base-content/60">Saldo pendiente</p>
                  <p className="font-medium">{formatCurrency(event!.remainingAmount)}</p>
                </div>
              </div>

              {/* Resumen Financiero Visual */}
              <div className="mt-4 p-4 bg-base-200 rounded-xl">
                <h4 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                  Resumen Financiero
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-base-content/50">Precio total</p>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(event!.eventPrice)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/50">Total pagado</p>
                    <p className="text-sm font-bold text-success">
                      {formatCurrency(event!.depositAmount)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/50">Saldo pendiente</p>
                    <p className="text-sm font-bold text-warning">
                      {formatCurrency(event!.remainingAmount)}
                    </p>
                  </div>
                </div>
                <div className="w-full">
                  <progress
                    className="progress progress-primary w-full"
                    value={Math.min(depositPercent, 100)}
                    max="100"
                  />
                  <p className="text-xs text-base-content/40 mt-1 text-right">
                    {Math.min(depositPercent, 100).toFixed(0)}% pagado
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    className={`btn w-full mt-4 gap-2 ${event!.remainingAmount <= 0 ? "btn-success btn-outline" : "btn-primary"}`}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <DollarSign className="w-4 h-4" />
                    {event!.remainingAmount <= 0 ? "Ver pagos y comprobantes" : "Registrar o consultar pagos"}
                  </button>
                )}
              </div>

              {/* Timeline */}
              <div className="mt-4">
                <EventTimeline status={event!.status} />
              </div>

              {event!.notes && (
                <div className="mt-4">
                  <p className="text-sm text-base-content/60">Notas</p>
                  <p className="p-3 bg-base-200 rounded-lg text-sm mt-1">
                    {event!.notes}
                  </p>
                </div>
              )}

              {/* Workflow Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-2">
                {canConfirm(event!.status) && event!.remainingAmount <= 0 && (
                  <button
                    type="button"
                    className="btn btn-success gap-2"
                    onClick={handleConfirm}
                    disabled={workflowLoading !== null}
                  >
                    {workflowLoading === "confirm" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
                    ) : (
                      <><Check className="w-4 h-4" /> Confirmar</>
                    )}
                  </button>
                )}
                {canConfirm(event!.status) && event!.remainingAmount > 0 && (
                  <div className="w-full">
                    <button
                      type="button"
                      className="btn btn-ghost gap-2 opacity-50 cursor-not-allowed w-full"
                      disabled
                    >
                      <Check className="w-4 h-4" /> Confirmar
                    </button>
                    <p className="text-xs text-warning mt-1">
                      Para confirmar el evento primero debe cubrirse el monto total.
                    </p>
                  </div>
                )}
                {canStart(event!.status) && (
                  <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={handleStart}
                    disabled={workflowLoading !== null}
                  >
                    {workflowLoading === "start" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando...</>
                    ) : (
                      <><Play className="w-4 h-4" /> Iniciar Evento</>
                    )}
                  </button>
                )}
                {canComplete(event!.status) && (
                  <button
                    type="button"
                    className="btn btn-success gap-2"
                    onClick={handleComplete}
                    disabled={workflowLoading !== null}
                  >
                    {workflowLoading === "complete" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Completando...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Completar</>
                    )}
                  </button>
                )}
              </div>

            </>
          )}

          {/* Acciones */}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              Cerrar
            </button>

            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cancelEdit}
                  disabled={saving || availabilityChecking}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveEdit}
                  disabled={saving || availabilityChecking}
                >
                  {saving || availabilityChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {availabilityChecking ? "Verificando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {!isCancelled && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-error"
                      onClick={() => setShowConfirmCancel(true)}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        "Cancelar Evento"
                      )}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={handleClose}>Cerrar</button>
        </form>
        </dialog>
      )}

      {/* Modal de confirmación de cancelación */}
      <ConfirmCancelEventModal
        open={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={handleCancelConfirm}
        eventName={event!.childName}
        loading={cancelling}
      />

      {event && (
        <EventPaymentFlowModal
          event={event}
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRegistered={(updatedEvent) => {
            setEvent(updatedEvent);
            setEditForm((current) => ({ ...current, depositAmount: updatedEvent.depositAmount }));
            setOriginalForm((current) => ({ ...current, depositAmount: updatedEvent.depositAmount }));
            onUpdated();
          }}
        />
      )}

    </>
  );
}
