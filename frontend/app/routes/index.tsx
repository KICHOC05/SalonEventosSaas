import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Award,
  ShieldCheck,
  UserRound,
  Baby,
  LoaderCircle,
} from "lucide-react";
import { buildMeta } from "~/lib/meta";
import { fetchPublicAvailability, registerPublicFrequentClient } from "~/lib/api";
import "~/styles/landing.css";

export function meta() {
  return buildMeta(
    "Space Kids - Fiestas Infantiles Espaciales",
    "La mejor experiencia de fiestas infantiles con temática espacial en Space Kids"
  );
}

// =====================================================
// TYPES
// =====================================================

interface Package {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: any;
  gradient: string;
  btnGradient: string;
  iconColor: string;
  popular?: boolean;
  features: { icon: any; text: string }[];
}

interface VideoCard {
  id: number;
  src: string;
  badge: string;
  BadgeIcon: any;
  title: string;
  subtitle: string;
}

type DayStatus = "available" | "occupied" | "past" | "empty";

interface CalDay {
  day: number;
  status: DayStatus;
  dateStr?: string;
  tip?: string;
}

// =====================================================
// DATA
// =====================================================

const videoCards: VideoCard[] = [
  {
    id: 1,
    src: "https://assets.mixkit.co/videos/preview/mixkit-children-playing-with-a-space-roller-coaster-41547-large.mp4",
    badge: "Cafetería",
    BadgeIcon: Cake,
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
    BadgeIcon: Star,
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

const packagesData: Package[] = [
  {
    id: "basico",
    name: "Cohete Básico",
    description: "Ideal para primeros exploradores",
    icon: Rocket,
    gradient: "from-cyan-500 to-blue-700",
    btnGradient: "from-cyan-600 to-blue-700",
    iconColor: "text-cyan-400",
    features: [
      { icon: Clock, text: "2 horas de diversión" },
      { icon: Users, text: "Hasta 15 niños" },
      { icon: Cake, text: "Pastel temático" },
      { icon: Gamepad2, text: "Zona de juegos" },
    ],
    price: "$1,299",
  },
  {
    id: "galactico",
    name: "Viaje Galáctico",
    description: "La experiencia completa",
    icon: Globe,
    gradient: "from-pink-500 to-purple-700",
    btnGradient: "from-pink-600 to-purple-700",
    iconColor: "text-pink-400",
    popular: true,
    features: [
      { icon: Clock, text: "3 horas de aventura" },
      { icon: Users, text: "Hasta 25 niños" },
      { icon: Cake, text: "Pastel + cupcakes" },
      { icon: Camera, text: "Realidad virtual" },
      { icon: Users, text: "Animador espacial" },
    ],
    price: "$2,199",
  },
  {
    id: "super",
    name: "Súper Space",
    description: "Experiencia premium",
    icon: Crown,
    gradient: "from-yellow-500 to-orange-600",
    btnGradient: "from-yellow-600 to-orange-700",
    iconColor: "text-yellow-400",
    features: [
      { icon: Clock, text: "4 horas de misión" },
      { icon: Users, text: "Hasta 40 niños" },
      { icon: UtensilsCrossed, text: "Buffet espacial" },
      { icon: Waves, text: "Cohete inflable" },
      { icon: Camera, text: "Fotógrafo incluido" },
    ],
    price: "$3,499",
  },
];

// =====================================================
// HOOKS
// =====================================================

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

function useAnimatedCounter(target: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(eased * target);
      setCount(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isVisible, target, duration, delay]);

  return { ref, count, isVisible };
}

// =====================================================
// COMPONENTES INTERNOS
// =====================================================

function Animate({
  children,
  from = "up",
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  from?: "up" | "left" | "right" | "zoom";
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView();
  const hidden: Record<string, string> = {
    up: "opacity-0 translate-y-8",
    left: "opacity-0 -translate-x-8",
    right: "opacity-0 translate-x-8",
    zoom: "opacity-0 scale-90",
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible
          ? "opacity-100 translate-x-0 translate-y-0 scale-100"
          : hidden[from]
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block px-4 py-2 bg-base-100 rounded-full text-sm font-semibold tracking-wider uppercase border ${className}`}
    >
      {children}
    </span>
  );
}

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  className = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const { ref, count, isVisible } = useAnimatedCounter(target, 2000);

  return (
    <span ref={ref} className={className}>
      {isVisible ? `${prefix}${count}${suffix}` : "0"}
    </span>
  );
}

// =====================================================
// STARS BACKGROUND
// =====================================================

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
        animation: `twinkle ${Math.random() * 3 + 2}s ${Math.random() * 5}s infinite`,
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

// =====================================================
// HERO SECTION
// =====================================================

function HeroSection() {
  return (
    <section
      id="inicio"
      className="sk-hero"
    >
      <div className="sk-hero-nebula" aria-hidden="true" />
      <div className="sk-hero-stars" aria-hidden="true" />

      <div className="sk-hero-shell">
        <div className="sk-hero-copy">
          <img
            src="/spacekids/spacekids-logo.png"
            alt="Space Kids, salón de eventos infantiles"
            className="sk-hero-logo animate-fade-in-up"
          />
          <div className="sk-eyebrow animate-fade-in-up">
            <span className="sk-eyebrow-dot" aria-hidden="true" />
            Salón infantil · Una aventura fuera de este mundo
          </div>

          <div className="sk-mobile-mascot">
            <div className="sk-mobile-mascot-orbit" aria-hidden="true" />
            <div className="sk-mobile-mascot-glow" aria-hidden="true" />
            <img
              src="/spacekids/luna-alien.png"
              alt="Luna, la anfitriona espacial de Space Kids"
            />
          </div>

          <h1 className="sk-hero-title animate-fade-in-up">
            La fiesta de sus sueños
            <span>despega aquí.</span>
          </h1>

          <p className="sk-hero-description animate-fade-in-up">
            Creamos celebraciones espaciales llenas de juego, color y momentos
            que toda la familia querrá volver a vivir.
          </p>

          <div className="sk-hero-actions animate-fade-in-up">
            <a href="#reservar" className="sk-button sk-button-primary">
              <Rocket className="h-5 w-5" aria-hidden="true" />
              Reservar mi misión
            </a>
            <a href="#disponibilidad" className="sk-button sk-button-secondary">
              <Calendar className="h-5 w-5" aria-hidden="true" />
              Explorar fechas
            </a>
          </div>

          <ul className="sk-hero-benefits" aria-label="Beneficios Space Kids">
            <li><Check aria-hidden="true" /> Atención personalizada</li>
            <li><Check aria-hidden="true" /> Experiencia familiar</li>
            <li><Check aria-hidden="true" /> Fiesta a tu medida</li>
          </ul>
        </div>

        <div className="sk-hero-visual" aria-label="Luna, la anfitriona espacial de Space Kids">
          <div className="sk-orbit sk-orbit-one" aria-hidden="true" />
          <div className="sk-orbit sk-orbit-two" aria-hidden="true" />
          <div className="sk-planet sk-planet-pink" aria-hidden="true" />
          <div className="sk-planet sk-planet-yellow" aria-hidden="true" />
          <div className="sk-visual-glow" aria-hidden="true" />
          <img
            src="/spacekids/luna-alien.png"
            alt="Luna, una pequeña alienígena con traje espacial morado, dando la bienvenida"
            className="sk-alien"
            loading="eager"
            fetchPriority="high"
          />
          <div className="sk-float-card sk-float-card-games">
            <Gamepad2 aria-hidden="true" />
            <span><strong>Diversión</strong>Zona de juegos</span>
          </div>
          <div className="sk-float-card sk-float-card-party">
            <Cake aria-hidden="true" />
            <span><strong>Tu celebración</strong>A tu estilo</span>
          </div>
        </div>
      </div>

      <a href="#plan-mision" className="sk-scroll-cue" aria-label="Descubrir la experiencia Space Kids">
        <span>Descubre la misión</span>
        <ChevronRight aria-hidden="true" />
      </a>
    </section>
  );
}

// =====================================================
// STATS SECTION
// =====================================================

function StatsSection() {
  const stats = [
    { key: "events", icon: Calendar, label: "Fiestas realizadas", value: 500, color: "from-cyan-500 to-blue-600" },
    { key: "children", icon: Users, label: "Niños felices", value: 10000, color: "from-pink-500 to-rose-600" },
    { key: "experience", icon: Award, label: "Años de experiencia", value: 5, color: "from-amber-500 to-orange-600" },
    { key: "rating", icon: Star, label: "Calificación promedio", value: 4.9, color: "from-yellow-400 to-yellow-600" },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-base-100/50 to-base-200/30 border-y border-base-300/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((item) => (
            <div key={item.key} className="text-center group">
              <div className="relative inline-block mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-base-content">
                {item.key === "rating" ? (
                  <AnimatedCounter target={item.value} suffix="★" />
                ) : (
                  <AnimatedCounter target={item.value} suffix={item.key === "experience" ? "+" : ""} />
                )}
              </div>
              <p className="text-sm text-base-content/60 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =====================================================
// MISSION JOURNEY
// =====================================================

function MissionJourneySection() {
  const steps = [
    {
      number: "01",
      title: "Elige tu fecha",
      description: "Revisa el calendario y cuéntanos cuándo quieres despegar.",
    },
    {
      number: "02",
      title: "Diseñamos la misión",
      description: "Personalizamos la experiencia según tu celebración y tus invitados.",
    },
    {
      number: "03",
      title: "Disfruta sin estrés",
      description: "Tú celebras; nuestro equipo se encarga de llevar la misión a buen puerto.",
    },
  ];

  return (
    <section id="plan-mision" className="sk-journey" aria-labelledby="journey-title">
      <div className="sk-journey-shell">
        <Animate from="left" className="sk-journey-art">
          <div className="sk-journey-planet" aria-hidden="true" />
          <img
            src="/spacekids/astronautas-exploradores.png"
            alt="Dos astronautas infantiles explorando juntos"
            loading="lazy"
          />
          <div className="sk-journey-caption">
            <Rocket aria-hidden="true" />
            <span><strong>Una misión sencilla</strong>De la idea al gran día</span>
          </div>
        </Animate>

        <Animate from="right" className="sk-journey-content">
          <SectionBadge className="border-cyan-300/30 text-cyan-200">Plan de vuelo</SectionBadge>
          <h2 id="journey-title">Organizar su gran día puede sentirse así de fácil.</h2>
          <p className="sk-journey-lead">
            Un recorrido claro, acompañado y pensado para que las familias tomen
            decisiones con confianza.
          </p>
          <ol className="sk-journey-steps">
            {steps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <a href="#reservar" className="sk-text-link">
            Empezar a planear
            <ArrowRight aria-hidden="true" />
          </a>
        </Animate>
      </div>
    </section>
  );
}

// =====================================================
// FEATURED EXPERIENCE SECTION
// =====================================================

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
        background: "linear-gradient(135deg, #0A0A1F 0%, #1E1B4B 50%, #4C1D95 100%)",
      }}
    >
      <div className="container mx-auto">
        <Animate className="text-center mb-12">
          <SectionBadge className="border-primary/30 text-primary">✨ Vive la magia</SectionBadge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Vive tu propia gran próxima experiencia
          </h2>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
            Cada fiesta es una aventura única. Mira cómo vivimos la magia y
            prepárate para crear recuerdos inolvidables con tus pequeños astronautas.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Animate from="left">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
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
                <p className="text-white/80 text-lg">Descubre cómo vivimos la diversión</p>
              </div>
              <button
                onClick={togglePlay}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition border border-white/30"
              >
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
                    <h4 className="text-2xl font-heading font-bold text-white">Tu momento espacial</h4>
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
                    <div className="text-3xl font-bold text-secondary">500+</div>
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
                <span className="text-xl font-semibold">Quiero vivir esta experiencia</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}

// =====================================================
// VIDEO SLIDER SECTION
// =====================================================

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
    const card = trackRef.current.querySelector(".video-card") as HTMLElement;
    if (!card) return;
    const cardW = card.offsetWidth + 20;
    trackRef.current.style.transform = `translateX(-${index * cardW}px)`;
  }, [index, visibleCards]);

  useEffect(() => {
    const t = setTimeout(() => {
      videosRef.current.forEach((v) => v?.play().catch(() => {}));
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="videos" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto">
        <Animate className="text-center mb-12">
          <SectionBadge className="border-primary/30 text-primary">📱 Momentos inolvidables</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Capturamos la magia
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">Desliza para ver más momentos ✨</p>
        </Animate>

        <Animate>
          <div className="relative px-2 md:px-4">
            <div className="overflow-hidden">
              <div ref={trackRef} className="flex transition-transform duration-500 ease-out gap-5">
                {videoCards.map((vc, i) => (
                  <div
                    key={vc.id}
                    className="video-card flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] relative rounded-2xl overflow-hidden bg-base-100 border border-primary/30 hover:border-secondary hover:-translate-y-2 hover:shadow-[0_20px_30px_-10px_rgba(225,29,116,0.4)] transition-all duration-300 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]"
                  >
                    <video
                      ref={(el) => { if (el) videosRef.current[i] = el; }}
                      loop
                      muted
                      playsInline
                      className="w-full aspect-video object-cover"
                    >
                      <source src={vc.src} type="video/mp4" />
                    </video>

                    <div className="absolute top-4 left-4 z-5">
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-secondary text-white text-xs font-semibold rounded-full border border-white/30 shadow-[0_4px_10px_rgba(225,29,116,0.3)]">
                        <vc.BadgeIcon className="w-3 h-3" /> {vc.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-[#0A0A1F] to-transparent pointer-events-none">
                      <h4 className="font-bold text-lg text-white">{vc.title}</h4>
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
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-8 bg-secondary shadow-[0_0_15px_var(--s)]"
                    : "w-2.5 bg-base-content/30 hover:bg-base-content/50"
                }`}
              />
            ))}
          </div>
        </Animate>
      </div>
    </section>
  );
}

