// Content for the Services page (/services) and the Services mega menu.
// Restructured 2026-10 to four services: Consultancy, Workflowautomatisering,
// Maatwerksoftware and 3D-configuratoren. Authored NL-first, then translated to
// EN/DE/FR/ES (2026-10). English is the source for the translations; NL stays
// as the original. House style (every language): no dashes, no comma before a
// coordinating conjunction, Swiss ss (never ß) in German. The literal "amai!" is
// the brand marker rendered as the styled "amai" wordmark by BrandText.

export type ServicesLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

/** Icon key, mapped to an inline SVG in the page/menu. */
export type ServiceIcon =
  | 'websites'
  | 'email'
  | 'automation'
  | 'booking'
  | 'systems'
  | 'ai'
  | 'audit';

export type ServiceSub = {
  title: string;
  short: string;
  explainerTitle: string;
  explainerText: string;
  items: string[];
  benefits: string[];
};

export type Service = {
  id: string;
  icon: ServiceIcon;
  title: string;
  short: string;
  description?: string;
  explainerTitle: string;
  explainerText: string;
  audience: string[];
  builds: string[];
  benefits: string[];
  examples: string[];
  ctaLabel: string;
  ctaHref: string;
  subs?: ServiceSub[];
};

export type ServicesContent = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  eyebrow: string;
  h1: string;
  heroSub: string;
  ctaExplore: string;
  ctaContact: string;
  introLead: string;
  introTitle: string;
  introText: string;
  quickLinksLabel: string;
  forWhoLabel: string;
  buildsLabel: string;
  benefitsLabel: string;
  examplesLabel: string;
  seoGeo: {
    title: string;
    intro: string;
    explainerTitle: string;
    explainerText: string;
    points: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  howTitle: string;
  howIntro: string;
  howSteps: { title: string; text: string }[];
  faqTitle: string;
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalText: string;
  finalCta: string;
  finalCtaSecondary: string;
  services: Service[];
};

const HREF = {
  consultancy: '/kontakt?interest=consultancy',
  automation: '/kontakt?interest=workflow-automation',
  systems: '/kontakt?interest=maatwerksoftware',
  configurator: '/kontakt?interest=3d-configurators',
} as const;

/** URL slug per service id (locale-independent). Internal ids are kept from the
 *  previous structure; only business-systems moved to the maatwerksoftware slug. */
export const SERVICE_SLUG: Record<string, string> = {
  '3d-configurators': '3d-configurators',
  consultancy: 'consultancy',
};
/** Canonical display order (menu, ecosystem, overview, sitemap). The AI-native
 *  business-software page replaced the former Workflowautomatisering and
 *  Maatwerksoftware services (2026-10); those URLs 301 to /services/ai-native. */
export const SERVICE_ORDER = ['3d-configurators', 'ai-native', 'consultancy'] as const;

/** Nav/overview label + one-liner for the AI-native page (its own page is custom
 *  and does not go through the [service] system). NL authored; EN/DE/FR/ES short. */
export const AI_NATIVE_NAV: Record<ServicesLocale, { title: string; short: string }> = {
  nl: { title: 'Bedrijfssoftware', short: 'Software op maat die uw processen verbindt en automatiseert.' },
  en: { title: 'Business software', short: 'Custom software that connects and automates your processes.' },
  de: { title: 'Unternehmenssoftware', short: 'Massgeschneiderte Software, die Ihre Prozesse verbindet und automatisiert.' },
  fr: { title: 'Logiciel d’entreprise', short: 'Logiciel sur mesure qui relie et automatise vos processus.' },
  es: { title: 'Software empresarial', short: 'Software a medida que conecta y automatiza sus procesos.' },
};
export const SERVICE_ID_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_SLUG).map(([id, slug]) => [slug, id]),
);
/** Ordered slugs for routing + sitemap (matches the services display order). */
export const SERVICE_SLUGS = Object.values(SERVICE_SLUG);

// ─────────────────────────────── EN (source) ───────────────────────────────
const enServices: Service[] = [
  {
    id: 'consultancy',
    icon: 'audit',
    title: 'Consultancy',
    short: 'Decide what to digitalise and where AI adds value.',
    description:
      'Independent advice on digitalisation and AI. We analyse your processes and deliver a clear roadmap with priorities.',
    explainerTitle: 'What is digital consultancy?',
    explainerText:
      'Independent advice on how to improve your processes and software with technology. The result is a plan, not software right away.',
    audience: ['business owners', 'CEOs', 'operations managers', 'digital leads'],
    builds: ['Process analysis', 'Digital strategy', 'AI advice', 'Technology choice', 'Digital roadmap'],
    benefits: ['Well founded choices', 'Priorities that hold up', 'Independent advice', 'A roadmap you can execute'],
    examples: ['Digitalisation advice', 'AI feasibility', 'Make or buy assessment'],
    ctaLabel: 'Discuss your digital challenge',
    ctaHref: HREF.consultancy,
  },
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflow automation',
    short: 'Automate repetitive work and connect your systems.',
    description:
      'Automate recurring steps and connect existing systems through integrations and API, with targeted use of AI.',
    explainerTitle: 'What is workflow automation?',
    explainerText:
      'Automatically running or connecting recurring steps in a business process, so staff do less manual work.',
    audience: ['operations managers', 'business owners', 'administration', 'sales teams'],
    builds: ['System integrations', 'CRM and ERP workflows', 'Document processing', 'Data synchronisation', 'AI supported workflows'],
    benefits: ['Less manual work', 'Fewer errors', 'More oversight', 'Systems that work together'],
    examples: ['Lead to CRM', 'Invoice processing', 'Automatic follow up'],
    ctaLabel: 'Let us review your workflow',
    ctaHref: HREF.automation,
  },
  {
    id: 'business-systems',
    icon: 'systems',
    title: 'Custom software',
    short: 'Software built to fit when off the shelf packages do not.',
    description:
      'Web applications, portals and internal tools built to measure, with integrations and attention to maintenance and ownership.',
    explainerTitle: 'What is custom software?',
    explainerText:
      'Software built specifically for your company instead of an off the shelf package, so it matches how you work.',
    audience: ['business owners', 'operations managers', 'digital leads', 'teams with a specific process'],
    builds: ['Internal business applications', 'Customer and partner portals', 'Web applications', 'Integrations', 'Legacy modernisation'],
    benefits: ['Fits your process', 'Connects with your systems', 'Scalable', 'Maintained and adaptable'],
    examples: ['Customer portal', 'Internal tool', 'Replace legacy'],
    ctaLabel: 'Discuss your software question',
    ctaHref: HREF.systems,
  },
  {
    id: '3d-configurators',
    icon: 'systems',
    title: '3D configurators',
    short: 'Make configurable products sellable online.',
    description:
      'Configurators with real time 3D, rules and pricing logic, connected to your webshop, CRM or ERP.',
    explainerTitle: 'What is a 3D product configurator?',
    explainerText:
      'An interactive tool that lets a customer build a product themselves, see it in 3D and get the price straight away. Every option updates the 3D model and the price in real time so there is no back and forth by email. That leaves your team fewer quote requests to process and gives the customer an immediate, concrete answer.',
    audience: ['manufacturers', 'custom builders', 'webshops', 'sales teams'],
    builds: ['Real time 3D', 'Product options and variants', 'Configuration rules', 'Pricing logic', 'Quote and order requests', 'Integrations'],
    benefits: ['Less quoting work', 'More concrete requests', 'Customers configure themselves', 'An instant indicative price'],
    examples: ['Furniture configurator', 'Gate and railing', 'Custom machine'],
    ctaLabel: 'Discuss your product configurator',
    ctaHref: HREF.configurator,
  },
];

