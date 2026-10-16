// Pricing page service tiles, one entry per locale. Mirrors the HTML design the
// owner approved: each tile shows an icon, name, price and a short sub line on the
// face, with a longer description revealed on hover. Bespoke services (Digitale
// Plattformen, Consultancy) are quote based and show "Auf Anfrage" instead of a
// monthly price. House style applies: no hyphenated compounds, "und" not "&",
// Swiss ss, "AI" not "KI"/"IA".

export type PricingTileContent = {
  id: string;
  name: string;
  from: boolean; // show the "ab/dès/from" prefix
  price: string; // e.g. "99 CHF" or "Auf Anfrage"
  per: string; // "/ Monat" | "einmalig" | "" for quote based
  sub: string; // short line on the face
  desc: string; // longer line revealed on hover
  icon: string; // ServiceIcon id
};

export type PricingTilesLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

export const pricingTiles: Record<PricingTilesLocale, PricingTileContent[]> = {
  de: [
    { id: 'web2', name: 'Business Website', from: true, price: '99 CHF', per: '/ Monat', sub: 'mehrseitig, bis 10 Seiten', desc: 'Mehrseitige Website (bis 10 Seiten) mit mehr Struktur, Vertrauen und SEO.', icon: 'pages' },
    { id: 'shop', name: 'Webshop', from: true, price: '125 CHF', per: '/ Monat', sub: 'inkl. Produkten, Zahlung und Versand Setup', desc: 'Ein Online Shop, der verkauft: Produkte, Zahlungen und Bestellungen sauber und sicher abgewickelt.', icon: 'cart' },
    { id: 'logo', name: 'Logo + Markenrichtlinien', from: true, price: '750 CHF', per: 'einmalig', sub: 'ideal als Ergänzung zu einem Abo', desc: 'Ein passendes Logo und ein kompakter Markenleitfaden für einen einheitlichen, professionellen Auftritt.', icon: 'star' },
    { id: 'email', name: 'Email Marketing', from: true, price: '79 CHF', per: '/ Monat', sub: 'inkl. Vorlagen und Versand', desc: 'Newsletter und Kampagnen, die Ihr Unternehmen sichtbar halten und Stammkunden zurückbringen.', icon: 'email' },
    { id: 'auto', name: 'Workflow Automatisierung', from: true, price: '129 CHF', per: '/ Monat', sub: 'Einrichtung der Flows inklusive', desc: 'Automatisierte Follow ups, Flows und Erinnerungen. Sie bleiben in Kontakt, ohne daran zu denken.', icon: 'sun' },
    { id: 'ai', name: 'AI Assistenten', from: true, price: '99 CHF', per: '/ Monat', sub: 'auf Ihre Inhalte trainiert', desc: 'Praktische AI Tools für Support, Leads und interne Abläufe, rund um die Uhr für Sie im Einsatz.', icon: 'sparkle' },
    { id: 'gads', name: 'Google Ads', from: false, price: '195 CHF', per: '/ Monat', sub: 'zzgl. Werbebudget nach Wahl', desc: 'Bezahlte Kampagnen, die Sie genau dort sichtbar machen, wo Ihre Kunden suchen.', icon: 'target' },
    { id: 'bport', name: 'Digitale Plattformen', from: false, price: 'Auf Anfrage', per: '', sub: 'Dashboards, CRM und Kundenportale', desc: 'Massgeschneiderte Plattformen: Business Dashboards, CRM Systeme und Kundenportale in einer verbundenen Lösung.', icon: 'systems' },
    { id: 'consultancy', name: 'Consultancy', from: false, price: 'Auf Anfrage', per: '', sub: 'unabhängige digitale Beratung', desc: 'Unabhängige Beratung für Ihre digitale Transformation: Strategie, Auswahl der richtigen Lösungen und Begleitung bei digitalen Herausforderungen.', icon: 'audit' },
  ],
  fr: [
    { id: 'web2', name: 'Business Website', from: true, price: '99 CHF', per: '/ mois', sub: 'plusieurs pages, jusqu’à 10 pages', desc: 'Site multipage (jusqu’à 10 pages) avec plus de structure, de confiance et de SEO.', icon: 'pages' },
    { id: 'shop', name: 'Webshop', from: true, price: '125 CHF', per: '/ mois', sub: 'produits, paiement et expédition inclus', desc: 'Une boutique en ligne qui vend: produits, paiements et commandes gérés proprement et en sécurité.', icon: 'cart' },
    { id: 'logo', name: 'Logo + charte graphique', from: true, price: '750 CHF', per: 'une fois', sub: 'idéal en complément d’un abonnement', desc: 'Un logo adapté et un guide de marque compact pour une image cohérente et professionnelle.', icon: 'star' },
    { id: 'email', name: 'Email Marketing', from: true, price: '79 CHF', per: '/ mois', sub: 'modèles et envoi inclus', desc: 'Newsletters et campagnes qui gardent votre entreprise visible et ramènent vos clients fidèles.', icon: 'email' },
    { id: 'auto', name: 'Automatisation des workflows', from: true, price: '129 CHF', per: '/ mois', sub: 'mise en place des flux incluse', desc: 'Relances, flux et rappels automatisés. Vous restez en contact sans y penser.', icon: 'sun' },
    { id: 'ai', name: 'Assistants AI', from: true, price: '99 CHF', per: '/ mois', sub: 'entraînés sur vos contenus', desc: 'Des outils AI pratiques pour le support, les leads et les processus internes, à votre service jour et nuit.', icon: 'sparkle' },
    { id: 'gads', name: 'Google Ads', from: false, price: '195 CHF', per: '/ mois', sub: 'budget publicitaire en sus selon votre choix', desc: 'Des campagnes payantes qui vous rendent visible exactement là où vos clients cherchent.', icon: 'target' },
    { id: 'bport', name: 'Plateformes digitales', from: false, price: 'Sur demande', per: '', sub: 'tableaux de bord, CRM et portails clients', desc: 'Des plateformes sur mesure: tableaux de bord, systèmes CRM et portails clients dans une solution reliée.', icon: 'systems' },
    { id: 'consultancy', name: 'Consultancy', from: false, price: 'Sur demande', per: '', sub: 'conseil digital indépendant', desc: 'Conseil indépendant pour votre transformation digitale: stratégie, choix des bonnes solutions et accompagnement face aux défis digitaux.', icon: 'audit' },
  ],
  en: [
    { id: 'web2', name: 'Business Website', from: true, price: '99 CHF', per: '/ month', sub: 'multi page, up to 10 pages', desc: 'A multi page website (up to 10 pages) with more structure, trust and SEO.', icon: 'pages' },
    { id: 'shop', name: 'Webshop', from: true, price: '125 CHF', per: '/ month', sub: 'products, payment and shipping included', desc: 'An online shop that sells: products, payments and orders handled cleanly and securely.', icon: 'cart' },
    { id: 'logo', name: 'Logo + brand guidelines', from: true, price: '750 CHF', per: 'one time', sub: 'ideal alongside a subscription', desc: 'A fitting logo and a compact brand guide for a consistent, professional image.', icon: 'star' },
    { id: 'email', name: 'Email Marketing', from: true, price: '79 CHF', per: '/ month', sub: 'templates and sending included', desc: 'Newsletters and campaigns that keep your business visible and bring loyal customers back.', icon: 'email' },
    { id: 'auto', name: 'Workflow Automation', from: true, price: '129 CHF', per: '/ month', sub: 'flow setup included', desc: 'Automated follow ups, flows and reminders. You stay in touch without thinking about it.', icon: 'sun' },
    { id: 'ai', name: 'AI Assistants', from: true, price: '99 CHF', per: '/ month', sub: 'trained on your content', desc: 'Practical AI tools for support, leads and internal processes, working for you around the clock.', icon: 'sparkle' },
    { id: 'gads', name: 'Google Ads', from: false, price: '195 CHF', per: '/ month', sub: 'ad budget on top, your choice', desc: 'Paid campaigns that make you visible exactly where your customers search.', icon: 'target' },
    { id: 'bport', name: 'Digital Platforms', from: false, price: 'On request', per: '', sub: 'dashboards, CRM and customer portals', desc: 'Tailored platforms: business dashboards, CRM systems and customer portals in one connected solution.', icon: 'systems' },
    { id: 'consultancy', name: 'Consultancy', from: false, price: 'On request', per: '', sub: 'independent digital advisory', desc: 'Independent advice for your digital transformation: strategy, choosing the right solutions and guidance through digital challenges.', icon: 'audit' },
  ],
  es: [
    { id: 'web2', name: 'Business Website', from: true, price: '99 CHF', per: '/ mes', sub: 'varias páginas, hasta 10 páginas', desc: 'Sitio web de varias páginas (hasta 10 páginas) con más estructura, confianza y SEO.', icon: 'pages' },
    { id: 'shop', name: 'Webshop', from: true, price: '125 CHF', per: '/ mes', sub: 'productos, pago y envío incluidos', desc: 'Una tienda online que vende: productos, pagos y pedidos gestionados de forma limpia y segura.', icon: 'cart' },
    { id: 'logo', name: 'Logo + manual de marca', from: true, price: '750 CHF', per: 'pago único', sub: 'ideal como complemento de una suscripción', desc: 'Un logo adecuado y una guía de marca compacta para una imagen coherente y profesional.', icon: 'star' },
    { id: 'email', name: 'Email Marketing', from: true, price: '79 CHF', per: '/ mes', sub: 'plantillas y envío incluidos', desc: 'Boletines y campañas que mantienen su empresa visible y hacen volver a los clientes fieles.', icon: 'email' },
    { id: 'auto', name: 'Automatización de flujos', from: true, price: '129 CHF', per: '/ mes', sub: 'configuración de los flujos incluida', desc: 'Seguimientos automatizados, flujos y recordatorios. Usted sigue en contacto sin tener que pensarlo.', icon: 'sun' },
    { id: 'ai', name: 'Asistentes AI', from: true, price: '99 CHF', per: '/ mes', sub: 'entrenados con sus contenidos', desc: 'Herramientas de AI prácticas para soporte, leads y procesos internos, trabajando para usted las 24 horas.', icon: 'sparkle' },
    { id: 'gads', name: 'Google Ads', from: false, price: '195 CHF', per: '/ mes', sub: 'presupuesto de anuncios aparte, a su elección', desc: 'Campañas de pago que le hacen visible justo donde buscan sus clientes.', icon: 'target' },
    { id: 'bport', name: 'Plataformas digitales', from: false, price: 'A consultar', per: '', sub: 'dashboards, CRM y portales de clientes', desc: 'Plataformas a medida: dashboards de negocio, sistemas CRM y portales de clientes en una solución conectada.', icon: 'systems' },
    { id: 'consultancy', name: 'Consultancy', from: false, price: 'A consultar', per: '', sub: 'asesoramiento digital independiente', desc: 'Asesoramiento independiente para su transformación digital: estrategia, elección de las soluciones adecuadas y acompañamiento ante los retos digitales.', icon: 'audit' },
  ],
  nl: [
    { id: 'web2', name: 'Business Website', from: true, price: '99 CHF', per: '/ maand', sub: 'meerdere pagina’s, tot 10 pagina’s', desc: 'Website met meerdere pagina’s (tot 10 pagina’s) met meer structuur, vertrouwen en SEO.', icon: 'pages' },
    { id: 'shop', name: 'Webshop', from: true, price: '125 CHF', per: '/ maand', sub: 'producten, betaling en verzending inbegrepen', desc: 'Een online shop die verkoopt: producten, betalingen en bestellingen netjes en veilig afgehandeld.', icon: 'cart' },
    { id: 'logo', name: 'Logo + huisstijl', from: true, price: '750 CHF', per: 'eenmalig', sub: 'ideaal als aanvulling op een abonnement', desc: 'Een passend logo en een compacte huisstijlgids voor een consistente, professionele uitstraling.', icon: 'star' },
    { id: 'email', name: 'Email Marketing', from: true, price: '79 CHF', per: '/ maand', sub: 'inclusief sjablonen en verzending', desc: 'Nieuwsbrieven en campagnes die uw onderneming zichtbaar houden en vaste klanten terugbrengen.', icon: 'email' },
    { id: 'auto', name: 'Workflow Automatisering', from: true, price: '129 CHF', per: '/ maand', sub: 'inclusief inrichting van de flows', desc: 'Geautomatiseerde follow ups, flows en herinneringen. U blijft in contact zonder eraan te denken.', icon: 'sun' },
    { id: 'ai', name: 'AI Assistenten', from: true, price: '99 CHF', per: '/ maand', sub: 'getraind op uw content', desc: 'Praktische AI tools voor support, leads en interne processen, dag en nacht voor u aan het werk.', icon: 'sparkle' },
    { id: 'gads', name: 'Google Ads', from: false, price: '195 CHF', per: '/ maand', sub: 'plus advertentiebudget naar keuze', desc: 'Betaalde campagnes die u precies daar zichtbaar maken waar uw klanten zoeken.', icon: 'target' },
    { id: 'bport', name: 'Digitale platformen', from: false, price: 'Op aanvraag', per: '', sub: 'dashboards, CRM en klantportalen', desc: 'Platformen op maat: business dashboards, CRM systemen en klantportalen in één verbonden oplossing.', icon: 'systems' },
    { id: 'consultancy', name: 'Consultancy', from: false, price: 'Op aanvraag', per: '', sub: 'onafhankelijk digitaal advies', desc: 'Onafhankelijk advies voor uw digitale transformatie: strategie, keuze van de juiste oplossingen en begeleiding bij digitale uitdagingen.', icon: 'audit' },
  ],
};
