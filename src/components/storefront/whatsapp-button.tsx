"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton({
  phone,
  message,
}: {
  phone: string;
  message: string;
}) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  const href = `https://wa.me/${cleaned}?text=${encodeURIComponent(message || "")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl sm:h-14 sm:w-14"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
