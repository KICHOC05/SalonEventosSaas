import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusColor } from "~/utils/eventHelpers";

interface CalendarEventBase {
  publicId: string;
  childName: string;
  customerName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface EventCalendarViewProps {
  events: CalendarEventBase[];
  loading?: boolean;
  onDateClick: (date: string) => void;
  onMonthChange: (startDate: Date, endDate: Date) => void;
  selectedDate?: string;
}

interface CalendarDay {
  day: number;
  dateStr?: string;
  events: CalendarEventBase[];
}

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 1,
  CONFIRMED: 2,
  PENDING_DEPOSIT: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_DEPOSIT: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const LEGEND_ITEMS = [
  "PENDING_DEPOSIT",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eventDateOnly(value: string): string {
  return value.split("T")[0];
}

function topStatus(dayEvents: CalendarEventBase[]): string {
  if (dayEvents.length === 0) return "";
  return dayEvents.reduce((current, candidate) =>
    (STATUS_PRIORITY[current.status] ?? 99) <= (STATUS_PRIORITY[candidate.status] ?? 99)
      ? current
      : candidate
  ).status;
}

function monthRange(month: Date): { start: Date; end: Date } {
  return {
    start: new Date(month.getFullYear(), month.getMonth(), 1),
    end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
  };
}

export default function EventCalendarView({
  events,
  loading = false,
  onDateClick,
  onMonthChange,
  selectedDate,
}: EventCalendarViewProps) {
  const initialMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const monthLabel = useMemo(() => {
    const label = new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    }).format(visibleMonth);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [visibleMonth]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    const eventsByDate = new Map<string, CalendarEventBase[]>();

    events.forEach((event) => {
      const date = eventDateOnly(event.eventDate);
      const dayEvents = eventsByDate.get(date) ?? [];
      dayEvents.push(event);
      eventsByDate.set(date, dayEvents);
    });

    const days: CalendarDay[] = Array.from({ length: leadingEmptyDays }, () => ({
      day: 0,
      events: [],
    }));

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = formatLocalDate(new Date(year, month, day));
      days.push({
        day,
        dateStr,
        events: eventsByDate.get(dateStr) ?? [],
      });
    }

    return days;
  }, [events, visibleMonth]);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1
    );
    setVisibleMonth(nextMonth);
    const range = monthRange(nextMonth);
    onMonthChange(range.start, range.end);
  };

  const goToCurrentMonth = () => {
    setVisibleMonth(initialMonth);
    const range = monthRange(initialMonth);
    onMonthChange(range.start, range.end);
  };

  const isCurrentMonth =
    visibleMonth.getFullYear() === initialMonth.getFullYear() &&
    visibleMonth.getMonth() === initialMonth.getMonth();

  return (
    <div className="bg-base-100 border border-primary/20 rounded-2xl p-4 sm:p-6 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold capitalize truncate">
            <CalendarDays className="w-5 h-5 text-primary shrink-0" />
            {monthLabel}
          </h2>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
            {loading
              ? "Consultando agenda…"
              : `${events.length} evento${events.length === 1 ? "" : "s"} registrado${events.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={loading}
            aria-label="Ver mes anterior"
            className="btn btn-sm btn-square btn-ghost border border-base-300/30 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToCurrentMonth}
            disabled={loading || isCurrentMonth}
            className="btn btn-sm btn-ghost border border-base-300/30 rounded-full px-3 hidden sm:inline-flex"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={loading}
            aria-label="Ver mes siguiente"
            className="btn btn-sm btn-square btn-ghost border border-base-300/30 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
        {WEEK_DAYS.map((weekday) => (
          <div
            key={weekday}
            className="text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-base-content/45"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div
        className={`relative grid grid-cols-7 gap-1.5 sm:gap-2 transition-opacity ${loading ? "opacity-45" : "opacity-100"}`}
        aria-busy={loading}
      >
        {calendarDays.map((calendarDay, index) => {
          if (!calendarDay.dateStr) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayEvents = calendarDay.events;
          const status = topStatus(dayEvents);
          const statusColor = status ? getStatusColor(status) : "";
          const isSelected = selectedDate === calendarDay.dateStr;
          const isPast = calendarDay.dateStr < todayStr;
          const statusSummary = Array.from(new Set(dayEvents.map((event) => STATUS_LABELS[event.status] ?? event.status))).join(", ");
          const accessibleLabel = dayEvents.length > 0
            ? `${calendarDay.dateStr}: ${dayEvents.length} evento${dayEvents.length === 1 ? "" : "s"}, ${statusSummary}`
            : `${calendarDay.dateStr}: disponible, crear evento`;

          return (
            <button
              type="button"
              key={calendarDay.dateStr}
              onClick={() => onDateClick(calendarDay.dateStr!)}
              disabled={loading}
              aria-label={accessibleLabel}
              aria-pressed={isSelected}
              title={accessibleLabel}
              className={`group relative aspect-square min-h-10 rounded-xl border flex items-center justify-center text-xs sm:text-sm font-semibold transition-all
                ${dayEvents.length > 0
                  ? "hover:scale-95 shadow-sm"
                  : "bg-base-200/60 border-base-300/30 hover:bg-base-300/50"
                }
                ${isPast && dayEvents.length === 0 ? "text-base-content/30" : "text-base-content/80"}
                ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 scale-95" : ""}
              `}
              style={dayEvents.length > 0 ? {
                backgroundColor: `${statusColor}1F`,
                borderColor: statusColor,
              } : undefined}
            >
              <span>{calendarDay.day}</span>

              {dayEvents.length > 0 && (
                <>
                  <div className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.publicId}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/40"
                        style={{ backgroundColor: getStatusColor(event.status) }}
                      />
                    ))}
                  </div>
                  {dayEvents.length > 1 && (
                    <span
                      className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full text-[9px] leading-4 text-white font-bold"
                      style={{ backgroundColor: statusColor }}
                    >
                      {dayEvents.length}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="loading loading-spinner loading-md text-primary" aria-label="Cargando eventos" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 pt-4 border-t border-base-300/20">
        {LEGEND_ITEMS.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded border"
              style={{
                backgroundColor: `${getStatusColor(status)}33`,
                borderColor: getStatusColor(status),
              }}
            />
            <span className="text-[11px] text-base-content/60">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-base-content/40 mt-3">
        Las fechas ocupadas filtran los eventos; una fecha vacía abre la creación automáticamente.
      </p>
    </div>
  );
}
