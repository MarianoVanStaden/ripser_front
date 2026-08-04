// Escritorio: abre WhatsApp Web directamente (sin pasar por wa.me, que pregunta
// app vs web) y reutiliza la MISMA pestaña en clicks sucesivos.
//
// Nota: el truco del window name compartido (window.open(url, 'name')) NO
// alcanza porque WhatsApp Web envía Cross-Origin-Opener-Policy, que rompe la
// relación con el name al cargar. Solución: mantenemos una referencia módulo-
// global a la ventana abierta. Setear `.location.href` está permitido cross-
// origin (es navegación top-level), igual que `.focus()` y leer `.closed`.
//
// Móvil: web.whatsapp.com no funciona en navegadores móviles (muestra el cartel
// "usá una computadora"), así que ahí usamos wa.me, que abre la app nativa o
// deja elegir entre WhatsApp y WhatsApp Business.

const WHATSAPP_WINDOW_NAME = 'ripser_whatsapp_web';
let waWindow: Window | null = null;

export const openWhatsAppWeb = (telefono: string | null | undefined) => {
  if (!telefono) return;
  const phone = telefono.replace(/\D/g, '');
  if (!phone) return;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    // wa.me abre la app nativa (o el selector WhatsApp / WhatsApp Business).
    window.open(`https://wa.me/${phone}`, '_blank');
    return;
  }

  const url = `https://web.whatsapp.com/send?phone=${phone}`;

  // Reusar la pestaña previa si sigue abierta.
  if (waWindow && !waWindow.closed) {
    try {
      waWindow.location.href = url;
      waWindow.focus();
      return;
    } catch {
      // Si por alguna razón el browser bloqueó la navegación cross-origin,
      // caemos al window.open de abajo.
    }
  }

  waWindow = window.open(url, WHATSAPP_WINDOW_NAME);
};
