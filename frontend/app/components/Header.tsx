import { Link, useLocation } from "react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Rocket,
  CalendarCheck,
  Home,
  PlayCircle,
  Gift,
  Calendar,
  Images,
  Star,
  Phone,
} from "lucide-react";

const navLinks = [
  { href: "#inicio", label: "Inicio", Icon: Home, color: "text-cyan-400" },
  { href: "#videos", label: "Experiencia", Icon: PlayCircle, color: "text-pink-400" },
  { href: "#paquetes", label: "Paquetes", Icon: Gift, color: "text-purple-400" },
  { href: "#disponibilidad", label: "Disponibilidad", Icon: Calendar, color: "text-yellow-400" },
  { href: "/galeria", label: "Galería", Icon: Images, color: "text-cyan-400", isRoute: true },
  { href: "#resenas", label: "Reseñas", Icon: Star, color: "text-yellow-400" },
  { href: "#contacto", label: "Contacto", Icon: Phone, color: "text-green-400" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // ── Función para cerrar menú (reutilizable) ──
  const closeMenu = useCallback(() => {
    setIsMobileOpen(false);
    document.body.style.overflow = "";  // ← Usar "" en vez de "auto" para no sobreescribir CSS
  }, []);

  // ── Scroll listener ──
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Cerrar menú al cambiar de ruta ──
  useEffect(() => {
    closeMenu();
  }, [location, closeMenu]);

  // ══════════════════════════════════════════════
  // FIX 2: Listener de resize para cerrar menú
  //         al pasar a breakpoint desktop (1024px)
  // ══════════════════════════════════════════════
  useEffect(() => {
    const onResize = () => {
      // 1024px = breakpoint "lg" de Tailwind
      if (window.innerWidth >= 1024 && isMobileOpen) {
        closeMenu();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobileOpen, closeMenu]);

  // ── Limpieza de overflow al desmontar ──
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const toggleMenu = () => {
    const willOpen = !isMobileOpen;
    setIsMobileOpen(willOpen);
    document.body.style.overflow = willOpen ? "hidden" : "";
  };

  const scrollTo = (hash: string) => {
    closeMenu();
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          FIX 1: Header z-[200] para que esté POR ENCIMA
                 del menú móvil (z-[150])
          ═══════════════════════════════════════════════════ */}
      <header
        className={`
          fixed top-0 left-0 w-full z-[200] transition-all duration-300 py-4 px-4 md:px-8
          bg-base-200 border-b shadow-lg
          ${isScrolled
            ? "border-secondary/30 shadow-secondary/15"
            : "border-primary/30 shadow-black/50"
          }
        `}
      >
        <div className="container mx-auto flex items-center justify-between">
          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
              Space Kids
            </span>
          </Link>

          {/* ── Nav Desktop ── */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-base-content hover:text-primary font-medium transition relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-base-content hover:text-primary font-medium transition relative group cursor-pointer"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full" />
                </button>
              )
            )}
          </nav>

          {/* ── Botón Reservar + Hamburguesa ── */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollTo("#reservar")}
              className="hidden md:inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-white
                bg-gradient-to-r from-secondary to-accent
                shadow-[0_8px_0_theme(colors.base-200),0_10px_20px_-5px_rgba(225,29,116,0.3)]
                border border-white/20
                hover:-translate-y-1 hover:shadow-[0_12px_0_theme(colors.base-200),0_15px_30px_-5px_rgba(6,182,212,0.4)] hover:border-primary
                active:translate-y-1 active:shadow-[0_4px_0_theme(colors.base-200)]
                transition-all duration-300"
            >
              <CalendarCheck className="w-4 h-4" />
              Reservar ahora
            </button>

            {/* ─────────────────────────────────────────
                Hamburguesa: ya no necesita z-[200] propio
                porque el header entero es z-[200]
                ───────────────────────────────────────── */}
            <button
              onClick={toggleMenu}
              className="lg:hidden relative w-[30px] h-[24px]"
              aria-label="Menú"
            >
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300
                  ${isMobileOpen ? "top-[10px] rotate-45 !bg-secondary" : "top-0"}`}
              />
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300 top-[10px]
                  ${isMobileOpen ? "opacity-0 -translate-x-5" : ""}`}
              />
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300
                  ${isMobileOpen ? "top-[10px] -rotate-45 !bg-secondary" : "top-[20px]"}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════ MENÚ MÓVIL z-[150] (debajo del header) ═══════════ */}
      <div
        className={`
          fixed top-0 h-screen w-full z-[150] bg-base-200
          border-r-2 border-primary shadow-[5px_0_30px_rgba(0,0,0,0.5)]
          transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          pt-[100px] overflow-y-auto
          ${isMobileOpen ? "left-0" : "-left-full"}
          lg:hidden
        `}
      >
        <div className="flex flex-col gap-4 px-6">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={closeMenu}
                className="flex items-center gap-4 text-xl font-medium py-4 px-6 rounded-xl
                  bg-primary/10 border border-primary/20 text-base-content
                  hover:bg-primary hover:text-base-200 hover:border-primary transition-all"
              >
                <link.Icon className={`w-6 h-6 ${link.color}`} />
                {link.label}
              </Link>
            ) : (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="flex items-center gap-4 text-xl font-medium py-4 px-6 rounded-xl text-left
                  bg-primary/10 border border-primary/20 text-base-content
                  hover:bg-primary hover:text-base-200 hover:border-primary transition-all"
              >
                <link.Icon className={`w-6 h-6 ${link.color}`} />
                {link.label}
              </button>
            )
          )}

          <div className="mt-8 pt-8 border-t border-primary/30">
            <button
              onClick={() => scrollTo("#reservar")}
              className="w-full flex items-center justify-center gap-2 px-7 py-4 rounded-full font-semibold text-white
                bg-gradient-to-r from-secondary to-accent
                shadow-[0_8px_0_theme(colors.base-200),0_10px_20px_-5px_rgba(225,29,116,0.3)]
                border border-white/20 transition-all"
            >
              <CalendarCheck className="w-5 h-5" />
              Reservar ahora
            </button>
          </div>
        </div>
      </div>
    </>
  );
}