// =====================================================
// PACKAGES SECTION
// =====================================================

function PackagesSection() {
  const dirs: ("up" | "left" | "right" | "zoom")[] = ["left", "up", "right"];

  return (
    <section id="paquetes" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-secondary/30 text-secondary">Elige tu aventura</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 text-base-content">
            Paquetes Espaciales
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Todo incluido, sin sorpresas. Elige el que mejor se adapte a tu misión.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          {packagesData.map((pkg, i) => (
            <Animate key={pkg.id} from={dirs[i]} delay={i * 150}>
              <div
                className={`relative bg-base-100 rounded-3xl p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-3 transition-all duration-400 border ${
                  pkg.popular
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
                    <pkg.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-base-content mb-2">{pkg.name}</h3>
                  <p className="text-base-content/60">{pkg.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {pkg.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3 text-base-content/80">
                      <f.icon className={`w-5 h-5 ${pkg.iconColor} flex-shrink-0`} />
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center mb-8">
                  <span className="text-4xl font-bold text-base-content">{pkg.price}</span>
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
      </div>
    </section>
  );
}

// =====================================================
// AVAILABILITY SECTION
// =====================================================

function AvailabilitySection() {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const currentMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const [visibleMonth, setVisibleMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [occupiedDates, setOccupiedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const formatLocalDate = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const monthRange = useMemo(() => {
    const fromDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const toDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    return {
      from: formatLocalDate(fromDate),
      to: formatLocalDate(toDate),
    };
  }, [formatLocalDate, visibleMonth]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setOccupiedDates([]);

    fetchPublicAvailability(monthRange.from, monthRange.to)
      .then((response) => {
        if (!active) return;
        setOccupiedDates(response.occupiedDates ?? []);
      })
      .catch(() => {
        if (!active) return;
        setError("No pudimos consultar la agenda. Intenta nuevamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [monthRange, requestVersion]);

  const monthLabel = useMemo(() => {
    const value = new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
    }).format(visibleMonth);
    return value.charAt(0).toUpperCase() + value.slice(1);
  }, [visibleMonth]);

  const calendarDays = useMemo<CalDay[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    const occupied = new Set(occupiedDates);
    const todayStr = formatLocalDate(today);

    const days: CalDay[] = Array.from({ length: leadingEmptyDays }, () => ({
      day: 0,
      status: "empty" as const,
    }));

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = formatLocalDate(new Date(year, month, day));
      const status: DayStatus = dateStr < todayStr
        ? "past"
        : occupied.has(dateStr)
          ? "occupied"
          : "available";
      days.push({
        day,
        dateStr,
        status,
        tip: status === "available"
          ? "Disponible para reservar"
          : status === "occupied"
            ? "Fecha ocupada"
            : "Fecha pasada",
      });
    }

    return days;
  }, [formatLocalDate, occupiedDates, today, visibleMonth]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "--/--/----";
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${selectedDate}T12:00:00`));
  }, [selectedDate]);

  const isCurrentMonth =
    visibleMonth.getFullYear() === currentMonth.getFullYear() &&
    visibleMonth.getMonth() === currentMonth.getMonth();

  const statusStyles: Record<DayStatus, string> = {
    available: "bg-success/20 border border-success text-base-content cursor-pointer hover:scale-95",
    occupied: "bg-error/20 border border-error text-base-content/50 cursor-not-allowed",
    past: "bg-base-300/30 border border-base-300/40 text-base-content/30 cursor-not-allowed",
    empty: "bg-transparent border-transparent",
  };

  const handleDayClick = (d: CalDay) => {
    if (d.status !== "available" || !d.dateStr) return;
    setSelectedDate(d.dateStr);
  };

  const changeMonth = (offset: number) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  return (
    <section id="disponibilidad" className="py-24 px-4 bg-base-200 sk-availability">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-primary/30 text-primary">Agenda conectada</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Disponibilidad
          </h2>
          <p className="text-xl text-base-content/70 max-w-3xl mx-auto">
            Consulta las fechas disponibles directamente desde nuestra agenda de eventos.
            Los cambios realizados por el equipo se reflejan automáticamente.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8">
          <Animate from="left" className="lg:col-span-2">
            <div className="bg-base-100 border border-primary/30 rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-heading font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> {monthLabel}
                  </h3>
                  <p className="text-sm text-base-content/50">
                    {loading ? "Consultando agenda…" : "Disponibilidad actualizada"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    disabled={isCurrentMonth || loading}
                    aria-label="Ver mes anterior"
                    className="w-10 h-10 rounded-full bg-base-200 border border-primary/30 hover:bg-primary/20 transition flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    disabled={loading}
                    aria-label="Ver mes siguiente"
                    className="w-10 h-10 rounded-full bg-base-200 border border-primary/30 hover:bg-primary/20 transition flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setRequestVersion((version) => version + 1)}
                    className="font-bold underline underline-offset-4"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((wd) => (
                  <div key={wd} className="text-center text-sm font-semibold text-base-content/60">
                    {wd}
                  </div>
                ))}
              </div>

              <div className={`relative grid grid-cols-7 gap-2 transition-opacity ${loading ? "opacity-45" : "opacity-100"}`} aria-busy={loading}>
                {calendarDays.map((d, i) => {
                  if (d.status === "empty") return <div key={`e${i}`} className="aspect-square" />;
                  const isSelected = selectedDate === d.dateStr;

                  return (
                    <button
                      type="button"
                      key={d.dateStr}
                      onClick={() => handleDayClick(d)}
                      disabled={d.status !== "available" || loading}
                      aria-label={`${d.dateStr}: ${d.tip}`}
                      aria-pressed={isSelected}
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
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-base-200 text-base-content border border-primary rounded-lg text-xs whitespace-nowrap shadow-[0_4px_10px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {d.tip}
                        </span>
                      )}
                    </button>
                  );
                })}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="loading loading-spinner loading-md text-primary" aria-label="Cargando disponibilidad" />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-primary/30">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-success/30 border border-success" />
                  <span className="text-sm text-base-content/80">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-error/30 border border-error" />
                  <span className="text-sm text-base-content/80">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-base-300/30 border border-base-300/40" />
                  <span className="text-sm text-base-content/80">Fecha pasada</span>
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
                <h3 className="text-2xl font-heading font-bold text-base-content mb-2">Tu fecha</h3>
                <p className="text-base-content/70">Selecciona un día disponible</p>
              </div>

              <div className="mb-8 p-6 bg-base-200 rounded-xl text-center border border-secondary/30">
                <p className="text-sm text-base-content/50 mb-2">Fecha seleccionada</p>
                <p className="text-2xl font-bold text-secondary capitalize">{selectedDateLabel}</p>
              </div>

              <a
                href={selectedDate ? "#reservar" : "#"}
                className={`block w-full py-4 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full text-center font-bold text-white hover:opacity-90 transition transform hover:scale-105 ${!selectedDate ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <CalendarCheck className="w-4 h-4 inline mr-2" /> Consultar esta fecha
              </a>

              <p className="text-xs text-base-content/40 text-center mt-4">
                * La disponibilidad se confirma nuevamente al registrar la reservación.
              </p>
            </div>
          </Animate>
        </div>
      </div>
    </section>
  );
}

// =====================================================
// CLIENTES FRECUENTES SECTION
// =====================================================

const INITIAL_FREQUENT_CLIENT_FORM = {
  parentName: "",
  childName: "",
  phone: "",
  email: "",
  consentAccepted: false,
};

function ClientesFrecuentesSection() {
  const [form, setForm] = useState(INITIAL_FREQUENT_CLIENT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");

  const updateField = (field: keyof typeof INITIAL_FREQUENT_CLIENT_FORM, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (status === "error") setStatus("idle");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (form.parentName.trim().length < 2) {
      nextErrors.parentName = "Ingresa tu nombre completo";
    }
    if (form.childName.trim().length < 2) {
      nextErrors.childName = "Ingresa el nombre del niño";
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      nextErrors.phone = "Ingresa un teléfono de 10 a 15 dígitos";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Ingresa un correo válido";
    }
    if (!form.consentAccepted) {
      nextErrors.consentAccepted = "Necesitamos tu autorización para completar el registro";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerMessage("");
    try {
      const response = await registerPublicFrequentClient({
        parentName: form.parentName.trim(),
        childName: form.childName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        consentAccepted: form.consentAccepted,
      });
      setServerMessage(response.message);
      setStatus("success");
    } catch (error) {
      setServerMessage(
        error instanceof Error
          ? error.message
          : "No pudimos completar tu registro. Inténtalo nuevamente."
      );
      setStatus("error");
    }
  };

  const startAnotherRegistration = () => {
    setForm(INITIAL_FREQUENT_CLIENT_FORM);
    setErrors({});
    setServerMessage("");
    setStatus("idle");
  };

  return (
    <section id="clientes-frecuentes" className="sk-loyalty-section">
      <div className="sk-loyalty-stars" aria-hidden="true" />
      <div className="sk-loyalty-shell">
        <Animate from="left" className="sk-loyalty-story">
          <SectionBadge className="border-yellow-300/30 text-yellow-200">
            <Crown className="h-4 w-4" /> Tripulación frecuente
          </SectionBadge>
          <h2>Tu próxima misión puede traer recompensas</h2>
          <p className="sk-loyalty-lead">
            Regístrate en Space Kids y vincula tus próximas visitas al programa de clientes frecuentes.
          </p>

          <div className="sk-loyalty-benefits">
            <div>
              <span><Star /></span>
              <section>
                <h3>Acumula visitas</h3>
                <p>Tu perfil podrá registrar el avance de cada compra elegible.</p>
              </section>
            </div>
            <div>
              <span><Gift /></span>
              <section>
                <h3>Desbloquea beneficios</h3>
                <p>Consulta tus recompensas conforme al programa activo del salón.</p>
              </section>
            </div>
            <div>
              <span><ShieldCheck /></span>
              <section>
                <h3>Registro seguro</h3>
                <p>Tus datos se envían directamente al sistema de Space Kids.</p>
              </section>
            </div>
          </div>

          <img
            src="/spacekids/astronautas-exploradores.png"
            alt="Astronautas de Space Kids explorando juntos"
            className="sk-loyalty-astronauts"
            loading="lazy"
          />
        </Animate>

        <Animate from="right" className="sk-loyalty-card">
          {status === "success" ? (
            <div className="sk-loyalty-success" role="status" aria-live="polite">
              <div className="sk-loyalty-success-icon"><Check /></div>
              <p className="sk-loyalty-kicker">Registro confirmado</p>
              <h3>¡Bienvenido a la tripulación!</h3>
              <p>{serverMessage}</p>
              <div className="sk-loyalty-sms-note">
                <Phone />
                <span>La validación mediante código SMS se habilitará en una siguiente etapa.</span>
              </div>
              <button type="button" onClick={startAnotherRegistration} className="sk-loyalty-secondary-button">
                Registrar a otra persona
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="sk-loyalty-card-heading">
                <span><Rocket /></span>
                <div>
                  <p>Alta en tiempo real</p>
                  <h3>Únete a la tripulación</h3>
                </div>
              </div>

              <div className="sk-loyalty-field">
                <label htmlFor="frequent-parent-name">Nombre completo</label>
                <div className={errors.parentName ? "has-error" : ""}>
                  <UserRound aria-hidden="true" />
                  <input
                    id="frequent-parent-name"
                    name="parentName"
                    type="text"
                    autoComplete="name"
                    maxLength={200}
                    placeholder="Ej. María López"
                    value={form.parentName}
                    onChange={(event) => updateField("parentName", event.target.value)}
                    aria-invalid={Boolean(errors.parentName)}
                    aria-describedby={errors.parentName ? "frequent-parent-name-error" : undefined}
                  />
                </div>
                {errors.parentName && <p id="frequent-parent-name-error" className="sk-field-error">{errors.parentName}</p>}
              </div>

              <div className="sk-loyalty-field">
                <label htmlFor="frequent-child-name">Nombre del niño</label>
                <div className={errors.childName ? "has-error" : ""}>
                  <Baby aria-hidden="true" />
                  <input
                    id="frequent-child-name"
                    name="childName"
                    type="text"
                    maxLength={150}
                    placeholder="Ej. Emilio"
                    value={form.childName}
                    onChange={(event) => updateField("childName", event.target.value)}
                    aria-invalid={Boolean(errors.childName)}
                    aria-describedby={errors.childName ? "frequent-child-name-error" : undefined}
                  />
                </div>
                {errors.childName && <p id="frequent-child-name-error" className="sk-field-error">{errors.childName}</p>}
              </div>

              <div className="sk-loyalty-field">
                <label htmlFor="frequent-phone">Teléfono</label>
                <div className={errors.phone ? "has-error" : ""}>
                  <Phone aria-hidden="true" />
                  <input
                    id="frequent-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={24}
                    placeholder="55 1234 5678"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "frequent-phone-error" : "frequent-phone-help"}
                  />
                </div>
                {errors.phone ? (
                  <p id="frequent-phone-error" className="sk-field-error">{errors.phone}</p>
                ) : (
                  <p id="frequent-phone-help" className="sk-field-help">Será el identificador de tu cuenta frecuente.</p>
                )}
              </div>

              <div className="sk-loyalty-field">
                <label htmlFor="frequent-email">Correo <span>(opcional)</span></label>
                <div className={errors.email ? "has-error" : ""}>
                  <Mail aria-hidden="true" />
                  <input
                    id="frequent-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={150}
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "frequent-email-error" : undefined}
                  />
                </div>
                {errors.email && <p id="frequent-email-error" className="sk-field-error">{errors.email}</p>}
              </div>

              <label className={`sk-loyalty-consent ${errors.consentAccepted ? "has-error" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.consentAccepted}
                  onChange={(event) => updateField("consentAccepted", event.target.checked)}
                  aria-invalid={Boolean(errors.consentAccepted)}
                  aria-describedby={errors.consentAccepted ? "frequent-consent-error" : undefined}
                />
                <span>
                  Autorizo a Space Kids a usar estos datos para administrar mi participación y contactarme sobre mis beneficios.
                </span>
              </label>
              {errors.consentAccepted && <p id="frequent-consent-error" className="sk-field-error">{errors.consentAccepted}</p>}

              {status === "error" && (
                <div className="sk-loyalty-server-error" role="alert">{serverMessage}</div>
              )}

              <button type="submit" className="sk-loyalty-submit" disabled={status === "submitting"}>
                {status === "submitting" ? (
                  <><LoaderCircle className="animate-spin" /> Registrando…</>
                ) : (
                  <><Rocket /> Quiero ser cliente frecuente</>
                )}
              </button>
              <p className="sk-loyalty-privacy"><ShieldCheck /> No compartimos tus datos con perfiles públicos.</p>
            </form>
          )}
        </Animate>
      </div>
    </section>
  );
}