// ─────────────────────────────── DE ───────────────────────────────
const deServices: Service[] = [
  {
    id: 'consultancy',
    icon: 'audit',
    title: 'Consultancy',
    short: 'Bestimmen Sie, was zu digitalisieren ist und wo AI Mehrwert bringt.',
    description:
      'Unabhängige Beratung zu Digitalisierung und AI. Wir analysieren Ihre Prozesse und liefern eine klare Roadmap mit Prioritäten.',
    explainerTitle: 'Was ist digitale Beratung?',
    explainerText:
      'Unabhängige Beratung, wie Sie Ihre Prozesse und Software mit Technologie verbessern. Das Ergebnis ist ein Plan, nicht sofort Software.',
    audience: ['Geschäftsführer', 'CEOs', 'Operations Manager', 'Digitalverantwortliche'],
    builds: ['Prozessanalyse', 'Digitale Strategie', 'AI-Beratung', 'Technologiewahl', 'Digitale Roadmap'],
    benefits: ['Fundierte Entscheidungen', 'Prioritäten, die stimmen', 'Unabhängige Beratung', 'Eine Roadmap, die Sie umsetzen können'],
    examples: ['Digitalisierungsberatung', 'AI-Machbarkeit', 'Make or Buy Abwägung'],
    ctaLabel: 'Besprechen Sie Ihre digitale Herausforderung',
    ctaHref: HREF.consultancy,
  },
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflowautomatisierung',
    short: 'Automatisieren Sie wiederkehrende Arbeit und verbinden Sie Ihre Systeme.',
    description:
      'Wiederkehrende Schritte automatisieren und bestehende Systeme über Integrationen und API verbinden, mit gezieltem Einsatz von AI.',
    explainerTitle: 'Was ist Workflowautomatisierung?',
    explainerText:
      'Das automatische Ausführen oder Verbinden wiederkehrender Schritte in einem Geschäftsprozess, damit Mitarbeiter weniger manuelle Arbeit leisten.',
    audience: ['Operations Manager', 'Geschäftsführer', 'Administration', 'Sales Teams'],
    builds: ['Systemintegrationen', 'CRM und ERP Workflows', 'Dokumentenverarbeitung', 'Datensynchronisation', 'AI-gestützte Workflows'],
    benefits: ['Weniger manuelle Arbeit', 'Weniger Fehler', 'Mehr Überblick', 'Systeme, die zusammenarbeiten'],
    examples: ['Lead ins CRM', 'Rechnungsverarbeitung', 'Automatische Nachverfolgung'],
    ctaLabel: 'Lassen Sie uns Ihren Workflow ansehen',
    ctaHref: HREF.automation,
  },
  {
    id: 'business-systems',
    icon: 'systems',
    title: 'Massgeschneiderte Software',
    short: 'Software nach Mass, wenn Standardpakete nicht passen.',
    description:
      'Webanwendungen, Portale und interne Tools nach Mass, mit Integrationen und Blick auf Wartung und Eigentum.',
    explainerTitle: 'Was ist massgeschneiderte Software?',
    explainerText:
      'Software, die speziell für Ihr Unternehmen gebaut wird statt eines fertigen Pakets, damit sie zu Ihrer Arbeitsweise passt.',
    audience: ['Geschäftsführer', 'Operations Manager', 'Digitalverantwortliche', 'Teams mit einem spezifischen Prozess'],
    builds: ['Interne Unternehmensanwendungen', 'Kunden- und Partnerportale', 'Webanwendungen', 'Integrationen', 'Legacy Modernisierung'],
    benefits: ['Passt zu Ihrem Prozess', 'Verbindet sich mit Ihren Systemen', 'Skalierbar', 'Gewartet und anpassbar'],
    examples: ['Kundenportal', 'Internes Tool', 'Legacy ersetzen'],
    ctaLabel: 'Besprechen Sie Ihre Softwarefrage',
    ctaHref: HREF.systems,
  },
  {
    id: '3d-configurators',
    icon: 'systems',
    title: '3D-Konfiguratoren',
    short: 'Machen Sie konfigurierbare Produkte online verkäuflich.',
    description:
      'Konfiguratoren mit Echtzeit 3D, Regeln und Preislogik, verbunden mit Ihrem Webshop, CRM oder ERP.',
    explainerTitle: 'Was ist ein 3D-Produktkonfigurator?',
    explainerText:
      'Ein interaktives Tool, mit dem ein Kunde ein Produkt selbst zusammenstellt, in 3D sieht und sofort den Preis erhält. Jede Auswahl aktualisiert das 3D Modell und den Preis in Echtzeit sodass kein Hin und Her per Email mehr nötig ist. So bleiben für Ihr Team weniger Offertenanfragen zu bearbeiten und der Kunde erhält sofort eine konkrete Antwort.',
    audience: ['Hersteller', 'Massanfertiger', 'Webshops', 'Sales Teams'],
    builds: ['Echtzeit 3D', 'Produktoptionen und Varianten', 'Konfigurationsregeln', 'Preislogik', 'Offerten- und Bestellanfragen', 'Integrationen'],
    benefits: ['Weniger Offertenarbeit', 'Konkretere Anfragen', 'Kunden konfigurieren selbst', 'Sofort ein Richtpreis'],
    examples: ['Möbelkonfigurator', 'Tor und Geländer', 'Massgefertigte Maschine'],
    ctaLabel: 'Besprechen Sie Ihren Produktkonfigurator',
    ctaHref: HREF.configurator,
  },
];

