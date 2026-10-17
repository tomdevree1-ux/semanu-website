// Content for the Services page (/services) and the Services mega menu.
// Restructured 2026-10: the public services are 3D-configuratoren and AI-native
// bedrijfssoftware (/services/business-software, which absorbed Workflowautomatisering and
// Maatwerksoftware); Consultancy was dropped. Authored NL-first, then translated
// to EN/DE/FR/ES. House style (every language): no dashes, no comma before a
// coordinating conjunction, standard German spelling (ß) in German. The literal "semanu" is
// the brand marker rendered as the styled "semanu" wordmark by BrandText.

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
  automation: '/contact?interest=business-software',
  systems: '/contact?interest=business-software',
  configurator: '/contact?interest=3d-configurators',
} as const;

/** URL slug per service id (locale-independent). Internal ids are kept from the
 *  previous structure; only business-systems moved to the maatwerksoftware slug. */
export const SERVICE_SLUG: Record<string, string> = {
  '3d-configurators': '3d-configurators',
};
/** Canonical display order (menu, ecosystem, overview, sitemap). The AI-native
 *  business-software page replaced the former Workflowautomatisering and
 *  Maatwerksoftware services (2026-10); those URLs 301 to /services/business-software.
 *  Consultancy is no longer offered (2026-10); /services/consultancy 301s too. */
export const SERVICE_ORDER = ['3d-configurators', 'ai-native'] as const;

/** Nav/overview label + one-liner for the AI-native page (its own page is custom
 *  and does not go through the [service] system). NL authored; EN/DE/FR/ES short. */
export const AI_NATIVE_NAV: Record<ServicesLocale, { title: string; short: string }> = {
  nl: { title: 'Bedrijfssoftware', short: 'Software op maat die uw processen verbindt en automatiseert.' },
  en: { title: 'Business software', short: 'Custom software that connects and automates your processes.' },
  de: { title: 'Unternehmenssoftware', short: 'Maßgeschneiderte Software, die Ihre Prozesse verbindet und automatisiert.' },
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
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflow automation',
    short: 'Automate repetitive work and connect your systems.',
    description:
      'Automate recurring steps and connect existing systems through integrations and API with targeted use of AI.',
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
    short: 'Software built to fit when off-the-shelf packages do not.',
    description:
      'Web applications, portals and internal tools built to measure with integrations and attention to maintenance and ownership.',
    explainerTitle: 'What is custom software?',
    explainerText:
      'Software built specifically for your company instead of an off-the-shelf package, so it matches how you work.',
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
      'Configurators with real-time 3D, rules and pricing logic, connected to your webshop, CRM or ERP.',
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
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflowautomatisierung',
    short: 'Automatisieren Sie wiederkehrende Arbeit und verbinden Sie Ihre Systeme.',
    description:
      'Wiederkehrende Schritte automatisieren und bestehende Systeme über Integrationen und API verbinden mit gezieltem Einsatz von AI.',
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
    title: 'Maßgeschneiderte Software',
    short: 'Software nach Maß, wenn Standardpakete nicht passen.',
    description:
      'Webanwendungen, Portale und interne Tools nach Maß mit Integrationen und Blick auf Wartung und Eigentum.',
    explainerTitle: 'Was ist maßgeschneiderte Software?',
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
      'Ein interaktives Tool mit dem ein Kunde ein Produkt selbst zusammenstellt, in 3D sieht und sofort den Preis erhält. Jede Auswahl aktualisiert das 3D-Modell und den Preis in Echtzeit sodass kein Hin und Her per Email mehr nötig ist. So bleiben für Ihr Team weniger Angebotsanfragen zu bearbeiten und der Kunde erhält sofort eine konkrete Antwort.',
    audience: ['Hersteller', 'Maßanfertiger', 'Webshops', 'Sales Teams'],
    builds: ['Echtzeit 3D', 'Produktoptionen und Varianten', 'Konfigurationsregeln', 'Preislogik', 'Angebots- und Bestellanfragen', 'Integrationen'],
    benefits: ['Weniger Offertenarbeit', 'Konkretere Anfragen', 'Kunden konfigurieren selbst', 'Sofort ein Richtpreis'],
    examples: ['Möbelkonfigurator', 'Tor und Geländer', 'Maßgefertigte Maschine'],
    ctaLabel: 'Besprechen Sie Ihren Produktkonfigurator',
    ctaHref: HREF.configurator,
  },
];

