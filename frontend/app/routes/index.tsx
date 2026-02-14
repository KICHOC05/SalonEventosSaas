import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import {
  Rocket, Calendar, CalendarCheck, ChevronLeft, ChevronRight,
  Pause, Play, Cake, Gamepad2, Paintbrush, Users, Globe,
  Star, Crown, UtensilsCrossed, Waves, Camera, Gift, Images,
  ArrowRight, Phone, Mail, MapPin, Send, MessageCircle,
  Check, Clock, Facebook, Instagram, Youtube, Quote, Eye,
  User, ChevronDown,
} from "lucide-react";
import "~/styles/landing.css";

/* ╔══════════════════════════════════════════════╗
   ║                   DATA                       ║
   ╚══════════════════════════════════════════════╝ */

const videoCards = [
  {
    id: 1,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4",
    badge: "Cumpleaños Real",
    BadgeIcon: Cake,
    title: "Fiesta de Mateo",
    subtitle: "15 niños — Paquete Galáctico",
  },
  {
    id: 2,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-toys-46541-large.mp4",
    badge: "Zona de Juegos",
    BadgeIcon: Gamepad2,
    title: "Resbaladilla Lunar",
    subtitle: "Diversión sin gravedad",
  },
  {
    id: 3,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-in-a-castle-with-balls-41546-large.mp4",
    badge: "Decoración",
    BadgeIcon: Paintbrush,
    title: "Ambiente Galáctico",
    subtitle: "Planetas y estrellas",
  },
  {
    id: 4,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-on-a-slide-46618-large.mp4",
    badge: "Animación",
    BadgeIcon: Users,
    title: "Show Espacial",
    subtitle: "Astronauta divertido",
  },
  {
    id: 5,
    src: "https://assets.mixkit.co/videos/preview/mixkit-family-having-fun-at-a-birthday-party-41544-large.mp4",
    badge: "Testimonio",
    BadgeIcon: Quote,
    title: "Familia Rodríguez",
    subtitle: '"Inolvidable"',
  },
];

const packagesData = [
  {
    id: "basico",
    name: "Cohete Básico",
    desc: "Ideal para primeros exploradores",
    Icon: Rocket,
    gradient: "from-cyan-500 to-blue-700",
    btnGradient: "from-cyan-600 to-blue-700",
    features: [
      { Icon: Clock, text: "2 horas de diversión" },
      { Icon: Users, text: "Hasta 15 niños" },
      { Icon: Cake, text: "Pastel temático" },
      { Icon: Gamepad2, text: "Zona de juegos" },
    ],
    price: "$1,299",
  },
  {
    id: "galactico",
    name: "Viaje Galáctico",
    desc: "La experiencia completa",
    Icon: Globe,
    gradient: "from-pink-500 to-purple-700",
    btnGradient: "from-pink-600 to-purple-700",
    popular: true,
    features: [
      { Icon: Clock, text: "3 horas de aventura" },
      { Icon: Users, text: "Hasta 25 niños" },
      { Icon: Cake, text: "Pastel + cupcakes" },
      { Icon: Eye, text: "Realidad virtual" },
      { Icon: User, text: "Animador espacial" },
    ],
    price: "$2,199",
  },
  {
    id: "super",
    name: "Súper Space",
    desc: "Experiencia premium",
    Icon: Star,
    gradient: "from-yellow-500 to-orange-600",
    btnGradient: "from-yellow-600 to-orange-700",
    features: [
      { Icon: Clock, text: "4 horas de misión" },
      { Icon: Users, text: "Hasta 40 niños" },
      { Icon: UtensilsCrossed, text: "Buffet espacial" },
      { Icon: Waves, text: "Cohete inflable" },
      { Icon: Camera, text: "Fotógrafo incluido" },
    ],
    price: "$3,499",
  },
];

type DayStatus = "available" | "occupied" | "partial" | "empty";
interface CalDay {
  day: number;
  status: DayStatus;
  tip?: string;
}

