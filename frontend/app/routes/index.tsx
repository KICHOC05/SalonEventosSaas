import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import {
  Rocket,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Cake,
  Gamepad2,
  Paintbrush,
  Users,
  Globe,
  Star,
  Crown,
  UtensilsCrossed,
  Waves,
  Camera,
  Gift,
  Images,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  Check,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  Quote,
  Eye,
  User,
  Coffee,
} from "lucide-react";
import "~/styles/landing.css";
import { buildMeta } from "~/lib/meta";

export function meta() {
  return buildMeta("Pagina de Inicio", "Bienvenido a Spacekids");
}


const videoCards = [
  {
    id: 1,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4",
    badge: "Cafetería",
    BadgeIcon: Coffee,
    title: "Bebidas y postres",
    subtitle: "Disfruta mientras tus hijos se divierten",
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
  {
    id: 6,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4",
    badge: "Pastel Espacial",
    BadgeIcon: Cake,
    title: "Momento del pastel",
    subtitle: "Diseños personalizados",
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
    iconColor: "text-cyan-400",
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
    iconColor: "text-pink-400",
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
    iconColor: "text-yellow-400",
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
    borderColor: "ring-secondary",
  },
  {
    id: 2,
    name: "Carlos Ramírez",
    date: "8 de octubre, 2024",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
    text: "Elegimos el paquete Galáctico y superó todas las expectativas. La atención al detalle fue impecable. Mi hija todavía habla de su 'aventura espacial'.",
    stars: 5,
    borderColor: "ring-primary",
  },
  {
    id: 3,
    name: "Ana Martínez",
    date: "2 de octubre, 2024",
    img: "https://randomuser.me/api/portraits/women/67.jpg",
    text: "El mejor salón de fiestas al que hemos ido. El personal es muy atento y profesional, las instalaciones están impecables. Totalmente recomendado.",
    stars: 5,
    borderColor: "ring-purple-400",
  },
];


function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

type AnimDir = "up" | "left" | "right" | "zoom";

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
    zoom: "opacity-0 scale-90",
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible
        ? "opacity-100 translate-x-0 translate-y-0 scale-100"
        : hidden[from]
        } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block px-4 py-2 bg-base-100 rounded-full text-sm font-semibold tracking-wider uppercase border ${className}`}
    >
      {children}
    </span>
  );
}


function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    for (let i = 0; i < 150; i++) {
      const s = document.createElement("div");
      s.className = "star-dot";
      const size = Math.random() * 3 + 1;
      Object.assign(s.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: "50%",
        boxShadow: "0 0 10px rgba(255,255,255,0.5)",
        animation: `twinkle ${Math.random() * 3 + 2}s ${Math.random() * 5
          }s infinite`,
      });
      c.appendChild(s);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 20% 30%, #1E1B4B 0%, transparent 30%), radial-gradient(circle at 80% 70%, #4C1D95 0%, transparent 35%), radial-gradient(circle at 40% 80%, #0A0A1F 0%, transparent 40%)",
      }}
    />
  );
}


function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A1F] via-[#0A0A1F]/90 to-[#12122B]/95" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <Animate>
          <span className="inline-block px-6 py-3 bg-base-100 border border-primary rounded-full text-sm font-medium mb-6 shadow-lg">
            🚀 Bienvenidos a bordo
          </span>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              ¡La mejor fiesta
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              infantil del universo!
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Un viaje intergaláctico lleno de diversión, juegos y aventuras para
            los pequeños astronautas
          </p>
        </Animate>

        <Animate delay={200}>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a href="#reservar" className="btn-space-primary text-lg">
              <Rocket className="w-5 h-5" /> Reservar evento
            </a>
            <a href="#disponibilidad" className="btn-space-secondary text-lg">
              <Calendar className="w-5 h-5" /> Ver disponibilidad
            </a>
          </div>
        </Animate>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-12 h-20 border-2 border-white/30 rounded-full flex justify-center bg-[#0A0A1F]/50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-white to-transparent rounded-full mt-3 animate-pulse" />
        </div>
      </div>
    </section>
  );
}


function FeaturedExperienceSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="experiencia-destacada"
      className="py-24 px-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0A0A1F 0%, #1E1B4B 50%, #4C1D95 100%)",
      }}
    >
      <div className="container mx-auto">
        <Animate className="text-center mb-12">
          <SectionBadge className="border-primary/30 text-primary">
            ✨ Vive la magia
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Vive tu propia gran próxima experiencia
          </h2>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
            Cada fiesta es una aventura única. Mira cómo vivimos la magia y
            prepárate para crear recuerdos inolvidables con tus pequeños
            astronautas.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Animate from="left">
            <div className="featured-video-container">
              <video ref={videoRef} loop playsInline className="w-full h-full">
                <source
                  src="https://assets.mixkit.co/videos/preview/mixkit-children-playing-in-a-castle-with-balls-41546-large.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute bottom-0 inset-x-0 p-5 md:p-10 bg-gradient-to-t from-[#0A0A1F] to-transparent">
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">
                  La aventura espacial te espera
                </h3>
                <p className="text-white/80 text-lg">
                  Descubre cómo vivimos la diversión
                </p>
              </div>
              <button onClick={togglePlay} className="play-button-overlay">
                {isPlaying ? (
                  <Pause className="w-10 h-10 text-white" />
                ) : (
                  <Play className="w-10 h-10 text-white ml-1" />
                )}
              </button>
            </div>
          </Animate>

          <Animate from="right">
            <div className="space-y-8">
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-heading font-bold text-white">
                      Tu momento espacial
                    </h4>
                    <p className="text-primary">Comienza aquí</p>
                  </div>
                </div>
                <p className="text-white/80 text-lg mb-6">
                  En Space Kids, cada celebración es única. Desde decoraciones
                  personalizadas hasta animadores profesionales, creamos la
                  experiencia perfecta para tu pequeño astronauta.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl font-bold text-secondary">
                      500+
                    </div>
                    <p className="text-sm text-white/60">Fiestas realizadas</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-3xl font-bold text-primary">10k+</div>
                    <p className="text-sm text-white/60">Niños felices</p>
                  </div>
                </div>
              </div>

              <a
                href="#reservar"
                className="inline-flex items-center gap-3 text-white hover:text-primary transition group"
              >
                <span className="text-xl font-semibold">
                  Quiero vivir esta experiencia
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}


function VideoSliderSection() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLVideoElement[]>([]);

  const getVisible = useCallback(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
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
    setIndex(Math.max(0, Math.min(i, maxIndex)));
  };

  useEffect(() => {
    if (!trackRef.current) return;
    const card = trackRef.current.querySelector(
      ".video-card"
    ) as HTMLElement;
    if (!card) return;
    const cardW = card.offsetWidth + 20;
    trackRef.current.style.transform = `translateX(-${index * cardW}px)`;
  }, [index, visibleCards]);

  useEffect(() => {
    const t = setTimeout(() => {
      videosRef.current.forEach((v) => v?.play().catch(() => { }));
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAll = () =>
    videosRef.current.forEach((v) => v?.play().catch(() => { }));
  const handlePauseAll = () =>
    videosRef.current.forEach((v) => v?.pause());

  return (
    <section id="videos" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto">
        <Animate className="text-center mb-12">
          <SectionBadge className="border-primary/30 text-primary">
            📱 Momentos inolvidables
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Capturamos la magia
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Desliza para ver más momentos ✨
          </p>
        </Animate>

        <Animate>
          <div className="relative px-2 md:px-4">
            <div className="overflow-hidden">
              <div ref={trackRef} className="video-slider-track">
                {videoCards.map((vc, i) => (
                  <div
                    key={vc.id}
                    className="video-card bg-base-100 border border-primary/30 hover:border-secondary hover:-translate-y-2 hover:shadow-[0_20px_30px_-10px_rgba(225,29,116,0.4)] transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]"
                  >
                    <video
                      ref={(el) => {
                        if (el) videosRef.current[i] = el;
                      }}
                      loop
                      muted
                      playsInline
                    >
                      <source src={vc.src} type="video/mp4" />
                    </video>

                    <div className="absolute top-4 left-4 z-5">
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-secondary text-white text-xs font-semibold rounded-full border border-white/30 shadow-[0_4px_10px_rgba(225,29,116,0.3)]">
                        <vc.BadgeIcon className="w-3 h-3" /> {vc.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#0A0A1F] to-transparent pointer-events-none">
                      <h4 className="font-bold text-lg text-white">
                        {vc.title}
                      </h4>
                      <p className="text-sm text-white/80">{vc.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => slideToIndex(index - 1)}
              className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-base-100 border-2 border-primary flex items-center justify-center text-base-content hover:bg-primary hover:text-base-200 hover:scale-110 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
              disabled={index === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => slideToIndex(index + 1)}
              className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-base-100 border-2 border-primary flex items-center justify-center text-base-content hover:bg-primary hover:text-base-200 hover:scale-110 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
              disabled={index >= maxIndex}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center gap-3 mt-8 flex-wrap">
            {videoCards.map((_, i) => (
              <button
                key={i}
                onClick={() => slideToIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === index
                  ? "w-8 bg-secondary shadow-[0_0_15px_var(--s)]"
                  : "w-2.5 bg-base-content/30 hover:bg-base-content/50"
                  }`}
              />
            ))}
          </div>

          <div className="scroll-indicator-mobile text-base-content/50 text-xs mt-4">
            <ChevronLeft className="w-3 h-3 inline mr-1" /> Desliza{" "}
            <ChevronRight className="w-3 h-3 inline ml-1" />
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handlePauseAll}
              className="px-6 py-3 bg-base-100 border border-primary/30 rounded-full text-sm font-medium hover:bg-primary hover:text-base-200 transition flex items-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pausar todos
            </button>
            <button
              onClick={handlePlayAll}
              className="px-6 py-3 bg-base-100 border border-secondary/30 rounded-full text-sm font-medium hover:bg-secondary hover:text-white transition flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Reproducir todos
            </button>
          </div>
        </Animate>
      </div>
    </section>
  );
}


