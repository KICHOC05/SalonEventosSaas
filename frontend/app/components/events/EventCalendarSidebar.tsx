import EventQuickStats from "./EventQuickStats";
import EventStatusLegend from "./EventStatusLegend";
import type { EventResponse } from "~/types/event";

interface EventCalendarSidebarProps {
  events: EventResponse[];
  filterStatus: string;
  onFilterChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "PENDING_DEPOSIT", label: "Pendiente dep\u00f3sito" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function EventCalendarSidebar({
  events,
  filterStatus,
  onFilterChange,
  searchTerm,
  onSearchChange,
}: EventCalendarSidebarProps) {
  return (
    <div className="space-y-4 mb-6">
      <EventQuickStats events={events} />

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="form-control">
            <div className="join">
              <span className="join-item btn btn-disabled btn-sm text-base-content/40">
                Filtrar
              </span>
              <select
                className="select select-bordered select-sm join-item"
                value={filterStatus}
                onChange={(e) => onFilterChange(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-control w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar cliente o ni\u00f1o..."
            className="input input-bordered input-sm w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <EventStatusLegend />
    </div>
  );
}
