import { Eye, Check, Play, CheckCircle, Loader2, XCircle } from "lucide-react";
import { getStatusBadge, formatCurrency, formatEventNumber, formatTime, canConfirm, canStart, canComplete, canCancel } from "~/utils/eventHelpers";

interface EventCardItem {
  publicId: string;
  eventNumber: number;
  customerName: string;
  childName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
  packageName?: string;
  eventPrice?: number;
  guestChildren?: number;
}

interface EventCardProps {
  event: EventCardItem;
  onView: (publicId: string) => void;
  onConfirm?: (publicId: string) => void;
  onStart?: (publicId: string) => void;
  onComplete?: (publicId: string) => void;
  onCancel?: (publicId: string) => void;
  workflowLoading?: string | null;
}

export default function EventCard({
  event,
  onView,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  workflowLoading,
}: EventCardProps) {
  const badge = getStatusBadge(event.status);
  const date = new Date(event.eventDate + "T12:00:00");
  const day = date.getDate();
  const month = date.toLocaleDateString("es-MX", { month: "short" });
  const isToday = event.eventDate === new Date().toISOString().split("T")[0];
  const price = event.eventPrice ?? 0;

  const handleCancel = () => {
    if (onCancel && window.confirm("\u00bfEst\u00e1s seguro de cancelar este evento?")) {
      onCancel(event.publicId);
    }
  };

  return (
    <div className="group bg-base-100 border border-base-300/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-stretch gap-3 hover:border-base-300/50 hover:shadow-sm transition-all min-w-0">
      {/* Date block */}
      <div
        className={`shrink-0 w-full sm:w-14 flex flex-row sm:flex-col items-center justify-center gap-1 sm:gap-0 rounded-lg py-2 ${
          isToday ? "bg-primary/10 text-primary" : "bg-base-200"
        }`}
      >
        <span className="text-[10px] uppercase font-semibold tracking-wider">{month}</span>
        <span className="text-lg font-bold leading-none mt-0.5">{day}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-primary">
            {formatEventNumber(event.eventNumber)}
          </span>
          <span className="font-semibold text-sm truncate">{event.customerName}</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: badge.bgColor,
              color: badge.dotColor,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dotColor }} />
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-base-content/50 flex-wrap">
          {event.childName && <span>{event.childName}</span>}
          <span className="text-base-content/20">|</span>
          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          {price > 0 && (
            <>
              <span className="text-base-content/20">|</span>
              <span className="text-primary font-medium">{formatCurrency(price)}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center justify-end gap-1 pt-2 sm:pt-0 border-t border-base-300/20 sm:border-t-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-xs btn-square"
          title="Ver detalle"
          onClick={() => onView(event.publicId)}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        {onConfirm && canConfirm(event.status) && (
          <button
            className="btn btn-ghost btn-xs btn-square text-success"
            title="Confirmar"
            onClick={() => onConfirm(event.publicId)}
            disabled={workflowLoading !== null}
          >
            {workflowLoading === "confirm" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
        )}
        {onStart && canStart(event.status) && (
          <button
            className="btn btn-ghost btn-xs btn-square text-primary"
            title="Iniciar"
            onClick={() => onStart(event.publicId)}
            disabled={workflowLoading !== null}
          >
            {workflowLoading === "start" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}
        {onComplete && canComplete(event.status) && (
          <button
            className="btn btn-ghost btn-xs btn-square text-success"
            title="Completar"
            onClick={() => onComplete(event.publicId)}
            disabled={workflowLoading !== null}
          >
            {workflowLoading === "complete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          </button>
        )}
        {onCancel && canCancel(event.status) && (
          <button
            className="btn btn-ghost btn-xs btn-square text-error"
            title="Cancelar"
            onClick={handleCancel}
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
