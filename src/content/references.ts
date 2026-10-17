// Content for the Referenzen page: extended business cases instead of a
// classic portfolio. Per case we tell one story in four steps (what the
// company does, where it got stuck, how semanu helped, the result) plus a real
// client quote where we have one. Kept as a typed module per locale, so the long copy stays readable and the message files stay
// lean. Honest descriptions only: no invented metrics, rankings or quotes.

export type RefStatus = 'live' | 'dev';

export type RefQuote = { text: string; author: string; role: string };

export type RefCase = {
  name: string;
  tag: string;
  status: RefStatus;
  href?: string;
  /** What the company does (context before the problem). */
  company: string;
  /** Where they got stuck. */
  challenge: string;
  /** How semanu helped. */
  solution: string;
  /** What changed for them (the trust maker). */
  result: string;
  /** Real client quote, only where one exists. */
  quote?: RefQuote;
};

export type RefStat = { n: string; l: string };

export type RefContent = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  heroViewProjects: string;
  stats: RefStat[];
  statusLive: string;
  statusDev: string;
  visit: string;
  companyLabel: string;
  challengeLabel: string;
  solutionLabel: string;
  resultLabel: string;
  cases: RefCase[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

export type RefLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

export const REFERENCES: Record<RefLocale, RefContent> = {
  de: {
    title: 'Referenzen: echte Business Cases',
    description:
      'Vier echte Fälle statt Portfolio: was das Unternehmen macht, wo es hakte und wie semanu geholfen hat. Poortland, eine Plattform, ein 3D-Konfigurator und ein interaktiver Kiosk.',
    eyebrow: 'Referenzen',
    h1: 'Was Unternehmen mit semanu erreichen',
    heroViewProjects: 'Zu den Fällen',
    stats: [
      { n: '4', l: 'Fälle im Detail' },
      { n: 'CH', l: 'Hosting und Support' },
      { n: '1', l: 'Fester Ansprechpartner' },
    ],
    intro:
      'Kein klassisches Portfolio, sondern ausführliche Business Cases: was das Unternehmen macht, wo es hakte und wie semanu geholfen hat. Ehrlich beschrieben und mit Resultat.',
    statusLive: 'Live',
    statusDev: 'In Entwicklung',
    visit: 'Zur Website',
    companyLabel: 'Das Unternehmen',
    challengeLabel: 'Die Herausforderung',
    solutionLabel: 'Die Lösung',
    resultLabel: 'Das Resultat',
    cases: [
      {
        name: 'semanu interactieve kiosk',
        tag: '3D-configurator',
        status: 'live',
        company:
          'semanu bouwt interactieve 3D-configuratoren en kiosks waarmee klanten een product zelf samenstellen.',
        challenge:
          'Producten op maat vragen veel overleg en handmatige offertes voordat een klant beslist.',
        solution:
          'Een interactieve kiosk waarmee bezoekers ruimte, indeling en afwerking kiezen, live in 3D zien en meteen de prijs krijgen.',
        result:
          'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      },
      {
        name: 'Poortland',
        tag: 'Workflowautomatisering',
        status: 'live',
        href: 'https://www.poortland.be',
        company:
          'Poortland entwirft, fertigt und montiert architektonische Tore und Überdachungen für Wohnhäuser, bei denen Ausstrahlung, Sicherheit und Verarbeitung zusammenkommen.',
        challenge:
          'Anfragen kamen über mehrere Kanäle gleichzeitig (Social, Kontaktformular, Email und Telefon), sodass ein Lead leicht verloren ging. Die Website liess sich intern kaum aktualisieren und brachte nicht durchgehend die richtigen Besucher.',
        solution:
          'semanu baute eine vollständige Website mit CMS-Modul, damit das Team Fotos und Inhalte selbst pflegt. Ein integriertes Angebotstool lässt Besucher ein passendes Angebot anfragen und die Website läuft in vier Sprachen mit hreflang. semanu betreut die Google Ads und eine Sichtbarkeitsschleife hält SEO und GEO jeden Monat im Blick. Ein integriertes CRM-Modul erfasst jeden Lead aus vier Kanälen (Meta mit Instagram und Facebook, dem Kontaktformular, Email und Telefon) und begleitet ihn vom ersten Kontakt bis zur unterschriebenen Offerte.',
        result:
          'Vom ersten Kundenkontakt bis zur Montage: Angebot, Produktion und Planung verbunden in einem digitalen Fluss. Poortland pflegt die eigene Website, bleibt in Suche und AI sichtbar und verfolgt jeden Lead an einem Ort, vom ersten Kontakt bis zur unterschriebenen Offerte.',
        quote: {
          text: 'semanu hat uns klar und persönlich durch den ganzen Prozess geführt. Wir fühlten uns eingebunden, ohne alles selbst managen zu müssen. Unsere Website wirkt jetzt professionell und vertrauenswürdig. Wir empfehlen semanu jedem Unternehmen, das eine moderne Website ohne Stress möchte.',
          author: 'Poortland',
          role: 'Tore und Überdachungen',
        },
      },
      {
        name: 'SEMANU',
        tag: 'Plattform',
        status: 'live',
        href: 'https://semanu.be',
        company:
          'SEMANU ist ein Beratungsunternehmen für Business Analyse und führt mehrere Mandate gleichzeitig. Jedes Mandat bringt Angebote, NDAs, Projektdokumente und Rechnungen mit sich.',
        challenge:
          'Der ganze Ablauf lief über einzelne Tools und lange Email Verläufe: Leads qualifizieren, Angebote senden und freigeben lassen, NDAs signieren, fakturieren und Dokumente teilen. Das kostete Zeit und machte Mandate schwer nachvollziehbar.',
        solution:
          'semanu baute eine Plattform aus einem Guss: eine öffentliche Website in vier Sprachen mit Readiness Checks und Lead Magnets, ein Ops Dashboard für SEMANU und ein Kundenportal. Angebote, NDAs und Rechnungen laufen durchgehend über die Plattform.',
        result:
          'Eine Person führt heute Dutzende Mandate ohne administrativen Aufwand. Leads qualifizieren sich selbst, Kunden geben Angebote im Portal frei und signieren NDAs online und jedes Dokument bleibt in einer nachvollziehbaren Spur.',
      },
      {
        name: '3D Configurator',
        tag: 'Webshop',
        status: 'live',
        company:
          'Ein Hersteller fertigt Aluminiumplatten auf Maß. Jede Platte ist anders: Abmessungen, Kantenbearbeitung, Oberfläche und Aussparungen.',
        challenge:
          'Jede Anfrage musste von Hand berechnet und angeboten werden. Das band Fachleute an repetitive Kalkulationen, verzögerte Antworten und begrenzte, wie viele Anfragen das Team bewältigen konnte.',
        solution:
          'semanu baute einen 3D-Konfigurator als Webshop. Kunden stellen ihre Platte selbst zusammen, sehen das Resultat live in 3D, erhalten sofort einen Preis und bestellen direkt online.',
        result:
          'Kunden bestellen rund um die Uhr selbst und das manuelle Offerieren entfällt. Ein komplexes Produkt ist in wenigen Klicks bestellbar und das Team hat den Rücken frei für die Fertigung.',
      },
    ],
    ctaTitle: 'Wird Ihr Fall der nächste?',
    ctaText:
      'Erzählen Sie uns kurz, wo es bei Ihnen hakt. Wir melden uns persönlich mit einer ehrlichen Einschätzung.',
    ctaButton: 'Kontakt aufnehmen',
  },

  fr: {
    title: 'Références : des business cases réels',
    description:
      'Quatre cas réels plutôt qu’un portfolio : ce que fait l’entreprise, où ça coinçait et comment semanu a aidé. Poortland, une plateforme, un configurateur 3D et une borne interactive.',
    eyebrow: 'Références',
    h1: 'Ce que les entreprises accomplissent avec semanu',
    heroViewProjects: 'Voir les cas',
    stats: [
      { n: '4', l: 'Cas en détail' },
      { n: 'CH', l: 'Hébergement et support' },
      { n: '1', l: 'Interlocuteur fixe' },
    ],
    intro:
      'Pas un portfolio classique mais des business cases détaillés : ce que fait l’entreprise, où ça coinçait et comment semanu a aidé. Décrits honnêtement et avec le résultat.',
    statusLive: 'En ligne',
    statusDev: 'En développement',
    visit: 'Voir le site',
    companyLabel: 'L’entreprise',
    challengeLabel: 'Le défi',
    solutionLabel: 'La solution',
    resultLabel: 'Le résultat',
    cases: [
      {
        name: 'semanu interactieve kiosk',
        tag: '3D-configurator',
        status: 'live',
        company:
          'semanu bouwt interactieve 3D-configuratoren en kiosks waarmee klanten een product zelf samenstellen.',
        challenge:
          'Producten op maat vragen veel overleg en handmatige offertes voordat een klant beslist.',
        solution:
          'Een interactieve kiosk waarmee bezoekers ruimte, indeling en afwerking kiezen, live in 3D zien en meteen de prijs krijgen.',
        result:
          'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      },
      {
        name: 'Poortland',
        tag: 'Workflowautomatisering',
        status: 'live',
        href: 'https://www.poortland.be',
        company:
          'Poortland conçoit, fabrique et pose des portails et des couvertures architecturaux pour des habitations où allure, sécurité et finition se rejoignent.',
        challenge:
          'Les demandes arrivaient par plusieurs canaux à la fois (réseaux sociaux, formulaire de contact, e-mail et téléphone), si bien qu’un lead se perdait facilement. Le site était difficile à mettre à jour en interne et n’attirait pas toujours les bons visiteurs.',
        solution:
          'semanu a construit pour Poortland un site complet avec un module CMS, pour que l’équipe mette à jour ses photos et son contenu quand elle le souhaite. Un outil de devis intégré permet aux visiteurs de demander une offre sur mesure et le site tourne en quatre langues avec hreflang. semanu gère les Google Ads et une boucle de visibilité surveille le SEO et le GEO chaque mois. Un module CRM intégré capte chaque lead depuis quatre canaux (Meta avec Instagram et Facebook, le formulaire de contact, e-mail et téléphone) et le suit du premier contact jusqu’au devis signé.',
        result:
          'Du premier contact client à la pose : devis, production et planning reliés dans un seul flux digital. Poortland met à jour son propre site, reste visible dans la recherche et l’AI et suit chaque lead à un seul endroit, du premier message au devis signé.',
        quote: {
          text: 'semanu nous a guidés de façon claire et personnelle tout au long du projet. Nous nous sommes sentis impliqués sans devoir tout gérer seuls. Notre site paraît maintenant professionnel et digne de confiance. Nous recommandons semanu à toute entreprise qui veut un site moderne sans stress.',
          author: 'Poortland',
          role: 'Portails et couvertures',
        },
      },
      {
        name: 'SEMANU',
        tag: 'Plateforme',
        status: 'live',
        href: 'https://semanu.be',
        company:
          'SEMANU est un cabinet de conseil en business analyse qui mène plusieurs mandats en parallèle. Chaque mandat apporte des offres, des NDA, des documents de projet et des factures.',
        challenge:
          'Tout le processus passait par des outils séparés et de longs fils d’e-mail : qualifier les leads, envoyer et faire valider les offres, signer les NDA, facturer et partager les documents. Cela coûtait du temps et rendait les mandats difficiles à suivre.',
        solution:
          'semanu a construit une plateforme d’un seul tenant : un site public en quatre langues avec Readiness Checks et lead magnets, un tableau de bord ops pour SEMANU et un portail client. Offres, NDA et factures circulent de bout en bout via la plateforme.',
        result:
          'Une seule personne gère aujourd’hui des dizaines de mandats sans charge administrative. Les leads se qualifient seuls, les clients valident les offres et signent les NDA dans le portail et chaque document reste dans une trace vérifiable.',
      },
      {
        name: '3D Configurator',
        tag: 'Boutique en ligne',
        status: 'live',
        company:
          'Un fabricant produit des plaques en aluminium sur mesure. Chaque plaque est différente : dimensions, traitement des bords, finition et découpes.',
        challenge:
          'Chaque demande devait être calculée et chiffrée à la main. Cela occupait des spécialistes avec des calculs répétitifs, retardait les réponses et limitait le nombre de demandes traitées.',
        solution:
          'semanu a construit un configurateur 3D comme boutique en ligne. Le client compose sa plaque, voit le résultat en direct en 3D, obtient un prix immédiat et commande en ligne.',
        result:
          'Les clients commandent seuls à toute heure et le devis manuel disparaît. Un produit complexe se commande en quelques clics et l’équipe se concentre sur la production.',
      },
    ],
    ctaTitle: 'Et si votre cas était le prochain ?',
    ctaText:
      'Dites-nous en quelques mots où ça coince chez vous. Nous revenons vers vous personnellement avec un avis honnête.',
    ctaButton: 'Nous contacter',
  },

  en: {
    title: 'Client stories: real business cases',
    description:
      'Four real cases instead of a portfolio: what the company does, where it got stuck and how semanu helped. Poortland, a platform, a 3D configurator and an interactive kiosk.',
    eyebrow: 'Client stories',
    h1: 'What businesses achieve with semanu',
    heroViewProjects: 'See the cases',
    stats: [
      { n: '4', l: 'Cases in detail' },
      { n: 'CH', l: 'Hosting and support' },
      { n: '1', l: 'Fixed contact person' },
    ],
    intro:
      'Not a classic portfolio but detailed business cases: what the company does, where it got stuck and how semanu helped. Described honestly and with the result.',
    statusLive: 'Live',
    statusDev: 'In development',
    visit: 'Visit the site',
    companyLabel: 'The company',
    challengeLabel: 'The challenge',
    solutionLabel: 'The solution',
    resultLabel: 'The result',
    cases: [
      {
        name: 'semanu interactieve kiosk',
        tag: '3D-configurator',
        status: 'live',
        company:
          'semanu bouwt interactieve 3D-configuratoren en kiosks waarmee klanten een product zelf samenstellen.',
        challenge:
          'Producten op maat vragen veel overleg en handmatige offertes voordat een klant beslist.',
        solution:
          'Een interactieve kiosk waarmee bezoekers ruimte, indeling en afwerking kiezen, live in 3D zien en meteen de prijs krijgen.',
        result:
          'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      },
      {
        name: 'Poortland',
        tag: 'Workflowautomatisering',
        status: 'live',
        href: 'https://www.poortland.be',
        company:
          'Poortland designs, builds and installs architectural gates and canopies for homes where looks, security and finish come together.',
        challenge:
          'Enquiries came in through several channels at once (social, the contact form, email and phone), so a lead was easy to lose. The website was hard to update in-house and did not consistently attract the right visitors.',
        solution:
          'semanu built Poortland a full website with a CMS module, so the team updates its own photos and content whenever it wants. A built-in quote tool lets visitors request a tailored offer and the site runs in four languages with hreflang. semanu manages the Google Ads and a visibility loop keeps SEO and GEO monitored every month. A built-in CRM module captures every lead from four channels (Meta with Instagram and Facebook, the contact form, email and phone) and follows each one from first contact to a signed quote.',
        result:
          'From first customer contact to installation: quote, production and planning connected in one digital flow. Poortland updates its own site, stays visible in search and AI and follows up every lead in one place, from the first message to a signed offer.',
        quote: {
          text: 'semanu guided us clearly and personally through the whole process. We felt involved without having to manage everything ourselves. Our website now looks professional and trustworthy. We would recommend semanu to any business that wants a modern site without the stress.',
          author: 'Poortland',
          role: 'Architectural gates',
        },
      },
      {
        name: 'SEMANU',
        tag: 'Platform',
        status: 'live',
        href: 'https://semanu.be',
        company:
          'SEMANU is a business analysis consultancy that runs several engagements in parallel. Every engagement brings quotes, NDAs, project documents and invoices.',
        challenge:
          'The whole process ran through separate tools and long email threads: qualifying leads, sending and validating quotes, signing NDAs, invoicing and sharing documents. That cost time and made engagements hard to track.',
        solution:
          'semanu built one connected platform: a public site in four languages with readiness checks and lead magnets, an ops dashboard for SEMANU and a client portal. Quotes, NDAs and invoices flow end to end through the platform.',
        result:
          'One person now runs dozens of engagements without admin overhead. Leads self qualify, clients validate quotes and sign NDAs in the portal and every document stays in one auditable trail.',
      },
      {
        name: '3D Configurator',
        tag: 'Webshop',
        status: 'live',
        company:
          'A manufacturer produces made-to-measure aluminium plates. Every plate is different: dimensions, edge processing, finish and cutouts.',
        challenge:
          'Every request had to be calculated and quoted by hand. That tied specialists to repetitive calculations, slowed down replies and capped how many requests the team could handle.',
        solution:
          'semanu built a 3D configurator as a webshop. Customers compose their plate, see the result live in 3D, get an instant price and order online.',
        result:
          'Customers order independently around the clock and manual quoting disappears. A complex product becomes orderable in a few clicks and the team can focus on production.',
      },
    ],
    ctaTitle: 'Will your case be the next?',
    ctaText:
      'Tell us briefly where things get stuck for you. We get back to you personally with an honest assessment.',
    ctaButton: 'Get in touch',
  },

  es: {
    title: 'Referencias: casos de negocio reales',
    description:
      'Cuatro casos reales en lugar de un portfolio: qué hace la empresa, dónde se atascaba y cómo ayudó semanu. Poortland, una plataforma, un configurador 3D y un quiosco interactivo.',
    eyebrow: 'Referencias',
    h1: 'Lo que las empresas logran con semanu',
    heroViewProjects: 'Ver los casos',
    stats: [
      { n: '4', l: 'Casos en detalle' },
      { n: 'CH', l: 'Hosting y soporte' },
      { n: '1', l: 'Persona de contacto fija' },
    ],
    intro:
      'No es un portfolio clásico sino casos de negocio detallados: qué hace la empresa, dónde se atascaba y cómo ayudó semanu. Descritos con honestidad e incluyendo el resultado.',
    statusLive: 'En vivo',
    statusDev: 'En desarrollo',
    visit: 'Visitar el sitio',
    companyLabel: 'La empresa',
    challengeLabel: 'El reto',
    solutionLabel: 'La solución',
    resultLabel: 'El resultado',
    cases: [
      {
        name: 'semanu interactieve kiosk',
        tag: '3D-configurator',
        status: 'live',
        company:
          'semanu bouwt interactieve 3D-configuratoren en kiosks waarmee klanten een product zelf samenstellen.',
        challenge:
          'Producten op maat vragen veel overleg en handmatige offertes voordat een klant beslist.',
        solution:
          'Een interactieve kiosk waarmee bezoekers ruimte, indeling en afwerking kiezen, live in 3D zien en meteen de prijs krijgen.',
        result:
          'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      },
      {
        name: 'Poortland',
        tag: 'Workflowautomatisering',
        status: 'live',
        href: 'https://www.poortland.be',
        company:
          'Poortland diseña, fabrica e instala portones y cubiertas arquitectónicas para viviendas donde estética, seguridad y acabado se encuentran.',
        challenge:
          'Las consultas llegaban por varios canales a la vez (redes sociales, el formulario de contacto, email y teléfono), de modo que un lead se perdía con facilidad. El sitio era difícil de actualizar internamente y no siempre atraía a los visitantes adecuados.',
        solution:
          'semanu construyó para Poortland un sitio completo con un módulo CMS, para que el equipo actualice sus fotos y su contenido cuando quiera. Una herramienta de presupuestos integrada permite a los visitantes pedir una oferta a medida y el sitio funciona en cuatro idiomas con hreflang. semanu gestiona los Google Ads y un bucle de visibilidad supervisa el SEO y el GEO cada mes. Un módulo CRM integrado capta cada lead desde cuatro canales (Meta con Instagram y Facebook, el formulario de contacto, email y teléfono) y lo acompaña desde el primer contacto hasta el presupuesto firmado.',
        result:
          'Del primer contacto con el cliente hasta la instalación: presupuesto, producción y planificación conectados en un solo flujo digital. Poortland actualiza su propio sitio, sigue visible en la búsqueda y la AI y hace seguimiento de cada lead en un solo lugar, del primer mensaje a la oferta firmada.',
        quote: {
          text: 'semanu nos guió de forma clara y personal durante todo el proceso. Nos sentimos implicados sin tener que gestionarlo todo nosotros mismos. Nuestro sitio web ahora parece profesional y fiable. Recomendamos semanu a cualquier empresa que quiera un sitio moderno sin estrés.',
          author: 'Poortland',
          role: 'Portones y cubiertas',
        },
      },
      {
        name: 'SEMANU',
        tag: 'Plataforma',
        status: 'live',
        href: 'https://semanu.be',
        company:
          'SEMANU es una consultora de análisis de negocio que gestiona varios mandatos en paralelo. Cada mandato trae ofertas, acuerdos de confidencialidad, documentos de proyecto y facturas.',
        challenge:
          'Todo el proceso pasaba por herramientas sueltas y largos hilos de email: cualificar leads, enviar ofertas y conseguir su aprobación, firmar acuerdos de confidencialidad, facturar y compartir documentos. Eso costaba tiempo y hacía los mandatos difíciles de seguir.',
        solution:
          'semanu construyó una plataforma de una sola pieza: un sitio público en cuatro idiomas con readiness checks y lead magnets, un panel de operaciones para SEMANU y un portal de cliente. Ofertas, acuerdos de confidencialidad y facturas circulan de principio a fin por la plataforma.',
        result:
          'Hoy una sola persona gestiona decenas de mandatos sin carga administrativa. Los leads se cualifican solos, los clientes aprueban las ofertas en el portal y firman los acuerdos de confidencialidad en línea y cada documento queda en un rastro verificable.',
      },
      {
        name: '3D Configurator',
        tag: 'Tienda online',
        status: 'live',
        company:
          'Un fabricante produce placas de aluminio a medida. Cada placa es diferente: dimensiones, tratamiento de bordes, acabado y recortes.',
        challenge:
          'Cada solicitud debía calcularse y presupuestarse a mano. Eso ataba a los especialistas a cálculos repetitivos, retrasaba las respuestas y limitaba cuántas solicitudes podía atender el equipo.',
        solution:
          'semanu construyó un configurador 3D como tienda online. El cliente compone su placa, ve el resultado en vivo en 3D, obtiene un precio al instante y pide directamente en línea.',
        result:
          'Los clientes piden solos a cualquier hora y el presupuesto manual desaparece. Un producto complejo se pide en unos pocos clics y el equipo tiene las manos libres para la producción.',
      },
    ],
    ctaTitle: '¿Será su caso el próximo?',
    ctaText:
      'Cuéntenos brevemente dónde se atasca en su empresa. Le respondemos personalmente con una valoración honesta.',
    ctaButton: 'Ponerse en contacto',
  },

  nl: {
    title: 'Referenties: echte business cases',
    description:
      'Vier echte cases in plaats van een portfolio: wat het bedrijf doet, waar het vastliep en hoe semanu hielp. Poortland, een platform, een 3D-configurator en een interactieve kiosk.',
    eyebrow: 'Referenties',
    h1: 'Wat bedrijven met\nsemanu bereiken.',
    heroViewProjects: 'Naar de cases',
    stats: [
      { n: '4', l: 'Cases in detail' },
      { n: 'CH', l: 'Hosting en support' },
      { n: '1', l: 'Vast aanspreekpunt' },
    ],
    intro:
      'Concrete business cases over wat het bedrijf deed, waar het vastliep en hoe semanu hielp. Eerlijk beschreven met het resultaat.',
    statusLive: 'Live',
    statusDev: 'In ontwikkeling',
    visit: 'Naar de website',
    companyLabel: 'Het bedrijf',
    challengeLabel: 'De uitdaging',
    solutionLabel: 'De oplossing',
    resultLabel: 'Het resultaat',
    cases: [
      {
        name: 'semanu interactieve kiosk',
        tag: '3D-configurator',
        status: 'live',
        company:
          'semanu bouwt interactieve 3D-configuratoren en kiosks waarmee klanten een product zelf samenstellen.',
        challenge:
          'Producten op maat vragen veel overleg en handmatige offertes voordat een klant beslist.',
        solution:
          'Een interactieve kiosk waarmee bezoekers ruimte, indeling en afwerking kiezen, live in 3D zien en meteen de prijs krijgen.',
        result:
          'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      },
      {
        name: 'Poortland',
        tag: 'Workflowautomatisering',
        status: 'live',
        href: 'https://www.poortland.be',
        company:
          'Poortland ontwerpt, maakt en plaatst architecturale poorten en overkappingen voor woningen waar uitstraling, veiligheid en afwerking samenkomen.',
        challenge:
          'Aanvragen kwamen via meerdere kanalen tegelijk binnen (social, het contactformulier, email en telefoon), waardoor een lead makkelijk verloren ging. De website was moeilijk zelf aan te passen en trok niet altijd de juiste bezoekers.',
        solution:
          'semanu bouwde voor Poortland een volledige website met een CMS-module, zodat het team zelf foto\'s en content beheert wanneer het wil. Een ingebouwde offerte tool laat bezoekers een offerte op maat aanvragen en de site draait in vier talen met hreflang. semanu beheert de Google Ads en een Zichtbaarheidsloop houdt SEO en GEO elke maand in de gaten. Een ingebouwde CRM-module vangt elke lead uit vier kanalen (Meta met Instagram en Facebook, het contactformulier, email en telefoon) en volgt die van eerste contact tot getekende offerte.',
        result:
          'Van eerste klantcontact tot plaatsing: offerte, productie en planning verbonden in één digitale flow. Poortland past de eigen site aan, blijft zichtbaar in zoekmachines en AI en volgt elke lead op één plek op, van het eerste bericht tot een getekende offerte.',
        quote: {
          text: 'semanu heeft ons helder en persoonlijk door het hele proces geleid. We voelden ons betrokken zonder alles zelf te moeten beheren. Onze website oogt nu professioneel en betrouwbaar. We raden semanu aan elk bedrijf aan dat een moderne website zonder stress wil.',
          author: 'Poortland',
          role: 'Poorten en overkappingen',
        },
      },
      {
        name: 'SEMANU',
        tag: 'Platform',
        status: 'live',
        href: 'https://semanu.be',
        company:
          'SEMANU is een adviesbureau voor business analyse dat meerdere opdrachten tegelijk voert. Elke opdracht brengt offertes, geheimhoudingsovereenkomsten, projectdocumenten en facturen mee.',
        challenge:
          'Het hele proces liep via losse tools en lange emailketens: leads kwalificeren, offertes versturen en laten goedkeuren, geheimhoudingsovereenkomsten tekenen, factureren en documenten delen. Dat kostte tijd en maakte opdrachten moeilijk te volgen.',
        solution:
          'semanu bouwde een platform uit één stuk: een publieke website in vier talen met readiness checks en lead magnets, een ops dashboard voor SEMANU en een klantportaal. Offertes, geheimhoudingsovereenkomsten en facturen lopen van begin tot eind via het platform.',
        result:
          'Vandaag voert één persoon tientallen opdrachten zonder administratieve last. Leads kwalificeren zichzelf, klanten keuren offertes goed in het portaal en tekenen geheimhoudingsovereenkomsten online en elk document blijft in een controleerbaar spoor.',
      },
      {
        name: '3D Configurator',
        tag: 'Webshop',
        status: 'live',
        company:
          'Een fabrikant maakt aluminium platen op maat. Elke plaat is anders: afmetingen, randbewerking, afwerking en uitsparingen.',
        challenge:
          'Elke aanvraag moest met de hand berekend en geoffreerd worden. Dat bond specialisten aan repetitieve berekeningen, vertraagde antwoorden en beperkte hoeveel aanvragen het team aankon.',
        solution:
          'semanu bouwde een 3D-configurator als webshop. De klant stelt zijn plaat zelf samen, ziet het resultaat live in 3D, krijgt meteen een prijs en bestelt direct online.',
        result:
          'Klanten bestellen zelf op elk moment en het handmatig offreren verdwijnt. Een complex product is in enkele klikken te bestellen en het team houdt de handen vrij voor de productie.',
      },
    ],
    ctaTitle: 'Wordt uw case de volgende?',
    ctaText:
      'Vertel ons kort waar het bij u vastloopt. We komen persoonlijk bij u terug met een eerlijke inschatting.',
    ctaButton: 'Contact opnemen',
  },
};

/** Service tags per case, brand-neutral and shared across locales (keyed by case name). */
export const REF_SERVICES: Record<string, string[]> = {
  Poortland: ['Website', 'CMS', 'Google Ads', 'SEO and GEO', 'CRM', 'Quote tool'],
  SEMANU: ['Platform', 'Client Portal', 'CRM', 'Webdesign', 'Development'],
  '3D Configurator': ['Webshop', '3D', 'Development', 'SEO'],
};

/** A project view in the case grid: image path plus descriptive alt text. */
export type RefImage = { src: string; alt: string };

/** Live project screenshots per case (served from /public/portfolio), keyed by case name. */
export const REF_IMAGES: Record<string, RefImage[]> = {
  Poortland: [{ src: '/portfolio/poortland-mockup.jpg', alt: 'Poortland website on a laptop' }],
  'semanu interactieve kiosk': [{ src: '/portfolio/kastenconfigurator-kiosk.jpg', alt: 'Kastenconfigurator op een kiosk in een showroom' }],
  SEMANU: [{ src: '/portfolio/semanu-website.jpg', alt: 'SEMANU public website, homepage with the business analysis pitch' }],
  '3D Configurator': [{ src: '/portfolio/configurator.jpg', alt: '3D configurator for made-to-measure aluminium plates' }],
};