// ─────────────────────────────── FR ───────────────────────────────
const frServices: Service[] = [
  {
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Automatisation des workflows',
    short: 'Automatisez le travail répétitif et reliez vos systèmes.',
    description:
      'Automatiser les étapes récurrentes et relier les systèmes existants via des intégrations et une API avec un usage ciblé de l’AI.',
    explainerTitle: 'L’automatisation des workflows, c’est quoi ?',
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
      'Applications web, portails et outils internes sur mesure avec des intégrations et une attention à la maintenance et à la propriété.',
    explainerTitle: 'Le logiciel sur mesure, c’est quoi ?',
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
    explainerTitle: 'Un configurateur de produit 3D, c’est quoi ?',
    explainerText:
      'Un outil interactif qui permet au client de composer son produit, de le voir en 3D et d’obtenir le prix tout de suite. Chaque choix met à jour le modèle 3D et le prix en temps réel donc plus besoin d’échanges par e-mail. Vous avez ainsi moins de demandes de devis à traiter et le client obtient tout de suite une réponse concrète.',
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
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Automatización de flujos',
    short: 'Automatice el trabajo repetitivo y conecte sus sistemas.',
    description:
      'Automatizar los pasos recurrentes y conectar los sistemas existentes mediante integraciones y API con un uso específico de la AI.',
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
      'Aplicaciones web, portales y herramientas internas a medida con integraciones y atención al mantenimiento y la propiedad.',
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
    id: 'marketing-automation',
    icon: 'automation',
    title: 'Workflowautomatisering',
    short: 'Automatiseer terugkerend werk en verbind uw systemen.',
    description:
      'Terugkerende stappen automatiseren en bestaande systemen verbinden via integraties en API met gerichte inzet van AI.',
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
      'Webapplicaties, portalen en interne tools op maat met integraties en oog voor onderhoud en eigendom.',
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
      'Een interactieve tool waarmee een klant een product zelf samenstelt, in 3D ziet en meteen de prijs krijgt. Elke keuze werkt het 3D-model en de prijs meteen bij zodat heen en weer mailen niet meer nodig is. Zo blijven er voor uw team minder offerteaanvragen over om te verwerken en krijgt de klant meteen een concreet antwoord.\n\nUw productieregels zitten rechtstreeks ingebouwd zodat een klant alleen combinaties kan kiezen die technisch haalbaar en maakbaar zijn. Onmogelijke of onrendabele samenstellingen komen zo nooit in uw productie terecht. Wat de klant bestelt kan u dus altijd effectief maken met de juiste afmetingen, materialen en opties.',
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
  metaTitle: 'Services for SMEs in Europe · semanu.eu',
  metaDescription: '3D configurators and custom business software for SMEs in Europe. semanu digitalises your processes with AI as the engine.',
  ogTitle: 'Digital services for SMEs',
  ogDescription: '3D configurators and custom business software with workflow automation. semanu is the digital partner for SMEs in Europe.',
  eyebrow: 'What we do',
  h1: 'Two services that move your business forward digitally.',
  heroSub: 'semanu is the digital partner for SMEs in Europe. We build 3D configurators and custom business software with AI as the engine.',
  ctaExplore: 'Explore services',
  ctaContact: 'Discuss your project',
  introTitle: 'What does semanu do?',
  introText: 'semanu helps SMEs make their processes, software and sales smarter. We combine technology, automation and AI where it is demonstrably useful.',
  introLead: 'semanu builds configurators, software and automation as one partner. You start with one clear need and build from there.',
  quickLinksLabel: 'Jump to a service',
  forWhoLabel: 'For whom',
  buildsLabel: 'What semanu can build or set up',
  benefitsLabel: 'Benefits',
  examplesLabel: 'Examples',
  seoGeo: {
    title: 'Built for search, AI discoverability and real customers',
    intro:
      'A modern website has to be clear for people, search engines and AI systems. semanu structures your content so customers understand what you offer and search engines can read it correctly.',
    explainerTitle: 'What is GEO?',
    explainerText:
      'GEO stands for Generative Engine Optimisation. It helps AI search systems understand your business, your services and your expertise so they can describe and recommend you more accurately.',
    points: ['clear service structure', 'understandable explanations', 'strong internal links', 'metadata and structured data', 'FAQ content', 'SEO and GEO friendly', 'content that answers real customer questions'],
    ctaLabel: 'Discuss your project',
    ctaHref: '/contact',
  },
  howTitle: 'How these services work together',
  howIntro:
    'You do not need everything at once. Most companies start with one clear need. semanu helps you step by step.',
  howSteps: [
    { title: 'Find the biggest gain', text: 'Every project starts with a short analysis of your processes: where do software, automation and AI add the most value?' },
    { title: 'Connect and automate', text: 'Workflow automation removes repetitive work and connects your existing systems.' },
    { title: 'Build what is missing', text: 'Custom software fills the gaps where off-the-shelf packages fall short.' },
    { title: 'Sell and configure', text: '3D configurators make configurable products sellable online.' },
  ],
  faqTitle: 'Questions about our services',
  faq: [
    { q: 'Which services does semanu offer?', a: '3D configurators and custom business software, including workflow automation. Together they help you connect, automate, build and sell.' },
    { q: 'Do I have to take everything at once?', a: 'No. Most companies start with one clear need, such as one workflow or one product. From there they build further.' },
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
  metaTitle: 'Dienstleistungen für KMU in Europa · semanu.eu',
  metaDescription: '3D-Konfiguratoren und Unternehmenssoftware nach Maß für KMU in Europa. semanu digitalisiert Ihre Prozesse mit AI als Motor.',
  ogTitle: 'Digitale Dienstleistungen für KMU',
  ogDescription: '3D-Konfiguratoren und maßgeschneiderte Unternehmenssoftware mit Workflowautomatisierung. semanu ist der digitale Partner für KMU in Europa.',
  eyebrow: 'Was wir tun',
  h1: 'Zwei Dienstleistungen, die Ihr Unternehmen digital voranbringen.',
  heroSub: 'semanu ist der digitale Partner für KMU in Europa. Wir bauen 3D-Konfiguratoren und Unternehmenssoftware nach Maß mit AI als Motor.',
  ctaExplore: 'Dienstleistungen entdecken',
  ctaContact: 'Ihr Projekt besprechen',
  introTitle: 'Was macht semanu?',
  introText: 'semanu hilft KMU, ihre Prozesse, Software und ihren Verkauf intelligenter zu machen. Wir kombinieren Technologie, Automatisierung und AI dort, wo es nachweisbar nützlich ist.',
  introLead: 'semanu baut Konfiguratoren, Software und Automatisierung aus einer Hand. Sie starten mit einem klaren Bedarf und bauen von dort weiter.',
  quickLinksLabel: 'Zu einer Dienstleistung',
  forWhoLabel: 'Für wen',
  buildsLabel: 'Was semanu bauen oder aufsetzen kann',
  benefitsLabel: 'Vorteile',
  examplesLabel: 'Beispiele',
  seoGeo: {
    title: 'Gebaut für Suche, AI-Auffindbarkeit und echte Kunden',
    intro:
      'Eine moderne Website muss für Menschen, Suchmaschinen und AI-Systeme klar sein. semanu strukturiert Ihre Inhalte, damit Kunden verstehen, was Sie anbieten und Suchmaschinen sie korrekt lesen können.',
    explainerTitle: 'Was ist GEO?',
    explainerText:
      'GEO steht für Generative Engine Optimisation. Es hilft AI-Suchsystemen, Ihr Unternehmen, Ihre Dienstleistungen und Ihre Expertise zu verstehen, damit sie Sie genauer beschreiben und empfehlen können.',
    points: ['klare Dienstleistungsstruktur', 'verständliche Erklärungen', 'starke interne Links', 'Metadaten und strukturierte Daten', 'FAQ Inhalte', 'SEO und GEO freundlich', 'Inhalte, die echte Kundenfragen beantworten'],
    ctaLabel: 'Projekt besprechen',
    ctaHref: '/contact',
  },
  howTitle: 'Wie diese Dienstleistungen zusammenwirken',
  howIntro:
    'Sie brauchen nicht alles auf einmal. Die meisten Unternehmen starten mit einem klaren Bedarf. semanu hilft Ihnen Schritt für Schritt.',
  howSteps: [
    { title: 'Den größten Gewinn finden', text: 'Jedes Projekt beginnt mit einer kurzen Analyse Ihrer Prozesse: wo bringen Software, Automatisierung und AI den größten Mehrwert?' },
    { title: 'Verbinden und automatisieren', text: 'Workflowautomatisierung nimmt wiederkehrende Arbeit ab und verbindet Ihre bestehenden Systeme.' },
    { title: 'Bauen, was fehlt', text: 'Maßgeschneiderte Software ergänzt dort, wo Standardpakete zu kurz greifen.' },
    { title: 'Verkaufen und konfigurieren', text: '3D-Konfiguratoren machen konfigurierbare Produkte online verkäuflich.' },
  ],
  faqTitle: 'Fragen zu unseren Dienstleistungen',
  faq: [
    { q: 'Welche Dienstleistungen bietet semanu?', a: '3D-Konfiguratoren und Unternehmenssoftware nach Maß, inklusive Workflowautomatisierung. Zusammen helfen sie Ihnen zu verbinden, zu automatisieren, zu bauen und zu verkaufen.' },
    { q: 'Muss ich alles auf einmal nehmen?', a: 'Nein. Die meisten Unternehmen starten mit einem klaren Bedarf, etwa einem Ablauf oder einem Produkt. Von dort bauen sie weiter.' },
    { q: 'Setzen Sie immer AI ein?', a: 'Nein. AI ist ein Mittel, kein Ziel. Wir setzen es ein, wo es nachweisbar nützlich ist und wählen klassische Technologie, wo sie besser passt.' },
    { q: 'Was ist GEO?', a: 'GEO steht für Generative Engine Optimisation. Es hilft AI-Suchsystemen, Ihr Unternehmen, Ihre Dienstleistungen und Ihre Expertise zu verstehen, damit sie Sie genauer beschreiben und empfehlen können.' },
  ],
  finalTitle: 'Nicht sicher, was Ihr Unternehmen braucht?',
  finalText:
    'Sagen Sie uns kurz, was Sie brauchen und wir helfen Ihnen zu verstehen, was zuerst zählt und was warten kann.',
  finalCta: 'Ihr Projekt besprechen',
  finalCtaSecondary: 'Kontakt aufnehmen',
};

const frFields: ContentFields = {
  metaTitle: 'Services pour PME en Europe · semanu.eu',
  metaDescription: 'Configurateurs 3D et logiciels d’entreprise sur mesure pour les PME en Europe. semanu digitalise vos processus avec l’AI comme moteur.',
  ogTitle: 'Services digitaux pour PME',
  ogDescription: 'Configurateurs 3D et logiciels d’entreprise sur mesure avec automatisation des workflows. semanu est le partenaire digital des PME en Europe.',
  eyebrow: 'Ce que nous faisons',
  h1: 'Deux services qui font avancer votre entreprise sur le plan digital.',
  heroSub: 'semanu est le partenaire digital des PME en Europe. Nous construisons des configurateurs 3D et des logiciels d’entreprise sur mesure avec l’AI comme moteur.',
  ctaExplore: 'Découvrir les services',
  ctaContact: 'Parler de votre projet',
  introTitle: 'Que fait semanu ?',
  introText: 'semanu aide les PME à rendre leurs processus, leurs logiciels et leurs ventes plus intelligents. Nous combinons technologie, automatisation et AI là où c’est réellement utile.',
  introLead: 'semanu construit configurateurs, logiciels et automatisations chez un seul partenaire. Vous démarrez avec un besoin clair et construisez à partir de là.',
  quickLinksLabel: 'Vers un service',
  forWhoLabel: 'Pour qui',
  buildsLabel: 'Ce que semanu peut construire ou mettre en place',
  benefitsLabel: 'Avantages',
  examplesLabel: 'Exemples',
  seoGeo: {
    title: 'Conçu pour la recherche, la visibilité AI et de vrais clients',
    intro:
      'Un site moderne doit être clair pour les personnes, les moteurs de recherche et les systèmes AI. semanu structure votre contenu pour que les clients comprennent votre offre et que les moteurs de recherche la lisent correctement.',
    explainerTitle: 'GEO, c’est quoi ?',
    explainerText:
      'GEO signifie Generative Engine Optimisation. Cela aide les systèmes de recherche AI à comprendre votre entreprise, vos services et votre expertise pour vous décrire et vous recommander plus précisément.',
    points: ['structure de services claire', 'explications compréhensibles', 'liens internes solides', 'métadonnées et données structurées', 'contenu FAQ', 'adapté au SEO et au GEO', 'du contenu qui répond aux vraies questions des clients'],
    ctaLabel: 'Parler de votre projet',
    ctaHref: '/contact',
  },
  howTitle: 'Comment ces services fonctionnent ensemble',
  howIntro:
    'Vous n’avez pas besoin de tout en même temps. La plupart des entreprises démarrent avec un besoin clair. semanu vous aide pas à pas.',
  howSteps: [
    { title: 'Trouver le plus grand gain', text: 'Chaque projet commence par une courte analyse de vos processus : où les logiciels, l’automatisation et l’AI apportent-ils le plus de valeur ?' },
    { title: 'Relier et automatiser', text: 'L’automatisation des workflows supprime le travail répétitif et relie vos systèmes existants.' },
    { title: 'Construire ce qui manque', text: 'Le logiciel sur mesure complète là où les solutions standard sont insuffisantes.' },
    { title: 'Vendre et configurer', text: 'Les configurateurs 3D rendent les produits configurables vendables en ligne.' },
  ],
  faqTitle: 'Questions sur nos services',
  faq: [
    { q: 'Quels services propose semanu ?', a: 'Des configurateurs 3D et des logiciels d’entreprise sur mesure, automatisation des workflows comprise. Ensemble, ils vous aident à relier, automatiser, construire et vendre.' },
    { q: 'Faut-il tout prendre en même temps ?', a: 'Non. La plupart des entreprises démarrent avec un besoin clair, par exemple un processus ou un produit. À partir de là, elles construisent.' },
    { q: 'Utilisez-vous toujours l’AI ?', a: 'Non. L’AI est un moyen, pas un but. Nous l’utilisons là où elle est réellement utile et choisissons une technologie classique là où elle convient mieux.' },
    { q: 'GEO, c’est quoi ?', a: 'GEO signifie Generative Engine Optimisation. Cela aide les systèmes de recherche AI à comprendre votre entreprise, vos services et votre expertise pour vous décrire et vous recommander plus précisément.' },
  ],
  finalTitle: 'Vous ne savez pas ce dont votre entreprise a besoin ?',
  finalText:
    'Dites-nous brièvement ce dont vous avez besoin et nous vous aidons à comprendre ce qui compte d’abord et ce qui peut attendre.',
  finalCta: 'Parler de votre projet',
  finalCtaSecondary: 'Nous contacter',
};

const esFields: ContentFields = {
  metaTitle: 'Servicios para pymes en Europa · semanu.eu',
  metaDescription: 'Configuradores 3D y software empresarial a medida para pymes en Europa. semanu digitaliza sus procesos con la AI como motor.',
  ogTitle: 'Servicios digitales para pymes',
  ogDescription: 'Configuradores 3D y software empresarial a medida con automatización de flujos. semanu es el socio digital para pymes en Europa.',
  eyebrow: 'Lo que hacemos',
  h1: 'Dos servicios que impulsan su empresa en lo digital.',
  heroSub: 'semanu es el socio digital para pymes en Europa. Creamos configuradores 3D y software empresarial a medida con la AI como motor.',
  ctaExplore: 'Descubrir los servicios',
  ctaContact: 'Hablar de su proyecto',
  introTitle: '¿Qué hace semanu?',
  introText: 'semanu ayuda a las pymes a hacer más inteligentes sus procesos, su software y sus ventas. Combinamos tecnología, automatización y AI donde resulta demostrablemente útil.',
  introLead: 'semanu crea configuradores, software y automatizaciones como un solo socio. Empieza con una necesidad clara y construye a partir de ahí.',
  quickLinksLabel: 'Ir a un servicio',
  forWhoLabel: 'Para quién',
  buildsLabel: 'Lo que semanu puede construir o poner en marcha',
  benefitsLabel: 'Ventajas',
  examplesLabel: 'Ejemplos',
  seoGeo: {
    title: 'Diseñado para la búsqueda, la visibilidad en AI y clientes reales',
    intro:
      'Un sitio web moderno debe ser claro para las personas, los motores de búsqueda y los sistemas de AI. semanu estructura su contenido para que los clientes entiendan lo que ofrece y los motores de búsqueda lo lean correctamente.',
    explainerTitle: '¿Qué es GEO?',
    explainerText:
      'GEO significa Generative Engine Optimisation. Ayuda a los sistemas de búsqueda de AI a entender su empresa, sus servicios y su experiencia para describirle y recomendarle con más precisión.',
    points: ['estructura de servicios clara', 'explicaciones comprensibles', 'enlaces internos sólidos', 'metadatos y datos estructurados', 'contenido de FAQ', 'apto para SEO y GEO', 'contenido que responde a preguntas reales de clientes'],
    ctaLabel: 'Hablar de su proyecto',
    ctaHref: '/contact',
  },
  howTitle: 'Cómo funcionan juntos estos servicios',
  howIntro:
    'No necesita todo a la vez. La mayoría de las empresas empiezan con una necesidad clara. semanu le ayuda paso a paso.',
  howSteps: [
    { title: 'Encontrar la mayor ganancia', text: 'Cada proyecto empieza con un breve análisis de sus procesos: ¿dónde aportan más valor el software, la automatización y la AI?' },
    { title: 'Conectar y automatizar', text: 'La automatización de flujos elimina el trabajo repetitivo y conecta sus sistemas existentes.' },
    { title: 'Construir lo que falta', text: 'El software a medida completa donde los paquetes estándar se quedan cortos.' },
    { title: 'Vender y configurar', text: 'Los configuradores 3D hacen vendibles en línea los productos configurables.' },
  ],
  faqTitle: 'Preguntas sobre nuestros servicios',
  faq: [
    { q: '¿Qué servicios ofrece semanu?', a: 'Configuradores 3D y software empresarial a medida, incluida la automatización de flujos. Juntos le ayudan a conectar, automatizar, construir y vender.' },
    { q: '¿Tengo que contratarlo todo a la vez?', a: 'No. La mayoría de las empresas empiezan con una necesidad clara, como un flujo o un producto. A partir de ahí construyen.' },
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
  metaTitle: 'Diensten voor kmo’s in Europa · semanu.eu',
  metaDescription: '3D-configuratoren en bedrijfssoftware op maat voor kmo’s in Europa. semanu digitaliseert uw processen met AI als motor.',
  ogTitle: 'Digitale diensten voor kmo’s',
  ogDescription: '3D-configuratoren en bedrijfssoftware op maat met workflowautomatisering. semanu is de digitale partner voor kmo’s in Europa.',
  eyebrow: 'Wat we doen',
  h1: 'Twee diensten die uw bedrijf digitaal vooruit helpen.',
  heroSub: 'semanu is de digitale partner voor kmo’s in Europa. Wij bouwen 3D-configuratoren en bedrijfssoftware op maat met AI als motor.',
  ctaExplore: 'Diensten ontdekken',
  ctaContact: 'Uw project bespreken',
  introTitle: 'Wat doet semanu?',
  introText: 'semanu helpt kmo’s hun processen, software en verkoop slimmer te maken. We combineren technologie, automatisering en AI waar het aantoonbaar nuttig is.',
  introLead: 'semanu bouwt configuratoren, software en automatisering als één partner. U start met één duidelijke behoefte en bouwt van daaruit verder.',
  quickLinksLabel: 'Naar een dienst',
  forWhoLabel: 'Voor wie',
  buildsLabel: 'Wat semanu kan bouwen of opzetten',
  benefitsLabel: 'Voordelen',
  examplesLabel: 'Voorbeelden',
  seoGeo: {
    title: 'Gebouwd voor zoekopdrachten, AI vindbaarheid en echte klanten',
    intro:
      'Een moderne website moet duidelijk zijn voor mensen, zoekmachines en AI-systemen. semanu structureert uw inhoud zodat klanten begrijpen wat u aanbiedt en zoekmachines het correct kunnen lezen.',
    explainerTitle: 'Wat is GEO?',
    explainerText:
      'GEO staat voor Generative Engine Optimisation. Het helpt AI-zoeksystemen om uw bedrijf, uw diensten en uw expertise te begrijpen zodat ze u nauwkeuriger kunnen beschrijven en aanbevelen.',
    points: ['duidelijke dienstenstructuur', 'begrijpelijke uitleg', 'sterke interne links', 'metadata en gestructureerde data', 'FAQ inhoud', 'SEO en GEO vriendelijk', 'inhoud die echte klantvragen beantwoordt'],
    ctaLabel: 'Project bespreken',
    ctaHref: '/contact',
  },
  howTitle: 'Hoe deze diensten samenwerken',
  howIntro:
    'U hebt niet alles tegelijk nodig. De meeste bedrijven starten met één duidelijke behoefte. semanu helpt u stap voor stap.',
  howSteps: [
    { title: 'De grootste winst vinden', text: 'Elk project start met een korte analyse van uw processen: waar leveren software, automatisering en AI de meeste waarde op?' },
    { title: 'Verbinden en automatiseren', text: 'Workflowautomatisering neemt terugkerend werk weg en koppelt uw bestaande systemen.' },
    { title: 'Bouwen wat ontbreekt', text: 'Maatwerksoftware vult aan waar standaardpakketten tekortschieten.' },
    { title: 'Verkopen en configureren', text: '3D-configuratoren maken configureerbare producten online verkoopbaar.' },
  ],
  faqTitle: 'Vragen over onze diensten',
  faq: [
    { q: 'Welke diensten biedt semanu?', a: '3D-configuratoren en bedrijfssoftware op maat, inclusief workflowautomatisering. Samen helpen ze u verbinden, automatiseren, bouwen en verkopen.' },
    { q: 'Moet ik alles tegelijk afnemen?', a: 'Nee. De meeste bedrijven starten met één duidelijke behoefte, zoals één workflow of één product. Van daaruit bouwen ze verder.' },
    { q: 'Gebruiken jullie altijd AI?', a: 'Nee. AI is een middel, geen doel. We zetten het in waar het aantoonbaar nuttig is en kiezen klassieke technologie waar die beter past.' },
    { q: 'Wat is GEO?', a: 'GEO staat voor Generative Engine Optimisation. Het helpt AI-zoeksystemen om uw bedrijf, uw diensten en uw expertise te begrijpen zodat ze u nauwkeuriger kunnen beschrijven en aanbevelen.' },
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
        slug: 'business-software',
        title: ai.title,
        short: ai.short,
        description: ai.short,
        icon: 'systems' as ServiceIcon,
        href: '/services/business-software',
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
