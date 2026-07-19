import { useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
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
  onDateClick: (date: string) => void;
  onEventClick: (event: CalendarEventBase) => void;
  onViewChange: (view: string) => void;
  onDatesSet?: (gridStart: Date, gridEnd: Date, currentStart: Date, currentEnd: Date) => void;
  selectedDate?: string;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 1,
  CONFIRMED: 2,
  PENDING_DEPOSIT: 3,
  COMPLETED: 4,
  CANCELLED: 5,
};

function topStatus(dayEvents: { status: string }[]): string {
  if (dayEvents.length === 0) return "";
  return dayEvents.reduce((a, b) =>
    (STATUS_PRIORITY[a.status] ?? 99) < (STATUS_PRIORITY[b.status] ?? 99) ? a : b
  ).status;
}

function renderIndicators(frame: HTMLElement, dayEvents: CalendarEventBase[], dateStr: string, selectedDate?: string) {
  frame.querySelectorAll(".day-status-indicators").forEach((el) => el.remove());

  if (dayEvents.length > 0) {
    const top = topStatus(dayEvents);
    const color = getStatusColor(top);
    frame.style.backgroundColor = `${color}0D`;

    const indicators = document.createElement("div");
    indicators.className = "day-status-indicators flex justify-center gap-0.5 mt-0.5";
    indicators.style.pointerEvents = "none";

    const maxDots = Math.min(dayEvents.length, 3);
    for (let i = 0; i < maxDots; i++) {
      const dot = document.createElement("span");
      dot.className = "day-dot";
      dot.style.backgroundColor = getStatusColor(dayEvents[i].status);
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      dot.style.display = "inline-block";
      dot.style.flexShrink = "0";
      dot.style.border = "1px solid rgba(255,255,255,0.3)";
      indicators.appendChild(dot);
    }

    if (dayEvents.length > 3) {
      const more = document.createElement("span");
      more.className = "day-dot-more";
      more.textContent = `+${dayEvents.length - 3}`;
      more.style.fontSize = "9px";
      more.style.color = "var(--color-base-content)";
      more.style.opacity = "0.6";
      more.style.marginLeft = "2px";
      indicators.appendChild(more);
    }

    frame.appendChild(indicators);
  } else {
    frame.style.backgroundColor = "";
  }

  if (dateStr === selectedDate) {
    frame.style.boxShadow = "inset 0 0 0 2px var(--color-primary)";
    frame.style.borderRadius = "8px";
  } else {
    frame.style.boxShadow = "";
  }
}

