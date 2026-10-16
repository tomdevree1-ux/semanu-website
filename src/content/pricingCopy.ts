// All user facing copy for the pricing page (tabs, configurator, website
// explainer) in five locales. The option ids match ConfigState keys in
// pricingConfig.ts; only the labels, prices and plain language info are localized.
// House style: no hyphenated compounds, Swiss ss for German, "und/et/y/en"
// without a comma. All prices carry CHF.

export type PricingCopyLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

export type CfgOption = { id: string; label: string; price: string; info?: string };

export type PricingCopy = {
  tabs: { website: string; auto: string; ai: string; platforms: string; consultancy: string };
  webshopBadge: string;
  tabIntro: { auto: string; ai: string; platforms: string; consultancy: string };
  cfg: {
    step1: string;
    stepExtrasNew: string; // "Step 3 · Extras" for a new site
    stepExtrasExisting: string; // "Step 2 · Extras" for an existing site
    step2Pages: string;
    monthly: string;
    moreInfo: string;
    presetLabel: string;
    whatsIncluded: string;
    popularTag: string;
    situationNew: string;
    situationExisting: string;
    pagesUnit: string;
    pagesHelp: string;
    pages199: string;
    webshopTitle: string;
    webshopPrice: string;
    webshopDesc: string;
    productsUnit: string;
    productsHelp: string;
    products101: string;
    languagesCount: string;
    productImport: CfgOption;
    erpLink: CfgOption;
    newExtras: CfgOption[];
    existingExtras: CfgOption[];
    monthlyExtras: CfgOption[];
    priceTitle: string;
    reset: string;
    perMonth: string;
    oneTime: string; // e.g. "einmalig"
    perShort: string;
    onceShort: string;
    manualQuote: string;
    cta: string;
    finePrint: string;
    lineLabel: Record<string, string>;
    summary: {
      title: string;
      situation: string;
      new: string;
      existing: string;
      pages: string;
      webshopYes: string;
      totalLabel: string;
      monthWord: string;
      onceWord: string;
      manualNote: string;
    };
  };
  explainer: {
    h2: string;
    lead: string;
    includes: { title: string; text: string }[];
    conditionsTitle: string;
    conditionsText: string;
  };
};

