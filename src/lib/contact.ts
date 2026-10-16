/**
 * Single source of truth for SEMANU's public contact details.
 * PHONE_DISPLAY is the human-readable Belgian grouping shown on the site;
 * PHONE_E164 backs the tel: link and the schema.org telephone; the wa.me helper
 * opens a WhatsApp chat (no pre-filled message).
 */
export const CONTACT_EMAIL = 'hello@semanu.eu';
export const PHONE_DISPLAY = '+32 496 04 56 06';
export const PHONE_E164 = '+32496045606';
export const PHONE_TEL_HREF = `tel:${PHONE_E164}`;

/** wa.me expects the number without a leading + or any spaces. */
const WHATSAPP_NUMBER = '32496045606';

/** Opens the WhatsApp chat. No pre-filled text: the visitor writes their own message. */
export function whatsappHref(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}
