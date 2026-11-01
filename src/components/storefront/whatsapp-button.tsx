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
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
