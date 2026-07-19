import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { fetchEventCalendar, fetchEvents, confirmEvent, startEvent, completeEvent, cancelEvent } from "~/lib/api";
import type { EventCalendarResponse, EventResponse } from "~/types/event";
import { canConfirm, canStart, canComplete } from "~/utils/eventHelpers";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import EventPageHeader from "~/components/events/EventPageHeader";
import EventQuickStats from "~/components/events/EventQuickStats";
import EventCalendarView from "~/components/events/EventCalendarView";
import EventCard from "~/components/events/EventCard";
import EventEmptyState from "~/components/events/EventEmptyState";
import EventFormModal from "~/components/events/EventFormModal";
import EventDetailsModal from "~/components/events/EventsDetailsModals";
import EventSubmoduleTabs from "~/components/events/EventSubmoduleTabs";
import type { SubmoduleTab } from "~/components/events/EventSubmoduleTabs";
import EventHistoryModule from "~/components/events/EventHistoryModule";
import EventStatsModule from "~/components/events/EventStatsModule";

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDateOnly(value?: string): string {
  return (value || "").split("T")[0];
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "PENDING_DEPOSIT", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "COMPLETED", label: "Completados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export default function EventosPage() {
  const [events, setEvents] = useState<EventCalendarResponse[]>([]);
  const [fullEvents, setFullEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullEventsLoading, setFullEventsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeSubmodule: SubmoduleTab = tabParam === "history" || tabParam === "stats" ? tabParam : "calendar";

  const [selectedDayFilter, setSelectedDayFilter] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const today = useMemo(() => formatLocalDate(new Date()), []);
  const visibleRangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState<string | null>(null);

  const loadEvents = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const from = formatLocalDate(startDate);
      const to = formatLocalDate(endDate);
      const data = await fetchEventCalendar(from, to);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFullEvents = async () => {
    setFullEventsLoading(true);
    try {
      const data = await fetchEvents();
      setFullEvents(data);
    } catch {
      setFullEvents([]);
    } finally {
      setFullEventsLoading(false);
    }
  };

  // Load current month on mount so EventCalendarView can render
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    visibleRangeRef.current = { start: firstDay, end: lastDay };
    loadEvents(firstDay, lastDay);
    loadFullEvents();
  }, []);

  const refreshCalendar = useCallback(() => {
    const range = visibleRangeRef.current;
    if (range) {
      loadEvents(range.start, range.end);
    } else {
      const now = new Date();
      loadEvents(
        new Date(now.getFullYear(), now.getMonth(), 1),
        new Date(now.getFullYear(), now.getMonth() + 1, 0)
      );
    }
    loadFullEvents();
  }, []);

  const handleDatesSet = useCallback(
    (gridStart: Date, gridEnd: Date, currentStart: Date, currentEnd: Date) => {
      if (currentView === "dayGridMonth") {
        const firstDay = new Date(currentStart.getFullYear(), currentStart.getMonth(), 1);
        const lastDay = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0);
        visibleRangeRef.current = { start: firstDay, end: lastDay };
        loadEvents(firstDay, lastDay);
      } else {
        visibleRangeRef.current = { start: gridStart, end: gridEnd };
        loadEvents(gridStart, gridEnd);
      }

      // Clear selected day if it falls outside the visible grid
      if (selectedDayFilter) {
        const sel = new Date(selectedDayFilter + "T12:00:00");
        if (sel < gridStart || sel > gridEnd) {
          setSelectedDayFilter("");
        }
      }
    },
    [currentView, selectedDayFilter]
  );

  const handleDayClick = (dateStr: string) => {
    setSelectedDayFilter(dateStr === selectedDayFilter ? "" : dateStr);
  };

  const openDetails = (publicId: string) => {
    setSelectedEventId(publicId);
    setDetailsModalOpen(true);
  };

  const handleEventClick = (event: { publicId: string }) => {
    openDetails(event.publicId);
  };

  const openNewEvent = () => {
    setCreateModalOpen(true);
  };

  const handleWorkflowAction = async (
    action: string,
    publicId: string,
    apiCall: () => Promise<any>
  ) => {
    setWorkflowLoading(action);
    try {
      await apiCall();
      const actionLabel =
        action === "confirm"
          ? "confirmado"
          : action === "start"
            ? "iniciado"
            : action === "complete"
              ? "completado"
              : action === "cancel"
                ? "cancelado"
                : action;
      toast.success(`Evento ${actionLabel} correctamente`);
      refreshCalendar();
    } catch (error: any) {
      const errLabel =
        action === "confirm"
          ? "confirmar"
          : action === "start"
            ? "iniciar"
            : action === "complete"
              ? "completar"
              : action === "cancel"
                ? "cancelar"
                : "procesar";
      toast.error(error.message || `Error al ${errLabel} el evento`);
    } finally {
      setWorkflowLoading(null);
    }
  };

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (selectedDayFilter) {
      result = result.filter((e) => getDateOnly(e.eventDate) === selectedDayFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.customerName?.toLowerCase().includes(q) ||
          e.childName?.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "CANCELLED") {
      result = result.filter((e) => e.status === "CANCELLED");
      result.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    } else if (filterStatus) {
      result = result.filter((e) => e.status === filterStatus);
      result.sort((a, b) => {
        const dc = a.eventDate.localeCompare(b.eventDate);
        if (dc !== 0) return dc;
        return a.startTime.localeCompare(b.startTime);
      });
    } else {
      result = result.filter((e) => e.status !== "CANCELLED");
      if (!selectedDayFilter) {
        result = result.filter((e) => e.eventDate >= today);
      }
      result.sort((a, b) => {
        const dc = a.eventDate.localeCompare(b.eventDate);
        if (dc !== 0) return dc;
        return a.startTime.localeCompare(b.startTime);
      });
    }

    return result;
  }, [events, selectedDayFilter, filterStatus, searchTerm, today]);

  const hasFilters = filterStatus !== "" || searchTerm !== "" || selectedDayFilter !== "";
  const showEmpty = !loading && filteredEvents.length === 0;

  return (
    <div className="space-y-6">
      <EventPageHeader
        onCreateClick={openNewEvent}
        onRefresh={refreshCalendar}
        monthCount={events.length}
      />

      <EventQuickStats events={fullEvents} />

      {/* Submodule tabs */}
      <EventSubmoduleTabs
        active={activeSubmodule}
        onChange={(tab) => setSearchParams(tab === "calendar" ? {} : { tab }, { replace: true })}
      />

      {/* ===== CALENDARIO SUBMODULE ===== */}
      {activeSubmodule === "calendar" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
          {/* Left: Calendar */}
          <div>
            {loading && events.length === 0 ? (
              <div className="bg-base-100 border border-base-300/20 rounded-xl p-8 flex items-center justify-center">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : (
              <EventCalendarView
                events={events}
                selectedDate={selectedDayFilter}
                onDateClick={handleDayClick}
                onEventClick={handleEventClick}
                onViewChange={setCurrentView}
                onDatesSet={handleDatesSet}
              />
            )}
          </div>

          {/* Right: Event list */}
          <div className="space-y-4">
            {/* Search & filters */}
            <div className="bg-base-100 border border-base-300/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Buscar cliente o niño..."
                    className="input input-bordered input-sm w-full pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="w-3.5 h-3.5 text-base-content/40" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    className={`badge badge-sm cursor-pointer transition-colors ${
                      filterStatus === f.value
                        ? "badge-primary"
                        : "badge-ghost hover:bg-base-300/50"
                    }`}
                    onClick={() => setFilterStatus(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {selectedDayFilter && (
                <div className="flex items-center gap-2 text-xs text-base-content/50">
                  <span>
                    Mostrando eventos del{" "}
                    {new Date(selectedDayFilter + "T12:00:00").toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <button
                    className="badge badge-ghost badge-xs cursor-pointer"
                    onClick={() => setSelectedDayFilter("")}
                  >
                    Ver todo
                  </button>
                </div>
              )}
            </div>

            {/* Event cards */}
            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-md text-primary" />
              </div>
            ) : showEmpty ? (
              <EventEmptyState
                hasFilters={hasFilters}
                onCreateClick={openNewEvent}
              />
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.publicId}
                    event={event}
                    onView={openDetails}
                    onCancel={(id) => handleWorkflowAction("cancel", id, () => cancelEvent(id))}
                    onConfirm={
                      canConfirm(event.status)
                        ? (id) => handleWorkflowAction("confirm", id, () => confirmEvent(id))
                        : undefined
                    }
                    onStart={
                      canStart(event.status)
                        ? (id) => handleWorkflowAction("start", id, () => startEvent(id))
                        : undefined
                    }
                    onComplete={
                      canComplete(event.status)
                        ? (id) => handleWorkflowAction("complete", id, () => completeEvent(id))
                        : undefined
                    }
                    workflowLoading={workflowLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== HISTORIAL SUBMODULE ===== */}
      {activeSubmodule === "history" && (
        <EventHistoryModule
          events={fullEvents}
          loading={fullEventsLoading}
          onViewDetails={openDetails}
        />
      )}

      {/* ===== ESTADÍSTICAS SUBMODULE ===== */}
      {activeSubmodule === "stats" && (
        <EventStatsModule
          events={fullEvents}
          loading={fullEventsLoading}
          onViewDetails={openDetails}
        />
      )}

      <EventFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        selectedDate={selectedDayFilter || today}
        onCreated={refreshCalendar}
      />

      <EventDetailsModal
        publicId={selectedEventId}
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onUpdated={refreshCalendar}
      />
    </div>
  );
}
