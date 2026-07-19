import React from "react";
import type { EventCalendarResponse } from "~/types/event";

interface EventStatsCardsProps {
  events: EventCalendarResponse[];
}

export default function EventStatsCards({ events }: EventStatsCardsProps) {
  const total = events.length;
  const confirmed = events.filter((e) => e.status === "CONFIRMED").length;
  const pending = events.filter((e) => e.status === "PENDING_DEPOSIT").length;
  const cancelled = events.filter((e) => e.status === "CANCELLED").length;

  const stats = [
    {
      label: "Eventos Totales",
      value: total,
      color: "bg-primary",
      icon: "📅",
    },
    {
      label: "Confirmados",
      value: confirmed,
      color: "bg-info",
      icon: "✅",
    },
    {
      label: "Pendientes",
      value: pending,
      color: "bg-warning",
      icon: "⏳",
    },
    {
      label: "Cancelados",
      value: cancelled,
      color: "bg-error",
      icon: "❌",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-base-100 rounded-2xl shadow-sm border border-base-300/50 p-5 flex items-center gap-4"
        >
          <div
            className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white`}
          >
            {stat.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-base-content">{stat.value}</p>
            <p className="text-sm text-base-content/60">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}