// Abre WhatsApp Web directamente (sin pasar por wa.me, que pregunta app vs web)
// y reutiliza la misma pestaña en clics sucesivos gracias al window name fijo:
// el navegador, al encontrar una ventana ya abierta con ese name, navega esa
// pestaña en vez de crear una nueva.
const WHATSAPP_WINDOW_NAME = 'ripser_whatsapp_web';

export const openWhatsAppWeb = (telefono: string | null | undefined) => {
  if (!telefono) return;
  const phone = telefono.replace(/\D/g, '');
  if (!phone) return;
  window.open(
    `https://web.whatsapp.com/send?phone=${phone}`,
    WHATSAPP_WINDOW_NAME
  );
};
