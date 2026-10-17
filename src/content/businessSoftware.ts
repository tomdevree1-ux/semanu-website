// Copy for the business software service page (/services/business-software), one
// block per locale with the same structure. NL is the source text; en/de/fr/es
// are full translations. The FAQ lives separately in aiNativeFaq.ts.
// House style in every language: no em/en dashes, no comma before a coordinating
// conjunction. The literal "semanu" is rendered as the wordmark.

import type { ServicesLocale } from './services';

type Numbered = { n: string; title: string; text: string };

export type BusinessSoftwareCopy = {
  metaTitle: string;
  metaDescription: string;
  /** Schema.org Service name and serviceType, also the breadcrumb label. */
  serviceName: string;
  serviceType: string;
  heroHeadline: string;
  heroSub: string;
  heroCta: string;
  heroImageAlt: string;
  introTitle: string;
  introText: string;
  diffTitle: string;
  diffCards: Numbered[];
  aiTitle: string;
  aiText: string;
  aiOldLabel: string;
  aiOld: string[];
  aiNewLabel: string;
  aiNew: string[];
  modTitle: string;
  modText: string;
  modSteps: { n: string; title: string }[];
  confTitle: string;
  confText: string;
  confCta: string;
  finalTitle: string;
  finalText: string;
  finalCta: string;
  finalSecondary: string;
};