const calendarDays: CalDay[] = [
  { day: 0, status: "empty" },
  { day: 0, status: "empty" },
  { day: 1, status: "available", tip: "✅ Disponible todo el día" },
  { day: 2, status: "occupied", tip: "❌ Ocupado" },
  { day: 3, status: "available", tip: "✅ Disponible" },
  { day: 4, status: "partial", tip: "🟡 Solo mañana" },
  { day: 5, status: "available", tip: "✅ Disponible" },
  { day: 6, status: "available" },
  { day: 7, status: "available" },
  { day: 8, status: "occupied" },
  { day: 9, status: "available" },
  { day: 10, status: "available" },
  { day: 11, status: "partial" },
  { day: 12, status: "available" },
  { day: 13, status: "available" },
  { day: 14, status: "available" },
  { day: 15, status: "occupied" },
  { day: 16, status: "occupied" },
  { day: 17, status: "available" },
  { day: 18, status: "partial" },
  { day: 19, status: "available" },
  { day: 20, status: "available" },
  { day: 21, status: "available" },
  { day: 22, status: "available" },
  { day: 23, status: "available" },
  { day: 24, status: "available" },
  { day: 25, status: "available" },
  { day: 26, status: "partial" },
  { day: 27, status: "available" },
  { day: 28, status: "available" },
  { day: 29, status: "occupied" },
  { day: 30, status: "available" },
  { day: 31, status: "available" },
];

const reviewsData = [
  {
    id: 1,
    name: "María González",
    date: "15 de octubre, 2024",
    img: "https://randomuser.me/api/portraits/women/32.jpg",
    text: "La fiesta de mi hijo de 7 años fue increíble. Los animadores, los juegos, la decoración… todo perfecto. ¡Volveremos seguro!",
    stars: 5,
  },
  {
    id: 2,
    name: "Carlos Ramírez",
    date: "8 de octubre, 2024",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
    text: "Elegimos el paquete Galáctico y superó todas las expectativas. La atención al detalle fue impecable. Mi hija todavía habla de su 'aventura espacial'.",
    stars: 5,
  },
  {
    id: 3,
    name: "Ana Martínez",
    date: "2 de octubre, 2024",
    img: "https://randomuser.me/api/portraits/women/67.jpg",
    text: "El mejor salón de fiestas al que hemos ido. El personal es muy atento y profesional, las instalaciones están impecables. Totalmente recomendado.",
    stars: 5,
  },
];

/* ╔══════════════════════════════════════════════╗
   ║                  HOOKS                       ║
   ╚══════════════════════════════════════════════╝ */

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ╔══════════════════════════════════════════════╗
   ║           HELPER COMPONENTS                  ║
   ╚══════════════════════════════════════════════╝ */

type AnimDir = "up" | "left" | "right";

