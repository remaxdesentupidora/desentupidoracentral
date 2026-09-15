const WHATSAPP_PLACEHOLDER = /^\/whatsapp\/?$/i;
const DEFAULT_MESSAGE = 'Olá, preciso de uma desentupidora';

export function isWhatsAppPlaceholder(href: string | undefined): boolean {
  return Boolean(href && WHATSAPP_PLACEHOLDER.test(href.trim()));
}

export function buildWhatsAppUrl(
  whatsappNumber: string | undefined,
  text = DEFAULT_MESSAGE,
): string | undefined {
  const digits = whatsappNumber?.replace(/\D/g, '') ?? '';
  if (!digits) {
    return undefined;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function resolveCtaHref(href: string | undefined, whatsappNumber?: string): string {
  if (!href) {
    return '';
  }

  if (!isWhatsAppPlaceholder(href)) {
    return href;
  }

  return buildWhatsAppUrl(whatsappNumber) ?? href;
}