export default function EventCalendarView({
  events,
  onDateClick,
  onEventClick,
  onViewChange,
  onDatesSet,
  selectedDate,
}: EventCalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const dayFramesRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    dayFramesRef.current.forEach((frame, dateStr) => {
      const dayEvents = eventsRef.current.filter((e) => e.eventDate === dateStr);
      renderIndicators(frame, dayEvents, dateStr, selectedDate);
    });
  }, [events, selectedDate]);

  const calendarEvents = events.map((event) => {
    const color = getStatusColor(event.status);
    return {
      id: event.publicId,
      title: `${event.childName || event.customerName}`,
      start: `${event.eventDate}T${event.startTime}`,
      end: `${event.eventDate}T${event.endTime}`,
      backgroundColor: color,
      borderColor: color,
      textColor: "#fff",
      extendedProps: { event },
    };
  });

  const handleEventClick = useCallback(
    (info: any) => {
      onEventClick(info.event.extendedProps.event as CalendarEventBase);
    },
    [onEventClick]
  );

  const handleDateClick = useCallback(
    (info: any) => {
      onDateClick(info.dateStr);
    },
    [onDateClick]
  );

  const handleDatesSet = useCallback(
    (info: any) => {
      if (onDatesSet && info.start && info.end && info.view) {
        onDatesSet(info.start, info.end, info.view.currentStart, info.view.currentEnd);
      }
    },
    [onDatesSet]
  );

  const legendItems = [
    { label: "Pendiente", status: "PENDING_DEPOSIT" },
    { label: "Confirmado", status: "CONFIRMED" },
    { label: "En progreso", status: "IN_PROGRESS" },
    { label: "Completado", status: "COMPLETED" },
    { label: "Cancelado", status: "CANCELLED" },
  ];

  return (
    <div className="bg-base-100 border border-base-300/20 rounded-xl overflow-hidden">
      <div className="[&_.fc-theme-standard]:!border-transparent [&_.fc-scrollgrid]:!border-transparent [&_.fc-scrollgrid-section>td]:!border-transparent [&_.fc-col-header-cell]:!border-base-300/20 [&_.fc-daygrid-day]:!border-base-300/10 [&_.fc-daygrid-day-top]:!justify-center [&_.fc-daygrid-day-number]:!text-sm [&_.fc-daygrid-day-number]:!font-semibold [&_.fc-daygrid-day-number]:!p-1.5 [&_.fc-daygrid-day-events]:!hidden [&_.fc-daygrid-more-link]:!text-[10px] [&_.fc-daygrid-more-link]:!text-primary [&_.fc-daygrid-more-link]:!font-medium [&_.fc-daygrid-day-frame]:!min-h-[4.5rem] [&_.fc-daygrid-day-frame]:!p-1 [&_.fc-header-toolbar]:!mb-2 [&_.fc-header-toolbar]:!px-2 [&_.fc-header-toolbar]:!pt-1 [&_.fc-toolbar-title]:!text-base [&_.fc-button]:!h-8 [&_.fc-button]:!text-xs [&_.fc-button]:!rounded-lg [&_.fc-button-primary]:!bg-base-200 [&_.fc-button-primary]:!text-base-content [&_.fc-button-primary]:!border-base-300/20 [&_.fc-button-primary:hover]:!bg-base-300 [&_.fc-button-primary:not(:disabled).fc-button-active]:!bg-primary [&_.fc-button-primary:not(:disabled).fc-button-active]:!text-primary-content [&_.fc-day-today]:!bg-primary/[0.06] [&_.fc-day-today_.fc-daygrid-day-number]:!text-primary [&_.fc-day-today_.fc-daygrid-day-number]:!font-bold [&_.fc-daygrid-day]:!cursor-pointer [&_.fc-daygrid-day:hover]:!bg-base-200/60 [&_.fc-scrollgrid]:!rounded-lg [&_.fc-theme-standard]:!rounded-lg [&_.fc-col-header]:!bg-base-200/40 [&_.fc-scrollgrid]:!bg-base-200/20 [&_.fc-scrollgrid-sync-table]:!bg-transparent [&_.fc-theme-standard td]:!bg-transparent [&_.fc-col-header-cell]:!text-xs [&_.fc-col-header-cell]:!font-semibold [&_.fc-col-header-cell]:!text-base-content/50 [&_.fc-col-header-cell]:!uppercase [&_.fc-col-header-cell]:!tracking-wider [&_.fc-col-header-cell]:!py-2 [&_.fc-daygrid-body]:!rounded-lg [&_.fc-daygrid-body-unbalanced]:!rounded-lg]">
      <div className="p-3">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          viewDidMount={(info) => onViewChange(info.view.type)}
          height="auto"
          contentHeight="auto"
          dayMaxEvents={2}
          moreLinkText={(num) => `+${num}`}
          noEventsText=""
          eventDisplay="none"
          displayEventTime={false}
          dayCellClassNames={(arg) => {
            const dateStr = formatLocalDate(arg.date);
            const dayEvents = events.filter((e) => e.eventDate === dateStr);
            const cls = [];
            if (dayEvents.length > 0) cls.push("has-events");
            if (dateStr === selectedDate) cls.push("selected-day");
            return cls.join(" ");
          }}
          dayCellDidMount={(arg) => {
            const dateStr = formatLocalDate(arg.date);
            const frame = arg.el.querySelector(".fc-daygrid-day-frame") as HTMLElement;
            if (!frame) return;
            dayFramesRef.current.set(dateStr, frame);
            const dayEvents = eventsRef.current.filter((e) => e.eventDate === dateStr);
            renderIndicators(frame, dayEvents, dateStr, selectedDate);
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "D\u00eda",
          }}
        />
      </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 border-t border-base-300/10 mt-1">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(item.status) }}
            />
            <span className="text-[11px] text-base-content/60">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
