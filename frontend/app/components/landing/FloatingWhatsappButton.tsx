// app/components/landing/FloatingWhatsAppButton.tsx

import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export function FloatingWhatsAppButton({
  phoneNumber = "521234567890",
  message = "¡Hola! Me interesa reservar un evento en Space Kids",
}: FloatingWhatsAppButtonProps) {
  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="WhatsApp"
    >
      <div className="relative">
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse opacity-50" />
        
        {/* Button */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:scale-110 transition-transform duration-300">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white fill-white" />
          
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </div>
    </button>
  );
}