export const BUSINESS_SOFTWARE: Record<ServicesLocale, BusinessSoftwareCopy> = {
  nl: {
    metaTitle: 'Bedrijfssoftware op maat laten bouwen · semanu.eu',
    metaDescription:
      'Bedrijfssoftware op maat voor kmo’s, AI-first ontwikkeld: van offertebeheer en werkvoorbereiding tot productie en planning. Modulair en uitbreidbaar.',
    serviceName: 'AI-first bedrijfssoftware',
    serviceType: 'Bedrijfssoftware op maat',
    heroHeadline: 'Bedrijfssoftware opnieuw uitgevonden.',
    heroSub:
      'Dankzij onze AI-first ontwikkelaanpak maken we geavanceerde bedrijfssoftware toegankelijk voor kmo’s. Van offertebeheer en werkvoorbereiding tot productie en planning. Volledig op maat, modulair uitbreidbaar en verbonden door AI.',
    heroCta: 'Bespreek uw softwareproject',
    heroImageAlt: 'Voorbeeld van bedrijfssoftware op maat: dashboard voor urenregistratie',
    introTitle: 'Wat is modulaire bedrijfssoftware?',
    introText:
      'Modulaire bedrijfssoftware is software die rond uw processen wordt gebouwd, niet andersom. Wij ontwikkelen slimme modules op maat voor alle bedrijfsprocessen.\n\nStarten kan al vanaf één module en u breidt uit wanneer uw onderneming daar klaar voor is. Een intelligente AI-laag verbindt de modules, coördineert processen en automatiseert terugkerend werk.',
    diffTitle: 'Wat ons anders maakt.',
    diffCards: [
      { n: '01', title: 'Sneller met AI', text: 'Wij zetten AI in tijdens het volledige ontwikkelproces, zodat u sneller en betaalbaar maatwerk krijgt.' },
      { n: '02', title: 'Op uw tempo', text: 'We digitaliseren alleen de bedrijfsflows die u nu nodig heeft en breiden uit wanneer uw onderneming daar klaar voor is. Zo houdt u de kosten in de hand en groeit uw bedrijfssoftware mee met uw processen.' },
      { n: '03', title: 'U wordt eigenaar', text: 'Wij bouwen op maat van uw bedrijf en u wordt eigenaar van de software, inclusief de broncode. U zit niet vast aan één leverancier en blijft zelf de baas over uw systeem.' },
    ],
    aiTitle: 'Maatwerksoftware.\nOpnieuw uitgevonden.',
    aiText:
      'Traditionele maatwerksoftware vraagt vaak grote budgetten en lange ontwikkeltrajecten. Wij gebruiken AI tijdens het volledige ontwikkelproces. Zo bouwen we efficiënter software op maat en maken we geavanceerde oplossingen toegankelijk voor kmo’s.',
    aiOldLabel: 'Traditioneel maatwerk',
    aiOld: ['Lange ontwikkeltrajecten', 'Hoge ontwikkelkosten', 'Grote investering vooraf'],
    aiNewLabel: 'semanu · AI-first',
    aiNew: ['Sneller van idee naar software', 'Efficiënter ontwikkelen met AI', 'Klein starten, flexibel groeien'],
    modTitle: 'Start klein.\nGroei zonder grenzen.',
    modText:
      'U hoeft niet meteen uw volledige organisatie te digitaliseren. We starten waar de grootste meerwaarde ligt en bouwen verder wanneer uw onderneming daar klaar voor is.',
    modSteps: [
      { n: '01', title: 'Eerste module' },
      { n: '02', title: 'Processen verbinden' },
      { n: '03', title: 'Functionaliteiten uitbreiden' },
      { n: '04', title: 'AI-automatisering' },
    ],
    confTitle: 'Van 3D-configurator tot volledig bedrijfsplatform.',
    confText:
      'Onze 3D-configuratoren kunnen het vertrekpunt vormen van een geïntegreerd bedrijfsproces. Van productconfiguratie en offerte tot werkvoorbereiding, productie en levering. Met aanvullende modules groeit de configurator uit tot een centrale schakel binnen uw onderneming.',
    confCta: 'Ontdek onze 3D-configuratoren',
    finalTitle: 'Bespreek uw softwareproject.',
    finalText:
      'Vertel ons welke processen u wilt digitaliseren. Wij bekijken hoe maatwerksoftware en AI uw onderneming kunnen versterken.',
    finalCta: 'Bespreek uw project',
    finalSecondary: 'Ontdek onze 3D-configuratoren',
  },
  en: {
    metaTitle: 'Have custom business software built · semanu.eu',
    metaDescription:
      'Custom business software for SMEs, developed AI-first: from quotes and work preparation to production and planning. Modular, so you start small and grow.',
    serviceName: 'AI-first business software',
    serviceType: 'Custom business software',
    heroHeadline: 'Business software, reinvented.',
    heroSub:
      'Our AI-first development approach makes advanced business software accessible to SMEs. From quote management and work preparation to production and planning. Fully custom, modular and connected by AI.',
    heroCta: 'Discuss your software project',
    heroImageAlt: 'Example of custom business software: a time tracking dashboard',
    introTitle: 'What is modular business software?',
    introText:
      'Modular business software is built around your processes, not the other way round. We develop smart custom modules for every business process.\n\nYou can start with a single module and expand when your business is ready. An intelligent AI layer connects the modules, coordinates processes and automates recurring work.',
    diffTitle: 'What makes us different.',
    diffCards: [
      { n: '01', title: 'Faster with AI', text: 'We use AI throughout the entire development process, so you get custom software faster and at an affordable cost.' },
      { n: '02', title: 'At your pace', text: 'We only digitalise the business flows you need now and expand when your business is ready. That keeps costs under control while your software grows along with your processes.' },
      { n: '03', title: 'You own it', text: 'We build for your business and you become the owner of the software, including the source code. You are not tied to one supplier and stay in control of your system.' },
    ],
    aiTitle: 'Custom software.\nReinvented.',
    aiText:
      'Traditional custom software often needs large budgets and long development projects. We use AI throughout the entire development process. That lets us build custom software more efficiently and makes advanced solutions accessible to SMEs.',
    aiOldLabel: 'Traditional custom development',
    aiOld: ['Long development projects', 'High development costs', 'Large upfront investment'],
    aiNewLabel: 'semanu · AI-first',
    aiNew: ['Faster from idea to software', 'More efficient development with AI', 'Start small, grow flexibly'],
    modTitle: 'Start small.\nGrow without limits.',
    modText:
      'You do not have to digitalise your entire organisation at once. We start where the value is greatest and keep building when your business is ready.',
    modSteps: [
      { n: '01', title: 'First module' },
      { n: '02', title: 'Connect processes' },
      { n: '03', title: 'Extend functionality' },
      { n: '04', title: 'AI automation' },
    ],
    confTitle: 'From 3D configurator to a complete business platform.',
    confText:
      'Our 3D configurators can be the starting point of an integrated business process. From product configuration and quote to work preparation, production and delivery. With additional modules the configurator becomes a central link in your business.',
    confCta: 'Explore our 3D configurators',
    finalTitle: 'Discuss your software project.',
    finalText:
      'Tell us which processes you want to digitalise. We will look at how custom software and AI can strengthen your business.',
    finalCta: 'Discuss your project',
    finalSecondary: 'Explore our 3D configurators',
  },
  de: {
    metaTitle: 'Unternehmenssoftware nach Maß entwickeln lassen · semanu.eu',
    metaDescription:
      'Unternehmenssoftware nach Maß für KMU, AI-first entwickelt: von Angeboten und Arbeitsvorbereitung bis Produktion und Planung. Modular und erweiterbar.',
    serviceName: 'AI-first Unternehmenssoftware',
    serviceType: 'Unternehmenssoftware nach Maß',
    heroHeadline: 'Unternehmenssoftware, neu gedacht.',
    heroSub:
      'Mit unserem AI-first-Entwicklungsansatz machen wir anspruchsvolle Unternehmenssoftware für KMU zugänglich. Von Angebotsverwaltung und Arbeitsvorbereitung bis Produktion und Planung. Vollständig nach Maß, modular erweiterbar und durch AI verbunden.',
    heroCta: 'Ihr Softwareprojekt besprechen',
    heroImageAlt: 'Beispiel für Unternehmenssoftware nach Maß: Dashboard zur Zeiterfassung',
    introTitle: 'Was ist modulare Unternehmenssoftware?',
    introText:
      'Modulare Unternehmenssoftware wird um Ihre Prozesse herum gebaut, nicht umgekehrt. Wir entwickeln intelligente Module nach Maß für alle Geschäftsprozesse.\n\nSie können mit einem einzigen Modul starten und erweitern, sobald Ihr Unternehmen bereit ist. Eine intelligente AI-Schicht verbindet die Module, koordiniert Prozesse und automatisiert wiederkehrende Arbeit.',
    diffTitle: 'Was uns unterscheidet.',
    diffCards: [
      { n: '01', title: 'Schneller mit AI', text: 'Wir setzen AI im gesamten Entwicklungsprozess ein. So erhalten Sie Software nach Maß schneller und zu bezahlbaren Kosten.' },
      { n: '02', title: 'In Ihrem Tempo', text: 'Wir digitalisieren nur die Abläufe, die Sie jetzt brauchen. Erweitert wird, sobald Ihr Unternehmen bereit ist. So behalten Sie die Kosten im Griff und Ihre Software wächst mit Ihren Prozessen.' },
      { n: '03', title: 'Sie werden Eigentümer', text: 'Wir bauen nach Maß für Ihr Unternehmen und Sie werden Eigentümer der Software, einschließlich des Quellcodes. Sie sind nicht an einen Anbieter gebunden und behalten die Kontrolle über Ihr System.' },
    ],
    aiTitle: 'Software nach Maß.\nNeu gedacht.',
    aiText:
      'Klassische Individualsoftware erfordert oft große Budgets und lange Entwicklungsprojekte. Wir setzen AI im gesamten Entwicklungsprozess ein. So entwickeln wir Software nach Maß effizienter und machen anspruchsvolle Lösungen für KMU zugänglich.',
    aiOldLabel: 'Klassische Individualentwicklung',
    aiOld: ['Lange Entwicklungsprojekte', 'Hohe Entwicklungskosten', 'Große Investition im Voraus'],
    aiNewLabel: 'semanu · AI-first',
    aiNew: ['Schneller von der Idee zur Software', 'Effizienter entwickeln mit AI', 'Klein starten, flexibel wachsen'],
    modTitle: 'Klein starten.\nGrenzenlos wachsen.',
    modText:
      'Sie müssen nicht sofort Ihr ganzes Unternehmen digitalisieren. Wir starten dort, wo der größte Mehrwert liegt. Weitere Module folgen, sobald Ihr Unternehmen bereit ist.',
    modSteps: [
      { n: '01', title: 'Erstes Modul' },
      { n: '02', title: 'Prozesse verbinden' },
      { n: '03', title: 'Funktionen erweitern' },
      { n: '04', title: 'AI-Automatisierung' },
    ],
    confTitle: 'Vom 3D-Konfigurator zur kompletten Unternehmensplattform.',
    confText:
      'Unsere 3D-Konfiguratoren können der Ausgangspunkt eines integrierten Geschäftsprozesses sein. Von Produktkonfiguration und Angebot bis Arbeitsvorbereitung, Produktion und Lieferung. Mit zusätzlichen Modulen wird der Konfigurator zu einem zentralen Glied in Ihrem Unternehmen.',
    confCta: 'Unsere 3D-Konfiguratoren entdecken',
    finalTitle: 'Besprechen Sie Ihr Softwareprojekt.',
    finalText:
      'Sagen Sie uns, welche Prozesse Sie digitalisieren möchten. Wir prüfen, wie Software nach Maß und AI Ihr Unternehmen stärken können.',
    finalCta: 'Projekt besprechen',
    finalSecondary: 'Unsere 3D-Konfiguratoren entdecken',
  },
  fr: {
    metaTitle: 'Faire développer un logiciel d’entreprise sur mesure · semanu.eu',
    metaDescription:
      'Logiciel d’entreprise sur mesure pour PME, développé AI-first : des devis et de la préparation du travail à la production et au planning. Modulaire.',
    serviceName: 'Logiciel d’entreprise AI-first',
    serviceType: 'Logiciel d’entreprise sur mesure',
    heroHeadline: 'Le logiciel d’entreprise réinventé.',
    heroSub:
      'Grâce à notre approche de développement AI-first, nous rendons les logiciels d’entreprise avancés accessibles aux PME. De la gestion des devis et de la préparation du travail à la production et au planning. Entièrement sur mesure, modulaire et relié par l’AI.',
    heroCta: 'Parler de votre projet logiciel',
    heroImageAlt: 'Exemple de logiciel d’entreprise sur mesure : tableau de bord de suivi du temps',
    introTitle: 'Qu’est-ce qu’un logiciel d’entreprise modulaire ?',
    introText:
      'Un logiciel d’entreprise modulaire est construit autour de vos processus. Pas l’inverse. Nous développons des modules intelligents sur mesure pour tous vos processus métier.\n\nVous pouvez démarrer avec un seul module puis étendre quand votre entreprise est prête. Une couche d’AI intelligente relie les modules, coordonne les processus et automatise le travail répétitif.',
    diffTitle: 'Ce qui nous distingue.',
    diffCards: [
      { n: '01', title: 'Plus rapide grâce à l’AI', text: 'Nous utilisons l’AI tout au long du développement : vous obtenez un logiciel sur mesure plus vite et à un coût abordable.' },
      { n: '02', title: 'À votre rythme', text: 'Nous ne digitalisons que les flux dont vous avez besoin maintenant. Nous étendons quand votre entreprise est prête. Vous maîtrisez ainsi les coûts tandis que votre logiciel évolue avec vos processus.' },
      { n: '03', title: 'Vous en êtes propriétaire', text: 'Nous construisons sur mesure pour votre entreprise et vous devenez propriétaire du logiciel, code source compris. Vous n’êtes lié à aucun fournisseur et gardez la maîtrise de votre système.' },
    ],
    aiTitle: 'Le logiciel sur mesure.\nRéinventé.',
    aiText:
      'Le logiciel sur mesure classique exige souvent de gros budgets et de longs projets de développement. Nous utilisons l’AI tout au long du processus de développement. Nous construisons ainsi plus efficacement et rendons des solutions avancées accessibles aux PME.',
    aiOldLabel: 'Sur mesure classique',
    aiOld: ['Longs projets de développement', 'Coûts de développement élevés', 'Gros investissement de départ'],
    aiNewLabel: 'semanu · AI-first',
    aiNew: ['De l’idée au logiciel plus rapidement', 'Développer plus efficacement avec l’AI', 'Commencer petit, grandir avec souplesse'],
    modTitle: 'Commencez petit.\nGrandissez sans limites.',
    modText:
      'Inutile de digitaliser toute votre organisation d’un coup. Nous commençons là où la valeur ajoutée est la plus forte et poursuivons quand votre entreprise est prête.',
    modSteps: [
      { n: '01', title: 'Premier module' },
      { n: '02', title: 'Relier les processus' },
      { n: '03', title: 'Étendre les fonctionnalités' },
      { n: '04', title: 'Automatisation par l’AI' },
    ],
    confTitle: 'Du configurateur 3D à une plateforme d’entreprise complète.',
    confText:
      'Nos configurateurs 3D peuvent être le point de départ d’un processus métier intégré. De la configuration du produit et du devis à la préparation du travail, la production et la livraison. Avec des modules complémentaires, le configurateur devient un maillon central de votre entreprise.',
    confCta: 'Découvrir nos configurateurs 3D',
    finalTitle: 'Parlons de votre projet logiciel.',
    finalText:
      'Dites-nous quels processus vous voulez digitaliser. Nous examinons comment un logiciel sur mesure et l’AI peuvent renforcer votre entreprise.',
    finalCta: 'Parler de votre projet',
    finalSecondary: 'Découvrir nos configurateurs 3D',
  },
  es: {
    metaTitle: 'Encargar software empresarial a medida · semanu.eu',
    metaDescription:
      'Software empresarial a medida para pymes, desarrollado AI-first: de presupuestos y preparación del trabajo a producción y planificación. Modular.',
    serviceName: 'Software empresarial AI-first',
    serviceType: 'Software empresarial a medida',
    heroHeadline: 'El software empresarial, reinventado.',
    heroSub:
      'Gracias a nuestro enfoque de desarrollo AI-first, hacemos accesible el software empresarial avanzado para las pymes. De la gestión de presupuestos y la preparación del trabajo a la producción y la planificación. Totalmente a medida, ampliable por módulos y conectado mediante AI.',
    heroCta: 'Hable de su proyecto de software',
    heroImageAlt: 'Ejemplo de software empresarial a medida: panel de registro de horas',
    introTitle: '¿Qué es el software empresarial modular?',
    introText:
      'El software empresarial modular se construye en torno a sus procesos. No al revés. Desarrollamos módulos inteligentes a medida para todos los procesos de negocio.\n\nPuede empezar con un solo módulo y ampliar cuando su empresa esté preparada. Una capa inteligente de AI conecta los módulos, coordina los procesos y automatiza el trabajo repetitivo.',
    diffTitle: 'Lo que nos diferencia.',
    diffCards: [
      { n: '01', title: 'Más rápido con AI', text: 'Usamos AI durante todo el proceso de desarrollo. Así obtiene software a medida más rápido y a un coste asequible.' },
      { n: '02', title: 'A su ritmo', text: 'Solo digitalizamos los flujos que necesita ahora y ampliamos cuando su empresa esté preparada. Así controla los costes mientras su software crece con sus procesos.' },
      { n: '03', title: 'Usted es el propietario', text: 'Construimos a medida para su empresa y usted se convierte en propietario del software, código fuente incluido. No queda atado a un único proveedor y mantiene el control de su sistema.' },
    ],
    aiTitle: 'Software a medida.\nReinventado.',
    aiText:
      'El software a medida tradicional suele exigir grandes presupuestos y largos proyectos de desarrollo. Nosotros usamos AI durante todo el proceso de desarrollo. Así construimos software a medida de forma más eficiente y acercamos soluciones avanzadas a las pymes.',
    aiOldLabel: 'Desarrollo a medida tradicional',
    aiOld: ['Largos proyectos de desarrollo', 'Altos costes de desarrollo', 'Gran inversión inicial'],
    aiNewLabel: 'semanu · AI-first',
    aiNew: ['De la idea al software más rápido', 'Desarrollo más eficiente con AI', 'Empezar en pequeño, crecer con flexibilidad'],
    modTitle: 'Empiece en pequeño.\nCrezca sin límites.',
    modText:
      'No hace falta digitalizar toda su organización de golpe. Empezamos donde está el mayor valor añadido y seguimos construyendo cuando su empresa esté preparada.',
    modSteps: [
      { n: '01', title: 'Primer módulo' },
      { n: '02', title: 'Conectar procesos' },
      { n: '03', title: 'Ampliar funciones' },
      { n: '04', title: 'Automatización con AI' },
    ],
    confTitle: 'Del configurador 3D a una plataforma empresarial completa.',
    confText:
      'Nuestros configuradores 3D pueden ser el punto de partida de un proceso empresarial integrado. De la configuración del producto y el presupuesto a la preparación del trabajo, la producción y la entrega. Con módulos adicionales, el configurador se convierte en un eslabón central de su empresa.',
    confCta: 'Descubra nuestros configuradores 3D',
    finalTitle: 'Hablemos de su proyecto de software.',
    finalText:
      'Cuéntenos qué procesos quiere digitalizar. Estudiaremos cómo el software a medida y la AI pueden reforzar su empresa.',
    finalCta: 'Hable de su proyecto',
    finalSecondary: 'Descubra nuestros configuradores 3D',
  },
};

export function getBusinessSoftware(locale: string): BusinessSoftwareCopy {
  return BUSINESS_SOFTWARE[(locale in BUSINESS_SOFTWARE ? locale : 'en') as ServicesLocale];
}
