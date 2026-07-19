import { Calendar } from "lucide-react";

interface EventEmptyStateProps {
  hasFilters: boolean;
  onCreateClick: () => void;
}

export default function EventEmptyState({ hasFilters, onCreateClick }: EventEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
      <div className="w-14 h-14 rounded-xl bg-base-200 flex items-center justify-center mb-4">
        <Calendar className="w-7 h-7 text-base-content/30" />
      </div>
      <h3 className="text-base font-semibold text-base-content/50 mb-1">
        {hasFilters ? "Sin resultados" : "No hay eventos registrados"}
      </h3>
      <p className="text-sm text-base-content/30 mb-6">
        {hasFilters
          ? "Intenta ajustar los filtros o la b\u00fasqueda"
          : "Crea tu primer evento para comenzar"}
      </p>
      {!hasFilters && (
        <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
          Nuevo Evento
        </button>
      )}
    </div>
  );
}