const de: PricingCopy = {
  tabs: { website: 'Website', auto: 'Automatisierung', ai: 'AI', platforms: 'Plattformen', consultancy: 'Consultancy' },
  webshopBadge: '+ Webshop',
  tabIntro: {
    auto: 'Wiederkehrende Abläufe und Ihr Email Marketing laufen automatisch, damit kein Lead und kein Kunde vergessen wird.',
    ai: 'Praktische AI Assistenten für Support, Leads und interne Abläufe, trainiert auf Ihre Inhalte.',
    platforms: 'Dashboards, CRM Systeme und Kundenportale in einer verbundenen Plattform. Umfang und Preis pro Projekt.',
    consultancy: 'Unabhängige digitale Beratung. Umfang und Preis pro Auftrag.',
  },
  cfg: {
    step1: 'Schritt 1 · Ihre Situation',
    stepExtrasNew: 'Schritt 3 · Extras',
    stepExtrasExisting: 'Schritt 2 · Extras',
    step2Pages: 'Schritt 2 · Anzahl Seiten',
    monthly: 'Laufende Erweiterungen',
    moreInfo: 'Mehr Infos',
    presetLabel: 'Beliebte Auswahl',
    whatsIncluded: 'Was noch dabei ist',
    popularTag: 'Populär',
    situationNew: 'Neue Website',
    situationExisting: 'Ich habe schon eine Website',
    pagesUnit: 'Seiten',
    pagesHelp: 'Zehn Seiten sind im Abo enthalten.',
    pages199: 'Ab {n} Seiten wird Ihr Abo 199 CHF pro Monat, weil unbegrenzte Änderungen auf mehr Seiten mehr Arbeit sind.',
    webshopTitle: 'Webshop dazu',
    webshopPrice: 'plus 150 CHF pro Monat',
    webshopDesc: 'Verkaufen ab Ihrer Website: Produktkatalog, Warenkorb, Kasse, Twint und Kartenzahlung, Versandregeln und MWST.',
    productsUnit: 'Produkte',
    productsHelp: 'Ihre Produkte verwalten Sie selbst im Verwaltungsbereich.',
    products101: 'Ab 1000 Produkten kommt ein monatlicher Zuschlag dazu, der bei 2500 und 5000 Produkten weiter steigt.',
    languagesCount: 'Anzahl Sprachen',
    productImport: { id: 'productImport', label: 'Produktimport aus einer Liste oder CSV', price: '490 CHF einmalig', info: 'Wir importieren Ihre Produkte aus einer bestehenden Liste oder CSV, damit Sie nicht alles von Hand eingeben.' },
    erpLink: { id: 'erpLink', label: 'Kopplung mit Ihrer Buchhaltung oder ERP', price: 'auf Offerte', info: 'Wir verbinden Ihren Shop mit Ihrer Buchhaltung oder Ihrem ERP. Umfang und Preis pro System auf Offerte.' },
    newExtras: [
      { id: 'extraLanguage', label: 'Extra Sprache, inklusive hreflang', price: '290 CHF pro Sprache', info: 'Ihre komplette Website in einer weiteren Sprache, mit den hreflang Angaben, die Google sagen welche Version zu welchem Besucher passt.' },
      { id: 'logo', label: 'Logo und Markenrichtlinien', price: '750 CHF einmalig', info: 'Ein passendes Logo und ein kompakter Markenleitfaden für einen einheitlichen, professionellen Auftritt.' },
    ],
    existingExtras: [
      { id: 'audit', label: 'Crawler und Indexierungsaudit', price: '190 CHF einmalig', info: 'Wir prüfen ob Ihre Website im Google Index steht, ob die Sitemap stimmt und ob AI Crawler wirklich hereinkommen, und sagen Ihnen was zu reparieren ist.' },
      { id: 'extraLanguage', label: 'Extra Sprache hinzufügen', price: '490 CHF pro Sprache', info: 'Eine weitere Sprachversion Ihrer bestehenden Website, inklusive der hreflang Angaben für Google.' },
      { id: 'structuredData', label: 'Strukturierte Daten hinzufügen', price: '490 CHF einmalig', info: 'Zusätzliche Angaben im Quellcode, damit Google und AI Systeme Ihre Dienste, FAQ und Navigation besser verstehen und darstellen.' },
      { id: 'answerBlocks', label: 'Antwortblöcke neu schreiben', price: '75 CHF pro Seite oder 690 CHF pro zehn', info: 'Wir schreiben oben auf Ihre Seiten kurze Blöcke, die eine Frage vollständig beantworten, damit AI Antwortmaschinen Sie zitieren.' },
      { id: 'entityLocal', label: 'Entitäts und lokale Auffindbarkeit', price: '490 CHF einmalig', info: 'Ihr Google Unternehmensprofil und Ihre Angaben überall identisch, plus Einträge in den Verzeichnissen, die in Ihrer Branche gelesen werden.' },
      { id: 'analyticsConsent', label: 'Analytics und Consent Einrichtung', price: '290 CHF einmalig', info: 'GA4 und Consent Mode korrekt eingerichtet mit Cookie Banner und Conversion Zielen, damit Sie sehen was Ihre Website bringt.' },
      { id: 'cwv', label: 'Core Web Vitals Optimierung', price: 'ab 390 CHF auf Offerte', info: 'Wir machen Ihre bestehende Website schneller und stabiler nach den Werten, die Google für Ladezeit und Reaktion verwendet.' },
      { id: 'accessibility', label: 'Barrierefreiheit auf WCAG 2.2 AA', price: 'ab 690 CHF auf Offerte', info: 'Wir bringen Ihre Website auf den Standard WCAG 2.2 AA, damit sie auch mit Tastatur und Screenreader nutzbar ist.' },
    ],
    monthlyExtras: [
      { id: 'visibilityLoop', label: 'Sichtbarkeitsschleife, SEO und GEO Monitoring', price: '190 CHF pro Monat plus 490 CHF Einrichtung', info: 'Jeden Monat messen wir ob Sie in ChatGPT, Google AI Overviews, Perplexity und Copilot genannt werden, plus Search Console, und verbessern eine Seite. Sie erhalten drei Kennzahlen und einen Aktionspunkt.' },
      { id: 'googleAds', label: 'Google Ads Betreuung', price: '190 CHF pro Monat plus 490 CHF Einrichtung', info: 'Wir richten Ihre Google Ads ein und betreuen sie: Kampagnen, Suchbegriffe, Anzeigen, Gebote und Conversion Tracking, mit monatlicher Auswertung.' },
      { id: 'contentRetainer', label: 'Contentretainer, zwei Artikel pro Monat', price: '390 CHF pro Monat', info: 'Zwei Artikel pro Monat, geschrieben auf eine echte Suchfrage, mit internen Links zu Ihren Dienstseiten. Der Hebel der weiter skaliert.' },
      { id: 'reviewManagement', label: 'Reviewmanagement', price: '95 CHF pro Monat', info: 'Wir fragen Bewertungen zum richtigen Zeitpunkt bei Ihren Kunden ab, folgen nach und helfen beim Beantworten.' },
    ],
    priceTitle: 'Ihr Preis',
    reset: 'Zurücksetzen',
    perMonth: '/Monat',
    oneTime: 'einmalig',
    perShort: '/M',
    onceShort: 'einm.',
    manualQuote: 'Wir schauen uns Ihre Website an und senden Ihnen einen Preis innerhalb von zwei Werktagen.',
    cta: 'Offerte anfragen',
    finePrint: 'Keine Einrichtungskosten. Mindestlaufzeit sechsunddreissig Monate. Beträge exklusive 8,1% MWST.',
    lineLabel: {
      base: 'Basis', extraPages: 'Zusätzliche Seiten', webshop: 'Webshop', webshopProducts: 'Über 100 Produkte',
      productImport: 'Produktimport', logo: 'Logo und Markenrichtlinien', extraLanguage: 'Extra Sprache',
      structuredData: 'Erweiterte strukturierte Daten', migration: 'Migrations und Redirectplan',
      audit: 'Crawler und Indexierungsaudit', answerBlocks: 'Antwortblöcke neu geschrieben',
      entityLocal: 'Entitäts und lokale Auffindbarkeit', analyticsConsent: 'Analytics und Consent',
      visibilityLoop: 'Sichtbarkeitsschleife', visibilityLoopSetup: 'Sichtbarkeitsschleife Einrichtung', googleAds: 'Google Ads', googleAdsSetup: 'Google Ads Einrichtung',
      contentRetainer: 'Contentretainer', reviewManagement: 'Reviewmanagement',
    },
    summary: {
      title: 'Konfiguration aus dem Preisrechner:', situation: 'Situation', new: 'Neue Website', existing: 'Bestehende Website',
      pages: 'Seiten', webshopYes: 'Webshop: ja, {n} Produkte', totalLabel: 'Total', monthWord: 'pro Monat',
      onceWord: 'einmalig', manualNote: '(enthält Positionen auf Offerte)',
    },
  },
  explainer: {
    h2: 'Alles was eine gute Website braucht, ist dabei',
    lead: 'Wir rechnen nichts extra für die Dinge, die eine Website einfach gut machen. Eine Website die daran sparen muss, ist keine Website sondern ein Kostenpunkt.',
    includes: [
      { title: 'Wir denken zuerst nach, dann bauen wir.', text: 'Bevor eine Seite gemacht wird, legen wir gemeinsam fest wer Ihr Kunde ist, welche Frage er stellt und was jede Seite tun soll. Ohne diesen Schritt bekommen Sie eine Website die schön aussieht und nichts bringt, und dann zahlen Sie zweimal.' },
      { title: 'Sie stehen in Google.', text: 'Ihre Website wird angemeldet, Ihre Seitenkarte wird eingereicht und jede Seite bekommt einen eigenen Titel und eine Beschreibung. Klingt selbstverständlich, ist aber der häufigste Grund dass eine Website unauffindbar bleibt.' },
      { title: 'Schnell und funktionierend auf dem Telefon.', text: 'Wir bauen auf den Geschwindigkeitswerten die Google selbst verwendet. Mehr als die Hälfte Ihrer Besucher kommt über ein Handy.' },
      { title: 'Maschinen verstehen wer Sie sind.', text: 'Im Code Ihrer Website stehen Ihr Name, Ihre Adresse, Ihr Telefon und Ihre Firmennummer in einer Form die Suchmaschinen und AI Systeme wörtlich lesen können. So müssen sie nichts raten.' },
      { title: 'Ihre Texte sind geeignet um zitiert zu werden.', text: 'Oben auf jeder Seite steht eine kurze Antwort auf die Frage der Seite, geschrieben sodass ChatGPT oder Google sie wörtlich übernehmen kann. Das ist der Unterschied zwischen gefunden werden und genannt werden.' },
      { title: 'AI Systeme dürfen herein.', text: 'Wir setzen ausdrücklich in Ihren Einstellungen dass ChatGPT, Perplexity und der Rest Ihre Website lesen dürfen. Viele Websites blockieren das versehentlich, ohne dass es jemand merkt.' },
      { title: 'Nutzbar für alle.', text: 'Ausreichend Kontrast, bedienbar mit Tastatur, lesbar für einen Screenreader. Ab 2027 ist das in der Schweiz verpflichtend. Bei uns ist es heute schon Standard, also müssen Sie später nichts nachholen.' },
      { title: 'Ihre Angaben stimmen überall.', text: 'Wir richten Ihr Google Unternehmensprofil ein und sorgen dass Ihr Name, Ihre Adresse und Ihre Telefonnummer auf jedem Kanal identisch sind. Das bewegt lokale Auffindbarkeit am stärksten.' },
      { title: 'Sie sehen was Ihre Website bringt.', text: 'Besucherstatistiken korrekt eingerichtet, innerhalb der Datenschutzregeln, mit einer Cookie Meldung die dazu passt.' },
      { title: 'Hosting, Sicherheit und Backup.', text: 'Ihre Website läuft bei uns, bleibt erreichbar und wird täglich gesichert. Eine Rechnung, ein Ansprechpartner.' },
      { title: 'Unbegrenzte kleine Textänderungen.', text: 'Schicken Sie eine Mail und es steht da, meist innerhalb von zwei Werktagen. Sie müssen nie zweifeln ob eine Änderung die Mühe wert ist.' },
      { title: 'Erweiterte strukturierte Daten.', text: 'Google zeigt Ihre Dienste und häufigen Fragen direkt in den Suchergebnissen, sodass Ihre Seite mehr Platz und mehr Klicks bekommt.' },
      { title: 'Migrations und Redirectplan.', text: 'Ersetzt Ihre neue Website eine alte, leiten wir jede alte Adresse auf die neue um, damit Sie Ihre aufgebauten Google Positionen behalten.' },
    ],
    conditionsTitle: 'Bedingungen',
    conditionsText: 'Warum sechsunddreissig Monate. Sie zahlen nichts im Voraus. Wir bauen Ihre Website und verdienen sie über die Laufzeit Ihres Abos zurück. Daher vereinbaren wir eine Mindestlaufzeit von drei Jahren, und danach ist Ihr Abo monatlich kündbar. Während Ihres Abos gehört die Website uns und Sie nutzen sie, wie bei einem Leasingwagen. Kündigen Sie, geht die Website offline und Sie erhalten Ihre Texte und Fotos mit.',
  },
};