// =====================================================
// RESERVATION SECTION
// =====================================================

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
    if (!/^[0-9]{10,15}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Ingresa un teléfono válido";
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
          <SectionBadge className="border-secondary/30 text-base-content/90">Comienza tu misión</SectionBadge>
          <h2 className="text-4xl md:text-5xl font-heading font-bold mt-6 mb-4 text-base-content">
            Reserva tu aventura
          </h2>
          <p className="text-xl text-base-content/80">Completa el formulario y te contactaremos en minutos</p>
        </Animate>

        <Animate>
          <div className="bg-base-100 border border-primary/30 rounded-3xl p-6 md:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <Users className="w-4 h-4 inline mr-2 text-secondary" />
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Ej: María González"
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${
                      errors.fullName ? "border-error" : "border-primary/30"
                    }`}
                  />
                  {errors.fullName && <p className="text-error text-xs mt-2">{errors.fullName}</p>}
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
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${
                      errors.phone ? "border-error" : "border-primary/30"
                    }`}
                  />
                  {errors.phone && <p className="text-error text-xs mt-2">{errors.phone}</p>}
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
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${
                      errors.date ? "border-error" : "border-primary/30"
                    }`}
                  />
                  {errors.date && <p className="text-error text-xs mt-2">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-base-content font-medium mb-3">
                    <Gift className="w-4 h-4 inline mr-2 text-secondary" />
                    Paquete
                  </label>
                  <select
                    value={form.pkg}
                    onChange={(e) => update("pkg", e.target.value)}
                    className={`w-full bg-base-200 border rounded-2xl px-5 py-4 text-base-content transition-all focus:outline-none focus:border-secondary focus:bg-base-100 focus:shadow-[0_0_0_4px_rgba(225,29,116,0.2)] ${
                      errors.pkg ? "border-error" : "border-primary/30"
                    }`}
                  >
                    <option value="" disabled>Selecciona un paquete</option>
                    <option value="Básico">Cohete Básico</option>
                    <option value="Galáctico">Viaje Galáctico</option>
                    <option value="Súper Space">Misión Súper Space</option>
                  </select>
                  {errors.pkg && <p className="text-error text-xs mt-2">{errors.pkg}</p>}
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
                  className={`inline-flex items-center gap-2 px-12 py-5 bg-gradient-to-r from-pink-600 to-purple-700 rounded-full font-bold text-white hover:opacity-90 transition transform hover:scale-105 shadow-lg shadow-pink-500/30 text-lg ${
                    submitted ? "!bg-gradient-to-r !from-emerald-500 !to-green-600" : ""
                  }`}
                  disabled={submitted}
                >
                  {submitted ? (
                    <><Check className="w-5 h-5" /> ¡Enviado!</>
                  ) : (
                    <><Send className="w-5 h-5" /> Enviar solicitud</>
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

// =====================================================
// CONTACT SECTION
// =====================================================

function ContactSection() {
  return (
    <section id="contacto" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto">
        <Animate className="text-center mb-16">
          <SectionBadge className="border-primary/30 text-primary">Estamos aquí</SectionBadge>
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
              <h3 className="text-3xl font-heading font-bold text-white mb-2">WhatsApp</h3>
              <p className="text-white/90 text-2xl font-semibold mb-3">55 1234 5678</p>
              <p className="text-white/80">Respuesta en menos de 5 minutos ⚡</p>
            </a>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-base-100 border border-primary/30 rounded-2xl p-6 hover:border-primary transition shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)]">
                <Phone className="w-8 h-8 text-primary mb-4" />
                <h4 className="font-bold text-base-content mb-2">Teléfono</h4>
                <p className="text-base-content/80 text-lg">55 1234 5678</p>
                <p className="text-base-content/60 text-sm">Lun-Dom: 10am - 8pm</p>
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
                  <h4 className="font-bold text-base-content mb-2">Nuestra base espacial</h4>
                  <p className="text-base-content/80 text-lg">Calle Ignacio Zaragoza</p>
                  <p className="text-base-content/80">Centro, 42970 Atitalaquia, Hgo</p>
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

// =====================================================
// FLOATING WHATSAPP BUTTON
// =====================================================

function FloatingWhatsAppButton() {
  const handleClick = () => {
    window.open("https://wa.me/521234567890?text=¡Hola! Me interesa reservar un evento en Space Kids", "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="WhatsApp"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse opacity-50" />
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:scale-110 transition-transform duration-300">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </div>
    </button>
  );
}

// =====================================================
// PAGE EXPORT
// =====================================================

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
      <StatsSection />
      <MissionJourneySection />
      <FeaturedExperienceSection />
      <VideoSliderSection />
      <PackagesSection />
      <AvailabilitySection />
      <ClientesFrecuentesSection />
      <ReservationSection />
      <ContactSection />
      <FloatingWhatsAppButton />
    </div>
  );
}
