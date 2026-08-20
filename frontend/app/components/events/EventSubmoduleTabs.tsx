import { Calendar, History } from "lucide-react";

export type SubmoduleTab = "calendar" | "history";

interface EventSubmoduleTabsProps {
  active: SubmoduleTab;
  onChange: (tab: SubmoduleTab) => void;
}

const TABS: { id: SubmoduleTab; label: string; icon: typeof Calendar }[] = [
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "history", label: "Historial", icon: History },
];

export default function EventSubmoduleTabs({ active, onChange }: EventSubmoduleTabsProps) {
  return (
    <div className="bg-base-100 border border-base-300/20 rounded-xl p-1 inline-flex gap-1">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`btn btn-sm rounded-lg gap-1.5 transition-all ${
            active === id
              ? "btn-primary shadow-sm"
              : "btn-ghost text-base-content/60 hover:text-base-content hover:bg-base-200"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
