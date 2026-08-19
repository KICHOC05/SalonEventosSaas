import React, { useState, useCallback, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rescheduleEvent, checkEventAvailability } from "~/lib/api";
import type { EventResponse } from "~/types/event";
import { formatDate, formatTime } from "~/utils/eventHelpers";

interface RescheduleEventModalProps {
  open: boolean;
  onClose: () => void;
  event: EventResponse;
  onRescheduled: () => void;
}

type AvailStatus = "idle" | "checking" | "available" | "unavailable";

export default function RescheduleEventModal({
  open,
  onClose,
  event,
  onRescheduled,
}: RescheduleEventModalProps) {
  const [eventDate, setEventDate] = useState(event.eventDate);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [availStatus, setAvailStatus] = useState<AvailStatus>("idle");

  useEffect(() => {
    if (open) {
      setEventDate(event.eventDate);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setReason("");
      setAvailStatus("idle");
    }
  }, [open, event]);

  const checkAvail = useCallback(async () => {
    if (!eventDate || !startTime || !endTime) return;
    if (endTime <= startTime) return;
    setAvailStatus("checking");
    try {
      const result = await checkEventAvailability(eventDate, startTime, endTime, event.publicId);
      setAvailStatus(result.available ? "available" : "unavailable");
    } catch {
      setAvailStatus("idle");
    }
  }, [eventDate, startTime, endTime, event.publicId]);

  useEffect(() => {
    const timer = setTimeout(checkAvail, 500);
    return () => clearTimeout(timer);
  }, [checkAvail]);

  const hasChanged =
    eventDate !== event.eventDate ||
    startTime !== event.startTime ||
    endTime !== event.endTime;

  const canSubmit =
    hasChanged &&
    reason.trim().length > 0 &&
    availStatus === "available" &&
    !saving &&
    endTime > startTime;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      await rescheduleEvent(event.publicId, {
        eventDate,
        startTime,
        endTime,
        reason: reason.trim(),
      });
      toast.success("Evento reagendado correctamente");
      onRescheduled();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al reagendar el evento");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <dialog className="modal modal-open" open>
      <div className="modal-box max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-base-content/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Reagendar Evento</h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-base-content/60 mb-4">
          Evento de <strong>{event.childName}</strong> — actualmente:{" "}
          {formatDate(event.eventDate)} {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Nueva fecha *</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Hora inicio *</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Hora fin *</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
          </div>

          {endTime <= startTime && (
            <p className="text-error text-xs">La hora final debe ser mayor a la inicial</p>
          )}

          <div className="flex items-center gap-2">
            {availStatus === "checking" && (
              <span className="badge badge-warning gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Verificando...</span>
            )}
            {availStatus === "available" && (
              <span className="badge badge-success gap-1">Horario disponible</span>
            )}
            {availStatus === "unavailable" && (
              <span className="badge badge-error gap-1">Horario no disponible</span>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Motivo del cambio *</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="textarea textarea-bordered"
              rows={3}
              placeholder="Indica el motivo del reagendamiento"
              required
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Reagendando...</>
              ) : (
                "Guardar cambio"
              )}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Cerrar</button>
      </form>
    </dialog>
  );
}