// ─────────────────────────────── FR ───────────────────────────────
const frServices: Service[] = [
  {
    id: 'consultancy',
    icon: 'audit',
    title: 'Consultancy',
    short: 'Déterminez quoi digitaliser et où l’AI apporte de la valeur.',
    description:
      'Conseil indépendant en digitalisation et AI. Nous analysons vos processus et livrons une feuille de route claire avec des priorités.',
    explainerTitle: 'Le conseil digital, c’est quoi?',
    explainerText:
      'Conseil indépendant sur la façon d’améliorer vos processus et logiciels avec la technologie. Le résultat est un plan, pas un logiciel tout de suite.',
    audience: ['dirigeants', 'CEO', 'responsables opérations', 'responsables digitaux'],
    builds: ['Analyse des processus', 'Stratégie digitale', 'Conseil AI', 'Choix technologique', 'Feuille de route digitale'],
    benefits: ['Choix fondés', 'Des priorités justes', 'Conseil indépendant', 'Une feuille de route exécutable'],
    examples: ['Conseil en digitalisation', 'Faisabilité AI', 'Arbitrage make or buy'],
    ctaLabel: 'Parlons de votre défi digital',
    ctaHref: HREF.consultancy,
  },
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Automatisation des workflows',
    short: 'Automatisez le travail répétitif et reliez vos systèmes.',
    description:
      'Automatiser les étapes récurrentes et relier les systèmes existants via des intégrations et une API, avec un usage ciblé de l’AI.',
    explainerTitle: 'L’automatisation des workflows, c’est quoi?',
    explainerText:
      'Exécuter ou relier automatiquement des étapes récurrentes d’un processus métier, pour que les collaborateurs fassent moins de travail manuel.',
    audience: ['responsables opérations', 'dirigeants', 'administration', 'équipes commerciales'],
    builds: ['Intégrations de systèmes', 'Workflows CRM et ERP', 'Traitement de documents', 'Synchronisation de données', 'Workflows assistés par l’AI'],
    benefits: ['Moins de travail manuel', 'Moins d’erreurs', 'Plus de visibilité', 'Des systèmes qui collaborent'],
    examples: ['Lead vers le CRM', 'Traitement des factures', 'Relance automatique'],
    ctaLabel: 'Analysons votre workflow',
    ctaHref: HREF.automation,
  },
  {
    id: 'business-systems',
    icon: 'systems',
    title: 'Logiciel sur mesure',
    short: 'Un logiciel sur mesure quand les solutions standard ne suffisent pas.',
    description:
      'Applications web, portails et outils internes sur mesure, avec des intégrations et une attention à la maintenance et à la propriété.',
    explainerTitle: 'Le logiciel sur mesure, c’est quoi?',
    explainerText:
      'Un logiciel conçu spécifiquement pour votre entreprise plutôt qu’un paquet tout fait, pour qu’il colle à votre façon de travailler.',
    audience: ['dirigeants', 'responsables opérations', 'responsables digitaux', 'équipes avec un processus spécifique'],
    builds: ['Applications métier internes', 'Portails clients et partenaires', 'Applications web', 'Intégrations', 'Modernisation du legacy'],
    benefits: ['Colle à votre processus', 'Se connecte à vos systèmes', 'Évolutif', 'Maintenu et adaptable'],
    examples: ['Portail client', 'Outil interne', 'Remplacer le legacy'],
    ctaLabel: 'Parlons de votre besoin logiciel',
    ctaHref: HREF.systems,
  },
  {
    id: '3d-configurators',
    icon: 'systems',
    title: 'Configurateurs 3D',
    short: 'Rendez vos produits configurables vendables en ligne.',
    description:
      'Des configurateurs avec de la 3D en temps réel, des règles et une logique de prix, reliés à votre boutique, CRM ou ERP.',
    explainerTitle: 'Un configurateur de produit 3D, c’est quoi?',
    explainerText:
      'Un outil interactif qui permet au client de composer son produit, de le voir en 3D et d’obtenir le prix tout de suite. Chaque choix met à jour le modèle 3D et le prix en temps réel donc plus besoin d’échanges par email. Vous avez ainsi moins de demandes de devis à traiter et le client obtient tout de suite une réponse concrète.',
    audience: ['fabricants', 'entreprises sur mesure', 'boutiques en ligne', 'équipes commerciales'],
    builds: ['3D en temps réel', 'Options et variantes de produit', 'Règles de configuration', 'Logique de prix', 'Demandes de devis et de commande', 'Intégrations'],
    benefits: ['Moins de travail de devis', 'Des demandes plus concrètes', 'Les clients configurent en autonomie', 'Un prix indicatif immédiat'],
    examples: ['Configurateur de meubles', 'Portail et balustrade', 'Machine sur mesure'],
    ctaLabel: 'Parlons de votre configurateur produit',
    ctaHref: HREF.configurator,
  },
];

