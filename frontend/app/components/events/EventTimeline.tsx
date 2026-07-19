import React from "react";
import { CheckCircle, Circle, Clock, CalendarCheck, XCircle } from "lucide-react";

interface EventTimelineProps {
  status: string;
}

const STEPS = [
  { key: "PENDING_DEPOSIT", label: "Pendiente depósito", icon: Clock },
  { key: "CONFIRMED", label: "Confirmado", icon: CalendarCheck },
  { key: "IN_PROGRESS", label: "En progreso", icon: Circle },
  { key: "COMPLETED", label: "Completado", icon: CheckCircle },
];

const CANCELLED_STEP = { key: "CANCELLED", label: "Cancelado", icon: XCircle };

export default function EventTimeline({ status }: EventTimelineProps) {
  const isCancelled = status === "CANCELLED";
  const steps = isCancelled ? [...STEPS, CANCELLED_STEP] : STEPS;
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="bg-base-200 rounded-xl p-4">
      <h4 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-4">
        Timeline del Evento
      </h4>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex && !isCancelled;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex && !isCancelled;
          const isCancelledStep = step.key === "CANCELLED";

          let bgColor = "bg-base-300";
          let textColor = "text-base-content/30";
          let lineColor = "bg-base-300";

          if (isCompleted && !isCancelledStep) {
            bgColor = "bg-success";
            textColor = "text-success";
            lineColor = "bg-success";
          } else if (isCurrent && !isCancelledStep) {
            bgColor = "bg-primary";
            textColor = "text-primary";
            lineColor = "bg-primary";
          } else if (isCancelledStep) {
            bgColor = "bg-error";
            textColor = "text-error";
            lineColor = "bg-error";
          }

          const Icon = step.icon;

          return (
            <div key={step.key} className="flex gap-4">
              {/* Línea vertical */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} text-white`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 ${lineColor}`} />
                )}
              </div>

              {/* Texto */}
              <div className="py-1">
                <p
                  className={`text-sm font-medium ${
                    isPending && !isCancelledStep
                      ? "text-base-content/30"
                      : textColor
                  }`}
                >
                  {step.label}
                  {isCurrent && !isCancelledStep && (
                    <span className="ml-2 text-xs font-normal text-base-content/40">
                      (actual)
                    </span>
                  )}
                  {isCancelledStep && (
                    <span className="ml-2 text-xs font-normal text-error/70">
                      (cancelado)
                    </span>
                  )}
                </p>
                {isCurrent && !isCancelledStep && (
                  <p className="text-xs text-primary/50">Paso actual</p>
                )}
                {isCancelledStep && (
                  <p className="text-xs text-error/50">Evento cancelado</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}