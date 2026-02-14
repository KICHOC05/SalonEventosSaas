import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import {
  Rocket,
  ArrowLeft,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Gamepad2,
  Paintbrush,
  Cake,
  UtensilsCrossed,
  Users,
  Heart,
} from "lucide-react";
import "~/styles/gallery.css";

/* ╔══════════════════════════════════════════════╗
   ║              GALLERY DATA                    ║
   ╚══════════════════════════════════════════════╝ */

type Category = "all" | "juegos" | "decoracion" | "eventos" | "comida" | "animacion";

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  subtitle: string;
  category: Exclude<Category, "all">;
}

const filters: { key: Category; label: string; emoji: string }[] = [
  { key: "all", label: "Todos", emoji: "🌟" },
  { key: "juegos", label: "Área de Juegos", emoji: "🎮" },
  { key: "decoracion", label: "Decoración", emoji: "✨" },
  { key: "eventos", label: "Eventos", emoji: "🎂" },
  { key: "comida", label: "Zona de Comida", emoji: "🍕" },
  { key: "animacion", label: "Animación", emoji: "🚀" },
];

const categoryConfig: Record<
  Exclude<Category, "all">,
  { Icon: React.ElementType; label: string }
> = {
  juegos: { Icon: Gamepad2, label: "Área de Juegos" },
  decoracion: { Icon: Paintbrush, label: "Decoración" },
  eventos: { Icon: Cake, label: "Evento Real" },
  comida: { Icon: UtensilsCrossed, label: "Zona de Comida" },
  animacion: { Icon: Users, label: "Animación" },
};

const galleryImages: GalleryImage[] = [
  // Juegos (6)
  { id: 0, src: "https://images.pexels.com/photos/1068349/pexels-photo-1068349.jpeg", title: "Resbaladilla Lunar", subtitle: "La favorita de los astronautas", category: "juegos" },
  { id: 1, src: "https://images.pexels.com/photos/1315486/pexels-photo-1315486.jpeg", title: "Cohete Inflable", subtitle: "3 metros de altura", category: "juegos" },
  { id: 2, src: "https://images.pexels.com/photos/1391485/pexels-photo-1391485.jpeg", title: "Piscina Galáctica", subtitle: "10,000 pelotas espaciales", category: "juegos" },
  { id: 3, src: "https://images.pexels.com/photos/2251239/pexels-photo-2251239.jpeg", title: "Laberinto Lunar", subtitle: "Aventura y diversión", category: "juegos" },
  { id: 4, src: "https://images.pexels.com/photos/207933/pexels-photo-207933.jpeg", title: "Tobogán Espacial", subtitle: "8 metros de diversión", category: "juegos" },
  { id: 5, src: "https://images.pexels.com/photos/3771076/pexels-photo-3771076.jpeg", title: "Zona Bumper", subtitle: "Autos chocones", category: "juegos" },

  // Decoración (6)
  { id: 6, src: "https://images.pexels.com/photos/3771079/pexels-photo-3771079.jpeg", title: "Salón Galáctico", subtitle: "Capacidad: 50 personas", category: "decoracion" },
  { id: 7, src: "https://images.pexels.com/photos/3771080/pexels-photo-3771080.jpeg", title: "Planetas Flotantes", subtitle: "Sistema solar completo", category: "decoracion" },
  { id: 8, src: "https://images.pexels.com/photos/3771073/pexels-photo-3771073.jpeg", title: "Cielo Estrellado", subtitle: "500 luces LED", category: "decoracion" },
  { id: 9, src: "https://images.pexels.com/photos/1391485/pexels-photo-1391485.jpeg", title: "Mesas Temáticas", subtitle: "Diseño exclusivo", category: "decoracion" },
  { id: 10, src: "https://images.pexels.com/photos/1068349/pexels-photo-1068349.jpeg", title: "Arco de Globos", subtitle: "Galaxia de colores", category: "decoracion" },
  { id: 11, src: "https://images.pexels.com/photos/2251239/pexels-photo-2251239.jpeg", title: "Centros de Mesa", subtitle: "Cohetes luminosos", category: "decoracion" },

  // Eventos (6)
  { id: 12, src: "https://images.pexels.com/photos/207933/pexels-photo-207933.jpeg", title: "Cumpleaños de Sofía", subtitle: "25 invitados", category: "eventos" },
  { id: 13, src: "https://images.pexels.com/photos/1315486/pexels-photo-1315486.jpeg", title: "Fiesta de Mateo", subtitle: "Paquete Galáctico", category: "eventos" },
  { id: 14, src: "https://images.pexels.com/photos/3771076/pexels-photo-3771076.jpeg", title: "Cumpleaños de Valentina", subtitle: "40 invitados", category: "eventos" },
  { id: 15, src: "https://images.pexels.com/photos/3771079/pexels-photo-3771079.jpeg", title: "Fiesta de Santiago", subtitle: "Súper Space", category: "eventos" },
  { id: 16, src: "https://images.pexels.com/photos/3771080/pexels-photo-3771080.jpeg", title: "Comunión", subtitle: "Decoración especial", category: "eventos" },
  { id: 17, src: "https://images.pexels.com/photos/1068349/pexels-photo-1068349.jpeg", title: "Graduación", subtitle: "Kinder espacial", category: "eventos" },

  // Comida (4)
  { id: 18, src: "https://images.pexels.com/photos/1391485/pexels-photo-1391485.jpeg", title: "Candy Bar", subtitle: "Dulces espaciales", category: "comida" },
  { id: 19, src: "https://images.pexels.com/photos/2251239/pexels-photo-2251239.jpeg", title: "Pastel Espacial", subtitle: "Diseño personalizado", category: "comida" },
  { id: 20, src: "https://images.pexels.com/photos/207933/pexels-photo-207933.jpeg", title: "Cupcakes", subtitle: "Sabor galáctico", category: "comida" },
  { id: 21, src: "https://images.pexels.com/photos/1315486/pexels-photo-1315486.jpeg", title: "Buffet Espacial", subtitle: "Para 40 invitados", category: "comida" },

  // Animación (4)
  { id: 22, src: "https://images.pexels.com/photos/3771076/pexels-photo-3771076.jpeg", title: "Astronauta", subtitle: "Show interactivo", category: "animacion" },
  { id: 23, src: "https://images.pexels.com/photos/3771079/pexels-photo-3771079.jpeg", title: "Mago Espacial", subtitle: "Trucos galácticos", category: "animacion" },
  { id: 24, src: "https://images.pexels.com/photos/3771080/pexels-photo-3771080.jpeg", title: "Pintura Facial", subtitle: "Diseños espaciales", category: "animacion" },
  { id: 25, src: "https://images.pexels.com/photos/1068349/pexels-photo-1068349.jpeg", title: "Globoflexia", subtitle: "Figuras espaciales", category: "animacion" },
];