const en: PricingCopy = {
  tabs: { website: 'Website', auto: 'Automation', ai: 'AI', platforms: 'Platforms', consultancy: 'Consultancy' },
  webshopBadge: '+ Webshop',
  tabIntro: {
    auto: 'Recurring tasks and your email marketing run automatically, so no lead and no customer is forgotten.',
    ai: 'Practical AI assistants for support, leads and internal work, trained on your content.',
    platforms: 'Dashboards, CRM systems and customer portals in one connected platform. Scope and price per project.',
    consultancy: 'Independent digital advice. Scope and price per engagement.',
  },
  cfg: {
    step1: 'Step 1 · Your situation',
    stepExtrasNew: 'Step 3 · Extras',
    stepExtrasExisting: 'Step 2 · Extras',
    step2Pages: 'Step 2 · Number of pages',
    monthly: 'Ongoing add ons',
    moreInfo: 'More info',
    presetLabel: 'Popular choice',
    whatsIncluded: 'What else is included',
    popularTag: 'Popular',
    situationNew: 'New website',
    situationExisting: 'I already have a website',
    pagesUnit: 'pages',
    pagesHelp: 'Ten pages are included in the plan.',
    pages199: 'From {n} pages your plan becomes 199 CHF per month, because unlimited changes on more pages are more work.',
    webshopTitle: 'Add a webshop',
    webshopPrice: 'plus 150 CHF per month',
    webshopDesc: 'Sell from your website: product catalogue, cart, checkout, Twint and card payment, shipping rules and VAT.',
    productsUnit: 'products',
    productsHelp: 'You manage your products yourself in the admin area.',
    products101: 'Above 1000 products a monthly surcharge applies, rising further at 2500 and 5000 products.',
    languagesCount: 'Number of languages',
    productImport: { id: 'productImport', label: 'Product import from a list or CSV', price: '490 CHF one time', info: 'We import your products from an existing list or CSV, so you do not enter everything by hand.' },
    erpLink: { id: 'erpLink', label: 'Link with your accounting or ERP', price: 'on quote', info: 'We connect your shop with your accounting or ERP. Scope and price per system on quote.' },
    newExtras: [
      { id: 'extraLanguage', label: 'Extra language, including hreflang', price: '290 CHF per language', info: 'Your whole website in another language, with the hreflang tags that tell Google which version fits which visitor.' },
      { id: 'logo', label: 'Logo and brand guidelines', price: '750 CHF one time', info: 'A fitting logo and a compact brand guide for a consistent, professional image.' },
    ],
    existingExtras: [
      { id: 'audit', label: 'Crawler and indexing audit', price: '190 CHF one time', info: 'We check whether your site is in the Google index, whether the sitemap is correct and whether AI crawlers really get in, and tell you what to fix.' },
      { id: 'extraLanguage', label: 'Add an extra language', price: '490 CHF per language', info: 'Another language version of your existing site, including the hreflang tags for Google.' },
      { id: 'structuredData', label: 'Add structured data', price: '490 CHF one time', info: 'Extra data in the source so Google and AI systems understand and display your services, FAQ and navigation better.' },
      { id: 'answerBlocks', label: 'Rewrite answer blocks', price: '75 CHF per page or 690 CHF per ten', info: 'We write short blocks at the top of your pages that fully answer a question, so AI answer engines quote you.' },
      { id: 'entityLocal', label: 'Entity and local findability', price: '490 CHF one time', info: 'Your Google Business Profile and your details identical everywhere, plus listings on the directories that are read in your sector.' },
      { id: 'analyticsConsent', label: 'Analytics and consent setup', price: '290 CHF one time', info: 'GA4 and Consent Mode set up correctly with a cookie banner and conversion goals, so you see what your website brings.' },
      { id: 'cwv', label: 'Core Web Vitals optimisation', price: 'from 390 CHF on quote', info: 'We make your existing site faster and more stable to the values Google uses for load time and responsiveness.' },
      { id: 'accessibility', label: 'Accessibility to WCAG 2.2 AA', price: 'from 690 CHF on quote', info: 'We bring your site to the WCAG 2.2 AA standard so it is usable with keyboard and screen reader too.' },
    ],
    monthlyExtras: [
      { id: 'visibilityLoop', label: 'Visibility loop, SEO and GEO monitoring', price: '190 CHF per month plus 490 CHF setup', info: 'Each month we measure whether you are named in ChatGPT, Google AI Overviews, Perplexity and Copilot, plus Search Console, and improve one page. You get three metrics and one action point.' },
      { id: 'googleAds', label: 'Google Ads management', price: '190 CHF per month plus 490 CHF setup', info: 'We set up and run your Google Ads: campaigns, keywords, ads, bids and conversion tracking, with a monthly report.' },
      { id: 'contentRetainer', label: 'Content retainer, two articles per month', price: '390 CHF per month', info: 'Two articles a month, written on a real search question, with internal links to your service pages. The lever that keeps scaling.' },
      { id: 'reviewManagement', label: 'Review management', price: '95 CHF per month', info: 'We ask your customers for reviews at the right moment, follow up and help you reply.' },
    ],
    priceTitle: 'Your price',
    reset: 'Reset',
    perMonth: '/month',
    oneTime: 'one time',
    perShort: '/m',
    onceShort: 'once',
    manualQuote: 'We look at your website and send you a price within two working days.',
    cta: 'Request your quote',
    finePrint: 'No setup cost. Minimum term thirty six months. Amounts exclude 8.1% VAT.',
    lineLabel: {
      base: 'Base', extraPages: 'Extra pages', webshop: 'Webshop', webshopProducts: 'Above 100 products',
      productImport: 'Product import', logo: 'Logo and brand guidelines', extraLanguage: 'Extra language',
      structuredData: 'Extended structured data', migration: 'Migration and redirect plan',
      audit: 'Crawler and indexing audit', answerBlocks: 'Answer blocks rewritten',
      entityLocal: 'Entity and local findability', analyticsConsent: 'Analytics and consent',
      visibilityLoop: 'Visibility loop', visibilityLoopSetup: 'Visibility loop setup', googleAds: 'Google Ads', googleAdsSetup: 'Google Ads setup',
      contentRetainer: 'Content retainer', reviewManagement: 'Review management',
    },
    summary: {
      title: 'Configuration from the price calculator:', situation: 'Situation', new: 'New website', existing: 'Existing website',
      pages: 'Pages', webshopYes: 'Webshop: yes, {n} products', totalLabel: 'Total', monthWord: 'per month',
      onceWord: 'one time', manualNote: '(includes items on quote)',
    },
  },
  explainer: {
    h2: 'What is always included, for 99 CHF per month',
    lead: 'Ten pages, built, hosted and maintained. You pay nothing up front. Everything below is standard. We charge nothing extra for the things that simply make a website good.',
    includes: [
      { title: 'Business analysis first', text: 'Before a page is built we define who your visitor is, what question they ask and what each page should do. Without this step you get a website that looks good and does nothing.' },
      { title: 'Technical SEO', text: 'Your site is in the Google index, has an XML sitemap, is connected to Search Console and every page has one H1, a unique title and a meta description. This is the starting point.' },
      { title: 'Core Web Vitals and mobile', text: 'Built on the thresholds Google itself uses for load time, shift and responsiveness, and working on a phone.' },
      { title: 'Organization or LocalBusiness schema', text: 'A block of structured data in the source that tells search engines and AI systems who you are: name, address, phone, company number and your profiles. This is what a machine reads instead of guessing.' },
      { title: 'AI citable content', text: 'At the top of every page a block of three to five sentences that fully answers the page question, written so an answer engine can quote it word for word.' },
      { title: 'robots.txt with AI crawler allowlist and llms.txt', text: 'Two text files that decide whether AI answer engines may read your site. We explicitly allow the eighteen relevant crawlers.' },
      { title: 'Accessibility to WCAG 2.2 AA', text: 'Contrast, keyboard operation, alternative text, form labels and screen reader support. The revised BehiG makes digital accessibility mandatory for private companies from 2027. We build every site accessible, even when you do not have to yet.' },
      { title: 'Entity and local findability', text: 'Your Google Business Profile set up, name, address and phone identical character for character on every channel, your profiles linked through sameAs, and your listing on the directories that are actually read in your sector.' },
      { title: 'Analytics and consent', text: 'GA4 set up correctly, Consent Mode v2 so measurement keeps working within European rules, and a cookie banner that matches. Including conversion goals.' },
      { title: 'Hosting, SSL, updates and daily backup', text: 'Your site runs with us, stays reachable and stays secure. No separate hosting bill and no second point of contact.' },
      { title: 'Unlimited small text changes', text: 'Send an email and it is there, usually within two working days. So your site does not age, and correct details are exactly what search engines and AI answer engines reward.' },
      { title: 'Extended structured data', text: 'Google shows your services and common questions directly in the search results, so your page takes more space and gets more clicks.' },
      { title: 'Migration and redirect plan', text: 'If your new site replaces an old one, we redirect every old address to the new one so you keep the Google positions you built.' },
    ],
    conditionsTitle: 'Terms',
    conditionsText: 'Minimum term thirty six months, then cancellable monthly with one month notice. Because there is no setup cost we pre finance the build and earn it back over the term. During the plan the site is ours and you use it. If you cancel, the site goes offline and you receive your texts and images.',
  },
};

