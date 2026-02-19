import { Link } from "react-router";
import {
  Rocket,
  ChevronRight,
  Facebook,
  Instagram,
  Youtube,
  Heart,
} from "lucide-react";

const exploreLinks = [
  { href: "#inicio", label: "Inicio" },
  { href: "#experiencia-destacada", label: "Experiencia" },
  { href: "#videos", label: "Momentos" },
  { href: "#paquetes", label: "Paquetes" },
  { href: "/galeria", label: "Galería", isRoute: true },
];

const infoLinks = [
  { href: "#disponibilidad", label: "Disponibilidad" },
  { href: "#resenas", label: "Reseñas" },
  { href: "#reservar", label: "Reservar" },
  { href: "#contacto", label: "Contacto" },
];

function smoothScroll(hash: string) {
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
}

function FooterLink({
  href,
  label,
  chevronColor,
  isRoute,
}: {
  href: string;
  label: string;
  chevronColor: string;
  isRoute?: boolean;
}) {
  if (isRoute) {
    return (
      <li>
        <Link
          to={href}
          className="text-base-content/60 hover:text-base-content transition flex items-center gap-2"
        >
          <ChevronRight className={`w-3 h-3 ${chevronColor}`} />
          {label}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <button
        onClick={() => smoothScroll(href)}
        className="text-base-content/60 hover:text-base-content transition flex items-center gap-2 cursor-pointer"
      >
        <ChevronRight className={`w-3 h-3 ${chevronColor}`} />
        {label}
      </button>
    </li>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.1a8.16 8.16 0 0 0 3.76.92V5.64a4.79 4.79 0 0 1-3.76 1.05z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-base-200 border-t-2 border-secondary shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-heading font-bold bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
                Space Kids
              </span>
            </div>
            <p className="text-base-content/60 mb-4 leading-relaxed">
              Donde las fiestas infantiles llegan a otro nivel. Experiencias
              espaciales inolvidables desde 2020.
            </p>
          </div>

          {/* Col 2: Explorar */}
          <div>
            <h4 className="text-lg font-heading font-bold text-base-content mb-6">
              Explorar
            </h4>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  chevronColor="text-primary"
                  isRoute={link.isRoute}
                />
              ))}
            </ul>
          </div>

          {/* Col 3: Información */}
          <div>
            <h4 className="text-lg font-heading font-bold text-base-content mb-6">
              Información
            </h4>
            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <FooterLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  chevronColor="text-secondary"
                />
              ))}
            </ul>
          </div>

          {/* Col 4: Redes Sociales */}
          <div>
            <h4 className="text-lg font-heading font-bold text-base-content mb-6">
              Redes Sociales
            </h4>
            <div className="flex flex-wrap gap-4">
              {[
                { Icon: Facebook, href: "https://facebook.com" },
                { Icon: Instagram, href: "https://instagram.com" },
                { Icon: TikTokIcon, href: "https://tiktok.com" },
                { Icon: Youtube, href: "https://youtube.com" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon w-14 h-14 rounded-full bg-base-100 border border-primary/30 flex items-center justify-center shadow-lg hover:bg-secondary hover:border-white hover:text-white transition-all duration-300"
                >
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-secondary/30 pt-8 text-center">
          <p className="text-base-content/50">
            © {currentYear} Space Kids. Todos los derechos reservados.
          </p>
          <p className="text-base-content/30 text-sm mt-3 flex items-center justify-center gap-1">
            Diseñado con{" "}
            <Heart className="w-4 h-4 text-secondary fill-secondary" /> para
            pequeños astronautas
          </p>
        </div>
      </div>
    </footer>
  );
}