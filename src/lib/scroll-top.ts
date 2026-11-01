/** Lleva la vista al inicio (útil en móvil al cambiar de paso). */
export function scrollToPageTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  // Fallback inmediato por si el teclado móvil deja el scroll abajo
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}