const fr: PricingCopy = {
  tabs: { website: 'Website', auto: 'Automatisation', ai: 'AI', platforms: 'Plateformes', consultancy: 'Consultancy' },
  webshopBadge: '+ Webshop',
  tabIntro: {
    auto: 'Les tâches récurrentes et votre email marketing tournent automatiquement, pour que ni un lead ni un client ne soit oublié.',
    ai: 'Des assistants AI pratiques pour le support, les leads et le travail interne, entraînés sur vos contenus.',
    platforms: 'Tableaux de bord, systèmes CRM et portails clients dans une plateforme reliée. Périmètre et prix par projet.',
    consultancy: 'Conseil digital indépendant. Périmètre et prix par mission.',
  },
  cfg: {
    step1: 'Étape 1 · Votre situation',
    stepExtrasNew: 'Étape 3 · Extras',
    stepExtrasExisting: 'Étape 2 · Extras',
    step2Pages: 'Étape 2 · Nombre de pages',
    monthly: 'Extensions récurrentes',
    moreInfo: 'Plus d\'infos',
    presetLabel: 'Choix populaire',
    whatsIncluded: 'Ce qui est encore inclus',
    popularTag: 'Populaire',
    situationNew: 'Nouveau site',
    situationExisting: "J'ai déjà un site",
    pagesUnit: 'pages',
    pagesHelp: 'Dix pages sont incluses dans l\'abonnement.',
    pages199: 'À partir de {n} pages votre abonnement passe à 199 CHF par mois, car des modifications illimitées sur plus de pages représentent plus de travail.',
    webshopTitle: 'Ajouter un webshop',
    webshopPrice: 'plus 150 CHF par mois',
    webshopDesc: 'Vendre depuis votre site: catalogue produits, panier, caisse, Twint et paiement par carte, règles de livraison et TVA.',
    productsUnit: 'produits',
    productsHelp: 'Vous gérez vos produits vous même dans l\'espace d\'administration.',
    products101: 'À partir de 1000 produits un supplément mensuel s\'ajoute, qui augmente encore à 2500 et 5000 produits.',
    languagesCount: 'Nombre de langues',
    productImport: { id: 'productImport', label: 'Import produits depuis une liste ou un CSV', price: '490 CHF une fois', info: 'Nous importons vos produits depuis une liste existante ou un CSV, pour que vous ne saisissiez pas tout à la main.' },
    erpLink: { id: 'erpLink', label: 'Liaison avec votre comptabilité ou ERP', price: 'sur devis', info: 'Nous relions votre boutique à votre comptabilité ou votre ERP. Périmètre et prix par système sur devis.' },
    newExtras: [
      { id: 'extraLanguage', label: 'Langue supplémentaire, hreflang inclus', price: '290 CHF par langue', info: 'Tout votre site dans une autre langue, avec les balises hreflang qui disent à Google quelle version convient à quel visiteur.' },
      { id: 'logo', label: 'Logo et charte graphique', price: '750 CHF une fois', info: 'Un logo adapté et un guide de marque compact pour une image cohérente et professionnelle.' },
    ],
    existingExtras: [
      { id: 'audit', label: 'Audit de crawl et d\'indexation', price: '190 CHF une fois', info: 'Nous vérifions si votre site est dans l\'index de Google, si le sitemap est correct et si les crawlers AI entrent vraiment, et vous disons quoi corriger.' },
      { id: 'extraLanguage', label: 'Ajouter une langue', price: '490 CHF par langue', info: 'Une version supplémentaire de votre site existant, avec les balises hreflang pour Google.' },
      { id: 'structuredData', label: 'Ajouter des données structurées', price: '490 CHF une fois', info: 'Des données en plus dans le code pour que Google et les systèmes AI comprennent et affichent mieux vos services, FAQ et navigation.' },
      { id: 'answerBlocks', label: 'Réécrire les blocs de réponse', price: '75 CHF par page ou 690 CHF par dix', info: 'Nous écrivons en haut de vos pages de courts blocs qui répondent entièrement à une question, pour que les moteurs de réponse AI vous citent.' },
      { id: 'entityLocal', label: 'Visibilité d\'entité et locale', price: '490 CHF une fois', info: 'Votre profil Google Business et vos informations identiques partout, plus des mentions sur les annuaires lus dans votre secteur.' },
      { id: 'analyticsConsent', label: 'Mise en place analytics et consentement', price: '290 CHF une fois', info: 'GA4 et Consent Mode correctement configurés avec bannière cookies et objectifs de conversion, pour voir ce que votre site rapporte.' },
      { id: 'cwv', label: 'Optimisation Core Web Vitals', price: 'dès 390 CHF sur devis', info: 'Nous rendons votre site existant plus rapide et plus stable selon les valeurs que Google utilise pour le chargement et la réactivité.' },
      { id: 'accessibility', label: 'Accessibilité au niveau WCAG 2.2 AA', price: 'dès 690 CHF sur devis', info: 'Nous amenons votre site au niveau WCAG 2.2 AA pour qu\'il soit utilisable aussi au clavier et au lecteur d\'écran.' },
    ],
    monthlyExtras: [
      { id: 'visibilityLoop', label: 'Boucle de visibilité, monitoring SEO et GEO', price: '190 CHF par mois plus 490 CHF de mise en place', info: 'Chaque mois nous mesurons si vous êtes cité dans ChatGPT, Google AI Overviews, Perplexity et Copilot, plus Search Console, et améliorons une page. Vous recevez trois indicateurs et un point d\'action.' },
      { id: 'googleAds', label: 'Gestion Google Ads', price: '190 CHF par mois plus 490 CHF de mise en place', info: 'Nous mettons en place et gérons vos Google Ads: campagnes, mots clés, annonces, enchères et suivi de conversion, avec un rapport mensuel.' },
      { id: 'contentRetainer', label: 'Retainer de contenu, deux articles par mois', price: '390 CHF par mois', info: 'Deux articles par mois, écrits sur une vraie requête, avec des liens internes vers vos pages de service. Le levier qui continue de croître.' },
      { id: 'reviewManagement', label: 'Gestion des avis', price: '95 CHF par mois', info: 'Nous demandons des avis à vos clients au bon moment, faisons le suivi et aidons à répondre.' },
    ],
    priceTitle: 'Votre prix',
    reset: 'Réinitialiser',
    perMonth: '/mois',
    oneTime: 'une fois',
    perShort: '/m',
    onceShort: 'unique',
    manualQuote: 'Nous regardons votre site et vous envoyons un prix sous deux jours ouvrables.',
    cta: 'Demander votre offre',
    finePrint: 'Aucun frais de mise en place. Durée minimale trente six mois. Montants hors TVA de 8,1%.',
    lineLabel: {
      base: 'Base', extraPages: 'Pages supplémentaires', webshop: 'Webshop', webshopProducts: 'Au delà de 100 produits',
      productImport: 'Import produits', logo: 'Logo et charte graphique', extraLanguage: 'Langue supplémentaire',
      structuredData: 'Données structurées étendues', migration: 'Plan de migration et de redirection',
      audit: 'Audit de crawl et d\'indexation', answerBlocks: 'Blocs de réponse réécrits',
      entityLocal: 'Visibilité d\'entité et locale', analyticsConsent: 'Analytics et consentement',
      visibilityLoop: 'Boucle de visibilité', visibilityLoopSetup: 'Mise en place boucle de visibilité', googleAds: 'Google Ads', googleAdsSetup: 'Mise en place Google Ads',
      contentRetainer: 'Retainer de contenu', reviewManagement: 'Gestion des avis',
    },
    summary: {
      title: 'Configuration du calculateur de prix:', situation: 'Situation', new: 'Nouveau site', existing: 'Site existant',
      pages: 'Pages', webshopYes: 'Webshop: oui, {n} produits', totalLabel: 'Total', monthWord: 'par mois',
      onceWord: 'une fois', manualNote: '(contient des positions sur devis)',
    },
  },
  explainer: {
    h2: 'Ce qui est toujours inclus, pour 99 CHF par mois',
    lead: 'Dix pages, construites, hébergées et entretenues. Vous ne payez rien à l\'avance. Tout ci dessous est standard. Nous ne facturons rien de plus pour ce qui rend simplement un site bon.',
    includes: [
      { title: 'Analyse business d\'abord', text: 'Avant qu\'une page soit construite, nous définissons qui est votre visiteur, quelle question il pose et ce que chaque page doit faire. Sans cette étape, vous obtenez un site qui a l\'air bien et ne fait rien.' },
      { title: 'SEO technique', text: 'Votre site est dans l\'index de Google, a un sitemap XML, est relié à la Search Console et chaque page a un H1, un titre unique et une meta description. C\'est le point de départ.' },
      { title: 'Core Web Vitals et mobile', text: 'Construit sur les seuils que Google utilise lui même pour le temps de chargement, le décalage et la réactivité, et fonctionnant sur un téléphone.' },
      { title: 'Schéma Organization ou LocalBusiness', text: 'Un bloc de données structurées dans le code qui dit aux moteurs et aux systèmes AI qui vous êtes: nom, adresse, téléphone, numéro d\'entreprise et vos profils. Voilà ce qu\'une machine lit au lieu de deviner.' },
      { title: 'Contenu citable par l\'AI', text: 'En haut de chaque page un bloc de trois à cinq phrases qui répond entièrement à la question de la page, écrit pour qu\'un moteur de réponse puisse le citer mot pour mot.' },
      { title: 'robots.txt avec allowlist de crawlers AI et llms.txt', text: 'Deux fichiers texte qui décident si les moteurs de réponse AI peuvent lire votre site. Nous autorisons explicitement les dix huit crawlers pertinents.' },
      { title: 'Accessibilité au niveau WCAG 2.2 AA', text: 'Contraste, navigation au clavier, textes alternatifs, labels de formulaire et support des lecteurs d\'écran. La révision de la BehiG rend l\'accessibilité numérique obligatoire pour les entreprises privées dès 2027. Nous construisons chaque site accessible, même quand vous n\'y êtes pas encore tenu.' },
      { title: 'Visibilité d\'entité et locale', text: 'Votre profil Google Business configuré, nom, adresse et téléphone identiques caractère par caractère sur chaque canal, vos profils reliés via sameAs, et votre mention sur les annuaires vraiment lus dans votre secteur.' },
      { title: 'Analytics et consentement', text: 'GA4 correctement configuré, Consent Mode v2 pour que la mesure continue de fonctionner dans les règles européennes, et une bannière cookies qui va avec. Objectifs de conversion inclus.' },
      { title: 'Hébergement, SSL, mises à jour et sauvegarde quotidienne', text: 'Votre site tourne chez nous, reste accessible et reste sûr. Pas de facture d\'hébergement séparée et pas de deuxième interlocuteur.' },
      { title: 'Modifications de texte illimitées', text: 'Envoyez un mail et c\'est en ligne, généralement sous deux jours ouvrables. Ainsi votre site ne vieillit pas, et des informations exactes sont exactement ce que les moteurs et les moteurs de réponse AI récompensent.' },
      { title: 'Données structurées étendues', text: 'Google montre vos services et vos questions fréquentes directement dans les résultats, donc votre page prend plus de place et récolte plus de clics.' },
      { title: 'Plan de migration et de redirection', text: 'Si votre nouveau site remplace un ancien, nous redirigeons chaque ancienne adresse vers la nouvelle pour garder vos positions Google.' },
    ],
    conditionsTitle: 'Conditions',
    conditionsText: 'Durée minimale trente six mois, ensuite résiliable mensuellement avec un préavis d\'un mois. Comme il n\'y a pas de frais de mise en place, nous préfinançons la construction et la récupérons sur la durée. Pendant l\'abonnement le site nous appartient et vous l\'utilisez. Si vous résiliez, le site passe hors ligne et vous recevez vos textes et images.',
  },
};

