import { Plus, RotateCcw, Calendar } from "lucide-react";

interface EventPageHeaderProps {
  onCreateClick: () => void;
  onRefresh?: () => void;
  monthCount?: number;
}

export default function EventPageHeader({
  onCreateClick,
  onRefresh,
  monthCount,
}: EventPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Eventos</h1>
          <p className="text-sm text-base-content/60">
            {monthCount !== undefined
              ? `${monthCount} evento${monthCount !== 1 ? "s" : ""} este mes`
              : "Gesti\u00f3n de eventos"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button className="btn btn-ghost btn-sm btn-square" onClick={onRefresh}>
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>
    </div>
  );
}
