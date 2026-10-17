// Content for the 3D configurator demo pages (/configurator/[type]).
// Every type has the same structure (hero, demo, intro, what the customer
// configures, what you receive, who it is for, FAQ), with copy specific to the
// real configurator SEMANU built for that product: a fitted wardrobe planner
// (cabinet), a dining table configurator (table), a glass balustrade
// configurator (railing) and a steel swing gate configurator with a technical
// dossier (gate). Original semanu sample data only; no third party product names.
// House style: no dashes, no comma before a coordinating conjunction.

export type ConfLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';
type Loc = Record<ConfLocale, string>;

/** Compact helper: one string per locale, in the order nl, en, de, fr, es. */
const L = (nl: string, en: string, de: string, fr: string, es: string): Loc => ({ nl, en, de, fr, es });

export type ConfContent = {
  title: string;
  h1: string;
  heroSub: string;
  metaTitle: string;
  metaDescription: string;
  introHeading: string;
  introBody: string;
  /** What the customer configures (real options of this configurator type). */
  features: string[];
  /** What the business receives (outputs). */
  outputs: string[];
  /** Who it is for. */
  useCases: string[];
  faq: { q: string; a: string }[];
  /** Optional link to the full, live configurator (opens in a new tab). */
  configUrl?: string;
  launchLabel?: string;
};

export type ConfDemoOption = { label: Loc | string; price?: number; swatch?: string };
export type ConfDemo = {
  currency: string;
  basePrice: number;
  steps: { label: Loc; options: ConfDemoOption[] }[];
};

export const CONFIG_SLUGS = ['cabinet', 'table', 'railing', 'gate'] as const;

/** Labels shared by every configurator page, per locale. */
export const UI: Record<
  ConfLocale,
  {
    eyebrow: string;
    featuresHeading: string;
    outputsHeading: string;
    useCasesHeading: string;
    faqTitle: string;
    moreTitle: string;
    serviceLabel: string;
    finalTitle: string;
    finalText: string;
    finalCta: string;
    demoNote: string;
    previewLabel: string;
    summaryLabel: string;
    priceNote: string;
    ctaLabel: string;
  }
> = {
  nl: {
    eyebrow: '3D-configurator',
    featuresHeading: 'Wat uw klant samenstelt',
    outputsHeading: 'Wat u ontvangt',
    useCasesHeading: 'Voor wie',
    faqTitle: 'Veelgestelde vragen',
    moreTitle: 'Meer configuratoren',
    serviceLabel: 'Alles over 3D-configuratoren',
    finalTitle: 'Een configurator voor uw product?',
    finalText: 'Vertel ons over uw product en de opties. Wij tonen hoe een configurator in uw verkoop en productie past.',
    finalCta: 'Bespreek een configurator',
    demoNote: 'Vereenvoudigde demo met voorbeelddata. Prijzen zijn indicatief.',
    previewLabel: 'Voorbeeld',
    summaryLabel: 'Uw keuze',
    priceNote: 'Richtprijs',
    ctaLabel: 'Aanvraag sturen',
  },
  en: {
    eyebrow: '3D configurator',
    featuresHeading: 'What your customer configures',
    outputsHeading: 'What you receive',
    useCasesHeading: 'Who it is for',
    faqTitle: 'Frequently asked questions',
    moreTitle: 'More configurators',
    serviceLabel: 'All about 3D configurators',
    finalTitle: 'Want a configurator for your product?',
    finalText: 'Tell us about your product and its options. We show you how a configurator fits your sales and production.',
    finalCta: 'Discuss a configurator',
    demoNote: 'Simplified demo with sample data. Prices are indicative only.',
    previewLabel: 'Preview',
    summaryLabel: 'Your choice',
    priceNote: 'Indicative price',
    ctaLabel: 'Send enquiry',
  },
  de: {
    eyebrow: '3D-Konfigurator',
    featuresHeading: 'Was Ihr Kunde konfiguriert',
    outputsHeading: 'Was Sie erhalten',
    useCasesHeading: 'Für wen',
    faqTitle: 'Häufige Fragen',
    moreTitle: 'Weitere Konfiguratoren',
    serviceLabel: 'Alles über 3D-Konfiguratoren',
    finalTitle: 'Ein Konfigurator für Ihr Produkt?',
    finalText: 'Erzählen Sie uns von Ihrem Produkt und seinen Optionen. Wir zeigen, wie ein Konfigurator in Vertrieb und Fertigung passt.',
    finalCta: 'Konfigurator besprechen',
    demoNote: 'Vereinfachte Demo mit Beispieldaten. Preise sind unverbindliche Richtwerte.',
    previewLabel: 'Vorschau',
    summaryLabel: 'Ihre Auswahl',
    priceNote: 'Richtpreis',
    ctaLabel: 'Anfrage senden',
  },
  fr: {
    eyebrow: 'Configurateur 3D',
    featuresHeading: 'Ce que votre client configure',
    outputsHeading: 'Ce que vous recevez',
    useCasesHeading: 'Pour qui',
    faqTitle: 'Questions fréquentes',
    moreTitle: 'Autres configurateurs',
    serviceLabel: 'Tout sur les configurateurs 3D',
    finalTitle: 'Un configurateur pour votre produit ?',
    finalText: 'Parlez-nous de votre produit et de ses options. Nous vous montrons comment un configurateur s’intègre à vos ventes et à votre production.',
    finalCta: 'Parler d’un configurateur',
    demoNote: 'Démo simplifiée avec des données d’exemple. Prix indicatifs uniquement.',
    previewLabel: 'Aperçu',
    summaryLabel: 'Votre choix',
    priceNote: 'Prix indicatif',
    ctaLabel: 'Envoyer la demande',
  },
  es: {
    eyebrow: 'Configurador 3D',
    featuresHeading: 'Lo que configura su cliente',
    outputsHeading: 'Lo que usted recibe',
    useCasesHeading: 'Para quién',
    faqTitle: 'Preguntas frecuentes',
    moreTitle: 'Más configuradores',
    serviceLabel: 'Todo sobre configuradores 3D',
    finalTitle: '¿Un configurador para su producto?',
    finalText: 'Cuéntenos su producto y sus opciones. Le mostramos cómo encaja un configurador en sus ventas y su producción.',
    finalCta: 'Hablar de un configurador',
    demoNote: 'Demo simplificada con datos de ejemplo. Precios solo orientativos.',
    previewLabel: 'Vista previa',
    summaryLabel: 'Su elección',
    priceNote: 'Precio indicativo',
    ctaLabel: 'Enviar solicitud',
  },
};

/** Notice shown next to every embedded demo configurator: nothing entered there is
 *  processed, plus a contact link for visitors who want one for their own products. */
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