// ─────────────────────────────── ES ───────────────────────────────
const esServices: Service[] = [
  {
    id: 'consultancy',
    icon: 'audit',
    title: 'Consultancy',
    short: 'Defina qué digitalizar y dónde la AI aporta valor.',
    description:
      'Asesoramiento independiente sobre digitalización y AI. Analizamos sus procesos y entregamos una hoja de ruta clara con prioridades.',
    explainerTitle: '¿Qué es la consultoría digital?',
    explainerText:
      'Asesoramiento independiente sobre cómo mejorar sus procesos y software con tecnología. El resultado es un plan, no software de inmediato.',
    audience: ['gerentes', 'CEO', 'responsables de operaciones', 'responsables digitales'],
    builds: ['Análisis de procesos', 'Estrategia digital', 'Asesoramiento en AI', 'Elección tecnológica', 'Hoja de ruta digital'],
    benefits: ['Decisiones fundamentadas', 'Prioridades acertadas', 'Asesoramiento independiente', 'Una hoja de ruta que puede ejecutar'],
    examples: ['Asesoramiento en digitalización', 'Viabilidad de AI', 'Evaluación make or buy'],
    ctaLabel: 'Hablemos de su reto digital',
    ctaHref: HREF.consultancy,
  },
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Automatización de flujos',
    short: 'Automatice el trabajo repetitivo y conecte sus sistemas.',
    description:
      'Automatizar los pasos recurrentes y conectar los sistemas existentes mediante integraciones y API, con un uso específico de la AI.',
    explainerTitle: '¿Qué es la automatización de flujos?',
    explainerText:
      'Ejecutar o conectar automáticamente pasos recurrentes de un proceso de negocio, para que el personal haga menos trabajo manual.',
    audience: ['responsables de operaciones', 'gerentes', 'administración', 'equipos comerciales'],
    builds: ['Integraciones de sistemas', 'Flujos de CRM y ERP', 'Procesamiento de documentos', 'Sincronización de datos', 'Flujos asistidos por AI'],
    benefits: ['Menos trabajo manual', 'Menos errores', 'Más visibilidad', 'Sistemas que colaboran'],
    examples: ['Lead al CRM', 'Procesamiento de facturas', 'Seguimiento automático'],
    ctaLabel: 'Analicemos su flujo de trabajo',
    ctaHref: HREF.automation,
  },
  {
    id: 'business-systems',
    icon: 'systems',
    title: 'Software a medida',
    short: 'Software a medida cuando los paquetes estándar no encajan.',
    description:
      'Aplicaciones web, portales y herramientas internas a medida, con integraciones y atención al mantenimiento y la propiedad.',
    explainerTitle: '¿Qué es el software a medida?',
    explainerText:
      'Software creado específicamente para su empresa en lugar de un paquete cerrado, para que se ajuste a su forma de trabajar.',
    audience: ['gerentes', 'responsables de operaciones', 'responsables digitales', 'equipos con un proceso específico'],
    builds: ['Aplicaciones internas de negocio', 'Portales de clientes y socios', 'Aplicaciones web', 'Integraciones', 'Modernización de legacy'],
    benefits: ['Se ajusta a su proceso', 'Conecta con sus sistemas', 'Escalable', 'Mantenido y adaptable'],
    examples: ['Portal de clientes', 'Herramienta interna', 'Reemplazar legacy'],
    ctaLabel: 'Hablemos de su necesidad de software',
    ctaHref: HREF.systems,
  },
  {
    id: '3d-configurators',
    icon: 'systems',
    title: 'Configuradores 3D',
    short: 'Haga vendibles en línea sus productos configurables.',
    description:
      'Configuradores con 3D en tiempo real, reglas y lógica de precios, conectados a su tienda, CRM o ERP.',
    explainerTitle: '¿Qué es un configurador de producto 3D?',
    explainerText:
      'Una herramienta interactiva con la que el cliente compone un producto, lo ve en 3D y obtiene el precio al instante. Cada opción actualiza el modelo 3D y el precio en tiempo real así que no hacen falta idas y venidas por email. Así tiene menos solicitudes de presupuesto que gestionar y el cliente recibe al instante una respuesta concreta.',
    audience: ['fabricantes', 'empresas a medida', 'tiendas en línea', 'equipos comerciales'],
    builds: ['3D en tiempo real', 'Opciones y variantes de producto', 'Reglas de configuración', 'Lógica de precios', 'Solicitudes de presupuesto y pedido', 'Integraciones'],
    benefits: ['Menos trabajo de presupuestos', 'Solicitudes más concretas', 'Los clientes configuran por su cuenta', 'Un precio orientativo inmediato'],
    examples: ['Configurador de muebles', 'Portón y barandilla', 'Máquina a medida'],
    ctaLabel: 'Hablemos de su configurador de producto',
    ctaHref: HREF.configurator,
  },
];

// ─────────────────────────────── NL (original) ───────────────────────────────
const nlServices: Service[] = [
  {
    id: 'consultancy',
    icon: 'audit',
    title: 'Consultancy',
    short: 'Bepaal wat u moet digitaliseren en waar AI waarde oplevert.',
    description:
      'Onafhankelijk advies over digitalisering en AI. We analyseren uw processen en leveren een heldere roadmap met prioriteiten.',
    explainerTitle: 'Wat is digitale consultancy?',
    explainerText:
      'Onafhankelijk advies over hoe u uw processen en software kunt verbeteren met technologie. Het resultaat is een plan, niet meteen software.',
    audience: ['zaakvoerders', "CEO's", 'operations managers', 'digitaal verantwoordelijken'],
    builds: ['Procesanalyse', 'Digitale strategie', 'AI-advies', 'Technologiekeuze', 'Digitale roadmap'],
    benefits: ['Onderbouwde keuzes', 'Prioriteiten die kloppen', 'Onafhankelijk advies', 'Een roadmap die u kunt uitvoeren'],
    examples: ['Digitaliseringsadvies', 'AI-haalbaarheid', 'Make or buy afweging'],
    ctaLabel: 'Bespreek uw digitale uitdaging',
    ctaHref: HREF.consultancy,
  },
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflowautomatisering',
    short: 'Automatiseer terugkerend werk en verbind uw systemen.',
    description:
      'Terugkerende stappen automatiseren en bestaande systemen verbinden via integraties en API, met gerichte inzet van AI.',
    explainerTitle: 'Wat is workflowautomatisering?',
    explainerText:
      'Het automatisch uitvoeren of verbinden van terugkerende stappen in een bedrijfsproces, zodat medewerkers minder manueel werk doen.',
    audience: ['operations managers', 'zaakvoerders', 'administratie', 'sales teams'],
    builds: ['Systeemintegraties', 'CRM en ERP workflows', 'Documentverwerking', 'Datasynchronisatie', 'AI-ondersteunde workflows'],
    benefits: ['Minder manueel werk', 'Minder fouten', 'Meer overzicht', 'Systemen die samenwerken'],
    examples: ['Lead naar CRM', 'Factuurverwerking', 'Automatische opvolging'],
    ctaLabel: 'Laat ons uw workflow bekijken',
    ctaHref: HREF.automation,
  },
  {
    id: 'business-systems',
    icon: 'systems',
    title: 'Maatwerksoftware',
    short: 'Software op maat wanneer standaardpakketten niet passen.',
    description:
      'Webapplicaties, portalen en interne tools op maat, met integraties en oog voor onderhoud en eigendom.',
    explainerTitle: 'Wat is maatwerksoftware?',
    explainerText:
      'Software die specifiek voor uw bedrijf wordt gebouwd in plaats van een kant-en-klaar pakket, zodat ze aansluit op hoe u werkt.',
    audience: ['zaakvoerders', 'operations managers', 'digitaal verantwoordelijken', 'teams met een specifiek proces'],
    builds: ['Interne bedrijfsapplicaties', 'Klant- en partnerportalen', 'Webapplicaties', 'Integraties', 'Legacy modernisering'],
    benefits: ['Sluit aan op uw proces', 'Koppelt met uw systemen', 'Schaalbaar', 'Onderhouden en aanpasbaar'],
    examples: ['Klantenportaal', 'Interne tool', 'Legacy vervangen'],
    ctaLabel: 'Bespreek uw softwarevraagstuk',
    ctaHref: HREF.systems,
  },
  {
    id: '3d-configurators',
    icon: 'systems',
    title: '3D-configuratoren',
    short: 'Maak complexe producten eenvoudig online verkoopbaar.',
    description:
      'Configuratoren met realtime 3D, regels en prijslogica, gekoppeld aan uw webshop, CRM of ERP.',
    explainerTitle: 'Wat is een 3D-productconfigurator?',
    explainerText:
      'Een interactieve tool waarmee een klant een product zelf samenstelt, in 3D ziet en meteen de prijs krijgt. Elke keuze werkt het 3D model en de prijs meteen bij zodat heen en weer mailen niet meer nodig is. Zo blijven er voor uw team minder offerteaanvragen over om te verwerken en krijgt de klant meteen een concreet antwoord.\n\nUw productieregels zitten rechtstreeks ingebouwd zodat een klant alleen combinaties kan kiezen die technisch haalbaar en maakbaar zijn. Onmogelijke of onrendabele samenstellingen komen zo nooit in uw productie terecht. Wat de klant bestelt kan u dus altijd effectief maken met de juiste afmetingen, materialen en opties.',
    audience: ['fabrikanten', 'maatwerkbedrijven', 'webshops', 'sales teams'],
    builds: ['Realtime 3D', 'Productopties en varianten', 'Configuratieregels', 'Prijslogica', 'Offerte- en orderaanvragen', 'Integraties'],
    benefits: ['Minder offertewerk', 'Concretere aanvragen', 'Klanten configureren zelf', 'Meteen een richtprijs'],
    examples: ['Meubelconfigurator', 'Poort en balustrade', 'Machine op maat'],
    ctaLabel: 'Bespreek uw productconfigurator',
    ctaHref: HREF.configurator,
  },
];

