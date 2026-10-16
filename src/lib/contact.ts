/**
 * Single source of truth for amai's public phone + WhatsApp.
 * PHONE_DISPLAY is the human-readable Swiss grouping shown on the site;
 * PHONE_E164 backs the tel: link and the schema.org telephone; the wa.me helper
 * opens a WhatsApp chat with amai (no pre-filled message).
 */
export const PHONE_DISPLAY = '+41 77 524 91 24';
export const PHONE_E164 = '+41775249124';
export const PHONE_TEL_HREF = `tel:${PHONE_E164}`;

/** wa.me expects the number without a leading + or any spaces. */
const WHATSAPP_NUMBER = '41775249124';

/** Opens the WhatsApp chat with amai. No pre-filled text: the chat opens with
 *  an empty input so the visitor writes their own message. */
export function whatsappHref(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}