/** Sample demo data per type: the step and option labels follow the real configurator. */
export const DEMOS: Record<string, ConfDemo> = {
  cabinet: {
    currency: 'EUR',
    basePrice: 1500,
    steps: [
      {
        label: L('Front', 'Front', 'Front', 'Façade', 'Frente'),
        options: [
          { label: L('Met deuren', 'With doors', 'Mit Türen', 'Avec portes', 'Con puertas') },
          { label: L('Open', 'Open', 'Offen', 'Ouvert', 'Abierto'), price: -150 },
        ],
      },
      {
        label: L('Breedte', 'Width', 'Breite', 'Largeur', 'Ancho'),
        options: [{ label: '160 cm' }, { label: '200 cm', price: 260 }, { label: '240 cm', price: 520 }],
      },
      {
        label: L('Indeling', 'Interior', 'Innenausstattung', 'Aménagement', 'Interior'),
        options: [
          { label: L('Legplanken', 'Shelves', 'Böden', 'Étagères', 'Baldas') },
          { label: L('Hangroede', 'Hanging rail', 'Kleiderstange', 'Penderie', 'Barra'), price: 40 },
          { label: L('Hangroede en laden', 'Rail and drawers', 'Stange und Schubladen', 'Penderie et tiroirs', 'Barra y cajones'), price: 340 },
        ],
      },
      {
        label: L('Afwerking', 'Finish', 'Oberfläche', 'Finition', 'Acabado'),
        options: [
          { label: L('Eik licht', 'Light oak', 'Eiche hell', 'Chêne clair', 'Roble claro'), swatch: '#cfb08a' },
          { label: L('Notelaar', 'Walnut', 'Nussbaum', 'Noyer', 'Nogal'), swatch: '#6b4a33', price: 180 },
          { label: L('Hoogglans wit', 'High gloss white', 'Hochglanz weiß', 'Blanc brillant', 'Blanco brillo'), swatch: '#f4f3ef', price: 120 },
          { label: L('Antraciet', 'Anthracite', 'Anthrazit', 'Anthracite', 'Antracita'), swatch: '#3a3d42', price: 120 },
        ],
      },
    ],
  },
  table: {
    currency: 'EUR',
    basePrice: 1500,
    steps: [
      {
        label: L('Vorm', 'Shape', 'Form', 'Forme', 'Forma'),
        options: [
          { label: L('Rechthoekig', 'Rectangular', 'Rechteckig', 'Rectangulaire', 'Rectangular') },
          { label: L('Ovaal', 'Oval', 'Oval', 'Ovale', 'Ovalada'), price: 150 },
          { label: L('Rond', 'Round', 'Rund', 'Ronde', 'Redonda'), price: 100 },
        ],
      },
      {
        label: L('Maat', 'Size', 'Größe', 'Taille', 'Tamaño'),
        options: [{ label: '180 cm' }, { label: '220 cm', price: 220 }, { label: '260 cm', price: 420 }],
      },
      {
        label: L('Blad', 'Top', 'Platte', 'Plateau', 'Tablero'),
        options: [
          { label: L('Eik', 'Oak', 'Eiche', 'Chêne', 'Roble') },
          { label: L('Notelaar', 'Walnut', 'Nussbaum', 'Noyer', 'Nogal'), price: 300 },
          { label: L('Keramiek', 'Ceramic', 'Keramik', 'Céramique', 'Cerámica'), price: 450 },
          { label: L('Linoleum', 'Linoleum', 'Linoleum', 'Linoléum', 'Linóleo'), price: 80 },
        ],
      },
      {
        label: L('Kleur onderstel', 'Base colour', 'Gestellfarbe', 'Couleur du piétement', 'Color de la base'),
        options: [
          { label: 'RAL 9005', swatch: '#0e0e10' },
          { label: 'RAL 7016', swatch: '#383e42' },
          { label: 'RAL 3000', swatch: '#a72920' },
          { label: 'RAL 5015', swatch: '#2271b3' },
        ],
      },
    ],
  },
  railing: {
    currency: 'EUR',
    basePrice: 900,
    steps: [
      {
        label: L('Vorm', 'Shape', 'Form', 'Forme', 'Forma'),
        options: [
          { label: L('Recht', 'Straight', 'Gerade', 'Droite', 'Recta') },
          { label: L('L-vorm', 'L shape', 'L-Form', 'En L', 'En L'), price: 150 },
          { label: L('U-vorm', 'U shape', 'U-Form', 'En U', 'En U'), price: 300 },
        ],
      },
      {
        label: L('Lengte', 'Length', 'Länge', 'Longueur', 'Longitud'),
        options: [{ label: '3 m' }, { label: '6 m', price: 780 }, { label: '9 m', price: 1560 }],
      },
      {
        label: L('Montage', 'Mounting', 'Montage', 'Fixation', 'Montaje'),
        options: [
          { label: L('Op de vloer', 'On the floor', 'Auf dem Boden', 'Au sol', 'Sobre el suelo') },
          { label: L('Tegen de zijkant', 'Side mounted', 'Seitlich', 'En applique', 'Lateral'), price: 180 },
          { label: L('Ingebouwd', 'Recessed', 'Eingelassen', 'Encastrée', 'Empotrado'), price: 360 },
        ],
      },
      {
        label: L('Profielkleur', 'Profile colour', 'Profilfarbe', 'Couleur du profil', 'Color del perfil'),
        options: [
          { label: 'RAL 9005', swatch: '#0e0e10' },
          { label: 'RAL 7016', swatch: '#383e42' },
          { label: 'RAL 9016', swatch: '#f1f0ea' },
          { label: L('Brons', 'Bronze', 'Bronze', 'Bronze', 'Bronce'), swatch: '#8c6a43', price: 120 },
        ],
      },
    ],
  },
  gate: {
    currency: 'EUR',
    basePrice: 2400,
    steps: [
      {
        label: L('Type', 'Type', 'Typ', 'Type', 'Tipo'),
        options: [
          { label: L('Enkele draaipoort', 'Single swing gate', 'Einflügelig', 'Battant simple', 'Una hoja') },
          { label: L('Dubbele draaipoort', 'Double swing gate', 'Zweiflügelig', 'Battant double', 'Dos hojas'), price: 600 },
        ],
      },
      {
        label: L('Breedte', 'Width', 'Breite', 'Largeur', 'Ancho'),
        options: [{ label: '3 m' }, { label: '4 m', price: 350 }, { label: '5 m', price: 720 }],
      },
      {
        label: L('Motorisatie', 'Automation', 'Antrieb', 'Motorisation', 'Motorización'),
        options: [
          { label: L('Manueel', 'Manual', 'Manuell', 'Manuel', 'Manual') },
          { label: L('Vijzelmotoren', 'Ram motors', 'Spindelantrieb', 'Moteurs à vérin', 'Motores de brazo'), price: 1400 },
          { label: L('Ondergrondse motoren', 'Underground motors', 'Unterflurantrieb', 'Moteurs enterrés', 'Motores enterrados'), price: 2400 },
        ],
      },
      {
        label: L('Kleur', 'Colour', 'Farbe', 'Couleur', 'Color'),
        options: [
          { label: 'RAL 7016', swatch: '#383e42' },
          { label: 'RAL 7021', swatch: '#2e3234' },
          { label: 'RAL 9005', swatch: '#0e0e10' },
          { label: 'RAL 9016', swatch: '#f1f0ea' },
        ],
      },
    ],
  },
};

const CABINET_URL: Loc = L(
  'https://www.semanu.be/kastenconfigurator',
  'https://www.semanu.be/cabinetconfigurator',
  'https://www.semanu.be/schrankplaner',
  'https://www.semanu.be/configurateurdressing',
  'https://www.semanu.be/configuradorarmarios',
);