type ContentFields = Omit<ServicesContent, 'services'>;

function build(svc: Service[], f: ContentFields): ServicesContent {
  // SERVICE_ORDER may contain ids without a full Service entry (e.g. 'ai-native',
  // whose page is custom and lives outside this [service] system). Those are not
  // part of the content services list, so drop them.
  const services = SERVICE_ORDER.map((id) => svc.find((s) => s.id === id)).filter(
    (s): s is Service => Boolean(s),
  );
  return { ...f, services };
}

const enFields: ContentFields = {
  metaTitle: 'Services for Swiss SMEs · amai.ch',
  metaDescription:
    'Consultancy, workflow automation, custom software and 3D configurators for Swiss SMEs. amai! digitalises your processes with AI as the engine.',
  ogTitle: 'Digital services for Swiss SMEs',
  ogDescription:
    'From strategic advice to automation, custom software and 3D configurators. amai! is the digital partner for Swiss SMEs.',
  eyebrow: 'What we do',
  h1: 'Four services that move your business forward digitally.',
  heroSub:
    'amai! is the digital partner for Swiss SMEs. From strategic advice to automation, custom software and 3D configurators, with AI as the engine.',
  ctaExplore: 'Explore services',
  ctaContact: 'Discuss your project',
  introTitle: 'What does amai! do?',
  introText:
    'amai! helps Swiss SMEs make their processes, software and digital operations smarter. We combine strategic advice, technology, automation and AI, where it is demonstrably useful.',
  introLead:
    'amai! brings advice, automation and custom work together in one partner. You start with one clear need and build from there.',
  quickLinksLabel: 'Jump to a service',
  forWhoLabel: 'For whom',
  buildsLabel: 'What amai! can build or set up',
  benefitsLabel: 'Benefits',
  examplesLabel: 'Examples',
  seoGeo: {
    title: 'Built for search, AI discoverability and real customers',
    intro:
      'A modern website has to be clear for people, search engines and AI systems. amai! structures your content so customers understand what you offer and search engines can read it correctly.',
    explainerTitle: 'What is GEO?',
    explainerText:
      'GEO stands for Generative Engine Optimisation. It helps AI search systems understand your business, your services and your expertise so they can describe and recommend you more accurately.',
    points: ['clear service structure', 'understandable explanations', 'strong internal links', 'metadata and structured data', 'FAQ content', 'SEO and GEO friendly', 'content that answers real customer questions'],
    ctaLabel: 'Request advice',
    ctaHref: '/kontakt',
  },
  howTitle: 'How these services work together',
  howIntro:
    'You do not need everything at once. Most companies start with one clear need. amai! helps you step by step.',
  howSteps: [
    { title: 'Decide what matters', text: 'Consultancy maps your processes and determines where digitalisation and AI add value.' },
    { title: 'Connect and automate', text: 'Workflow automation removes repetitive work and connects your existing systems.' },
    { title: 'Build what is missing', text: 'Custom software fills the gaps where off the shelf packages fall short.' },
    { title: 'Sell and configure', text: '3D configurators make configurable products sellable online.' },
  ],
  faqTitle: 'Questions about our services',
  faq: [
    { q: 'Which services does amai! offer?', a: 'Consultancy, workflow automation, custom software and 3D configurators. Together they help you decide, connect, build and sell.' },
    { q: 'Do I have to take everything at once?', a: 'No. Most companies start with one clear need, often an advisory track. From there they build further.' },
    { q: 'Do you always use AI?', a: 'No. AI is a means, not a goal. We use it where it is demonstrably useful and choose classic technology where that fits better.' },
    { q: 'What is GEO?', a: 'GEO stands for Generative Engine Optimisation. It helps AI search systems understand your business, your services and your expertise so they can describe and recommend you more accurately.' },
  ],
  finalTitle: 'Not sure what your business needs?',
  finalText:
    'Tell us briefly what you need and we help you understand what matters first and what can wait.',
  finalCta: 'Discuss your project',
  finalCtaSecondary: 'Get in touch',
};