function PackagesSection() {
  const dirs: AnimDir[] = ["left", "up", "right"];

  return (
    <section id="paquetes" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-secondary/30 text-secondary">
            Elige tu aventura
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 text-base-content">
            Paquetes Espaciales
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Todo incluido, sin sorpresas. Elige el que mejor se adapte a tu
            misión.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          {packagesData.map((pkg, i) => (
            <Animate key={pkg.id} from={dirs[i]} delay={i * 150}>
              <div
                className={`package-card bg-base-100 rounded-3xl p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-3 transition-all duration-400 border ${pkg.popular
                  ? "border-2 border-secondary lg:scale-105 bg-base-300"
                  : "border-primary/30 hover:border-secondary"
                  } hover:shadow-[0_30px_50px_-20px_rgba(225,29,116,0.4)]`}
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0A0A1F] text-xs font-bold rounded-full shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
                      <Crown className="w-3 h-3" /> MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${pkg.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <pkg.Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-base-content mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-base-content/60">{pkg.desc}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {pkg.features.map((f, fi) => (
                    <div
                      key={fi}
                      className="flex items-center gap-3 text-base-content/80"
                    >
                      <f.Icon
                        className={`w-5 h-5 ${pkg.iconColor} flex-shrink-0`}
                      />
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center mb-8">
                  <span className="text-4xl font-bold text-base-content">
                    {pkg.price}
                  </span>
                  <span className="text-base-content/60"> MXN</span>
                </div>

                <a
                  href="#reservar"
                  className={`block w-full py-4 bg-gradient-to-r ${pkg.btnGradient} rounded-full text-center font-bold text-white hover:opacity-90 transition transform hover:scale-105`}
                >
                  Reservar ahora
                </a>
              </div>
            </Animate>
          ))}
        </div>

        <Animate className="text-center mt-16">
          <Link to="/galeria" className="btn-gallery">
            <Images className="w-5 h-5" />
            Ver Galería Completa
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Animate>
      </div>
    </section>
  );
}