export const CONFIGURATORS: Record<string, Record<ConfLocale, ConfContent>> = {
  cabinet: {
    nl: {
      title: 'Kastconfigurator',
      metaTitle: 'Kastconfigurator voor maatkasten in 3D · semanu.eu',
      metaDescription: 'Demo van een kastconfigurator: maten van de ruimte, schuine plafonds, vakken, indelingen met laden en roedes, afwerkingen en grepen, met live prijs.',
      h1: 'Maatkasten in 3D samenstellen met een kastconfigurator.',
      heroSub: 'Uw klant geeft de breedte, hoogte en diepte van de ruimte in, verdeelt de kast in vakken en kiest indeling, afwerking en grepen. Het 3D-beeld en de prijs passen zich bij elke keuze aan.',
      introHeading: 'Waarom een kastconfigurator?',
      introBody: 'Een maatkast is nooit twee keer dezelfde: muur, plafond en indeling verschillen telkens. Zonder configurator gaat elke variant heen en weer per mail. Met een configurator ontwerpt uw klant zelf een kast die past, ziet hij ze in 3D en krijgt u een aanvraag met de juiste maten.',
      features: [
        'Breedte, hoogte en diepte van de ruimte, vrijstaand of tussen twee muren',
        'Schuine plafonds aan één of beide kanten',
        'Vakken met deuren of open, draairichting per deur',
        'Indelingen met legplanken, hangroedes, laden, kledinglift of schoenenrek',
        'Houtstructuren of hoogglanskleuren, binnen en buiten apart',
        'Staafgrepen, knopjes of greeploos met push to open',
      ],
      outputs: [
        'Een live prijs op basis van maten, materialen en beslag',
        'Alleen bouwbare combinaties, met de reden wanneer een optie niet past',
        'Een deellink die de volledige configuratie bewaart',
        'Een offerteaanvraag met de exacte maten en een overzicht',
      ],
      useCases: [
        'Meubelmakers die maatkasten en inbouwkasten verkopen',
        'Interieurbouwers die sneller willen offreren',
        'Winkels die kasten op maat online verkopen',
      ],
      faq: [
        { q: 'Wat kost een kastconfigurator?', a: 'Elke configurator krijgt een offerte op aanvraag. De prijs hangt af van het aantal opties, de prijsregels en de koppelingen met uw systemen. Vertel ons over uw assortiment en u krijgt een schriftelijke offerte.' },
        { q: 'Kunnen klanten hun eigen maten ingeven?', a: 'Ja. Breedte, hoogte en diepte maken deel uit van de configuratie, binnen de grenzen die u bepaalt. Indelingen die niet in een vak passen, worden verborgen met een korte uitleg.' },
        { q: 'Werkt de configurator met schuine plafonds?', a: 'Ja. De klant stelt per kant de kniehoogte en de breedte van de schuinte in. De kast volgt het plafond en het 3D-beeld toont meteen het resultaat.' },
        { q: 'Kan ik mijn eigen materialen, afwerkingen en beslag gebruiken?', a: 'Ja. Wij zetten uw eigen decors, kleuren, grepen en prijslogica in de configurator. Niets wordt van anderen overgenomen.' },
      ],
      configUrl: CABINET_URL.nl,
      launchLabel: 'Open de volledige kastconfigurator',
    },
    en: {
      title: 'Cabinet configurator',
      metaTitle: 'Cabinet configurator for fitted wardrobes in 3D · semanu.eu',
      metaDescription: 'Cabinet configurator demo: room dimensions, sloped ceilings, bays, interiors with drawers and rails, finishes and handles, with a live price in 3D.',
      h1: 'Fitted wardrobes made to measure, configured in 3D.',
      heroSub: 'Your customer enters the width, height and depth of the room, divides the cabinet into bays and picks interiors, finishes and handles. The 3D view and the price update with every choice.',
      introHeading: 'Why a cabinet configurator?',
      introBody: 'A fitted wardrobe is never the same twice: the wall, the ceiling and the bays all differ. Without a configurator every variant goes back and forth by email. With one, your customer designs a cabinet that fits, sees it in 3D and sends you an enquiry with the exact measurements.',
      features: [
        'Room width, height and depth, freestanding or between two walls',
        'Sloped ceilings on one or both sides',
        'Bays with doors or open, swing direction per door',
        'Interiors with shelves, hanging rails, drawers, a wardrobe lift or a shoe rack',
        'Wood textures or high gloss colours, inside and outside',
        'Bar handles, knobs or handleless push to open',
      ],
      outputs: [
        'A live price based on dimensions, materials and fittings',
        'Only buildable combinations, with the reason when an option does not fit',
        'A share link that stores the full configuration',
        'A quote request with the exact measurements and a summary',
      ],
      useCases: [
        'Furniture makers selling fitted wardrobes and storage cabinets',
        'Interior builders who want to quote faster',
        'Retailers who sell made-to-measure cabinets online',
      ],
      faq: [
        { q: 'What does a cabinet configurator cost?', a: 'Every configurator is quoted on request. The price depends on the number of options, the pricing rules and the links to your systems. Tell us about your range and you get a written quote.' },
        { q: 'Can customers enter their own dimensions?', a: 'Yes. Width, height and depth are part of the configuration, within the limits you set. Interiors that do not fit a bay are hidden with a short explanation.' },
        { q: 'Does the configurator handle sloped ceilings?', a: 'Yes. The customer sets the knee wall height and the width of the slope per side. The cabinet follows the ceiling and the 3D view shows the result straight away.' },
        { q: 'Can I use my own materials, finishes and fittings?', a: 'Yes. We put your own decors, colours, handles and price logic into the configurator. Nothing is taken from anyone else.' },
      ],
      configUrl: CABINET_URL.en,
      launchLabel: 'Open the full cabinet configurator',
    },
    de: {
      title: 'Schrankkonfigurator',
      metaTitle: 'Schrankkonfigurator für Maßschränke in 3D · semanu.eu',
      metaDescription: 'Demo eines Schrankkonfigurators: Raummaße, Dachschrägen, Fächer, Innenausstattung mit Schubladen und Kleiderstangen, Oberflächen und Griffe in 3D.',
      h1: 'Maßschränke in 3D planen mit einem Schrankkonfigurator.',
      heroSub: 'Ihr Kunde gibt Breite, Höhe und Tiefe des Raums ein, teilt den Schrank in Fächer und wählt Innenausstattung, Oberflächen und Griffe. 3D-Ansicht und Preis passen sich bei jeder Wahl an.',
      introHeading: 'Warum ein Schrankkonfigurator?',
      introBody: 'Ein Maßschrank ist nie zweimal gleich: Wand, Decke und Einteilung unterscheiden sich jedes Mal. Ohne Konfigurator geht jede Variante per E-Mail hin und her. Mit einem Konfigurator plant Ihr Kunde selbst einen passenden Schrank, sieht ihn in 3D und Sie erhalten eine Anfrage mit den richtigen Maßen.',
      features: [
        'Breite, Höhe und Tiefe des Raums, freistehend oder zwischen zwei Wänden',
        'Dachschrägen auf einer oder beiden Seiten',
        'Fächer mit Türen oder offen, Öffnungsrichtung pro Tür',
        'Innenausstattung mit Böden, Kleiderstangen, Schubladen, Kleiderlift oder Schuhregal',
        'Holzdekore oder Hochglanzfarben, innen und außen getrennt',
        'Stangengriffe, Knöpfe oder grifflos mit Push to Open',
      ],
      outputs: [
        'Ein Live-Preis auf Basis von Maßen, Materialien und Beschlägen',
        'Nur baubare Kombinationen, mit Begründung, wenn eine Option nicht passt',
        'Ein Link, der die komplette Konfiguration speichert',
        'Eine Angebotsanfrage mit exakten Maßen und Übersicht',
      ],
      useCases: [
        'Möbelhersteller, die Maß- und Einbauschränke verkaufen',
        'Innenausbauer, die schneller Angebote erstellen möchten',
        'Händler, die Schränke nach Maß online verkaufen',
      ],
      faq: [
        { q: 'Was kostet ein Schrankkonfigurator?', a: 'Jeder Konfigurator wird auf Anfrage angeboten. Der Preis hängt von der Anzahl der Optionen, den Preisregeln und den Anbindungen an Ihre Systeme ab. Erzählen Sie uns von Ihrem Sortiment und Sie erhalten ein schriftliches Angebot.' },
        { q: 'Können Kunden eigene Maße eingeben?', a: 'Ja. Breite, Höhe und Tiefe sind Teil der Konfiguration, innerhalb der Grenzen, die Sie festlegen. Einteilungen, die nicht in ein Fach passen, werden mit einer kurzen Erklärung ausgeblendet.' },
        { q: 'Funktioniert der Konfigurator mit Dachschrägen?', a: 'Ja. Der Kunde stellt pro Seite Kniestockhöhe und Breite der Schräge ein. Der Schrank folgt der Decke und die 3D-Ansicht zeigt sofort das Ergebnis.' },
        { q: 'Kann ich eigene Materialien, Oberflächen und Beschläge verwenden?', a: 'Ja. Wir hinterlegen Ihre eigenen Dekore, Farben, Griffe und Preislogik im Konfigurator. Nichts wird von anderen übernommen.' },
      ],
      configUrl: CABINET_URL.de,
      launchLabel: 'Vollständigen Schrankkonfigurator öffnen',
    },
    fr: {
      title: 'Configurateur d’armoire',
      metaTitle: 'Configurateur d’armoire sur mesure en 3D · semanu.eu',
      metaDescription: 'Démo d’un configurateur d’armoire : dimensions, plafonds mansardés, caissons, aménagements avec tiroirs et penderies, finitions et poignées en 3D.',
      h1: 'Composez une armoire sur mesure en 3D avec un configurateur.',
      heroSub: 'Votre client saisit la largeur, la hauteur et la profondeur de la pièce, divise l’armoire en caissons et choisit aménagements, finitions et poignées. La vue 3D et le prix suivent chaque choix.',
      introHeading: 'Pourquoi un configurateur d’armoire ?',
      introBody: 'Une armoire sur mesure n’est jamais deux fois la même : le mur, le plafond et l’aménagement changent à chaque fois. Sans configurateur, chaque variante fait des allers-retours par e-mail. Avec un configurateur, votre client conçoit lui-même une armoire qui s’adapte, la voit en 3D et vous envoie une demande avec les bonnes mesures.',
      features: [
        'Largeur, hauteur et profondeur de la pièce, en pose libre ou entre deux murs',
        'Plafonds mansardés d’un côté ou des deux',
        'Caissons avec portes ou ouverts, sens d’ouverture par porte',
        'Aménagements avec étagères, penderies, tiroirs, ascenseur de penderie ou range-chaussures',
        'Décors bois ou couleurs laquées brillantes, intérieur et extérieur séparément',
        'Poignées barres, boutons ou sans poignée avec ouverture par pression',
      ],
      outputs: [
        'Un prix en direct selon les dimensions, les matériaux et les ferrures',
        'Uniquement des combinaisons réalisables, avec la raison quand une option ne convient pas',
        'Un lien de partage qui conserve toute la configuration',
        'Une demande de devis avec les mesures exactes et un récapitulatif',
      ],
      useCases: [
        'Fabricants de meubles qui vendent des armoires et placards sur mesure',
        'Agenceurs d’intérieur qui veulent chiffrer plus vite',
        'Magasins qui vendent des armoires sur mesure en ligne',
      ],
      faq: [
        { q: 'Combien coûte un configurateur d’armoire ?', a: 'Chaque configurateur fait l’objet d’un devis sur demande. Le prix dépend du nombre d’options, des règles de prix et des liaisons avec vos systèmes. Parlez-nous de votre gamme : vous recevez un devis écrit.' },
        { q: 'Les clients peuvent-ils saisir leurs propres dimensions ?', a: 'Oui. Largeur, hauteur et profondeur font partie de la configuration, dans les limites que vous fixez. Les aménagements qui ne tiennent pas dans un caisson sont masqués avec une courte explication.' },
        { q: 'Le configurateur gère-t-il les plafonds mansardés ?', a: 'Oui. Le client règle la hauteur sous pente et la largeur de la pente de chaque côté. L’armoire suit le plafond et la vue 3D montre aussitôt le résultat.' },
        { q: 'Puis-je utiliser mes propres matériaux, finitions et ferrures ?', a: 'Oui. Nous intégrons vos décors, couleurs, poignées et votre logique de prix dans le configurateur. Rien n’est repris d’ailleurs.' },
      ],
      configUrl: CABINET_URL.fr,
      launchLabel: 'Ouvrir le configurateur d’armoire complet',
    },
    es: {
      title: 'Configurador de armarios',
      metaTitle: 'Configurador de armarios a medida en 3D · semanu.eu',
      metaDescription: 'Demo de un configurador de armarios: medidas del espacio, techos inclinados, módulos, interiores con cajones y barras, acabados y tiradores en 3D.',
      h1: 'Diseñe armarios a medida en 3D con un configurador.',
      heroSub: 'Su cliente introduce el ancho, el alto y el fondo del espacio, divide el armario en módulos y elige interiores, acabados y tiradores. La vista 3D y el precio se actualizan con cada elección.',
      introHeading: '¿Por qué un configurador de armarios?',
      introBody: 'Un armario a medida nunca es igual a otro: la pared, el techo y la distribución cambian cada vez. Sin configurador, cada variante va y viene por correo. Con un configurador, su cliente diseña un armario que encaja, lo ve en 3D y usted recibe una solicitud con las medidas correctas.',
      features: [
        'Ancho, alto y fondo del espacio, exento o entre dos paredes',
        'Techos inclinados a uno o ambos lados',
        'Módulos con puertas o abiertos, sentido de apertura por puerta',
        'Interiores con baldas, barras, cajones, barra abatible o zapatero',
        'Texturas de madera o colores alto brillo, por dentro y por fuera',
        'Tiradores de barra, pomos o sin tirador con apertura por presión',
      ],
      outputs: [
        'Un precio en directo según medidas, materiales y herrajes',
        'Solo combinaciones fabricables, con el motivo cuando una opción no cabe',
        'Un enlace que guarda toda la configuración',
        'Una solicitud de presupuesto con las medidas exactas y un resumen',
      ],
      useCases: [
        'Fabricantes de muebles que venden armarios y empotrados a medida',
        'Interioristas que quieren presupuestar más rápido',
        'Tiendas que venden armarios a medida en línea',
      ],
      faq: [
        { q: '¿Cuánto cuesta un configurador de armarios?', a: 'Cada configurador se presupuesta a petición. El precio depende del número de opciones, las reglas de precio y las conexiones con sus sistemas. Cuéntenos su gama y recibirá un presupuesto por escrito.' },
        { q: '¿Pueden los clientes introducir sus propias medidas?', a: 'Sí. Ancho, alto y fondo forman parte de la configuración, dentro de los límites que usted fija. Los interiores que no caben en un módulo se ocultan con una breve explicación.' },
        { q: '¿Funciona el configurador con techos inclinados?', a: 'Sí. El cliente ajusta en cada lado la altura de la pared baja y el ancho de la pendiente. El armario sigue el techo y la vista 3D muestra el resultado al instante.' },
        { q: '¿Puedo usar mis propios materiales, acabados y herrajes?', a: 'Sí. Incorporamos sus decorados, colores, tiradores y su lógica de precios al configurador. No se toma nada de otros.' },
      ],
      configUrl: CABINET_URL.es,
      launchLabel: 'Abrir el configurador de armarios completo',
    },
  },
  table: {
    nl: {
      title: 'Tafelconfigurator',
      metaTitle: 'Tafelconfigurator: vorm, blad en onderstel in 3D · semanu.eu',
      metaDescription: 'Demo van een tafelconfigurator: vorm en maten, bladen in eik, notelaar, keramiek of linoleum, RAL-kleuren voor het onderstel en verlengstukken.',
      h1: 'Stel een eettafel samen in 3D met een tafelconfigurator.',
      heroSub: 'Uw klant kiest vorm, lengte en breedte, het blad en de kleur van het stalen onderstel. Verlengstukken of een bijpassende bank zijn één klik verder. De richtprijs volgt elke keuze.',
      introHeading: 'Waarom een tafelconfigurator?',
      introBody: 'Een tafel kiest men op gevoel: de juiste maat voor de ruimte, een blad dat bij de vloer past, een onderstel in de juiste kleur. Met een configurator probeert uw klant die combinaties in 3D, ziet hij hoeveel personen eraan passen en stuurt hij u een volledige aanvraag met alle keuzes.',
      features: [
        'Rechthoekig, ovaal of rond, met lengte, breedte of diameter per 5 cm',
        'Hoogte binnen de marge die u toelaat',
        'Bladen in massieve eik, notelaar, keramiek, linoleum of staal',
        'Gepoedercoat onderstel in elke RAL-kleur',
        'Verlengstukken en een bijpassende bank als optie',
        'Aantal zitplaatsen berekend op basis van de maat',
      ],
      outputs: [
        'Een richtprijs met opsplitsing per onderdeel',
        'Een beeld van de samengestelde tafel met een specificatielijst',
        'Een vooraf ingevuld aanvraagbericht en een link die de configuratie opnieuw opent',
        'Maten zichtbaar in het 3D-beeld',
      ],
      useCases: [
        'Meubelmakers met tafels op maat',
        'Staal- en houtateliers met een vast gamma onderstellen en bladen',
        'Showrooms die klanten thuis willen laten ontwerpen',
      ],
      faq: [
        { q: 'Wat kost een tafelconfigurator?', a: 'Elke configurator krijgt een offerte op aanvraag. De prijs hangt af van het aantal modellen, materialen en prijsregels. Vertel ons over uw gamma en u krijgt een schriftelijke offerte.' },
        { q: 'Kan de configurator bladen in echte materialen tonen?', a: 'Ja. Hout, keramiek, linoleum en staal worden met hun eigen textuur en dikte getoond, zodat de klant het verschil in 3D ziet.' },
        { q: 'Kan ik de maten per model beperken?', a: 'Ja. Elk model krijgt een eigen minimum en maximum, stappen en regels. Opties die niet gelden, zoals een verlengstuk bij een ronde tafel, worden gewoon niet aangeboden.' },
        { q: 'Toont de configurator een prijs?', a: 'Ja, een richtprijs op basis van de keuzes, met een opsplitsing per onderdeel. De definitieve offerte maakt u zoals gewoonlijk.' },
      ],
    },
    en: {
      title: 'Table configurator',
      metaTitle: 'Table configurator: shape, top and base in 3D · semanu.eu',
      metaDescription: 'Table configurator demo: shape and size, tops in oak, walnut, ceramic or linoleum, RAL colours for the steel base and extension leaves.',
      h1: 'Design a dining table in 3D with a table configurator.',
      heroSub: 'Your customer picks the shape, length and width, the top and the colour of the steel base. Extension leaves or a matching bench are one click away. The indicative price follows every choice.',
      introHeading: 'Why a table configurator?',
      introBody: 'A table is chosen on feel: the right size for the room, a top that matches the floor, a base in the right colour. A configurator lets your customer try those combinations in 3D, see how many people fit and send you a complete enquiry with all choices.',
      features: [
        'Rectangular, oval or round, with length, width or diameter in 5 cm steps',
        'Height within the range you allow',
        'Tops in solid oak, walnut, ceramic, linoleum or steel',
        'Powder coated base in any RAL colour',
        'Extension leaves and a matching bench as options',
        'Number of seats calculated from the size',
      ],
      outputs: [
        'An indicative price with a breakdown per part',
        'An image of the configured table with a specification list',
        'A prefilled enquiry message and a link that reopens the configuration',
        'Dimensions shown in the 3D view',
      ],
      useCases: [
        'Furniture makers with made-to-measure tables',
        'Steel and wood workshops with a fixed range of bases and tops',
        'Showrooms that want customers to design at home',
      ],
      faq: [
        { q: 'What does a table configurator cost?', a: 'Every configurator is quoted on request. The price depends on the number of models, materials and pricing rules. Tell us about your range and you get a written quote.' },
        { q: 'Can it show tops in real materials?', a: 'Yes. Wood, ceramic, linoleum and steel are shown with their own texture and thickness, so the customer sees the difference in 3D.' },
        { q: 'Can I limit the sizes per model?', a: 'Yes. Each model gets its own minimum and maximum, steps and rules. Options that do not apply, such as an extension on a round table, are simply not offered.' },
        { q: 'Does the configurator show a price?', a: 'Yes, an indicative price based on the choices, with a breakdown per part. You still make the final quote as usual.' },
      ],
    },
    de: {
      title: 'Tischkonfigurator',
      metaTitle: 'Tischkonfigurator: Form, Platte und Gestell in 3D · semanu.eu',
      metaDescription: 'Demo eines Tischkonfigurators: Form und Maße, Platten aus Eiche, Nussbaum, Keramik oder Linoleum, RAL-Farben für das Gestell und Ansteckplatten.',
      h1: 'Esstisch in 3D gestalten mit einem Tischkonfigurator.',
      heroSub: 'Ihr Kunde wählt Form, Länge und Breite, die Platte und die Farbe des Stahlgestells. Ansteckplatten oder eine passende Bank sind einen Klick entfernt. Der Richtpreis folgt jeder Wahl.',
      introHeading: 'Warum ein Tischkonfigurator?',
      introBody: 'Einen Tisch wählt man nach Gefühl: die richtige Größe für den Raum, eine Platte, die zum Boden passt, ein Gestell in der richtigen Farbe. Mit einem Konfigurator probiert Ihr Kunde diese Kombinationen in 3D aus. Er sieht die Zahl der Sitzplätze und sendet Ihnen eine vollständige Anfrage mit allen Entscheidungen.',
      features: [
        'Rechteckig, oval oder rund, Länge, Breite oder Durchmesser in 5-cm-Schritten',
        'Höhe innerhalb des Spielraums, den Sie zulassen',
        'Platten aus massiver Eiche, Nussbaum, Keramik, Linoleum oder Stahl',
        'Pulverbeschichtetes Gestell in jeder RAL-Farbe',
        'Ansteckplatten und eine passende Bank als Option',
        'Anzahl der Sitzplätze aus der Größe berechnet',
      ],
      outputs: [
        'Ein Richtpreis mit Aufschlüsselung pro Bauteil',
        'Ein Bild des konfigurierten Tischs mit Spezifikationsliste',
        'Eine vorausgefüllte Anfrage und ein Link, der die Konfiguration wieder öffnet',
        'Maße direkt in der 3D-Ansicht',
      ],
      useCases: [
        'Möbelhersteller mit Tischen nach Maß',
        'Stahl- und Holzwerkstätten mit festem Sortiment an Gestellen und Platten',
        'Showrooms, deren Kunden zu Hause planen sollen',
      ],
      faq: [
        { q: 'Was kostet ein Tischkonfigurator?', a: 'Jeder Konfigurator wird auf Anfrage angeboten. Der Preis hängt von der Anzahl der Modelle, Materialien und Preisregeln ab. Erzählen Sie uns von Ihrem Sortiment und Sie erhalten ein schriftliches Angebot.' },
        { q: 'Kann der Konfigurator Platten in echten Materialien zeigen?', a: 'Ja. Holz, Keramik, Linoleum und Stahl erscheinen mit eigener Textur und Stärke, damit der Kunde den Unterschied in 3D sieht.' },
        { q: 'Kann ich die Maße pro Modell begrenzen?', a: 'Ja. Jedes Modell erhält eigene Mindest- und Höchstmaße, Schritte und Regeln. Optionen, die nicht gelten, etwa eine Ansteckplatte bei einem runden Tisch, werden einfach nicht angeboten.' },
        { q: 'Zeigt der Konfigurator einen Preis?', a: 'Ja, einen Richtpreis auf Basis der Auswahl, aufgeschlüsselt pro Bauteil. Das endgültige Angebot erstellen Sie wie gewohnt.' },
      ],
    },
    fr: {
      title: 'Configurateur de table',
      metaTitle: 'Configurateur de table : forme, plateau et piétement · semanu.eu',
      metaDescription: 'Démo d’un configurateur de table : forme et dimensions, plateaux en chêne, noyer, céramique ou linoléum, couleurs RAL pour le piétement et allonges.',
      h1: 'Composez une table à manger en 3D avec un configurateur.',
      heroSub: 'Votre client choisit la forme, la longueur et la largeur, le plateau et la couleur du piétement en acier. Allonges ou banc assorti sont à un clic. Le prix indicatif suit chaque choix.',
      introHeading: 'Pourquoi un configurateur de table ?',
      introBody: 'On choisit une table au ressenti : la bonne taille pour la pièce, un plateau assorti au sol, un piétement de la bonne couleur. Avec un configurateur, votre client essaie ces combinaisons en 3D, voit combien de personnes peuvent s’asseoir et vous envoie une demande complète avec tous ses choix.',
      features: [
        'Rectangulaire, ovale ou ronde, longueur, largeur ou diamètre par pas de 5 cm',
        'Hauteur dans la marge que vous autorisez',
        'Plateaux en chêne massif, noyer, céramique, linoléum ou acier',
        'Piétement thermolaqué dans toute couleur RAL',
        'Allonges et banc assorti en option',
        'Nombre de places calculé selon la taille',
      ],
      outputs: [
        'Un prix indicatif détaillé par élément',
        'Une image de la table configurée avec la liste des caractéristiques',
        'Un message de demande prérempli et un lien qui rouvre la configuration',
        'Les cotes affichées dans la vue 3D',
      ],
      useCases: [
        'Fabricants de meubles avec des tables sur mesure',
        'Ateliers acier et bois avec une gamme fixe de piétements et de plateaux',
        'Showrooms qui veulent laisser leurs clients concevoir chez eux',
      ],
      faq: [
        { q: 'Combien coûte un configurateur de table ?', a: 'Chaque configurateur fait l’objet d’un devis sur demande. Le prix dépend du nombre de modèles, de matériaux et de règles de prix. Parlez-nous de votre gamme : vous recevez un devis écrit.' },
        { q: 'Peut-il montrer des plateaux dans de vrais matériaux ?', a: 'Oui. Bois, céramique, linoléum et acier apparaissent avec leur propre texture et épaisseur, pour que le client voie la différence en 3D.' },
        { q: 'Puis-je limiter les dimensions par modèle ?', a: 'Oui. Chaque modèle reçoit ses propres minimum, maximum, pas et règles. Les options qui ne s’appliquent pas, comme une allonge sur une table ronde, ne sont tout simplement pas proposées.' },
        { q: 'Le configurateur affiche-t-il un prix ?', a: 'Oui, un prix indicatif selon les choix, détaillé par élément. Vous établissez le devis final comme d’habitude.' },
      ],
    },
    es: {
      title: 'Configurador de mesas',
      metaTitle: 'Configurador de mesas: forma, tablero y base en 3D · semanu.eu',
      metaDescription: 'Demo de un configurador de mesas: forma y medidas, tableros de roble, nogal, cerámica o linóleo, colores RAL para la base de acero y extensiones.',
      h1: 'Diseñe una mesa de comedor en 3D con un configurador.',
      heroSub: 'Su cliente elige la forma, el largo y el ancho, el tablero y el color de la base de acero. Las extensiones o un banco a juego están a un clic. El precio indicativo sigue cada elección.',
      introHeading: '¿Por qué un configurador de mesas?',
      introBody: 'Una mesa se elige por sensación: el tamaño adecuado para la sala, un tablero que combine con el suelo, una base del color correcto. Con un configurador, su cliente prueba esas combinaciones en 3D, ve cuántas personas caben y le envía una solicitud completa con todas sus elecciones.',
      features: [
        'Rectangular, ovalada o redonda, con largo, ancho o diámetro en pasos de 5 cm',
        'Altura dentro del margen que usted permite',
        'Tableros de roble macizo, nogal, cerámica, linóleo o acero',
        'Base con pintura en polvo en cualquier color RAL',
        'Extensiones y banco a juego como opción',
        'Número de plazas calculado según el tamaño',
      ],
      outputs: [
        'Un precio indicativo desglosado por pieza',
        'Una imagen de la mesa configurada con la lista de especificaciones',
        'Un mensaje de solicitud ya rellenado y un enlace que vuelve a abrir la configuración',
        'Medidas visibles en la vista 3D',
      ],
      useCases: [
        'Fabricantes de muebles con mesas a medida',
        'Talleres de acero y madera con una gama fija de bases y tableros',
        'Showrooms que quieren que sus clientes diseñen desde casa',
      ],
      faq: [
        { q: '¿Cuánto cuesta un configurador de mesas?', a: 'Cada configurador se presupuesta a petición. El precio depende del número de modelos, materiales y reglas de precio. Cuéntenos su gama y recibirá un presupuesto por escrito.' },
        { q: '¿Puede mostrar tableros en materiales reales?', a: 'Sí. Madera, cerámica, linóleo y acero se muestran con su propia textura y grosor, para que el cliente vea la diferencia en 3D.' },
        { q: '¿Puedo limitar las medidas por modelo?', a: 'Sí. Cada modelo tiene su propio mínimo, máximo, pasos y reglas. Las opciones que no aplican, como una extensión en una mesa redonda, simplemente no se ofrecen.' },
        { q: '¿Muestra el configurador un precio?', a: 'Sí, un precio indicativo según las elecciones, desglosado por pieza. El presupuesto final lo hace usted como siempre.' },
      ],
    },
  },
  railing: {
    nl: {
      title: 'Balustradeconfigurator',
      metaTitle: 'Balustradeconfigurator voor glazen balustrades · semanu.eu',
      metaDescription: 'Demo van een balustradeconfigurator: recht, L, U of vrije vorm, lengte per zijde, hoogte, montage, glassoort, profielkleur en toplijst, met live prijs.',
      h1: 'Plan een glazen balustrade in 3D met een balustradeconfigurator.',
      heroSub: 'Uw klant tekent de vorm van het terras of trapgat, geeft lengtes en hoogte in en kiest glas, montage en profielkleur. De prijs wordt per meter live berekend.',
      introHeading: 'Waarom een balustradeconfigurator?',
      introBody: 'Een balustrade rekent u in meters, hoeken en bevestigingen. Elk project vraagt een berekening voor de klant weet of het binnen het budget past. Een configurator maakt die berekening meteen: uw klant ziet de balustrade op de vorm van zijn eigen terras en u krijgt een aanvraag met elke lengte en hoek.',
      features: [
        'Rechte vorm, L-vorm, U-vorm of een vrije vorm getekend op een raster',
        'Lengte per zijde en een hoogte binnen de grenzen die u bepaalt',
        'Montage op de vloer, tegen de zijkant of ingebouwd',
        'Helder, extra helder, getint of opaal veiligheidsglas',
        'Profielkleuren in RAL of geanodiseerd',
        'Geen afwerking bovenaan, een toplijst of een inox handregel',
      ],
      outputs: [
        'Een prijs per lopende meter met toeslagen voor hoeken, glas en montage',
        'Aantal en breedte van de panelen automatisch berekend',
        'Een bovenaanzicht en maten in de 3D-scène',
        'Een offerteaanvraag met alle lengtes, hoeken en keuzes',
      ],
      useCases: [
        'Glas- en metaalateliers die balustrades plaatsen',
        'Leveranciers van balustradesystemen die via plaatsers verkopen',
        'Bouwers van terrassen, balkons en trapgaten',
      ],
      faq: [
        { q: 'Wat kost een balustradeconfigurator?', a: 'Elke configurator krijgt een offerte op aanvraag. De prijs hangt af van de vormen, opties en prijsregels die u wilt aanbieden. Vertel ons over uw systeem en u krijgt een schriftelijke offerte.' },
        { q: 'Kan de prijslogica afgeschermd blijven?', a: 'Ja. De berekening kan op de server draaien. Bezoekers zien het resultaat, nooit de formule of uw marges.' },
        { q: 'Kunnen klanten een onregelmatige vorm tekenen?', a: 'Ja. Naast rechte vormen, L-vormen en U-vormen kan de klant hoekpunten op een raster plaatsen. Hoeken en minimale lengtes volgen de regels van uw systeem.' },
        { q: 'Kan ik mijn eigen profielen en glassoorten gebruiken?', a: 'Ja. Wij zetten uw eigen profielen, glassoorten, kleuren en prijzen in de configurator. Niets wordt van anderen overgenomen.' },
      ],
    },
    en: {
      title: 'Railing configurator',
      metaTitle: 'Railing configurator for glass balustrades · semanu.eu',
      metaDescription: 'Railing configurator demo: straight, L, U or free shape, lengths per side, height, mounting, glass type, profile colour and top rail, priced live.',
      h1: 'Plan a glass balustrade in 3D with a railing configurator.',
      heroSub: 'Your customer draws the shape of the terrace or stairwell, enters the lengths and the height and chooses glass, mounting and profile colour. The price is calculated live for every metre.',
      introHeading: 'Why a railing configurator?',
      introBody: 'A balustrade is measured in metres, corners and fixings. Every project needs a calculation before the customer knows whether it fits the budget. A configurator does that calculation instantly: your customer sees the railing on their own terrace layout and you receive an enquiry with every length and corner.',
      features: [
        'A straight, L or U shape or a free shape drawn on a grid',
        'Length per side and a height within the limits you set',
        'Mounting on the floor, against the side or recessed',
        'Clear, extra clear, tinted or opal safety glass',
        'Profile colours in RAL or anodised finishes',
        'No top edge, a cap profile or a stainless steel handrail',
      ],
      outputs: [
        'A price per running metre with surcharges for corners, glass and mounting',
        'Panel count and widths calculated automatically',
        'A top view and dimensions in the 3D scene',
        'A quote request with all lengths, corners and choices',
      ],
      useCases: [
        'Glass and metal workshops installing balustrades',
        'Suppliers of railing systems who sell through installers',
        'Builders of terraces, balconies and stairwells',
      ],
      faq: [
        { q: 'What does a railing configurator cost?', a: 'Every configurator is quoted on request. The price depends on the shapes, options and pricing rules you want to offer. Tell us about your system and you get a written quote.' },
        { q: 'Can the price logic stay private?', a: 'Yes. The calculation can run on the server. Visitors see the result, never the formula or your margins.' },
        { q: 'Can customers draw an irregular shape?', a: 'Yes. Besides straight, L and U shapes the customer can place corner points on a grid. Angles and minimum lengths follow the rules of your system.' },
        { q: 'Can I use my own profiles and glass types?', a: 'Yes. We put your own profiles, glass types, colours and prices into the configurator. Nothing is taken from anyone else.' },
      ],
    },
    de: {
      title: 'Geländerkonfigurator',
      metaTitle: 'Geländerkonfigurator für Glasgeländer in 3D · semanu.eu',
      metaDescription: 'Demo eines Geländerkonfigurators: gerade, L, U oder freie Form, Länge pro Seite, Höhe, Montage, Glasart, Profilfarbe und Abschluss, mit Live-Preis.',
      h1: 'Glasgeländer in 3D planen mit einem Geländerkonfigurator.',
      heroSub: 'Ihr Kunde zeichnet die Form von Terrasse oder Treppenauge, gibt Längen und Höhe ein und wählt Glas, Montage und Profilfarbe. Der Preis wird pro Meter live berechnet.',
      introHeading: 'Warum ein Geländerkonfigurator?',
      introBody: 'Ein Geländer rechnet man in Metern, Ecken und Befestigungen. Jedes Projekt braucht eine Kalkulation, bevor der Kunde weiß, ob es ins Budget passt. Ein Konfigurator erledigt diese Kalkulation sofort: Ihr Kunde sieht das Geländer auf dem Grundriss seiner Terrasse und Sie erhalten eine Anfrage mit jeder Länge und Ecke.',
      features: [
        'Gerade Form, L-Form, U-Form oder eine freie Form auf einem Raster',
        'Länge pro Seite und eine Höhe innerhalb Ihrer Grenzen',
        'Montage auf dem Boden, seitlich oder eingelassen',
        'Klares, extra klares, getöntes oder opales Sicherheitsglas',
        'Profilfarben in RAL oder eloxiert',
        'Ohne Abschluss, mit Abdeckprofil oder mit Edelstahlhandlauf',
      ],
      outputs: [
        'Ein Preis pro laufendem Meter mit Zuschlägen für Ecken, Glas und Montage',
        'Anzahl und Breite der Glasfelder automatisch berechnet',
        'Draufsicht und Maße in der 3D-Szene',
        'Eine Angebotsanfrage mit allen Längen, Ecken und Optionen',
      ],
      useCases: [
        'Glas- und Metallbaubetriebe, die Geländer montieren',
        'Anbieter von Geländersystemen, die über Monteure verkaufen',
        'Bauunternehmen für Terrassen, Balkone und Treppenhäuser',
      ],
      faq: [
        { q: 'Was kostet ein Geländerkonfigurator?', a: 'Jeder Konfigurator wird auf Anfrage angeboten. Der Preis hängt von den Formen, Optionen und Preisregeln ab, die Sie anbieten möchten. Erzählen Sie uns von Ihrem System und Sie erhalten ein schriftliches Angebot.' },
        { q: 'Kann die Preislogik geschützt bleiben?', a: 'Ja. Die Berechnung kann auf dem Server laufen. Besucher sehen nur das Ergebnis. Formel und Margen bleiben verborgen.' },
        { q: 'Können Kunden eine unregelmäßige Form zeichnen?', a: 'Ja. Neben geraden Formen, L-Formen und U-Formen kann der Kunde Eckpunkte auf einem Raster setzen. Winkel und Mindestlängen folgen den Regeln Ihres Systems.' },
        { q: 'Kann ich eigene Profile und Glasarten verwenden?', a: 'Ja. Wir hinterlegen Ihre eigenen Profile, Glasarten, Farben und Preise im Konfigurator. Nichts wird von anderen übernommen.' },
      ],
    },
    fr: {
      title: 'Configurateur de garde-corps',
      metaTitle: 'Configurateur de garde-corps en verre en 3D · semanu.eu',
      metaDescription: 'Démo d’un configurateur de garde-corps : forme droite, en L, en U ou libre, longueurs, hauteur, fixation, verre, couleur du profil et main courante.',
      h1: 'Planifiez un garde-corps en verre en 3D avec un configurateur.',
      heroSub: 'Votre client dessine la forme de la terrasse ou de la trémie, saisit les longueurs et la hauteur et choisit le verre, la fixation et la couleur du profil. Le prix est calculé en direct au mètre.',
      introHeading: 'Pourquoi un configurateur de garde-corps ?',
      introBody: 'Un garde-corps se calcule en mètres, en angles et en fixations. Chaque projet demande un calcul avant que le client sache s’il tient dans son budget. Un configurateur fait ce calcul immédiatement : votre client voit le garde-corps sur le plan de sa terrasse et vous recevez une demande avec chaque longueur et chaque angle.',
      features: [
        'Forme droite, en L, en U ou forme libre dessinée sur une grille',
        'Longueur par côté et hauteur dans les limites que vous fixez',
        'Fixation au sol, en applique ou encastrée',
        'Verre de sécurité clair, extra-clair, teinté ou opale',
        'Couleurs de profil RAL ou anodisées',
        'Sans finition haute, avec profil de couverture ou main courante inox',
      ],
      outputs: [
        'Un prix au mètre linéaire avec suppléments pour angles, verre et fixation',
        'Nombre et largeur des panneaux calculés automatiquement',
        'Une vue de dessus et les cotes dans la scène 3D',
        'Une demande de devis avec toutes les longueurs, angles et options',
      ],
      useCases: [
        'Ateliers verre et métal qui posent des garde-corps',
        'Fournisseurs de systèmes de garde-corps qui vendent via des installateurs',
        'Constructeurs de terrasses, balcons et cages d’escalier',
      ],
      faq: [
        { q: 'Combien coûte un configurateur de garde-corps ?', a: 'Chaque configurateur fait l’objet d’un devis sur demande. Le prix dépend des formes, des options et des règles de prix que vous voulez proposer. Parlez-nous de votre système : vous recevez un devis écrit.' },
        { q: 'La logique de prix peut-elle rester confidentielle ?', a: 'Oui. Le calcul peut tourner sur le serveur. Les visiteurs voient le résultat, jamais la formule ni vos marges.' },
        { q: 'Les clients peuvent-ils dessiner une forme irrégulière ?', a: 'Oui. En plus des formes droites, en L et en U, le client peut placer des points d’angle sur une grille. Les angles et longueurs minimales suivent les règles de votre système.' },
        { q: 'Puis-je utiliser mes propres profils et types de verre ?', a: 'Oui. Nous intégrons vos profils, types de verre, couleurs et prix dans le configurateur. Rien n’est repris d’ailleurs.' },
      ],
    },
    es: {
      title: 'Configurador de barandillas',
      metaTitle: 'Configurador de barandillas de vidrio en 3D · semanu.eu',
      metaDescription: 'Demo de un configurador de barandillas: forma recta, en L, en U o libre, longitudes, altura, montaje, tipo de vidrio, color del perfil y pasamanos.',
      h1: 'Planifique una barandilla de vidrio en 3D con un configurador.',
      heroSub: 'Su cliente dibuja la forma de la terraza o del hueco de escalera, introduce las longitudes y la altura y elige vidrio, montaje y color del perfil. El precio se calcula en directo por metro.',
      introHeading: '¿Por qué un configurador de barandillas?',
      introBody: 'Una barandilla se calcula en metros, esquinas y fijaciones. Cada proyecto necesita un cálculo antes de que el cliente sepa si encaja en su presupuesto. Un configurador hace ese cálculo al instante: su cliente ve la barandilla sobre la forma de su terraza y usted recibe una solicitud con cada longitud y cada esquina.',
      features: [
        'Forma recta, en L, en U o libre dibujada sobre una cuadrícula',
        'Longitud por lado y altura dentro de los límites que usted fija',
        'Montaje sobre el suelo, lateral o empotrado',
        'Vidrio de seguridad claro, extraclaro, tintado u opal',
        'Colores de perfil RAL o anodizados',
        'Sin remate, con perfil superior o con pasamanos de acero inoxidable',
      ],
      outputs: [
        'Un precio por metro lineal con recargos por esquinas, vidrio y montaje',
        'Número y ancho de los paneles calculados automáticamente',
        'Una vista superior y medidas en la escena 3D',
        'Una solicitud de presupuesto con todas las longitudes, esquinas y opciones',
      ],
      useCases: [
        'Talleres de vidrio y metal que instalan barandillas',
        'Proveedores de sistemas de barandillas que venden a través de instaladores',
        'Constructores de terrazas, balcones y huecos de escalera',
      ],
      faq: [
        { q: '¿Cuánto cuesta un configurador de barandillas?', a: 'Cada configurador se presupuesta a petición. El precio depende de las formas, opciones y reglas de precio que quiera ofrecer. Cuéntenos su sistema y recibirá un presupuesto por escrito.' },
        { q: '¿Puede la lógica de precios quedar oculta?', a: 'Sí. El cálculo puede ejecutarse en el servidor. Los visitantes ven el resultado, nunca la fórmula ni sus márgenes.' },
        { q: '¿Pueden los clientes dibujar una forma irregular?', a: 'Sí. Además de formas rectas, en L y en U, el cliente puede colocar vértices sobre una cuadrícula. Los ángulos y las longitudes mínimas siguen las reglas de su sistema.' },
        { q: '¿Puedo usar mis propios perfiles y tipos de vidrio?', a: 'Sí. Incorporamos sus perfiles, tipos de vidrio, colores y precios al configurador. No se toma nada de otros.' },
      ],
    },
  },
  gate: {
    nl: {
      title: 'Poortconfigurator',
      metaTitle: 'Poortconfigurator met technische tekening · semanu.eu',
      metaDescription: 'Demo van een poortconfigurator: enkele of dubbele draaipoort, breedte, hoogte, helling, RAL-kleur, palen en motoren, met tekening en stuklijst.',
      h1: 'Configureer een stalen draaipoort in 3D, tot en met de technische tekening.',
      heroSub: 'Uw klant kiest een enkele of dubbele poort, de doorgangsbreedte, hoogte en kleur, de palen en de motorisatie. Dezelfde geometrie levert de stuklijst en de productietekeningen.',
      introHeading: 'Waarom een poortconfigurator?',
      introBody: 'Een poort is metaalwerk op de millimeter: doorgang, helling, palen, scharnieren en motoren bepalen samen de bouw. Met een configurator stelt uw klant dat in 3D samen, terwijl de regels van uw atelier elk resultaat bouwbaar houden. Dezelfde configuratie wordt daarna een tekening en een stuklijst voor uw werkplaats.',
      features: [
        'Enkele of dubbele draaipoort, scharnierzijde links of rechts',
        'Doorgangsbreedte en hoogte in millimeter, afgestemd op het vulraster',
        'Hellende grond, oplopend naar links of rechts',
        'Poedercoatkleuren met fijnstructuur of glad satijn',
        'Palen of bevestiging tegen de muur, op voetplaat of ingebetonneerd',
        'Manueel, vijzelmotoren of ondergrondse motoren en een optionele brievenbuspaal',
      ],
      outputs: [
        'Een technische tekening in PDF met vooraanzicht, bovenaanzicht, isometrie en details',
        'Een stuklijst in PDF en Excel met aantallen en lengtes',
        'Productiefiches per onderdeel',
        'CAD-bestanden in DXF, STEP en GLB uit dezelfde geometrie als het 3D-beeld',
      ],
      useCases: [
        'Metaalateliers die poorten en hekwerk op maat bouwen',
        'Plaatsers van poorten en omheiningen die ter plaatse willen offreren',
        'Fabrikanten die bestellingen rechtstreeks naar productie willen sturen',
      ],
      faq: [
        { q: 'Wat kost een poortconfigurator?', a: 'Elke configurator krijgt een offerte op aanvraag. De prijs hangt af van de productregels, de gewenste uitvoer en de koppelingen met uw systemen. Vertel ons over uw poorten en u krijgt een schriftelijke offerte.' },
        { q: 'Welke bestanden kan de configurator maken?', a: 'Een technische tekening, een stuklijst, productiefiches per onderdeel en CAD-bestanden in DXF, STEP en GLB. Ze komen allemaal uit dezelfde geometrie als het 3D-beeld, dus de maten kloppen altijd.' },
        { q: 'Worden scharnieren en sloten automatisch toegevoegd?', a: 'Ja. Regels bepalen het beslag: een extra scharnier bij hoge vleugels, een slot met krukgarnituur, een valgrendel bij een dubbele poort en een middenstijl bij zeer brede vleugels.' },
        { q: 'Toont de configurator een prijs?', a: 'Dat kiest u zelf. Hij kan een richtprijs tonen of een offerteaanvraag met de volledige configuratie sturen die u zelf prijst.' },
      ],
    },
    en: {
      title: 'Gate configurator',
      metaTitle: 'Gate configurator with technical drawings · semanu.eu',
      metaDescription: 'Gate configurator demo: single or double swing gate, width, height, slope, RAL colour, posts and motors, with a technical drawing and parts list.',
      h1: 'Configure a steel swing gate in 3D, down to the technical drawing.',
      heroSub: 'Your customer chooses a single or double gate, the opening width, height and colour, the posts and the automation. The same geometry produces the parts list and the production drawings.',
      introHeading: 'Why a gate configurator?',
      introBody: 'A gate is metalwork to the millimetre: opening, slope, posts, hinges and motors all affect the build. A configurator lets your customer put that together in 3D while the rules of your workshop keep every result buildable. The same configuration then becomes a drawing and a parts list for your workshop.',
      features: [
        'Single or double swing gate, hinge side left or right',
        'Opening width and height in millimetres, snapped to the infill grid',
        'Ground slope rising to the left or right',
        'Powder coat colours with a fine texture or smooth satin finish',
        'Posts or wall mounting, on a base plate or cast in concrete',
        'Manual, ram motors or underground motors and an optional mailbox post',
      ],
      outputs: [
        'A technical drawing in PDF with front, top, isometric and detail views',
        'A parts list in PDF and Excel with quantities and lengths',
        'Production sheets per part',
        'CAD files in DXF, STEP and GLB from the same geometry as the 3D view',
      ],
      useCases: [
        'Metal workshops building gates and fences to measure',
        'Gate and fence installers who want to quote on the spot',
        'Manufacturers who want orders to go straight to production',
      ],
      faq: [
        { q: 'What does a gate configurator cost?', a: 'Every configurator is quoted on request. The price depends on the product rules, the outputs you need and the links to your systems. Tell us about your gates and you get a written quote.' },
        { q: 'Which files can the configurator generate?', a: 'A technical drawing, a parts list, production sheets per part and CAD files in DXF, STEP and GLB. They all come from the same geometry as the 3D view, so the dimensions always match.' },
        { q: 'Are hinges and locks added automatically?', a: 'Yes. Rules decide the hardware: an extra hinge on tall leaves, a lock with handle set, a drop bolt on a double gate and a middle stile on very wide leaves.' },
        { q: 'Does the configurator show a price?', a: 'That is your choice. It can show an indicative price or send a quote request with the full configuration that you price yourself.' },
      ],
    },
    de: {
      title: 'Torkonfigurator',
      metaTitle: 'Torkonfigurator mit technischer Zeichnung · semanu.eu',
      metaDescription: 'Demo eines Torkonfigurators: Drehtor ein- oder zweiflügelig, Breite, Höhe, Gefälle, RAL-Farbe, Pfosten und Antrieb, mit Zeichnung und Stückliste.',
      h1: 'Stahl-Drehtor in 3D konfigurieren, bis zur technischen Zeichnung.',
      heroSub: 'Ihr Kunde wählt ein- oder zweiflügelig, Durchfahrtsbreite, Höhe und Farbe, Pfosten und Antrieb. Dieselbe Geometrie liefert Stückliste und Fertigungszeichnungen.',
      introHeading: 'Warum ein Torkonfigurator?',
      introBody: 'Ein Tor ist Metallbau auf den Millimeter: Durchfahrt, Gefälle, Pfosten, Scharniere und Antriebe bestimmen gemeinsam die Konstruktion. Mit einem Konfigurator stellt Ihr Kunde das in 3D zusammen, während die Regeln Ihrer Werkstatt jedes Ergebnis baubar halten. Dieselbe Konfiguration wird danach zu Zeichnung und Stückliste für Ihre Fertigung.',
      features: [
        'Ein- oder zweiflügeliges Drehtor, Anschlagseite links oder rechts',
        'Durchfahrtsbreite und Höhe in Millimetern, abgestimmt auf das Füllungsraster',
        'Gefälle, ansteigend nach links oder rechts',
        'Pulverbeschichtung in Feinstruktur oder glattem Satin',
        'Pfosten oder Wandmontage, auf Fußplatte oder einbetoniert',
        'Manuell, Spindelantrieb oder Unterflurantrieb und optionaler Briefkastenpfosten',
      ],
      outputs: [
        'Eine technische Zeichnung als PDF mit Vorderansicht, Draufsicht, Isometrie und Details',
        'Eine Stückliste als PDF und Excel mit Mengen und Längen',
        'Fertigungsblätter pro Bauteil',
        'CAD-Dateien in DXF, STEP und GLB aus derselben Geometrie wie die 3D-Ansicht',
      ],
      useCases: [
        'Metallbaubetriebe, die Tore und Zäune nach Maß bauen',
        'Tor- und Zaunmonteure, die vor Ort anbieten möchten',
        'Hersteller, deren Bestellungen direkt in die Fertigung gehen sollen',
      ],
      faq: [
        { q: 'Was kostet ein Torkonfigurator?', a: 'Jeder Konfigurator wird auf Anfrage angeboten. Der Preis hängt von den Produktregeln, den gewünschten Ausgaben und den Anbindungen an Ihre Systeme ab. Erzählen Sie uns von Ihren Toren und Sie erhalten ein schriftliches Angebot.' },
        { q: 'Welche Dateien kann der Konfigurator erzeugen?', a: 'Eine technische Zeichnung, eine Stückliste, Fertigungsblätter pro Bauteil und CAD-Dateien in DXF, STEP und GLB. Alle stammen aus derselben Geometrie wie die 3D-Ansicht. Die Maße stimmen also immer.' },
        { q: 'Werden Scharniere und Schlösser automatisch ergänzt?', a: 'Ja. Regeln bestimmen die Beschläge: ein zusätzliches Scharnier bei hohen Flügeln, ein Schloss mit Drückergarnitur, ein Bodenriegel beim zweiflügeligen Tor und ein Mittelholm bei sehr breiten Flügeln.' },
        { q: 'Zeigt der Konfigurator einen Preis?', a: 'Das entscheiden Sie. Er kann einen Richtpreis zeigen oder eine Angebotsanfrage mit der vollständigen Konfiguration senden, die Sie selbst kalkulieren.' },
      ],
    },
    fr: {
      title: 'Configurateur de portail',
      metaTitle: 'Configurateur de portail avec plan technique · semanu.eu',
      metaDescription: 'Démo d’un configurateur de portail : battant simple ou double, largeur, hauteur, pente, couleur RAL, poteaux et moteurs, avec plan et nomenclature.',
      h1: 'Configurez un portail battant en acier en 3D, jusqu’au plan technique.',
      heroSub: 'Votre client choisit un portail simple ou double, la largeur de passage, la hauteur et la couleur, les poteaux et la motorisation. La même géométrie produit la nomenclature et les plans de fabrication.',
      introHeading: 'Pourquoi un configurateur de portail ?',
      introBody: 'Un portail, c’est de la métallerie au millimètre : passage, pente, poteaux, charnières et moteurs déterminent ensemble la construction. Avec un configurateur, votre client compose tout cela en 3D tandis que les règles de votre atelier gardent chaque résultat réalisable. La même configuration devient ensuite un plan et une nomenclature pour votre atelier.',
      features: [
        'Portail battant simple ou double, côté charnières à gauche ou à droite',
        'Largeur de passage et hauteur au millimètre, alignées sur la trame du remplissage',
        'Terrain en pente, montant vers la gauche ou la droite',
        'Thermolaquage en finition fine texture ou satin lisse',
        'Poteaux ou fixation au mur, sur platine ou scellés dans le béton',
        'Manuel, moteurs à vérin ou moteurs enterrés et un poteau boîte aux lettres en option',
      ],
      outputs: [
        'Un plan technique en PDF avec vues de face, de dessus, isométrique et détails',
        'Une nomenclature en PDF et Excel avec quantités et longueurs',
        'Des fiches de fabrication par pièce',
        'Des fichiers CAO en DXF, STEP et GLB issus de la même géométrie que la vue 3D',
      ],
      useCases: [
        'Ateliers de métallerie qui fabriquent portails et clôtures sur mesure',
        'Installateurs de portails et clôtures qui veulent chiffrer sur place',
        'Fabricants qui veulent envoyer les commandes directement en production',
      ],
      faq: [
        { q: 'Combien coûte un configurateur de portail ?', a: 'Chaque configurateur fait l’objet d’un devis sur demande. Le prix dépend des règles produit, des sorties souhaitées et des liaisons avec vos systèmes. Parlez-nous de vos portails : vous recevez un devis écrit.' },
        { q: 'Quels fichiers le configurateur peut-il générer ?', a: 'Un plan technique, une nomenclature, des fiches de fabrication par pièce et des fichiers CAO en DXF, STEP et GLB. Tous proviennent de la même géométrie que la vue 3D : les cotes concordent toujours.' },
        { q: 'Les charnières et serrures sont-elles ajoutées automatiquement ?', a: 'Oui. Des règles déterminent la quincaillerie : une charnière supplémentaire sur les vantaux hauts, une serrure avec garniture, un verrou au sol sur un portail double et un montant central sur les vantaux très larges.' },
        { q: 'Le configurateur affiche-t-il un prix ?', a: 'C’est vous qui choisissez. Il peut afficher un prix indicatif ou envoyer une demande de devis avec la configuration complète que vous chiffrez vous-même.' },
      ],
    },
    es: {
      title: 'Configurador de portones',
      metaTitle: 'Configurador de portones con plano técnico · semanu.eu',
      metaDescription: 'Demo de un configurador de portones: batiente de una o dos hojas, ancho, altura, pendiente, color RAL, postes y motores, con plano y lista de piezas.',
      h1: 'Configure un portón batiente de acero en 3D, hasta el plano técnico.',
      heroSub: 'Su cliente elige un portón de una o dos hojas, el ancho de paso, la altura y el color, los postes y la motorización. La misma geometría genera la lista de piezas y los planos de fabricación.',
      introHeading: '¿Por qué un configurador de portones?',
      introBody: 'Un portón es cerrajería al milímetro: paso, pendiente, postes, bisagras y motores determinan juntos la construcción. Con un configurador, su cliente lo compone en 3D mientras las reglas de su taller mantienen cada resultado fabricable. La misma configuración se convierte después en un plano y una lista de piezas para su taller.',
      features: [
        'Portón batiente de una o dos hojas, bisagras a la izquierda o a la derecha',
        'Ancho de paso y altura en milímetros, ajustados a la trama del relleno',
        'Terreno en pendiente, subiendo hacia la izquierda o la derecha',
        'Pintura en polvo con acabado texturizado fino o satinado liso',
        'Postes o fijación a la pared, sobre placa base o empotrados en hormigón',
        'Manual, motores de brazo o motores enterrados y un poste buzón opcional',
      ],
      outputs: [
        'Un plano técnico en PDF con vistas frontal, superior, isométrica y detalles',
        'Una lista de piezas en PDF y Excel con cantidades y longitudes',
        'Fichas de fabricación por pieza',
        'Archivos CAD en DXF, STEP y GLB a partir de la misma geometría que la vista 3D',
      ],
      useCases: [
        'Talleres de cerrajería que fabrican portones y vallas a medida',
        'Instaladores de portones y vallas que quieren presupuestar in situ',
        'Fabricantes que quieren enviar los pedidos directamente a producción',
      ],
      faq: [
        { q: '¿Cuánto cuesta un configurador de portones?', a: 'Cada configurador se presupuesta a petición. El precio depende de las reglas de producto, los resultados que necesita y las conexiones con sus sistemas. Cuéntenos sus portones y recibirá un presupuesto por escrito.' },
        { q: '¿Qué archivos puede generar el configurador?', a: 'Un plano técnico, una lista de piezas, fichas de fabricación por pieza y archivos CAD en DXF, STEP y GLB. Todos salen de la misma geometría que la vista 3D, así que las medidas siempre coinciden.' },
        { q: '¿Se añaden automáticamente bisagras y cerraduras?', a: 'Sí. Unas reglas deciden los herrajes: una bisagra extra en hojas altas, una cerradura con manillas, un pasador de suelo en un portón de dos hojas y un montante central en hojas muy anchas.' },
        { q: '¿Muestra el configurador un precio?', a: 'Usted decide. Puede mostrar un precio indicativo o enviar una solicitud de presupuesto con la configuración completa que usted mismo valora.' },
      ],
    },
  },
};

/** Resolve a demo label for a locale (plain strings such as '3 m' or 'RAL 7016' are universal). */
export function demoLabel(label: Loc | string, locale: ConfLocale): string {
  return typeof label === 'string' ? label : label[locale];
}
