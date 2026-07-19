import { getStatusColor, getStatusBadge } from "~/utils/eventHelpers";

const STATUSES = ["PENDING_DEPOSIT", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function EventStatusLegend() {
  return (
    <div className="flex flex-wrap gap-2 items-center text-xs">
      <span className="font-medium text-base-content/40 mr-1">Estado:</span>
      {STATUSES.map((status) => {
        const badge = getStatusBadge(status);
        return (
          <span
            key={status}
            className="badge badge-sm gap-1"
            style={{
              backgroundColor: `${getStatusColor(status)}20`,
              color: getStatusColor(status),
              borderColor: getStatusColor(status),
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getStatusColor(status) }}
            />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