const deFields: ContentFields = {
  metaTitle: 'Dienstleistungen für Schweizer KMU · amai.ch',
  metaDescription:
    'Consultancy, Workflowautomatisierung, massgeschneiderte Software und 3D-Konfiguratoren für Schweizer KMU. amai! digitalisiert Ihre Prozesse mit AI als Motor.',
  ogTitle: 'Digitale Dienstleistungen für Schweizer KMU',
  ogDescription:
    'Von strategischer Beratung bis Automatisierung, massgeschneiderte Software und 3D-Konfiguratoren. amai! ist der digitale Partner für Schweizer KMU.',
  eyebrow: 'Was wir tun',
  h1: 'Vier Dienstleistungen, die Ihr Unternehmen digital voranbringen.',
  heroSub:
    'amai! ist der digitale Partner für Schweizer KMU. Von strategischer Beratung bis Automatisierung, massgeschneiderte Software und 3D-Konfiguratoren, mit AI als Motor.',
  ctaExplore: 'Dienstleistungen entdecken',
  ctaContact: 'Ihr Projekt besprechen',
  introTitle: 'Was macht amai!?',
  introText:
    'amai! hilft Schweizer KMU, ihre Prozesse, Software und digitale Abläufe intelligenter zu machen. Wir kombinieren strategische Beratung, Technologie, Automatisierung und AI, wo es nachweisbar nützlich ist.',
  introLead:
    'amai! bringt Beratung, Automatisierung und Massarbeit in einem Partner zusammen. Sie starten mit einem klaren Bedarf und bauen von dort weiter.',
  quickLinksLabel: 'Zu einer Dienstleistung',
  forWhoLabel: 'Für wen',
  buildsLabel: 'Was amai! bauen oder aufsetzen kann',
  benefitsLabel: 'Vorteile',
  examplesLabel: 'Beispiele',
  seoGeo: {
    title: 'Gebaut für Suche, AI Auffindbarkeit und echte Kunden',
    intro:
      'Eine moderne Website muss für Menschen, Suchmaschinen und AI Systeme klar sein. amai! strukturiert Ihre Inhalte, damit Kunden verstehen, was Sie anbieten und Suchmaschinen sie korrekt lesen können.',
    explainerTitle: 'Was ist GEO?',
    explainerText:
      'GEO steht für Generative Engine Optimisation. Es hilft AI Suchsystemen, Ihr Unternehmen, Ihre Dienstleistungen und Ihre Expertise zu verstehen, damit sie Sie genauer beschreiben und empfehlen können.',
    points: ['klare Dienstleistungsstruktur', 'verständliche Erklärungen', 'starke interne Links', 'Metadaten und strukturierte Daten', 'FAQ Inhalte', 'SEO und GEO freundlich', 'Inhalte, die echte Kundenfragen beantworten'],
    ctaLabel: 'Beratung anfragen',
    ctaHref: '/kontakt',
  },
  howTitle: 'Wie diese Dienstleistungen zusammenwirken',
  howIntro:
    'Sie brauchen nicht alles auf einmal. Die meisten Unternehmen starten mit einem klaren Bedarf. amai! hilft Ihnen Schritt für Schritt.',
  howSteps: [
    { title: 'Bestimmen, was zählt', text: 'Consultancy bildet Ihre Prozesse ab und bestimmt, wo Digitalisierung und AI Mehrwert bringen.' },
    { title: 'Verbinden und automatisieren', text: 'Workflowautomatisierung nimmt wiederkehrende Arbeit ab und verbindet Ihre bestehenden Systeme.' },
    { title: 'Bauen, was fehlt', text: 'Massgeschneiderte Software ergänzt dort, wo Standardpakete zu kurz greifen.' },
    { title: 'Verkaufen und konfigurieren', text: '3D-Konfiguratoren machen konfigurierbare Produkte online verkäuflich.' },
  ],
  faqTitle: 'Fragen zu unseren Dienstleistungen',
  faq: [
    { q: 'Welche Dienstleistungen bietet amai!?', a: 'Consultancy, Workflowautomatisierung, massgeschneiderte Software und 3D-Konfiguratoren. Zusammen helfen sie Ihnen zu bestimmen, zu verbinden, zu bauen und zu verkaufen.' },
    { q: 'Muss ich alles auf einmal nehmen?', a: 'Nein. Die meisten Unternehmen starten mit einem klaren Bedarf, oft einem Beratungstrack. Von dort bauen sie weiter.' },
    { q: 'Setzen Sie immer AI ein?', a: 'Nein. AI ist ein Mittel, kein Ziel. Wir setzen es ein, wo es nachweisbar nützlich ist und wählen klassische Technologie, wo sie besser passt.' },
    { q: 'Was ist GEO?', a: 'GEO steht für Generative Engine Optimisation. Es hilft AI Suchsystemen, Ihr Unternehmen, Ihre Dienstleistungen und Ihre Expertise zu verstehen, damit sie Sie genauer beschreiben und empfehlen können.' },
  ],
  finalTitle: 'Nicht sicher, was Ihr Unternehmen braucht?',
  finalText:
    'Sagen Sie uns kurz, was Sie brauchen und wir helfen Ihnen zu verstehen, was zuerst zählt und was warten kann.',
  finalCta: 'Ihr Projekt besprechen',
  finalCtaSecondary: 'Kontakt aufnehmen',
};