function Animate({
  children,
  from = "up",
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  from?: AnimDir;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  const hidden: Record<AnimDir, string> = {
    up: "opacity-0 translate-y-8",
    left: "opacity-0 -translate-x-8",
    right: "opacity-0 translate-x-8",
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0 translate-y-0" : hidden[from]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`badge badge-lg gap-2 ${className}`}>
      {children}
    </span>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║           STARS BACKGROUND                   ║
   ╚══════════════════════════════════════════════╝ */

function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    for (let i = 0; i < 120; i++) {
      const s = document.createElement("div");
      const size = Math.random() * 3 + 1;
      Object.assign(s.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: "50%",
        boxShadow: "0 0 6px rgba(255,255,255,0.4)",
        animation: `twinkle ${Math.random() * 3 + 2}s ${Math.random() * 5}s infinite`,
      });
      c.appendChild(s);
    }
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none bg-base-200" />;
}

/* ╔══════════════════════════════════════════════╗
   ║              HERO SECTION                    ║
   ╚══════════════════════════════════════════════╝ */

function HeroSection() {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Video background */}
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-base-200 via-base-200/90 to-base-300/95" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <Animate>
          <SectionBadge className="badge-outline mb-6">🚀 Bienvenidos a bordo</SectionBadge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              ¡La mejor fiesta
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              infantil del universo!
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-base-content/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Un viaje intergaláctico lleno de diversión, juegos y aventuras para los pequeños astronautas
          </p>
        </Animate>

        <Animate delay={200}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="#reservar" className="btn btn-primary btn-lg gap-2 shadow-lg">
              <Rocket className="w-5 h-5" /> Reservar evento
            </a>
            <a href="#disponibilidad" className="btn btn-outline btn-lg gap-2">
              <Calendar className="w-5 h-5" /> Ver disponibilidad
            </a>
          </div>
        </Animate>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-10 h-16 border-2 border-base-content/30 rounded-full flex justify-center bg-base-200/50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-base-content to-transparent rounded-full mt-3 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║           VIDEO SLIDER SECTION               ║
   ╚══════════════════════════════════════════════╝ */

function VideoSliderSection() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);

  // Responsive cards visible
  const getVisible = useCallback(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }, []);

  const [visibleCards, setVisibleCards] = useState(3);
  useEffect(() => {
    const update = () => setVisibleCards(getVisible());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [getVisible]);

  const maxIndex = Math.max(0, videoCards.length - visibleCards);

  const slideToIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(i, maxIndex));
    setIndex(clamped);
  };

  // Calculate translateX
  useEffect(() => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector(".video-card") as HTMLElement;
    if (!card) return;
    const cardW = card.offsetWidth + 24; // card + gap
    trackRef.current.style.transform = `translateX(-${index * cardW}px)`;
  }, [index, visibleCards]);

  // Autoplay videos
  useEffect(() => {
    const t = setTimeout(() => {
      videosRef.current.forEach((v) => v?.play().catch(() => { }));
    }, 1000);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAll = () => videosRef.current.forEach((v) => v?.play().catch(() => { }));
  const handlePauseAll = () => videosRef.current.forEach((v) => v?.pause());

  return (
    <section id="videos" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="badge-primary badge-outline">Experiencia visual</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vive la experiencia Space Kids
          </h2>
          <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
            Momentos reales, sonrisas genuinas. Descubre cómo vivimos la magia espacial.
          </p>
        </Animate>

        {/* Slider */}
        <Animate>
          <div className="relative px-4 md:px-12">
            <div className="overflow-hidden">
              <div ref={trackRef} className="video-slider-track">
                {videoCards.map((vc, i) => (
                  <div
                    key={vc.id}
                    className="video-card card bg-base-100 border border-primary/30 hover:border-secondary hover:-translate-y-2 hover:shadow-xl hover:shadow-secondary/20 transition-all duration-300"
                    onMouseEnter={() => videosRef.current[i]?.pause()}
                    onMouseLeave={() => videosRef.current[i]?.play().catch(() => { })}
                  >
                    <video
                      ref={(el) => { if (el) videosRef.current[i] = el; }}
                      loop
                      muted
                      playsInline
                    >
                      <source src={vc.src} type="video/mp4" />
                    </video>

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="badge badge-secondary gap-1 shadow-lg">
                        <vc.BadgeIcon className="w-3 h-3" /> {vc.badge}
                      </span>
                    </div>

                    {/* Overlay */}
                    <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-base-300 to-transparent">
                      <h4 className="font-bold text-lg">{vc.title}</h4>
                      <p className="text-sm text-base-content/70">{vc.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows */}
            <button
              onClick={() => slideToIndex(index - 1)}
              className="btn btn-circle btn-sm btn-outline border-primary absolute left-0 top-1/2 -translate-y-1/2 z-10"
              disabled={index === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => slideToIndex(index + 1)}
              className="btn btn-circle btn-sm btn-outline border-primary absolute right-0 top-1/2 -translate-y-1/2 z-10"
              disabled={index >= maxIndex}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {videoCards.map((_, i) => (
              <button
                key={i}
                onClick={() => slideToIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === index
                    ? "w-8 bg-secondary shadow-lg shadow-secondary/50"
                    : "w-2.5 bg-base-content/30 hover:bg-base-content/50"
                  }`}
              />
            ))}
          </div>

          {/* Play / Pause */}
          <div className="flex justify-center gap-4 mt-6">
            <button onClick={handlePauseAll} className="btn btn-ghost btn-sm gap-2 border border-primary/30">
              <Pause className="w-4 h-4" /> Pausar
            </button>
            <button onClick={handlePlayAll} className="btn btn-ghost btn-sm gap-2 border border-secondary/30">
              <Play className="w-4 h-4" /> Reproducir
            </button>
          </div>
        </Animate>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║           PACKAGES SECTION                   ║
   ╚══════════════════════════════════════════════╝ */

function PackagesSection() {
  const dirs: AnimDir[] = ["left", "up", "right"];

  return (
    <section id="paquetes" className="py-24 px-4 bg-base-300">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="badge-secondary badge-outline">Elige tu aventura</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6">Paquetes Espaciales</h2>
          <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
            Todo incluido, sin sorpresas. Elige el que mejor se adapte a tu misión.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          {packagesData.map((pkg, i) => (
            <Animate key={pkg.id} from={dirs[i]} delay={i * 150}>
              <div
                className={`card bg-base-100 shadow-lg hover:shadow-xl hover:-translate-y-3 transition-all duration-300 border ${pkg.popular
                    ? "border-2 border-secondary lg:scale-105"
                    : "border-primary/30 hover:border-secondary"
                  } relative overflow-hidden`}
              >
                {/* Top gradient line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-secondary scale-x-0 hover:scale-x-100 transition-transform origin-left" />

                {pkg.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="badge badge-warning gap-1 font-bold">
                      <Crown className="w-3 h-3" /> MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className="card-body items-center text-center">
                  {/* Icon */}
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <pkg.Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="card-title text-2xl">{pkg.name}</h3>
                  <p className="text-base-content/60">{pkg.desc}</p>

                  {/* Features */}
                  <ul className="space-y-3 my-6 text-left w-full">
                    {pkg.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-3 text-base-content/80">
                        <f.Icon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{pkg.price}</span>
                    <span className="text-base-content/60"> MXN</span>
                  </div>

                  <a
                    href="#reservar"
                    className={`btn w-full bg-gradient-to-r ${pkg.btnGradient} text-white border-0 hover:opacity-90`}
                  >
                    Reservar ahora
                  </a>
                </div>
              </div>
            </Animate>
          ))}
        </div>

        {/* Gallery link */}
        <Animate className="text-center mt-16">
          <Link
            to="/galeria"
            className="btn btn-lg gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:opacity-90 shadow-lg"
          >
            <Images className="w-5 h-5" />
            Ver Galería Completa
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Animate>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║         AVAILABILITY / CALENDAR              ║
   ╚══════════════════════════════════════════════╝ */

function AvailabilitySection() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const statusStyles: Record<DayStatus, string> = {
    available: "bg-success/20 border-success text-base-content cursor-pointer hover:scale-95",
    occupied: "bg-error/20 border-error text-base-content/50 cursor-not-allowed",
    partial: "bg-warning/20 border-warning text-base-content cursor-pointer hover:scale-95",
    empty: "bg-transparent border-transparent",
  };

  const handleDayClick = (d: CalDay) => {
    if (d.status === "occupied" || d.status === "empty") return;
    setSelectedDate(`2024-10-${String(d.day).padStart(2, "0")}`);
  };

  return (
    <section id="disponibilidad" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="badge-primary badge-outline">Fechas en tiempo real</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Disponibilidad
          </h2>
          <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
            Consulta rápidamente qué fechas están libres para tu evento espacial
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Animate from="left" className="lg:col-span-2">
            <div className="card bg-base-100 shadow-lg border border-primary/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="card-title gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> Octubre 2024
                    </h3>
                    <p className="text-sm text-base-content/50">Enero 2024 — Diciembre 2024</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-circle btn-ghost btn-sm">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="btn btn-circle btn-ghost btn-sm">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {weekDays.map((wd) => (
                    <div key={wd} className="text-center text-sm font-semibold text-base-content/50">
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((d, i) => {
                    if (d.status === "empty") return <div key={`e${i}`} className="aspect-square" />;

                    const dateStr = `2024-10-${String(d.day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={d.day}
                        onClick={() => handleDayClick(d)}
                        className={`group relative aspect-square flex items-center justify-center rounded-xl border transition-all text-sm font-medium
                          ${statusStyles[d.status]}
                          ${isSelected ? "ring-2 ring-secondary ring-offset-2 ring-offset-base-100 scale-95" : ""}
                        `}
                      >
                        {d.day}
                        {d.tip && (
                          <span className="cal-tooltip bg-base-300 text-base-content border border-primary/30 shadow-lg">
                            {d.tip}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success/30 border border-success" />
                    <span className="text-sm text-base-content/70">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-error/30 border border-error" />
                    <span className="text-sm text-base-content/70">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-warning/30 border border-warning" />
                    <span className="text-sm text-base-content/70">Parcial</span>
                  </div>
                </div>
              </div>
            </div>
          </Animate>

          {/* Selected date panel */}
          <Animate from="right">
            <div className="card bg-base-100 shadow-lg border-2 border-secondary/50">
              <div className="card-body items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <CalendarCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="card-title text-2xl">Tu fecha</h3>
                <p className="text-base-content/60">Selecciona un día disponible</p>

                <div className="w-full my-6 p-6 bg-base-200 rounded-xl border border-secondary/30">
                  <p className="text-sm text-base-content/50 mb-2">Fecha seleccionada</p>
                  <p className="text-3xl font-bold text-secondary">
                    {selectedDate ?? "--/--/----"}
                  </p>
                </div>

                <a
                  href={
                    selectedDate
                      ? `https://wa.me/521234567890?text=¡Hola! Quiero reservar para el día ${selectedDate} en Space Kids`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full gap-2"
                >
                  <CalendarCheck className="w-4 h-4" /> Reservar esta fecha
                </a>

                <p className="text-xs text-base-content/40 mt-4">
                  * Las fechas parciales tienen disponibilidad limitada
                </p>
              </div>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║            REVIEWS SECTION                   ║
   ╚══════════════════════════════════════════════╝ */

function ReviewsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % reviewsData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="resenas" className="py-24 px-4 bg-base-300">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="badge-primary badge-outline">Prueba social</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Lo que dicen los padres
          </h2>
          <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
            +500 familias confían en nosotros para sus fiestas espaciales
          </p>
        </Animate>

        <Animate>
          <div className="max-w-4xl mx-auto relative min-h-[300px]">
            {reviewsData.map((r, i) => (
              <div
                key={r.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                <div className="card bg-base-100 shadow-lg border border-primary/30">
                  <div className="card-body">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full ring ring-secondary ring-offset-base-100 ring-offset-2">
                          <img src={r.img} alt={r.name} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{r.name}</h4>
                        <p className="text-sm text-base-content/50">{r.date}</p>
                        <div className="flex mt-1 gap-0.5">
                          {Array.from({ length: r.stars }).map((_, si) => (
                            <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-base-content/80 text-lg leading-relaxed italic">
                      "{r.text}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {reviewsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-3 rounded-full transition-all duration-300 ${i === active
                    ? "w-8 bg-secondary shadow-lg shadow-secondary/50"
                    : "w-3 bg-base-content/30 hover:bg-base-content/50"
                  }`}
              />
            ))}
          </div>
        </Animate>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          RESERVATION FORM                    ║
   ╚══════════════════════════════════════════════╝ */

function ReservationSection() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    date: "",
    pkg: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Ingresa tu nombre completo";
    if (!/^[0-9]{10,15}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Ingresa un teléfono válido";
    if (!form.date) e.date = "Selecciona una fecha";
    if (!form.pkg) e.pkg = "Selecciona un paquete";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const msg =
      `¡Hola Space Kids!%0A%0A` +
      `Quiero reservar un evento:%0A` +
      `👤 Nombre: ${form.fullName}%0A` +
      `📱 Teléfono: ${form.phone}%0A` +
      `📅 Fecha: ${form.date}%0A` +
      `🎁 Paquete: ${form.pkg}%0A` +
      `📝 Mensaje: ${form.message || "Sin mensaje adicional"}`;

    window.open(`https://wa.me/521234567890?text=${msg}`, "_blank");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ fullName: "", phone: "", date: "", pkg: "", message: "" });
    }, 3000);
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  return (
    <section id="reservar" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto max-w-3xl">
        <Animate className="text-center mb-12">
          <SectionBadge className="badge-secondary badge-outline">Comienza tu misión</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-4">Reserva tu aventura</h2>
          <p className="text-xl text-base-content/70">
            Completa el formulario y te contactaremos en minutos
          </p>
        </Animate>

        <Animate>
          <div className="card bg-base-100 shadow-xl border border-primary/30">
            <div className="card-body p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <User className="w-4 h-4 text-secondary" /> Nombre completo
                      </span>
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Ej: María González"
                      className={`input input-bordered w-full ${errors.fullName ? "input-error" : ""}`}
                    />
                    {errors.fullName && (
                      <label className="label"><span className="label-text-alt text-error">{errors.fullName}</span></label>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Phone className="w-4 h-4 text-secondary" /> Teléfono
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="Ej: 55 1234 5678"
                      className={`input input-bordered w-full ${errors.phone ? "input-error" : ""}`}
                    />
                    {errors.phone && (
                      <label className="label"><span className="label-text-alt text-error">{errors.phone}</span></label>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Date */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-secondary" /> Fecha del evento
                      </span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => update("date", e.target.value)}
                      className={`input input-bordered w-full ${errors.date ? "input-error" : ""}`}
                    />
                    {errors.date && (
                      <label className="label"><span className="label-text-alt text-error">{errors.date}</span></label>
                    )}
                  </div>

                  {/* Package */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Gift className="w-4 h-4 text-secondary" /> Paquete
                      </span>
                    </label>
                    <select
                      value={form.pkg}
                      onChange={(e) => update("pkg", e.target.value)}
                      className={`select select-bordered w-full ${errors.pkg ? "select-error" : ""}`}
                    >
                      <option value="" disabled>Selecciona un paquete</option>
                      <option value="Básico">Cohete Básico</option>
                      <option value="Galáctico">Viaje Galáctico</option>
                      <option value="Súper Space">Misión Súper Space</option>
                    </select>
                    {errors.pkg && (
                      <label className="label"><span className="label-text-alt text-error">{errors.pkg}</span></label>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-secondary" /> Mensaje adicional
                    </span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="¿Algo especial que quieras incluir? (alergias, horarios, etc.)"
                    className="textarea textarea-bordered h-32 w-full"
                  />
                </div>

                {/* Submit */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    className={`btn btn-lg gap-2 px-12 ${submitted ? "btn-success" : "btn-primary"
                      }`}
                    disabled={submitted}
                  >
                    {submitted ? (
                      <><Check className="w-5 h-5" /> ¡Enviado!</>
                    ) : (
                      <><Send className="w-5 h-5" /> Enviar solicitud</>
                    )}
                  </button>
                  <p className="text-sm text-base-content/40 mt-4">
                    Al enviar, se abrirá WhatsApp con tu solicitud prellenada
                  </p>
                </div>
              </form>
            </div>
          </div>
        </Animate>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║           CONTACT SECTION                    ║
   ╚══════════════════════════════════════════════╝ */

function ContactSection() {
  return (
    <section id="contacto" className="py-24 px-4 bg-base-300">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="badge-primary badge-outline">Estamos aquí</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Contacto espacial
          </h2>
          <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
            Respuesta inmediata por WhatsApp. Estamos para ayudarte.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <Animate from="left" className="space-y-8">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/521234567890?text=¡Hola! Me interesa reservar un evento en Space Kids"
              target="_blank"
              rel="noopener noreferrer"
              className="card bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xl hover:scale-[1.02] transition-transform"
            >
              <div className="card-body items-center text-center">
                <MessageCircle className="w-16 h-16 mb-2" />
                <h3 className="text-3xl font-bold">WhatsApp</h3>
                <p className="text-2xl font-semibold opacity-90">55 1234 5678</p>
                <p className="opacity-80">Respuesta en menos de 5 minutos ⚡</p>
              </div>
            </a>

            {/* Contact cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="card bg-base-100 shadow-md border border-primary/30">
                <div className="card-body">
                  <Phone className="w-8 h-8 text-primary mb-2" />
                  <h4 className="font-bold">Teléfono</h4>
                  <p className="text-lg text-base-content/80">55 1234 5678</p>
                  <p className="text-sm text-base-content/50">Lun-Dom: 10am - 8pm</p>
                </div>
              </div>
              <div className="card bg-base-100 shadow-md border border-secondary/30">
                <div className="card-body">
                  <Mail className="w-8 h-8 text-secondary mb-2" />
                  <h4 className="font-bold">Email</h4>
                  <p className="text-base-content/80">hola@spacekids.com</p>
                  <p className="text-base-content/80">reservas@spacekids.com</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="card bg-base-100 shadow-md border border-primary/30">
              <div className="card-body flex-row items-start gap-4">
                <MapPin className="w-8 h-8 text-accent flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Nuestra base espacial</h4>
                  <p className="text-lg text-base-content/80">Av. Galaxia 123, Col. Universo</p>
                  <p className="text-base-content/70">Ciudad de México, CDMX</p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold mb-4">Síguenos en el espacio</h4>
              <div className="flex gap-3">
                {[
                  { Icon: Facebook, href: "#" },
                  { Icon: Instagram, href: "#" },
                  { Icon: Youtube, href: "#" },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="btn btn-circle btn-ghost btn-lg border border-primary/30 hover:btn-secondary transition-all"
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
          </Animate>

          {/* Map */}
          <Animate from="right">
            <div className="rounded-2xl overflow-hidden h-[500px] border-2 border-primary/30 shadow-xl">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3747.848028517887!2d-99.22500742299098!3d20.05680724075811!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d22b4d2b1e3fbb%3A0x82a989f57f70d218!2sSpace%20Kids%2C%20Sal%C3%B3n%20de%20Eventos%20Infantiles!5e0!3m2!1ses-419!2smx!4v1771042210749!5m2!1ses-419!2smx"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Ubicación Space Kids"
              />
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║            MAIN PAGE EXPORT                  ║
   ╚══════════════════════════════════════════════╝ */

export default function HomePage() {
  // Smooth scroll for hash links
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      e.preventDefault();
      document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative">
      <StarsBackground />
      <HeroSection />
      <VideoSliderSection />
      <PackagesSection />
      <AvailabilitySection />
      <ReviewsSection />
      <ReservationSection />
      <ContactSection />
    </div>
  );
}