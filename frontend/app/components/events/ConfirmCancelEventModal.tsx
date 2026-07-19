import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmCancelEventModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventName: string;
  loading?: boolean;
}

export default function ConfirmCancelEventModal({
  open,
  onClose,
  onConfirm,
  eventName,
  loading = false,
}: ConfirmCancelEventModalProps) {
  if (!open) return null;

  return (
    <dialog className="modal modal-open" open>
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-error" />
          </div>

          <h3 className="font-bold text-lg mb-2">Cancelar evento</h3>
          <p className="text-base-content/70 text-sm mb-1">
            ¿Deseas cancelar el evento de <strong>{eventName}</strong>?
          </p>
          <p className="text-base-content/50 text-xs">
            Esta acción liberará el horario para nuevas reservaciones.
          </p>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Cancelando...
              </>
            ) : (
              "Confirmar cancelación"
            )}
          </button>
        </div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Cerrar</button>
      </form>
    </dialog>
  );
}