/* ╔══════════════════════════════════════════════╗
   ║              HOOKS                           ║
   ╚══════════════════════════════════════════════╝ */

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
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Animate({
  children,
  className = "",
  delay = 0,
  type = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  type?: "up" | "zoom";
}) {
  const { ref, visible } = useInView();
  const hiddenClass =
    type === "zoom"
      ? "opacity-0 scale-90"
      : "opacity-0 translate-y-8";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 scale-100 translate-y-0" : hiddenClass
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║         STARS BACKGROUND                     ║
   ╚══════════════════════════════════════════════╝ */

function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = containerRef.current;
    if (!c || c.childElementCount > 0) return;
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, #1E1B4B 0%, transparent 30%),
          radial-gradient(circle at 80% 70%, #4C1D95 0%, transparent 35%),
          radial-gradient(circle at 40% 80%, #0A0A1F 0%, transparent 40%)
        `,
      }}
    />
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          GALLERY HEADER                      ║
   ╚══════════════════════════════════════════════╝ */

function GalleryHeader() {
  return (
    <header className="sticky top-0 z-50 bg-base-200 border-b-2 border-secondary shadow-[0_4px_30px_rgba(225,29,116,0.2)] py-4 px-4 md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
            Space Kids
          </span>
        </Link>

        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold
            bg-primary/10 border border-primary text-base-content
            hover:bg-primary hover:text-base-200 hover:-translate-x-1
            transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </header>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          GALLERY FOOTER                      ║
   ╚══════════════════════════════════════════════╝ */

function GalleryFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-200 border-t-2 border-secondary py-10 mt-16">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-secondary" />
          <span className="text-base-content/70">
            Space Kids — Galería Oficial
          </span>
          <Star className="w-5 h-5 text-primary" />
        </div>
        <p className="text-base-content/50">
          © {currentYear} Space Kids. Todos los derechos reservados.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-4 text-base-content/60 hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </footer>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          LIGHTBOX MODAL                      ║
   ╚══════════════════════════════════════════════╝ */

function LightboxModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-base-200/98 backdrop-blur-lg"
      onClick={onClose}
    >
      <div className="relative max-w-[90%] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-14 right-0 text-base-content hover:text-secondary transition-transform hover:rotate-90 duration-300"
        >
          <X className="w-12 h-12" />
        </button>

        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="absolute top-1/2 -translate-y-1/2 -left-16 md:-left-[70px]
            w-12 h-12 rounded-full flex items-center justify-center
            bg-base-content/10 border border-base-content/30 text-base-content backdrop-blur-sm
            hover:bg-secondary hover:border-white hover:scale-110
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={currentIndex === images.length - 1}
          className="absolute top-1/2 -translate-y-1/2 -right-16 md:-right-[70px]
            w-12 h-12 rounded-full flex items-center justify-center
            bg-base-content/10 border border-base-content/30 text-base-content backdrop-blur-sm
            hover:bg-secondary hover:border-white hover:scale-110
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="border-[3px] border-secondary rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(225,29,116,0.5)]">
          <img
            src={current.src}
            alt={current.title}
            className="max-h-[80vh] w-auto object-contain"
          />
        </div>

        {/* Caption */}
        <div className="text-center mt-4">
          <h3 className="text-lg font-bold text-base-content">{current.title}</h3>
          <p className="text-sm text-base-content/60">{current.subtitle}</p>
          <p className="text-xs text-base-content/40 mt-1">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          GALLERY ITEM                        ║
   ╚══════════════════════════════════════════════╝ */

function GalleryItem({
  image,
  onClick,
  delay = 0,
}: {
  image: GalleryImage;
  onClick: () => void;
  delay?: number;
}) {
  const config = categoryConfig[image.category];

  return (
    <Animate type="zoom" delay={delay}>
      <div
        onClick={onClick}
        className="gallery-item group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer
          border-2 border-primary/30 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)]
          hover:-translate-y-2.5 hover:border-secondary
          hover:shadow-[0_25px_50px_-15px_rgba(225,29,116,0.4)]
          transition-all duration-400"
      >
        {/* Image */}
        <img
          src={image.src}
          alt={image.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Category badge */}
        <div className="absolute top-5 left-5 z-10">
          <span className="badge badge-secondary gap-1.5 py-3 px-4 font-semibold shadow-lg border border-white/30">
            <config.Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="gallery-overlay absolute bottom-0 inset-x-0 p-7 bg-gradient-to-t from-base-200 to-transparent">
          <h3 className="text-xl font-bold">{image.title}</h3>
          <p className="text-base-content/80">{image.subtitle}</p>
        </div>
      </div>
    </Animate>
  );
}

/* ╔══════════════════════════════════════════════╗
   ║          MAIN GALLERY PAGE                   ║
   ╚══════════════════════════════════════════════╝ */

export default function GaleriaPage() {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // Filtered images
  const filteredImages =
    activeFilter === "all"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeFilter);

  // Modal handlers
  const openModal = useCallback((index: number) => {
    setModalIndex(index);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const prevImage = useCallback(() => {
    setModalIndex((i) => Math.max(0, i - 1));
  }, []);

  const nextImage = useCallback(() => {
    setModalIndex((i) => Math.min(filteredImages.length - 1, i + 1));
  }, [filteredImages.length]);

  return (
    <div className="relative min-h-screen">
      <StarsBackground />
      <GalleryHeader />

      {/* ═══════════ GALLERY SECTION ═══════════ */}
      <section className="py-16 px-4 bg-gradient-to-b from-base-200 to-base-300 min-h-screen">
        <div className="container mx-auto">
          {/* Title */}
          <Animate className="text-center mb-12">
            <span className="badge badge-lg badge-secondary badge-outline gap-2">
              Galería oficial
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-6 mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Momentos espaciales
            </h1>
            <p className="text-xl text-base-content/60 max-w-3xl mx-auto">
              Explora nuestra colección completa de experiencias inolvidables
            </p>
          </Animate>

          {/* Filters */}
          <Animate className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`
                  px-5 md:px-7 py-3 rounded-full font-semibold text-sm md:text-base
                  border shadow-md transition-all duration-300
                  ${
                    activeFilter === f.key
                      ? "bg-secondary text-white border-white shadow-secondary/50 shadow-lg"
                      : "bg-base-100 text-base-content border-primary/30 hover:bg-primary hover:text-base-200 hover:border-white hover:-translate-y-0.5"
                  }
                `}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </Animate>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredImages.map((image, index) => (
              <GalleryItem
                key={image.id}
                image={image}
                onClick={() => openModal(index)}
                delay={(index % 6) * 80}
              />
            ))}
          </div>

          {/* Empty state */}
          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <Rocket className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <p className="text-xl text-base-content/50">
                No hay imágenes en esta categoría
              </p>
            </div>
          )}

          {/* Reserve CTA */}
          <Animate className="text-center mt-16">
            <Link
              to="/#reservar"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg text-white
                bg-gradient-to-r from-secondary to-accent
                shadow-[0_8px_0_theme(colors.base-200),0_10px_20px_-5px_rgba(225,29,116,0.3)]
                border border-white/20
                hover:-translate-y-1 hover:shadow-[0_12px_0_theme(colors.base-200),0_15px_30px_-5px_rgba(6,182,212,0.4)] hover:border-primary
                active:translate-y-1 active:shadow-[0_4px_0_theme(colors.base-200)]
                transition-all duration-300"
            >
              <CalendarCheck className="w-5 h-5" />
              Reservar ahora
            </Link>
          </Animate>
        </div>
      </section>

      <GalleryFooter />

      {/* ═══════════ LIGHTBOX MODAL ═══════════ */}
      <LightboxModal
        images={filteredImages}
        currentIndex={modalIndex}
        isOpen={modalOpen}
        onClose={closeModal}
        onPrev={prevImage}
        onNext={nextImage}
      />
    </div>
  );
}