const es: PricingCopy = {
  tabs: { website: 'Website', auto: 'Automatización', ai: 'AI', platforms: 'Plataformas', consultancy: 'Consultancy' },
  webshopBadge: '+ Webshop',
  tabIntro: {
    auto: 'Las tareas recurrentes y su email marketing funcionan de forma automática, para que no se olvide ningún lead ni ningún cliente.',
    ai: 'Asistentes AI prácticos para soporte, leads y trabajo interno, entrenados con sus contenidos.',
    platforms: 'Dashboards, sistemas CRM y portales de clientes en una plataforma conectada. Alcance y precio por proyecto.',
    consultancy: 'Asesoramiento digital independiente. Alcance y precio por encargo.',
  },
  cfg: {
    step1: 'Paso 1 · Su situación',
    stepExtrasNew: 'Paso 3 · Extras',
    stepExtrasExisting: 'Paso 2 · Extras',
    step2Pages: 'Paso 2 · Número de páginas',
    monthly: 'Extensiones recurrentes',
    moreInfo: 'Más info',
    presetLabel: 'Elección popular',
    whatsIncluded: 'Qué más está incluido',
    popularTag: 'Popular',
    situationNew: 'Sitio nuevo',
    situationExisting: 'Ya tengo un sitio',
    pagesUnit: 'páginas',
    pagesHelp: 'Diez páginas están incluidas en la suscripción.',
    pages199: 'A partir de {n} páginas su suscripción pasa a 199 CHF por mes, porque los cambios ilimitados en más páginas son más trabajo.',
    webshopTitle: 'Añadir una webshop',
    webshopPrice: 'más 150 CHF por mes',
    webshopDesc: 'Vender desde su sitio: catálogo de productos, carrito, pago, Twint y pago con tarjeta, reglas de envío e IVA.',
    productsUnit: 'productos',
    productsHelp: 'Usted gestiona sus productos en el área de administración.',
    products101: 'A partir de 1000 productos se añade un suplemento mensual, que aumenta más a 2500 y 5000 productos.',
    languagesCount: 'Número de idiomas',
    productImport: { id: 'productImport', label: 'Importación de productos desde una lista o CSV', price: '490 CHF pago único', info: 'Importamos sus productos desde una lista existente o CSV, para que no introduzca todo a mano.' },
    erpLink: { id: 'erpLink', label: 'Conexión con su contabilidad o ERP', price: 'a consultar', info: 'Conectamos su tienda con su contabilidad o su ERP. Alcance y precio por sistema a consultar.' },
    newExtras: [
      { id: 'extraLanguage', label: 'Idioma adicional, hreflang incluido', price: '290 CHF por idioma', info: 'Todo su sitio en otro idioma, con las etiquetas hreflang que dicen a Google qué versión corresponde a qué visitante.' },
      { id: 'logo', label: 'Logo y manual de marca', price: '750 CHF pago único', info: 'Un logo adecuado y una guía de marca compacta para una imagen coherente y profesional.' },
    ],
    existingExtras: [
      { id: 'audit', label: 'Auditoría de rastreo e indexación', price: '190 CHF pago único', info: 'Comprobamos si su sitio está en el índice de Google, si el sitemap es correcto y si los crawlers AI entran de verdad, y le decimos qué corregir.' },
      { id: 'extraLanguage', label: 'Añadir un idioma', price: '490 CHF por idioma', info: 'Una versión más de su sitio existente, con las etiquetas hreflang para Google.' },
      { id: 'structuredData', label: 'Añadir datos estructurados', price: '490 CHF pago único', info: 'Datos adicionales en el código para que Google y los sistemas AI entiendan y muestren mejor sus servicios, FAQ y navegación.' },
      { id: 'answerBlocks', label: 'Reescribir bloques de respuesta', price: '75 CHF por página o 690 CHF por diez', info: 'Escribimos arriba de sus páginas bloques cortos que responden por completo a una pregunta, para que los motores de respuesta AI le citen.' },
      { id: 'entityLocal', label: 'Visibilidad de entidad y local', price: '490 CHF pago único', info: 'Su perfil de Google Business y sus datos idénticos en todas partes, más menciones en los directorios que se leen en su sector.' },
      { id: 'analyticsConsent', label: 'Configuración de analytics y consentimiento', price: '290 CHF pago único', info: 'GA4 y Consent Mode configurados correctamente con banner de cookies y objetivos de conversión, para ver qué aporta su sitio.' },
      { id: 'cwv', label: 'Optimización de Core Web Vitals', price: 'desde 390 CHF a consultar', info: 'Hacemos su sitio existente más rápido y estable según los valores que Google usa para carga y respuesta.' },
      { id: 'accessibility', label: 'Accesibilidad a WCAG 2.2 AA', price: 'desde 690 CHF a consultar', info: 'Llevamos su sitio al estándar WCAG 2.2 AA para que también sea usable con teclado y lector de pantalla.' },
    ],
    monthlyExtras: [
      { id: 'visibilityLoop', label: 'Bucle de visibilidad, monitoreo SEO y GEO', price: '190 CHF por mes más 490 CHF de configuración', info: 'Cada mes medimos si le mencionan en ChatGPT, Google AI Overviews, Perplexity y Copilot, más Search Console, y mejoramos una página. Recibe tres indicadores y un punto de acción.' },
      { id: 'googleAds', label: 'Gestión de Google Ads', price: '190 CHF por mes más 490 CHF de configuración', info: 'Configuramos y gestionamos sus Google Ads: campañas, palabras clave, anuncios, pujas y seguimiento de conversión, con informe mensual.' },
      { id: 'contentRetainer', label: 'Retainer de contenido, dos artículos por mes', price: '390 CHF por mes', info: 'Dos artículos al mes, escritos sobre una búsqueda real, con enlaces internos a sus páginas de servicio. La palanca que sigue creciendo.' },
      { id: 'reviewManagement', label: 'Gestión de reseñas', price: '95 CHF por mes', info: 'Pedimos reseñas a sus clientes en el momento adecuado, hacemos seguimiento y ayudamos a responder.' },
    ],
    priceTitle: 'Su precio',
    reset: 'Restablecer',
    perMonth: '/mes',
    oneTime: 'pago único',
    perShort: '/m',
    onceShort: 'único',
    manualQuote: 'Revisamos su sitio y le enviamos un precio en dos días laborables.',
    cta: 'Solicitar su oferta',
    finePrint: 'Sin coste de configuración. Duración mínima treinta y seis meses. Importes sin el 8,1% de IVA.',
    lineLabel: {
      base: 'Base', extraPages: 'Páginas adicionales', webshop: 'Webshop', webshopProducts: 'Más de 100 productos',
      productImport: 'Importación de productos', logo: 'Logo y manual de marca', extraLanguage: 'Idioma adicional',
      structuredData: 'Datos estructurados ampliados', migration: 'Plan de migración y redirección',
      audit: 'Auditoría de rastreo e indexación', answerBlocks: 'Bloques de respuesta reescritos',
      entityLocal: 'Visibilidad de entidad y local', analyticsConsent: 'Analytics y consentimiento',
      visibilityLoop: 'Bucle de visibilidad', visibilityLoopSetup: 'Configuración bucle de visibilidad', googleAds: 'Google Ads', googleAdsSetup: 'Configuración de Google Ads',
      contentRetainer: 'Retainer de contenido', reviewManagement: 'Gestión de reseñas',
    },
    summary: {
      title: 'Configuración del calculador de precios:', situation: 'Situación', new: 'Sitio nuevo', existing: 'Sitio existente',
      pages: 'Páginas', webshopYes: 'Webshop: sí, {n} productos', totalLabel: 'Total', monthWord: 'por mes',
      onceWord: 'pago único', manualNote: '(incluye posiciones a consultar)',
    },
  },
  explainer: {
    h2: 'Lo que siempre está incluido, por 99 CHF por mes',
    lead: 'Diez páginas, construidas, alojadas y mantenidas. No paga nada por adelantado. Todo lo de abajo es estándar. No cobramos nada extra por las cosas que simplemente hacen bueno un sitio.',
    includes: [
      { title: 'Análisis de negocio primero', text: 'Antes de construir una página definimos quién es su visitante, qué pregunta hace y qué debe hacer cada página. Sin este paso obtiene un sitio que se ve bien y no hace nada.' },
      { title: 'SEO técnico', text: 'Su sitio está en el índice de Google, tiene un sitemap XML, está conectado a Search Console y cada página tiene un H1, un título único y una meta description. Este es el punto de partida.' },
      { title: 'Core Web Vitals y móvil', text: 'Construido sobre los umbrales que Google usa para tiempo de carga, desplazamiento y capacidad de respuesta, y funcionando en un teléfono.' },
      { title: 'Esquema Organization o LocalBusiness', text: 'Un bloque de datos estructurados en el código que dice a los buscadores y sistemas AI quién es usted: nombre, dirección, teléfono, número de empresa y sus perfiles. Esto es lo que lee una máquina en lugar de adivinar.' },
      { title: 'Contenido citable por la AI', text: 'Arriba de cada página un bloque de tres a cinco frases que responde por completo a la pregunta de la página, escrito para que un motor de respuesta pueda citarlo palabra por palabra.' },
      { title: 'robots.txt con allowlist de crawlers AI y llms.txt', text: 'Dos archivos de texto que deciden si los motores de respuesta AI pueden leer su sitio. Permitimos explícitamente los dieciocho crawlers relevantes.' },
      { title: 'Accesibilidad a WCAG 2.2 AA', text: 'Contraste, manejo por teclado, textos alternativos, etiquetas de formulario y soporte de lectores de pantalla. La revisión de la BehiG hace obligatoria la accesibilidad digital para empresas privadas desde 2027. Construimos cada sitio accesible, incluso cuando aún no está obligado.' },
      { title: 'Visibilidad de entidad y local', text: 'Su perfil de Google Business configurado, nombre, dirección y teléfono idénticos carácter por carácter en cada canal, sus perfiles enlazados vía sameAs, y su mención en los directorios que realmente se leen en su sector.' },
      { title: 'Analytics y consentimiento', text: 'GA4 configurado correctamente, Consent Mode v2 para que la medición siga funcionando dentro de las reglas europeas, y un banner de cookies acorde. Objetivos de conversión incluidos.' },
      { title: 'Hosting, SSL, actualizaciones y copia diaria', text: 'Su sitio funciona con nosotros, sigue accesible y sigue seguro. Sin factura de hosting aparte y sin un segundo interlocutor.' },
      { title: 'Cambios de texto pequeños ilimitados', text: 'Envíe un correo y ahí está, normalmente en dos días laborables. Así su sitio no envejece, y los datos correctos son justo lo que premian los buscadores y los motores de respuesta AI.' },
      { title: 'Datos estructurados ampliados', text: 'Google muestra sus servicios y preguntas frecuentes directamente en los resultados, así su página ocupa más espacio y recibe más clics.' },
      { title: 'Plan de migración y redirección', text: 'Si su nuevo sitio reemplaza uno antiguo, redirigimos cada dirección antigua a la nueva para conservar sus posiciones en Google.' },
    ],
    conditionsTitle: 'Condiciones',
    conditionsText: 'Duración mínima treinta y seis meses, luego cancelable mensualmente con un mes de preaviso. Como no hay coste de configuración, prefinanciamos la construcción y la recuperamos durante el plazo. Durante la suscripción el sitio es nuestro y usted lo usa. Si cancela, el sitio queda fuera de línea y recibe sus textos e imágenes.',
  },
};