const frFields: ContentFields = {
  metaTitle: 'Services pour PME suisses · amai.ch',
  metaDescription:
    'Consultancy, automatisation des workflows, logiciels sur mesure et configurateurs 3D pour PME suisses. amai! digitalise vos processus avec l’AI comme moteur.',
  ogTitle: 'Services digitaux pour PME suisses',
  ogDescription:
    'Du conseil stratégique à l’automatisation, aux logiciels sur mesure et aux configurateurs 3D. amai! est le partenaire digital des PME suisses.',
  eyebrow: 'Ce que nous faisons',
  h1: 'Quatre services qui font avancer votre entreprise sur le plan digital.',
  heroSub:
    'amai! est le partenaire digital des PME suisses. Du conseil stratégique à l’automatisation, aux logiciels sur mesure et aux configurateurs 3D, avec l’AI comme moteur.',
  ctaExplore: 'Découvrir les services',
  ctaContact: 'Parler de votre projet',
  introTitle: 'Que fait amai!?',
  introText:
    'amai! aide les PME suisses à rendre leurs processus, leurs logiciels et leur fonctionnement digital plus intelligents. Nous combinons conseil stratégique, technologie, automatisation et AI, là où c’est réellement utile.',
  introLead:
    'amai! réunit conseil, automatisation et sur mesure chez un seul partenaire. Vous démarrez avec un besoin clair et construisez à partir de là.',
  quickLinksLabel: 'Vers un service',
  forWhoLabel: 'Pour qui',
  buildsLabel: 'Ce que amai! peut construire ou mettre en place',
  benefitsLabel: 'Avantages',
  examplesLabel: 'Exemples',
  seoGeo: {
    title: 'Conçu pour la recherche, la visibilité AI et de vrais clients',
    intro:
      'Un site moderne doit être clair pour les personnes, les moteurs de recherche et les systèmes AI. amai! structure votre contenu pour que les clients comprennent votre offre et que les moteurs de recherche la lisent correctement.',
    explainerTitle: 'GEO, c’est quoi?',
    explainerText:
      'GEO signifie Generative Engine Optimisation. Cela aide les systèmes de recherche AI à comprendre votre entreprise, vos services et votre expertise pour vous décrire et vous recommander plus précisément.',
    points: ['structure de services claire', 'explications compréhensibles', 'liens internes solides', 'métadonnées et données structurées', 'contenu FAQ', 'adapté au SEO et au GEO', 'du contenu qui répond aux vraies questions des clients'],
    ctaLabel: 'Demander conseil',
    ctaHref: '/kontakt',
  },
  howTitle: 'Comment ces services fonctionnent ensemble',
  howIntro:
    'Vous n’avez pas besoin de tout en même temps. La plupart des entreprises démarrent avec un besoin clair. amai! vous aide pas à pas.',
  howSteps: [
    { title: 'Déterminer ce qui compte', text: 'Le conseil cartographie vos processus et détermine où la digitalisation et l’AI apportent de la valeur.' },
    { title: 'Relier et automatiser', text: 'L’automatisation des workflows supprime le travail répétitif et relie vos systèmes existants.' },
    { title: 'Construire ce qui manque', text: 'Le logiciel sur mesure complète là où les solutions standard sont insuffisantes.' },
    { title: 'Vendre et configurer', text: 'Les configurateurs 3D rendent les produits configurables vendables en ligne.' },
  ],
  faqTitle: 'Questions sur nos services',
  faq: [
    { q: 'Quels services propose amai!?', a: 'Consultancy, automatisation des workflows, logiciels sur mesure et configurateurs 3D. Ensemble, ils vous aident à déterminer, relier, construire et vendre.' },
    { q: 'Vous devez tout prendre en même temps?', a: 'Non. La plupart des entreprises démarrent avec un besoin clair, souvent une mission de conseil. À partir de là, elles construisent.' },
    { q: 'Vous utilisez toujours l’AI?', a: 'Non. l’AI est un moyen, pas un but. Nous l’utilisons là où elle est réellement utile et choisissons une technologie classique là où elle convient mieux.' },
    { q: 'GEO, c’est quoi?', a: 'GEO signifie Generative Engine Optimisation. Cela aide les systèmes de recherche AI à comprendre votre entreprise, vos services et votre expertise pour vous décrire et vous recommander plus précisément.' },
  ],
  finalTitle: 'Vous ne savez pas ce dont votre entreprise a besoin?',
  finalText:
    'Dites nous brièvement ce dont vous avez besoin et nous vous aidons à comprendre ce qui compte d’abord et ce qui peut attendre.',
  finalCta: 'Parler de votre projet',
  finalCtaSecondary: 'Nous contacter',
};

const esFields: ContentFields = {
  metaTitle: 'Servicios para pymes suizas · amai.ch',
  metaDescription:
    'Consultancy, automatización de flujos, software a medida y configuradores 3D para pymes suizas. amai! digitaliza sus procesos con la AI como motor.',
  ogTitle: 'Servicios digitales para pymes suizas',
  ogDescription:
    'Desde el asesoramiento estratégico hasta la automatización, el software a medida y los configuradores 3D. amai! es el socio digital para pymes suizas.',
  eyebrow: 'Lo que hacemos',
  h1: 'Cuatro servicios que impulsan su empresa en lo digital.',
  heroSub:
    'amai! es el socio digital para pymes suizas. Desde el asesoramiento estratégico hasta la automatización, el software a medida y los configuradores 3D, con la AI como motor.',
  ctaExplore: 'Descubrir los servicios',
  ctaContact: 'Hablar de su proyecto',
  introTitle: '¿Qué hace amai!?',
  introText:
    'amai! ayuda a las pymes suizas a hacer más inteligentes sus procesos, su software y su funcionamiento digital. Combinamos asesoramiento estratégico, tecnología, automatización y AI, donde resulta demostrablemente útil.',
  introLead:
    'amai! reúne asesoramiento, automatización y trabajo a medida en un solo socio. Empieza con una necesidad clara y construye a partir de ahí.',
  quickLinksLabel: 'Ir a un servicio',
  forWhoLabel: 'Para quién',
  buildsLabel: 'Lo que amai! puede construir o poner en marcha',
  benefitsLabel: 'Ventajas',
  examplesLabel: 'Ejemplos',
  seoGeo: {
    title: 'Diseñado para la búsqueda, la visibilidad en AI y clientes reales',
    intro:
      'Un sitio web moderno debe ser claro para las personas, los motores de búsqueda y los sistemas de AI. amai! estructura su contenido para que los clientes entiendan lo que ofrece y los motores de búsqueda lo lean correctamente.',
    explainerTitle: '¿Qué es GEO?',
    explainerText:
      'GEO significa Generative Engine Optimisation. Ayuda a los sistemas de búsqueda de AI a entender su empresa, sus servicios y su experiencia para describirle y recomendarle con más precisión.',
    points: ['estructura de servicios clara', 'explicaciones comprensibles', 'enlaces internos sólidos', 'metadatos y datos estructurados', 'contenido de FAQ', 'apto para SEO y GEO', 'contenido que responde a preguntas reales de clientes'],
    ctaLabel: 'Solicitar asesoramiento',
    ctaHref: '/kontakt',
  },
  howTitle: 'Cómo funcionan juntos estos servicios',
  howIntro:
    'No necesita todo a la vez. La mayoría de las empresas empiezan con una necesidad clara. amai! le ayuda paso a paso.',
  howSteps: [
    { title: 'Definir lo que importa', text: 'La consultoría mapea sus procesos y determina dónde la digitalización y la AI aportan valor.' },
    { title: 'Conectar y automatizar', text: 'La automatización de flujos elimina el trabajo repetitivo y conecta sus sistemas existentes.' },
    { title: 'Construir lo que falta', text: 'El software a medida completa donde los paquetes estándar se quedan cortos.' },
    { title: 'Vender y configurar', text: 'Los configuradores 3D hacen vendibles en línea los productos configurables.' },
  ],
  faqTitle: 'Preguntas sobre nuestros servicios',
  faq: [
    { q: '¿Qué servicios ofrece amai!?', a: 'Consultancy, automatización de flujos, software a medida y configuradores 3D. Juntos le ayudan a definir, conectar, construir y vender.' },
    { q: '¿Tengo que contratarlo todo a la vez?', a: 'No. La mayoría de las empresas empiezan con una necesidad clara, a menudo un proyecto de asesoramiento. A partir de ahí construyen.' },
    { q: '¿Usan siempre AI?', a: 'No. La AI es un medio, no un fin. La usamos donde resulta demostrablemente útil y elegimos tecnología clásica donde encaja mejor.' },
    { q: '¿Qué es GEO?', a: 'GEO significa Generative Engine Optimisation. Ayuda a los sistemas de búsqueda de AI a entender su empresa, sus servicios y su experiencia para describirle y recomendarle con más precisión.' },
  ],
  finalTitle: '¿No sabe qué necesita su empresa?',
  finalText:
    'Cuéntenos brevemente qué necesita y le ayudamos a entender qué importa primero y qué puede esperar.',
  finalCta: 'Hablar de su proyecto',
  finalCtaSecondary: 'Contactar',
};

