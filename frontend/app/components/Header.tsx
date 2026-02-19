import { Link, useLocation } from "react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Rocket,
  CalendarCheck,
  Home,
  PlayCircle,
  Sparkles,
  Gift,
  Calendar,
  Images,
  Star,
  Phone,
} from "lucide-react";
import { ThemeToggle } from "~/components/ThemeToggle";

const navLinks = [
  { href: "#inicio", label: "Inicio", Icon: Home, color: "text-cyan-400" },
  {
    href: "#experiencia-destacada",
    label: "Experiencia",
    Icon: Sparkles,
    color: "text-pink-400",
  },
  {
    href: "#videos",
    label: "Momentos",
    Icon: PlayCircle,
    color: "text-pink-400",
  },
  {
    href: "#paquetes",
    label: "Paquetes",
    Icon: Gift,
    color: "text-purple-400",
  },
  {
    href: "#disponibilidad",
    label: "Disponibilidad",
    Icon: Calendar,
    color: "text-yellow-400",
  },
  {
    href: "/galeria",
    label: "Galería",
    Icon: Images,
    color: "text-cyan-400",
    isRoute: true,
  },
  {
    href: "#resenas",
    label: "Reseñas",
    Icon: Star,
    color: "text-yellow-400",
  },
  {
    href: "#contacto",
    label: "Contacto",
    Icon: Phone,
    color: "text-green-400",
  },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const closeMenu = useCallback(() => {
    setIsMobileOpen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [location, closeMenu]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && isMobileOpen) closeMenu();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobileOpen, closeMenu]);

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
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Header - solid background matching design */}
      <header
        className={`fixed top-0 left-0 w-full z-[200] transition-all duration-300 py-4 px-4 md:px-8 bg-base-200 ${
          isScrolled
            ? "border-b border-secondary/30 shadow-[0_4px_30px_rgba(225,29,116,0.15)]"
            : "border-b border-primary/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl md:text-3xl font-heading font-bold bg-gradient-to-r from-cyan-300 via-white to-pink-300 bg-clip-text text-transparent">
              Space Kids
            </span>
          </Link>

          {/* Nav Desktop */}
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

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle className="border border-primary/30" />

            {/* Reservar button desktop */}
            <button
              onClick={() => scrollTo("#reservar")}
              className="hidden md:inline-flex btn-space-primary"
            >
              <CalendarCheck className="w-4 h-4" />
              Reservar ahora
            </button>

            {/* Hamburger */}
            <button
              onClick={toggleMenu}
              className="lg:hidden relative w-[30px] h-[24px] z-[200]"
              aria-label="Menú"
            >
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300 ${
                  isMobileOpen
                    ? "top-[10px] rotate-45 !bg-secondary"
                    : "top-0"
                }`}
              />
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300 top-[10px] ${
                  isMobileOpen ? "opacity-0 -translate-x-5" : ""
                }`}
              />
              <span
                className={`block absolute h-[3px] w-full rounded bg-base-content transition-all duration-300 ${
                  isMobileOpen
                    ? "top-[10px] -rotate-45 !bg-secondary"
                    : "top-[20px]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - solid bg */}
      <div
        className={`fixed top-0 h-screen w-full z-[150] bg-base-200 border-r-2 border-primary shadow-[5px_0_30px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] pt-[100px] overflow-y-auto lg:hidden ${
          isMobileOpen ? "left-0" : "-left-full"
        }`}
      >
        <div className="flex flex-col gap-4 px-6">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={closeMenu}
                className="mobile-link flex items-center gap-4 text-xl font-medium py-4 px-6 rounded-xl"
              >
                <link.Icon className={`w-6 h-6 ${link.color}`} />
                {link.label}
              </Link>
            ) : (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="mobile-link flex items-center gap-4 text-xl font-medium py-4 px-6 rounded-xl text-left"
              >
                <link.Icon className={`w-6 h-6 ${link.color}`} />
                {link.label}
              </button>
            )
          )}

          {/* Theme toggle in mobile */}
          <div className="mobile-link flex items-center gap-4 py-4 px-6 rounded-xl">
            <span className="text-base-content/60 text-lg">Tema</span>
            <ThemeToggle />
          </div>

          <div className="mt-8 pt-8 border-t border-primary/30">
            <button
              onClick={() => scrollTo("#reservar")}
              className="w-full btn-space-primary justify-center"
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