const nl: PricingCopy = {
  tabs: { website: 'Website', auto: 'Automatisering', ai: 'AI', platforms: 'Platformen', consultancy: 'Consultancy' },
  webshopBadge: '+ Webshop',
  tabIntro: {
    auto: 'Terugkerende taken en uw email marketing lopen automatisch, zodat geen lead en geen klant vergeten wordt.',
    ai: 'Praktische AI assistenten voor support, leads en intern werk, getraind op uw content.',
    platforms: 'Dashboards, CRM systemen en klantportalen in één verbonden platform. Omvang en prijs per project.',
    consultancy: 'Onafhankelijk digitaal advies. Omvang en prijs per opdracht.',
  },
  cfg: {
    step1: 'Stap 1 · Uw situatie',
    stepExtrasNew: 'Stap 3 · Extra\'s',
    stepExtrasExisting: 'Stap 2 · Extra\'s',
    step2Pages: 'Stap 2 · Aantal pagina\'s',
    monthly: 'Doorlopende uitbreidingen',
    moreInfo: 'Meer info',
    presetLabel: 'Populaire keuze',
    whatsIncluded: 'Wat er nog meer in zit',
    popularTag: 'Populair',
    situationNew: 'Nieuwe website',
    situationExisting: 'Ik heb al een website',
    pagesUnit: 'pagina\'s',
    pagesHelp: '10 pagina\'s zijn inbegrepen.',
    pages199: 'Vanaf {n} pagina\'s wordt uw abonnement 199 CHF per maand, omdat onbeperkte wijzigingen op meer pagina\'s meer werk zijn.',
    webshopTitle: 'Webshop erbij',
    webshopPrice: 'plus 150 CHF per maand',
    webshopDesc: 'Verkopen vanaf uw website: productcatalogus, winkelwagen, afrekenen, Twint en kaartbetaling, verzendregels en btw.',
    productsUnit: 'producten',
    productsHelp: 'Uw producten beheert u zelf in het beheerscherm.',
    products101: 'Vanaf 1000 producten komt er een maandelijkse toeslag bij, die verder stijgt bij 2500 en 5000 producten.',
    languagesCount: 'Aantal talen',
    productImport: { id: 'productImport', label: 'Productimport uit een lijst of CSV', price: '490 CHF eenmalig', info: 'Wij importeren uw producten uit een bestaande lijst of CSV, zodat u niet alles met de hand invoert.' },
    erpLink: { id: 'erpLink', label: 'Koppeling met uw boekhouding of ERP', price: 'op offerte', info: 'Wij verbinden uw shop met uw boekhouding of ERP. Omvang en prijs per systeem op offerte.' },
    newExtras: [
      { id: 'extraLanguage', label: 'Extra taal, inclusief hreflang', price: '290 CHF per taal', info: 'Uw volledige website in een extra taal, met de hreflang aanduidingen die Google vertellen welke versie bij welke bezoeker hoort.' },
      { id: 'logo', label: 'Logo en huisstijl', price: '750 CHF eenmalig', info: 'Een passend logo en een compacte huisstijlgids voor een consistente, professionele uitstraling.' },
    ],
    existingExtras: [
      { id: 'audit', label: 'Crawler en indexatie audit', price: '190 CHF eenmalig', info: 'Wij controleren of uw site in de index van Google staat, of de sitemap klopt en of AI crawlers echt binnenkomen, en zeggen u wat te herstellen is.' },
      { id: 'extraLanguage', label: 'Extra taal toevoegen', price: '490 CHF per taal', info: 'Een extra taalversie van uw bestaande site, inclusief de hreflang aanduidingen voor Google.' },
      { id: 'structuredData', label: 'Gestructureerde data toevoegen', price: '490 CHF eenmalig', info: 'Extra gegevens in de broncode zodat Google en AI systemen uw diensten, FAQ en navigatie beter begrijpen en tonen.' },
      { id: 'answerBlocks', label: 'Antwoordblokken herschrijven', price: '75 CHF per pagina of 690 CHF per tien', info: 'Wij schrijven bovenaan uw pagina\'s korte blokken die een vraag volledig beantwoorden, zodat AI antwoordmachines u citeren.' },
      { id: 'entityLocal', label: 'Entiteits en lokale vindbaarheid', price: '490 CHF eenmalig', info: 'Uw Google Bedrijfsprofiel en uw gegevens overal identiek, plus vermeldingen op de gidsen die in uw sector gelezen worden.' },
      { id: 'analyticsConsent', label: 'Analytics en consent inrichting', price: '290 CHF eenmalig', info: 'GA4 en Consent Mode correct ingericht met cookiebanner en conversiedoelen, zodat u ziet wat uw site oplevert.' },
      { id: 'cwv', label: 'Core Web Vitals optimalisatie', price: 'vanaf 390 CHF op offerte', info: 'Wij maken uw bestaande site sneller en stabieler volgens de waarden die Google hanteert voor laadtijd en reactie.' },
      { id: 'accessibility', label: 'Toegankelijkheid naar WCAG 2.2 AA', price: 'vanaf 690 CHF op offerte', info: 'Wij brengen uw site naar de standaard WCAG 2.2 AA zodat hij ook met toetsenbord en schermlezer bruikbaar is.' },
    ],
    monthlyExtras: [
      { id: 'visibilityLoop', label: 'Zichtbaarheidsloop, SEO en GEO monitoring', price: '190 CHF per maand plus 490 CHF opzet', info: 'Elke maand meten wij of u genoemd wordt in ChatGPT, Google AI Overviews, Perplexity en Copilot, plus Search Console, en verbeteren wij één pagina. U krijgt drie kengetallen en één actiepunt.' },
      { id: 'googleAds', label: 'Google Ads beheer', price: '190 CHF per maand plus 490 CHF opzet', info: 'Wij zetten uw Google Ads op en beheren ze: campagnes, zoekwoorden, advertenties, biedingen en conversietracking, met maandelijkse rapportage.' },
      { id: 'contentRetainer', label: 'Contentretainer, twee artikelen per maand', price: '390 CHF per maand', info: 'Twee artikelen per maand, geschreven op een echte zoekvraag, met interne links naar uw dienstpagina\'s. De hefboom die blijft schalen.' },
      { id: 'reviewManagement', label: 'Reviewbeheer', price: '95 CHF per maand', info: 'Wij vragen reviews uit bij uw klanten op het juiste moment, volgen ze op en helpen bij het beantwoorden.' },
    ],
    priceTitle: 'Uw prijs',
    reset: 'Opnieuw beginnen',
    perMonth: '/maand',
    oneTime: 'eenmalig',
    perShort: '/m',
    onceShort: 'eenm.',
    manualQuote: 'Wij bekijken uw website en sturen u een prijs binnen twee werkdagen.',
    cta: 'Offerte aanvragen',
    finePrint: 'Geen opstartkost. Minimumduur zesendertig maanden. Bedragen exclusief 8,1% btw.',
    lineLabel: {
      base: 'Basis', extraPages: 'Extra pagina\'s', webshop: 'Webshop', webshopProducts: 'Meer dan 100 producten',
      productImport: 'Productimport', logo: 'Logo en huisstijl', extraLanguage: 'Extra taal',
      structuredData: 'Uitgebreide gestructureerde data', migration: 'Migratie en redirectplan',
      audit: 'Crawler en indexatie audit', answerBlocks: 'Antwoordblokken herschreven',
      entityLocal: 'Entiteits en lokale vindbaarheid', analyticsConsent: 'Analytics en consent',
      visibilityLoop: 'Zichtbaarheidsloop', visibilityLoopSetup: 'Zichtbaarheidsloop opzet', googleAds: 'Google Ads', googleAdsSetup: 'Google Ads opzet',
      contentRetainer: 'Contentretainer', reviewManagement: 'Reviewbeheer',
    },
    summary: {
      title: 'Configuratie uit de prijscalculator:', situation: 'Situatie', new: 'Nieuwe website', existing: 'Bestaande website',
      pages: 'Pagina\'s', webshopYes: 'Webshop: ja, {n} producten', totalLabel: 'Totaal', monthWord: 'per maand',
      onceWord: 'eenmalig', manualNote: '(bevat posten op offerte)',
    },
  },
  explainer: {
    h2: 'Alles wat een goede website nodig heeft, zit erin',
    lead: 'Wij rekenen niets extra voor de dingen die een website gewoon goed maken. Een site die daarop moet besparen, is geen website maar een kostenpost.',
    includes: [
      { title: 'Wij denken eerst na, dan pas bouwen we.', text: 'Voor er een pagina gemaakt wordt, leggen we samen vast wie uw klant is, welke vraag hij stelt, en wat elke pagina moet doen. Zonder die stap krijgt u een site die er mooi uitziet en niets oplevert, en dan betaalt u twee keer.' },
      { title: 'U staat in Google.', text: 'Uw site wordt aangemeld, uw paginakaart wordt ingediend, en elke pagina krijgt een eigen titel en omschrijving. Klinkt vanzelfsprekend, maar het is de meest voorkomende reden dat een site onvindbaar blijft.' },
      { title: 'Snel en werkend op een telefoon.', text: 'Wij bouwen op de snelheidsdrempels die Google zelf hanteert. Meer dan de helft van uw bezoekers komt via een gsm.' },
      { title: 'Machines begrijpen wie u bent.', text: 'In de code van uw site staat uw naam, adres, telefoon en ondernemingsnummer in een vorm die zoekmachines en AI systemen letterlijk kunnen lezen. Zo hoeven ze niets te raden.' },
      { title: 'Uw teksten zijn geschikt om geciteerd te worden.', text: 'Bovenaan elke pagina staat een kort antwoord op de vraag van die pagina, geschreven zodat ChatGPT of Google het letterlijk kan overnemen. Dat is het verschil tussen gevonden worden en genoemd worden.' },
      { title: 'AI systemen mogen binnen.', text: 'Wij zetten expliciet in uw instellingen dat ChatGPT, Perplexity en de rest uw site mogen lezen. Veel sites blokkeren dat per ongeluk, zonder dat iemand het merkt.' },
      { title: 'Bruikbaar voor iedereen.', text: 'Voldoende contrast, bedienbaar met een toetsenbord, leesbaar voor een schermlezer. Vanaf 2027 is dat in Zwitserland verplicht. Bij ons is het nu al standaard, dus u hoeft straks niets in te halen.' },
      { title: 'Uw gegevens kloppen overal.', text: 'Wij richten uw Google Bedrijfsprofiel in en zorgen dat uw naam, adres en telefoonnummer op elk kanaal identiek zijn. Dit is wat lokale vindbaarheid het hardst beweegt.' },
      { title: 'U ziet wat uw site opbrengt.', text: 'Bezoekersstatistieken correct ingesteld, binnen de privacyregels, met een cookiemelding die daarop aansluit.' },
      { title: 'Hosting, beveiliging en back-up.', text: 'Uw site draait bij ons, blijft bereikbaar en wordt dagelijks bewaard. Een factuur, een aanspreekpunt.' },
      { title: 'Onbeperkt kleine tekstwijzigingen.', text: 'Stuur een mail en het staat er, doorgaans binnen twee werkdagen. U hoeft nooit te twijfelen of een aanpassing de moeite waard is.' },
      { title: 'Uitgebreide gestructureerde data.', text: 'Google toont uw diensten en veelgestelde vragen direct in de zoekresultaten, zodat uw pagina meer plaats inneemt en meer kliks krijgt.' },
      { title: 'Migratie en redirectplan.', text: 'Vervangt uw nieuwe site een oude, dan leiden wij elk oud adres naar het nieuwe om zodat u uw opgebouwde Google posities behoudt.' },
    ],
    conditionsTitle: 'Voorwaarden',
    conditionsText: 'Waarom zesendertig maanden. U betaalt niets vooraf. Wij bouwen uw site en verdienen die terug over de looptijd van uw abonnement. Daarom spreken we een minimumduur van drie jaar af, en daarna is uw abonnement maandelijks opzegbaar. Tijdens uw abonnement is de site van ons en gebruikt u hem, zoals bij een leasewagen. Zegt u op, dan gaat de site offline en krijgt u uw teksten en foto\'s mee.',
  },
};

export const PRICING_COPY: Record<PricingCopyLocale, PricingCopy> = { de, fr, en, es, nl };

export function pricingCopy(locale: string): PricingCopy {
  return PRICING_COPY[(['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as PricingCopyLocale];
}