const nlFields: ContentFields = {
  metaTitle: 'Diensten voor Zwitserse kmo · amai.ch',
  metaDescription:
    'Consultancy, workflowautomatisering, maatwerksoftware en 3D-configuratoren voor Zwitserse kmo. amai! digitaliseert uw processen met AI als motor.',
  ogTitle: 'Digitale diensten voor Zwitserse kmo',
  ogDescription:
    'Van strategisch advies tot automatisering, maatwerksoftware en 3D-configuratoren. amai! is de digitale partner voor Zwitserse kmo.',
  eyebrow: 'Wat we doen',
  h1: 'Vier diensten die uw bedrijf digitaal vooruit helpen.',
  heroSub:
    'amai! is de digitale partner voor Zwitserse kmo. Van strategisch advies tot automatisering, maatwerksoftware en 3D-configuratoren, met AI als motor.',
  ctaExplore: 'Diensten ontdekken',
  ctaContact: 'Uw project bespreken',
  introTitle: 'Wat doet amai!?',
  introText:
    'amai! helpt Zwitserse kmo hun processen, software en digitale werking slimmer te maken. We combineren strategisch advies, technologie, automatisering en AI, waar het aantoonbaar nuttig is.',
  introLead:
    'amai! brengt advies, automatisering en maatwerk samen in één partner. U start met één duidelijke behoefte en bouwt van daaruit verder.',
  quickLinksLabel: 'Naar een dienst',
  forWhoLabel: 'Voor wie',
  buildsLabel: 'Wat amai! kan bouwen of opzetten',
  benefitsLabel: 'Voordelen',
  examplesLabel: 'Voorbeelden',
  seoGeo: {
    title: 'Gebouwd voor zoekopdrachten, AI vindbaarheid en echte klanten',
    intro:
      'Een moderne website moet duidelijk zijn voor mensen, zoekmachines en AI systemen. amai! structureert uw inhoud zodat klanten begrijpen wat u aanbiedt en zoekmachines het correct kunnen lezen.',
    explainerTitle: 'Wat is GEO?',
    explainerText:
      'GEO staat voor Generative Engine Optimisation. Het helpt AI zoeksystemen om uw bedrijf, uw diensten en uw expertise te begrijpen zodat ze u nauwkeuriger kunnen beschrijven en aanbevelen.',
    points: ['duidelijke dienstenstructuur', 'begrijpelijke uitleg', 'sterke interne links', 'metadata en gestructureerde data', 'FAQ inhoud', 'SEO en GEO vriendelijk', 'inhoud die echte klantvragen beantwoordt'],
    ctaLabel: 'Advies aanvragen',
    ctaHref: '/kontakt',
  },
  howTitle: 'Hoe deze diensten samenwerken',
  howIntro:
    'U hebt niet alles tegelijk nodig. De meeste bedrijven starten met één duidelijke behoefte. amai! helpt u stap voor stap.',
  howSteps: [
    { title: 'Bepalen wat telt', text: 'Consultancy brengt uw processen in kaart en bepaalt waar digitalisering en AI waarde opleveren.' },
    { title: 'Verbinden en automatiseren', text: 'Workflowautomatisering neemt terugkerend werk weg en koppelt uw bestaande systemen.' },
    { title: 'Bouwen wat ontbreekt', text: 'Maatwerksoftware vult aan waar standaardpakketten tekortschieten.' },
    { title: 'Verkopen en configureren', text: '3D-configuratoren maken configureerbare producten online verkoopbaar.' },
  ],
  faqTitle: 'Vragen over onze diensten',
  faq: [
    { q: 'Welke diensten biedt amai!?', a: 'Consultancy, workflowautomatisering, maatwerksoftware en 3D-configuratoren. Samen helpen ze u bepalen, verbinden, bouwen en verkopen.' },
    { q: 'Moet ik alles tegelijk afnemen?', a: 'Nee. De meeste bedrijven starten met één duidelijke behoefte, vaak een adviestraject. Van daaruit bouwen ze verder.' },
    { q: 'Gebruiken jullie altijd AI?', a: 'Nee. AI is een middel, geen doel. We zetten het in waar het aantoonbaar nuttig is en kiezen klassieke technologie waar die beter past.' },
    { q: 'Wat is GEO?', a: 'GEO staat voor Generative Engine Optimisation. Het helpt AI zoeksystemen om uw bedrijf, uw diensten en uw expertise te begrijpen zodat ze u nauwkeuriger kunnen beschrijven en aanbevelen.' },
  ],
  finalTitle: 'Niet zeker wat uw bedrijf nodig heeft?',
  finalText:
    'Vertel ons kort wat u nodig hebt en we helpen u begrijpen wat eerst telt en wat kan wachten.',
  finalCta: 'Uw project bespreken',
  finalCtaSecondary: 'Contact opnemen',
};

export const SERVICES: Record<ServicesLocale, ServicesContent> = {
  en: build(enServices, enFields),
  de: build(deServices, deFields),
  fr: build(frServices, frFields),
  es: build(esServices, esFields),
  nl: build(nlServices, nlFields),
};

export function serviceLinks(locale: ServicesLocale) {
  const byId = Object.fromEntries(SERVICES[locale].services.map((s) => [s.id, s] as const));
  return SERVICE_ORDER.map((id) => {
    if (id === 'ai-native') {
      const ai = AI_NATIVE_NAV[locale];
      return {
        id: 'ai-native',
        slug: 'ai-native',
        title: ai.title,
        short: ai.short,
        description: ai.short,
        icon: 'systems' as ServiceIcon,
        href: '/services/ai-native',
      };
    }
    const s = byId[id];
    return {
      id: s.id,
      slug: SERVICE_SLUG[s.id] ?? s.id,
      title: s.title,
      short: s.short,
      description: s.description ?? s.short,
      icon: s.icon,
      href: `/services/${SERVICE_SLUG[s.id] ?? s.id}`,
    };
  });
}

/** Look up a single service by its URL slug, for its dedicated page. */
export function serviceBySlug(locale: ServicesLocale, slug: string) {
  const id = SERVICE_ID_BY_SLUG[slug];
  if (!id) return null;
  const content = SERVICES[locale];
  const service = content.services.find((s) => s.id === id);
  return service ? { service, content } : null;
}
