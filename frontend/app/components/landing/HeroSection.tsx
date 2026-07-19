// app/components/landing/HeroSection.tsx - Versión mejorada

import { Rocket, Calendar, Zap, Users, Star } from "lucide-react";

export function HeroSection() {
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
        {/* Badge de urgencia */}
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-sm font-medium text-red-400 mb-6 backdrop-blur-sm">
            <Zap className="w-4 h-4 animate-pulse" />
            <span>🔥 Fechas de Julio casi agotadas</span>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <span className="inline-block px-6 py-3 bg-base-100/20 backdrop-blur-sm border border-primary/30 rounded-full text-sm font-medium mb-6 shadow-lg text-white/90">
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

          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Un viaje intergaláctico lleno de diversión, juegos y aventuras para
            los pequeños astronautas
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="flex flex-wrap justify-center gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 text-white/80">
            <Users className="w-5 h-5 text-secondary" />
            <span className="font-bold">500+</span>
            <span className="text-sm">Fiestas</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">4.9</span>
            <span className="text-sm">Calificación</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="font-bold">10k+</span>
            <span className="text-sm">Niños felices</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <a href="#reservar" className="btn-space-primary text-lg group">
            <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
            Reservar evento
          </a>
          <a href="#disponibilidad" className="btn-space-secondary text-lg group">
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
            Ver disponibilidad
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-12 h-20 border-2 border-white/30 rounded-full flex justify-center bg-[#0A0A1F]/50">
          <div className="w-1.5 h-4 bg-gradient-to-b from-white to-transparent rounded-full mt-3 animate-pulse" />
        </div>
      </div>
    </section>
  );
}