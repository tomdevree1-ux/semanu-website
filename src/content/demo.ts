// Copy for embedded demo configurators: the try-me activation layer (TryMeEmbed)
// and the demo notice (DemoNotice). Quote requests and orders are not processed.

export type ConfLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

export const TRY_ME: Record<ConfLocale, { button: string; text: string }> = {
  nl: { button: 'Probeer het zelf', text: 'Demo: offerteaanvragen en bestellingen worden niet verwerkt.' },
  en: { button: 'Try me', text: 'Demo: quote requests and orders are not processed.' },
  de: { button: 'Selbst ausprobieren', text: 'Demo: Angebotsanfragen und Bestellungen werden nicht verarbeitet.' },
  fr: { button: 'Essayez-le', text: 'Démo : les demandes de devis et les commandes ne sont pas traitées.' },
  es: { button: 'Pruébelo', text: 'Demo: las solicitudes de presupuesto y los pedidos no se procesan.' },
};

export const DEMO_NOTICE: Record<ConfLocale, { badge: string; text: string; cta: string }> = {
  nl: {
    badge: 'Demo',
    text: 'Dit is een demo. Probeer gerust alles uit: offerteaanvragen en bestellingen worden hier niet verwerkt. Wilt u dit voor uw eigen producten?',
    cta: 'Neem contact op',
  },
  en: {
    badge: 'Demo',
    text: 'This is a demo. Feel free to try everything: quote requests and orders are not processed here. Would you like this for your own products?',
    cta: 'Get in touch',
  },
  de: {
    badge: 'Demo',
    text: 'Dies ist eine Demo. Probieren Sie gerne alles aus: Angebotsanfragen und Bestellungen werden hier nicht verarbeitet. Möchten Sie das für Ihre eigenen Produkte?',
    cta: 'Kontakt aufnehmen',
  },
  fr: {
    badge: 'Démo',
    text: 'Ceci est une démo. Essayez tout librement : les demandes de devis et les commandes ne sont pas traitées ici. Vous souhaitez la même chose pour vos propres produits ?',
    cta: 'Contactez-nous',
  },
  es: {
    badge: 'Demo',
    text: 'Esto es una demo. Pruebe todo con total libertad: las solicitudes de presupuesto y los pedidos no se procesan aquí. ¿Quiere esto para sus propios productos?',
    cta: 'Contáctenos',
  },
};