function AvailabilitySection() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const statusStyles: Record<DayStatus, string> = {
    available:
      "bg-success/20 border border-success text-base-content cursor-pointer hover:scale-95",
    occupied:
      "bg-error/20 border border-error text-base-content/50 cursor-not-allowed",
    partial:
      "bg-warning/20 border border-warning text-base-content cursor-pointer hover:scale-95",
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
          <SectionBadge className="border-primary/30 text-primary">
            Fechas en tiempo real
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Disponibilidad
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Consulta rápidamente qué fechas están libres para tu evento
            espacial
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          <Animate from="left" className="lg:col-span-2">
            <div className="bg-base-100 border border-primary/30 rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Octubre 2024
                  </h3>
                  <p className="text-sm text-base-content/50">
                    Enero 2024 — Diciembre 2024
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-base-200 border border-primary/30 hover:bg-primary/20 transition flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-base-200 border border-primary/30 hover:bg-primary/20 transition flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-sm font-semibold text-base-content/60"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((d, i) => {
                  if (d.status === "empty")
                    return <div key={`e${i}`} className="aspect-square" />;

                  const dateStr = `2024-10-${String(d.day).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={d.day}
                      onClick={() => handleDayClick(d)}
                      className={`group relative aspect-square flex items-center justify-center rounded-xl transition-all text-sm font-medium bg-base-200
                        ${statusStyles[d.status]}
                        ${isSelected
                          ? "!border-2 !border-secondary shadow-[0_0_0_3px_rgba(225,29,116,0.3)] scale-95"
                          : ""
                        }
                      `}
                    >
                      {d.day}
                      {d.tip && (
                        <span className="cal-tooltip bg-base-200 text-base-content border border-primary shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                          {d.tip}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-primary/30">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/30 border border-success" />
                  <span className="text-sm text-base-content/80">
                    Disponible
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-error/30 border border-error" />
                  <span className="text-sm text-base-content/80">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-warning/30 border border-warning" />
                  <span className="text-sm text-base-content/80">Parcial</span>
                </div>
              </div>
            </div>
          </Animate>

          <Animate from="right">
            <div className="bg-base-100 border-2 border-secondary/50 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30">
                  <CalendarCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-base-content mb-2">
                  Tu fecha
                </h3>
                <p className="text-base-content/70">
                  Selecciona un día disponible
                </p>
              </div>

              <div className="mb-8 p-6 bg-base-200 rounded-xl text-center border border-secondary/30">
                <p className="text-sm text-base-content/50 mb-2">
                  Fecha seleccionada
                </p>
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
                className="block w-full py-4 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full text-center font-bold text-white hover:opacity-90 transition transform hover:scale-105"
              >
                <CalendarCheck className="w-4 h-4 inline mr-2" /> Reservar esta
                fecha
              </a>

              <p className="text-xs text-base-content/40 text-center mt-4">
                * Las fechas parciales tienen disponibilidad limitada
              </p>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}


function ReviewsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % reviewsData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="resenas" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-primary/30 text-primary">
            Prueba social
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Lo que dicen los padres
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            +500 familias confían en nosotros para sus fiestas espaciales
          </p>
        </Animate>

        <Animate>
          <div className="max-w-4xl mx-auto relative min-h-[350px]">
            {reviewsData.map((r, i) => (
              <div
                key={r.id}
                className={`absolute inset-0 transition-opacity duration-800 ${i === active
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
                  }`}
              >
                <div className="bg-base-100 border border-primary/30 rounded-3xl p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={r.img}
                      alt={r.name}
                      className={`w-16 h-16 rounded-full object-cover ring-2 ${r.borderColor} ring-offset-2 ring-offset-base-100`}
                    />
                    <div>
                      <h4 className="font-bold text-lg text-base-content">
                        {r.name}
                      </h4>
                      <p className="text-sm text-base-content/50">{r.date}</p>
                      <div className="flex mt-2 gap-0.5">
                        {Array.from({ length: r.stars }).map((_, si) => (
                          <Star
                            key={si}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-base-content/80 text-lg leading-relaxed italic">
                    "{r.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3 mt-8">
            {reviewsData.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-3 rounded-full transition-all duration-300 ${i === active
                  ? "w-8 bg-secondary shadow-[0_0_15px_var(--s)]"
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
          <SectionBadge className="border-secondary/30 text-base-content/90">
            Comienza tu misión
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-4 text-base-content">
            Reserva tu aventura
          </h2>
          <p className="text-xl text-base-content/80">
            Completa el formulario y te contactaremos en minutos
          </p>
        </Animate>

        <Animate>
          <div className="bg-base-100 border border-primary/30 rounded-3xl p-6 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <User className="w-4 h-4 inline mr-2 text-secondary" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Ej: María González"
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${errors.fullName
                      ? "border-error"
                      : "border-primary/30"
                      }`}
                  />
                  {errors.fullName && (
                    <p className="text-error text-xs mt-2">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <Phone className="w-4 h-4 inline mr-2 text-secondary" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="Ej: 55 1234 5678"
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${errors.phone ? "border-error" : "border-primary/30"
                      }`}
                  />
                  {errors.phone && (
                    <p className="text-error text-xs mt-2">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <Calendar className="w-4 h-4 inline mr-2 text-secondary" />
                    Fecha del evento
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${errors.date ? "border-error" : "border-primary/30"
                      }`}
                  />
                  {errors.date && (
                    <p className="text-error text-xs mt-2">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <Gift className="w-4 h-4 inline mr-2 text-secondary" />
                    Paquete
                  </label>
                  <select
                    value={form.pkg}
                    onChange={(e) => update("pkg", e.target.value)}
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${errors.pkg ? "border-error" : "border-primary/30"
                      }`}
                  >
                    <option value="" disabled>
                      Selecciona un paquete
                    </option>
                    <option value="Básico">Cohete Básico</option>
                    <option value="Galáctico">Viaje Galáctico</option>
                    <option value="Súper Space">Misión Súper Space</option>
                  </select>
                  {errors.pkg && (
                    <p className="text-error text-xs mt-2">{errors.pkg}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base-content font-medium mb-3">
                  <MessageCircle className="w-4 h-4 inline mr-2 text-secondary" />
                  Mensaje adicional
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="¿Algo especial que quieras incluir? (alergias, horarios, etc.)"
                  className="w-full bg-base-200 border border-primary/30 rounded-2xl px-5 py-4 text-base-content h-32 transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)]"
                />
              </div>

              <div className="text-center pt-6">
                <button
                  type="submit"
                  className={`btn-space-primary text-lg px-12 py-5 ${submitted
                    ? "!bg-gradient-to-r !from-emerald-500 !to-green-600"
                    : ""
                    }`}
                  disabled={submitted}
                >
                  {submitted ? (
                    <>
                      <Check className="w-5 h-5" /> ¡Enviado!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Enviar solicitud
                    </>
                  )}
                </button>
                <p className="text-sm text-base-content/50 mt-4">
                  Al enviar, se abrirá WhatsApp con tu solicitud prellenada
                </p>
              </div>
            </form>
          </div>
        </Animate>
      </div>
    </section>
  );
}


function ContactSection() {
  return (
    <section id="contacto" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-primary/30 text-primary">
            Estamos aquí
          </SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Contacto espacial
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Respuesta inmediata por WhatsApp. Estamos para ayudarte.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <Animate from="left" className="space-y-8">
            <a
              href="https://wa.me/521234567890?text=¡Hola! Me interesa reservar un evento en Space Kids"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-br from-emerald-600 to-emerald-800 border border-white/30 rounded-3xl p-10 text-center hover:scale-105 transition-transform duration-300 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] group"
            >
              <MessageCircle className="w-16 h-16 text-white mx-auto mb-4 group-hover:animate-bounce" />
              <h3 className="text-3xl font-heading font-bold text-white mb-2">
                WhatsApp
              </h3>
              <p className="text-white/90 text-2xl font-semibold mb-3">
                55 1234 5678
              </p>
              <p className="text-white/80">
                Respuesta en menos de 5 minutos ⚡
              </p>
            </a>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-base-100 border border-primary/30 rounded-2xl p-6 hover:border-primary transition shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]">
                <Phone className="w-8 h-8 text-primary mb-4" />
                <h4 className="font-bold text-base-content mb-2">Teléfono</h4>
                <p className="text-base-content/80 text-lg">55 1234 5678</p>
                <p className="text-base-content/60 text-sm">
                  Lun-Dom: 10am - 8pm
                </p>
              </div>
              <div className="bg-base-100 border border-secondary/30 rounded-2xl p-6 hover:border-secondary transition shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]">
                <Mail className="w-8 h-8 text-secondary mb-4" />
                <h4 className="font-bold text-base-content mb-2">Email</h4>
                <p className="text-base-content/80">hola@spacekids.com</p>
                <p className="text-base-content/80">reservas@spacekids.com</p>
              </div>
            </div>

            <div className="bg-base-100 border border-primary/30 rounded-2xl p-6 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]">
              <div className="flex items-start gap-4">
                <MapPin className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-base-content mb-2">
                    Nuestra base espacial
                  </h4>
                  <p className="text-base-content/80 text-lg">
                    Calle Ignacio Zaragoza
                  </p>
                  <p className="text-base-content/80">
                    Centro, 42970 Atitalaquia, Hgo
                  </p>
                </div>
              </div>
            </div>
          </Animate>

          <Animate from="right">
            <div className="rounded-2xl overflow-hidden h-[500px] border-2 border-primary/30 shadow-2xl">
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


export default function HomePage() {
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
      <FeaturedExperienceSection />
      <VideoSliderSection />
      <PackagesSection />
      <AvailabilitySection />
      <ReviewsSection />
      <ReservationSection />
      <ContactSection />
    </div>
  );
}