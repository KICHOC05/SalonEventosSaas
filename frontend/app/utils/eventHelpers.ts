export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING_DEPOSIT: "#F59E0B",
    CONFIRMED: "#3B82F6",
    IN_PROGRESS: "#8B5CF6",
    COMPLETED: "#6B7280",
    CANCELLED: "#EF4444",
  };
  return colors[status] || "#6B7280";
}

interface StatusBadge {
  color: string;
  label: string;
  dotColor: string;
  bgColor: string;
}

export function getStatusBadge(status: string): StatusBadge {
  const map: Record<string, StatusBadge> = {
    PENDING_DEPOSIT: {
      color: "badge-warning",
      label: "Pendiente",
      dotColor: "#F59E0B",
      bgColor: "bg-amber-500/10",
    },
    CONFIRMED: {
      color: "badge-info",
      label: "Confirmado",
      dotColor: "#3B82F6",
      bgColor: "bg-blue-500/10",
    },
    IN_PROGRESS: {
      color: "badge-primary",
      label: "En progreso",
      dotColor: "#8B5CF6",
      bgColor: "bg-purple-500/10",
    },
    COMPLETED: {
      color: "badge-neutral",
      label: "Completado",
      dotColor: "#6B7280",
      bgColor: "bg-gray-500/10",
    },
    CANCELLED: {
      color: "badge-error",
      label: "Cancelado",
      dotColor: "#EF4444",
      bgColor: "bg-red-500/10",
    },
  };
  return map[status] || {
    color: "badge-ghost",
    label: status,
    dotColor: "#6B7280",
    bgColor: "bg-gray-500/10",
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEventNumber(eventNumber: number): string {
  return `EV-${String(eventNumber).padStart(6, "0")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

export function canEdit(status: string): boolean {
  return status === "PENDING_DEPOSIT" || status === "CONFIRMED";
}

export function canConfirm(status: string): boolean {
  return status === "PENDING_DEPOSIT";
}

export function canStart(status: string): boolean {
  return status === "CONFIRMED";
}

export function canComplete(status: string): boolean {
  return status === "IN_PROGRESS";
}

export function canCancel(status: string): boolean {
  return status !== "CANCELLED" && status !== "COMPLETED";
}

export function isActive(status: string): boolean {
  return status !== "CANCELLED" && status !== "COMPLETED";
}
