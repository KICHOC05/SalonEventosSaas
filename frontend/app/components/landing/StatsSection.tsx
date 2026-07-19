// app/components/landing/StatsSection.tsx

import { useState, useEffect } from "react";
import { fetchPublicStats } from "~/lib/api";
import type { StatsResponse } from "~/types/landing";
import { AnimatedCounter } from "~/components/ui/AnimatedCounter";
import { Users, Star, Calendar, Award } from "lucide-react";

export function StatsSection() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar estadísticas:", error);
        setLoading(false);
      });
  }, []);

  const statItems = [
    {
      key: "events",
      icon: Calendar,
      label: "Fiestas realizadas",
      value: stats?.totalEvents || 0,
      color: "from-cyan-500 to-blue-600",
    },
    {
      key: "children",
      icon: Users,
      label: "Niños felices",
      value: stats?.happyChildren || 0,
      color: "from-pink-500 to-rose-600",
    },
    {
      key: "experience",
      icon: Award,
      label: "Años de experiencia",
      value: stats?.yearsExperience || 0,
      color: "from-amber-500 to-orange-600",
    },
    {
      key: "rating",
      icon: Star,
      label: "Calificación promedio",
      value: stats?.averageRating || 0,
      color: "from-yellow-400 to-yellow-600",
      format: (v: number) => v.toFixed(1),
      suffix: "★",
    },
  ];

  if (loading) {
    return (
      <section className="py-16 px-4 bg-base-100/50 border-y border-base-300/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="skeleton h-12 w-24 mx-auto mb-2" />
                <div className="skeleton h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-base-100/50 to-base-200/30 border-y border-base-300/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((item) => (
            <div
              key={item.key}
              className="text-center group"
            >
              <div className="relative inline-block mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-base-content">
                {item.key === "rating" ? (
                  <AnimatedCounter
                    target={item.value}
                    duration={2000}
                    format={(v) => v.toFixed(1)}
                    suffix="★"
                  />
                ) : (
                  <AnimatedCounter
                    target={item.value}
                    duration={2000}
                    suffix={item.key === "experience" ? "+" : ""}
                  />
                )}
              </div>
              <p className="text-sm text-base-content/60 mt-1 font-medium">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}