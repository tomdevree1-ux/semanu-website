// Rich, flow-specific detail content for the individual service pages
// (/services/<slug>). Restructured 2026-10 to four services:
//   Consultancy · Workflowautomatisering · Maatwerksoftware · 3D-configuratoren
//
// The internal service ids are kept from the previous structure to avoid a
// risky id-wide rename; only their public meaning, slug and copy changed:
//   consultancy          -> Consultancy
//   marketing-automation -> Workflowautomatisering  (slug workflow-automation)
//   business-systems     -> Maatwerksoftware        (slug maatwerksoftware)
//   3d-configurators     -> 3D-configuratoren        (slug 3d-configurators)
//
// NL-first: the content is authored in Dutch and reused across all five locale
// slots until DE/FR/EN/ES translations are added. House style (every language):
// no dashes, no comma before a coordinating conjunction (en / of / maar / met).
// The literal "semanu" in copy is the brand marker that BrandText renders as the
// styled "semanu" wordmark; keep it.

import type { ServicesLocale } from './services';

export type FlowId = 'presence' | 'automation' | 'systems';

/** Which flow (layout system) each service id renders with. */
export const FLOW_BY_ID: Record<string, FlowId> = {
  consultancy: 'automation',
  'marketing-automation': 'automation',
  'business-systems': 'systems',
  '3d-configurators': 'automation',
};

/**
 * Related services shown at the foot of each service page (max 2 each), chosen so
 * the cross links map real topical relationships without cannibalising.
 */
export const RELATED_SERVICES: Record<string, string[]> = {
  consultancy: ['marketing-automation', 'business-systems'],
  'marketing-automation': ['consultancy', 'business-systems'],
  'business-systems': ['consultancy', 'marketing-automation'],
  '3d-configurators': ['business-systems', 'marketing-automation'],
};

/**
 * Local-SEO landing pages most relevant to a service, surfaced as contextual
 * links on the service page. `labelKey` reuses existing `footer.topics.*`
 * translations, so no new strings are needed.
 */
export const SERVICE_LANDINGS: Record<string, { slug: string; labelKey: string }[]> = {
  '3d-configurators': [{ slug: '3d-konfigurator-schweiz', labelKey: 'konfigurator' }],
};

export type DetailCard = { title: string; text: string };

export type ServiceDetail = {
  // per-service metadata (unique per page)
  metaTitle: string;
  metaDescription: string;
  ogDescription: string;
  // hero
  heroHeadline: string; // the unique H1
  heroSub: string;
  // trust strip (3 to 4 short promises)
  trust: string[];
  // problem section
  problemTitle: string;
  problemIntro: string;
  problemCards: DetailCard[];
  // signature "engine"/visual section
  engineTitle: string;
  engineText: string;
  visual: string[]; // labels for the flow-specific visual (flow / hub)
  visualCaption: string;
  visualCards?: DetailCard[];
  hubCenter?: string; // centre label for the hub visual (systems flow)
  // what semanu builds (chips come from base service.builds)
  buildsTitle: string;
  buildsLead: string;
  // use cases
  useCasesTitle: string;
  useCasesLead: string;
  useCases: DetailCard[];
  example?: { label: string; text: string; linkLabel: string };
  // process
  processTitle: string;
  process: DetailCard[];
  // outcomes (chips come from base service.benefits)
  outcomesTitle: string;
  outcomesLead: string;
  // faq (service specific)
  faqTitle: string;
  faq: { q: string; a: string }[];
  // final cta
  finalTitle: string;
  finalText: string;
  finalCta: string;
  finalSecondaryLabel: string;
  finalSecondaryHref: string;
  seoStandard?: { heading: string; body: string; linkLabel: string; url: string };
  subTheme?: { label: string; heading: string; body: string; cards?: DetailCard[] };
  heroFlow?: { icon: 'lead' | 'mail' | 'wait' | 'bell' | 'check'; title: string; sub: string }[];
  scenario?: { title: string; problem: string; solution: string; result: string };
  // optional "from choice to request" flow: intro + big tiles (configurator /
  // consultancy). The tiles render their label as the title; `title`/`intro`
  // are kept for data completeness but are not shown.
  flow?: {
    title: string;
    intro: string;
    tiles: { label: string; title: string; text: string }[];
  };
  // optional compact "what you take away" rows: question bold + answer after
  takeaways?: {
    title: string;
    items: { q: string; a: string }[];
  };
  // optional "export documents" showcase: intro + document cards with an image
  exports?: {
    title: string;
    intro: string;
    docs: { label: string; img: string; alt: string; caption: string }[];
  };
  // optional "integrations" band: intro + a list of connected systems (chips)
  // plus an optional scrolling logo strip of known platforms.
  integrations?: {
    title: string;
    intro: string;
    items: string[];
    logos?: { name: string; src?: string }[];
  };
};

type DetailMap = Record<string, ServiceDetail>;

// ============================================================
// Content (NL, reused across all locales until translated)
// ============================================================
const nl: DetailMap = {
  consultancy: {
    metaTitle: 'Digitale consultancy voor kmo · semanu.eu',
    metaDescription:
      'Onafhankelijk advies over digitalisering en AI. semanu analyseert uw processen en levert een heldere roadmap met prioriteiten voor Zwitserse kmo.',
    ogDescription:
      'Weten wat u moet digitaliseren en waar AI echt waarde heeft, voordat u investeert. semanu brengt uw processen en opties helder in kaart.',
    heroHeadline: 'Digitale consultancy\neerst denken\ndan bouwen',
    heroSub:
      'semanu helpt Zwitserse kmo bepalen wat ze moeten digitaliseren en waar AI werkelijk waarde oplevert. U krijgt een onderbouwde roadmap in plaats van een verkooppraatje.',
    trust: [
      'eerlijk advies, ook als het antwoord niet bouwen is',
      'procesanalyse en roadmap',
      'advies los van de bouw',
    ],
    problemTitle: 'Investeren in digitalisering zonder richting kost geld',
    problemIntro: 'Veel kmo voelen dat het efficiënter kan, maar weten nog niet waarin ze moeten investeren.',
    problemCards: [
      { title: 'Losse tools', text: 'Systemen die niet samenwerken, zonder duidelijk startpunt om dat op te lossen.' },
      { title: 'AI als vraagteken', text: 'Twijfel of AI echt iets oplevert of vooral een modewoord is.' },
      { title: 'Investering zonder zekerheid', text: 'Een grote keuze voor de deur, zonder onderbouwing om ze te verdedigen.' },
    ],
    engineTitle: 'Hoe een adviestraject\nverloopt',
    engineText:
      'We brengen uw processen en systemen in kaart, bepalen waar de grootste winst zit en wegen per kans standaardsoftware, maatwerk, automatisering en AI tegen elkaar af. U krijgt een concrete roadmap met een logische volgorde. Omdat we zelf bouwen, weten we wat haalbaar en betaalbaar is, zonder dat het advies daardoor gestuurd wordt.',
    flow: {
      title: 'Wanneer consultancy het verschil maakt',
      intro: '',
      tiles: [
        {
          label: 'IDEE AFTOETSEN',
          title: '',
          text: 'U heeft een software-idee maar weet niet of het de investering waard is. We toetsen wat het minimaal moet kunnen, wat het ongeveer kost en of het al bestaat.',
        },
        {
          label: 'ECOSYSTEEM OPTIMALISEREN',
          title: '',
          text: 'Uw tools praten niet met elkaar en er wordt dubbel ingegeven. We brengen in kaart wat u kan houden, koppelen of schrappen.',
        },
        {
          label: 'DIGITALE STRATEGIE',
          title: '',
          text: 'U wil weten welke digitale stappen uw groei de komende jaren dragen en waar AI echt iets oplevert. U krijgt een duidelijke volgorde.',
        },
      ],
    },
    takeaways: {
      title: 'Wat u meeneemt',
      items: [
        { q: 'Moet ik dit bouwen?', a: 'Een go of no-go met wat het minimaal moet kunnen.' },
        { q: 'Wat kan weg en wat moet praten?', a: 'Een kaart van uw tools: houden, koppelen of schrappen.' },
        { q: 'Wat doe ik eerst?', a: 'Een roadmap op één pagina.' },
      ],
    },
    visual: ['Procesanalyse', 'Kansen', 'Prioriteiten', 'Technologiekeuze', 'Roadmap'],
    visualCaption: 'Van een onduidelijke opstelling naar een helder digitaal plan.',
    buildsTitle: 'Wat consultancy omvat',
    buildsLead: 'Onafhankelijk advies rond uw bedrijf, geen verkoopgesprek voor een tool.',
    useCasesTitle: 'Wanneer consultancy\nzinvol is',
    useCasesLead: 'Een paar situaties waarin een kort adviestraject het verschil maakt.',
    useCases: [
      { title: 'Losse tools', text: 'U werkt met systemen die niet met elkaar praten en weet niet waar te beginnen.' },
      { title: 'AI afwegen', text: 'U wil weten of AI iets voor u betekent voordat u erin investeert.' },
      { title: 'Grote keuze', text: 'U staat voor een investering en wil eerst zekerheid over de richting.' },
    ],
    processTitle: 'Zo pakken we een adviestraject aan',
    process: [
      { title: 'Procesanalyse', text: 'We brengen uw belangrijkste processen, systemen en knelpunten in kaart.' },
      { title: 'Kansen en prioriteiten', text: 'We bepalen waar de grootste winst zit en wat het eerst moet gebeuren.' },
      { title: 'Technologiekeuze', text: 'Per kans wegen we standaardsoftware, maatwerk, automatisering en AI af.' },
      { title: 'Roadmap', text: 'U krijgt een concreet stappenplan met een logische volgorde en afhankelijkheden.' },
    ],
    outcomesTitle: 'Wat u overhoudt',
    outcomesLead: 'Een onderbouwd plan dat u intern kunt verdedigen en ook zonder ons kunt uitvoeren.',
    faqTitle: 'Veelgestelde vragen over digitale consultancy',
    faq: [
      { q: 'Wat doet een digitale consultant?', a: 'Een digitale consultant analyseert hoe u werkt en adviseert welke processen u beter digitaliseert en welke technologie daarbij past. Het eindproduct is een onderbouwd plan, geen software.' },
      { q: 'Wanneer heeft mijn bedrijf digitale consultancy nodig?', a: 'Vooral wanneer u wil investeren in digitalisering of AI maar nog niet zeker weet waarin. Een kort adviestraject voorkomt dat u geld steekt in de verkeerde oplossing.' },
      { q: 'Waar kan AI waarde creëren binnen een kmo?', a: 'Daar waar een proces ongestructureerde informatie moet interpreteren, zoals documenten, emails of klantvragen. Voor eenvoudige, regelmatige taken is klassieke automatisering meestal beter.' },
      { q: 'Bouwen jullie ook wat je adviseert?', a: 'Ja, maar het advies staat los van de bouw. Zo blijft de aanbeveling onafhankelijk. U bent nooit verplicht om de uitvoering bij ons te leggen.' },
      { q: 'Moet ik al weten wat ik wil?', a: 'Nee. U mag met een vaag idee of een probleem komen. We scherpen samen aan wat echt nodig is en wat het eerst moet oplossen.' },
      { q: 'Kunnen we de roadmap daarna zelf uitvoeren?', a: 'Ja. Het plan is zo opgesteld dat u het intern kunt verdedigen en ook zonder ons kunt uitvoeren.' },
    ],
    finalTitle: 'Bespreek uw digitale uitdaging',
    finalText: 'Vertel kort waar u vastloopt en we bekijken samen wat eerst telt en wat kan wachten.',
    finalCta: 'Bespreek uw digitale uitdaging',
    finalSecondaryLabel: 'Bekijk alle diensten',
    finalSecondaryHref: '/services',
  },

  'marketing-automation': {
    metaTitle: 'Workflowautomatisering voor kmo · semanu.eu',
    metaDescription:
      'Automatiseer terugkerend werk en verbind uw systemen via integraties en API. semanu vermindert manueel werk en fouten voor Zwitserse kmo.',
    ogDescription:
      'semanu verbindt uw bestaande software en automatiseert terugkerende stappen, van CRM en ERP tot documentverwerking.',
    heroHeadline: 'Workflowautomatisering die uw systemen laat samenwerken.',
    heroSub:
      'semanu automatiseert terugkerende stappen en verbindt uw bestaande software, zodat uw team minder overtypt en minder fouten maakt. Voor Zwitserse kmo zonder groot IT team.',
    trust: ['koppelt bestaande systemen', 'minder manueel werk', 'AI alleen waar het telt'],
    problemTitle: 'Terugkerend handwerk kost stil elke week tijd',
    problemIntro: 'Wie met losse systemen werkt, herkent deze knelpunten.',
    problemCards: [
      { title: 'Overtypen tussen systemen', text: 'Dezelfde gegevens gaan met de hand van het ene systeem naar het andere.' },
      { title: 'Fouten door handwerk', text: 'Elke manuele stap is een plek waar iets kan misgaan of blijven liggen.' },
      { title: 'Losse tools', text: 'Applicaties die niet met elkaar praten, waardoor niemand het overzicht houdt.' },
    ],
    engineTitle: 'Van losse stappen\nnaar één flow',
    engineText:
      'We bekijken de workflow zoals die vandaag echt verloopt, bepalen welke stappen zich lenen voor automatisering en bouwen de koppelingen via API en integraties. Zo hoeft u uw systemen niet te vervangen. AI zetten we gericht in, alleen waar een stap ongestructureerde informatie moet interpreteren.',
    visual: ['Formulier', 'Lead opgeslagen', 'Email verstuurd', 'Team verwittigd', 'Opvolging'],
    visualCaption: 'Eén gebeurtenis, de volgende stappen automatisch afgehandeld.',
    buildsTitle: 'Wat semanu opzet',
    buildsLead: 'Interne en klantgerichte processen die stil op de achtergrond lopen.',
    useCasesTitle: 'Welke processen\nu kunt automatiseren',
    useCasesLead: 'Processen die terugkeren en vaste regels volgen lenen zich het best.',
    useCases: [
      { title: 'Systeemintegraties', text: 'Twee of meer applicaties automatisch laten samenwerken.' },
      { title: 'CRM en ERP', text: 'Leads, orders of klantgegevens synchroon houden tussen systemen.' },
      { title: 'Documentverwerking', text: 'Facturen, formulieren of bestelbonnen uitlezen en verwerken.' },
    ],
    processTitle: 'Zo pakken we een automatisering aan',
    process: [
      { title: 'In kaart', text: 'We bekijken de workflow zoals die echt verloopt, inclusief de uitzonderingen.' },
      { title: 'Afbakenen', text: 'We bepalen welke stappen zich lenen voor automatisering en welke beter manueel blijven.' },
      { title: 'Bouwen en testen', text: 'We bouwen de koppelingen en testen ze op uw echte gevallen.' },
      { title: 'Opvolgen', text: 'We houden de workflow mee in de gaten en passen aan wanneer uw proces wijzigt.' },
    ],
    outcomesTitle: 'Wat het oplevert',
    outcomesLead: 'Minder handwerk, minder fouten en meer overzicht over uw processen.',
    faqTitle: 'Veelgestelde vragen over workflowautomatisering',
    faq: [
      { q: 'Wat is workflowautomatisering?', a: 'Het automatisch uitvoeren of verbinden van terugkerende stappen in een bedrijfsproces, zodat medewerkers dat werk niet meer handmatig doen.' },
      { q: 'Welke bedrijfsprocessen kunnen worden geautomatiseerd?', a: 'Processen die terugkeren en vaste regels volgen, zoals gegevens overzetten tussen systemen, documenten verwerken of bevestigingen en herinneringen versturen.' },
      { q: 'Kan automatisering gekoppeld worden aan bestaande software?', a: 'Ja. Via API en integraties verbinden we systemen die u al gebruikt, zodat u ze niet hoeft te vervangen.' },
      { q: 'Wanneer is AI nodig voor automatisering?', a: 'Alleen wanneer een stap ongestructureerde informatie moet interpreteren, zoals een vrij geschreven email. Voor regelgebaseerde stappen is klassieke automatisering beter.' },
      { q: 'Wat is het verschil met RPA?', a: 'RPA bootst handelingen na in de schermen van een programma. Een API koppeling werkt rechtstreeks tussen systemen en is doorgaans stabieler. We kiezen RPA alleen als een koppeling ontbreekt.' },
    ],
    finalTitle: 'Laat ons uw workflow bekijken',
    finalText: 'Vertel welk terugkerend werk u tijd kost en we tonen wat semanu daarvan kan automatiseren.',
    finalCta: 'Laat ons uw workflow bekijken',
    finalSecondaryLabel: 'Bekijk alle diensten',
    finalSecondaryHref: '/services',
  },

  'business-systems': {
    metaTitle: 'Maatwerksoftware voor kmo · semanu.eu',
    metaDescription:
      'Software op maat wanneer standaardpakketten niet passen: webapplicaties, portalen en interne tools, met koppelingen naar uw systemen.',
    ogDescription:
      'semanu bouwt software op maat die aansluit op hoe u werkt: portalen, interne tools en webapplicaties, met integraties en oog voor onderhoud.',
    heroHeadline: 'Maatwerksoftware voor wanneer standaardpakketten niet passen.',
    heroSub:
      'semanu bouwt webapplicaties, portalen en interne tools die aansluiten op hoe uw bedrijf echt werkt. Voor Zwitserse kmo die vastlopen op standaardsoftware.',
    trust: ['aansluit op uw proces', 'koppelt met uw systemen', 'oog voor onderhoud en eigendom'],
    hubCenter: 'Maatwerk',
    problemTitle: 'Wanneer standaardsoftware uw bedrijf afremt',
    problemIntro: 'Standaardsoftware is vaak het vertrekpunt. Soms past ze gewoon niet.',
    problemCards: [
      { title: 'Proces aanpassen aan de tool', text: 'U verbouwt uw manier van werken om in het pakket te passen, in plaats van omgekeerd.' },
      { title: 'Veel losse tools', text: 'Meerdere pakketten en veel handwerk om één werkproces rond te krijgen.' },
      { title: 'Groei afgeremd', text: 'Bestaande software koppelt niet of kan niet mee met wat u nodig hebt.' },
    ],
    engineTitle: 'Eén platform, uw systemen\neromheen verbonden',
    engineText:
      'We vertalen uw probleem naar concrete requirements en bouwen eerst het onderdeel met de meeste waarde. Daarna breiden we stapsgewijs uit, met integraties naar uw bestaande systemen zodat gegevens op één plek kloppen. Software blijft leven, dus we houden ze veilig, actueel en aanpasbaar.',
    visual: ['Webapplicaties', 'Portalen', 'Interne tools', 'Integraties', 'Onderhoud'],
    visualCaption: 'Een platform op maat, rond uw bedrijf gebouwd.',
    buildsTitle: 'Wat semanu bouwt',
    buildsLead: 'Maatwerk rond uw bedrijf, geen generieke sjabloon.',
    useCasesTitle: 'Wat we bouwen',
    useCasesLead: 'Een paar vormen die maatwerksoftware vaak aanneemt.',
    useCases: [
      { title: 'Interne bedrijfsapplicaties', text: 'Tools die een specifiek werkproces ondersteunen.' },
      { title: 'Klant- en partnerportalen', text: 'Een beveiligde omgeving waar klanten of partners zelf zaken regelen.' },
      { title: 'Legacy modernisering', text: 'Een verouderd systeem gefaseerd vervangen zonder uw werking stil te leggen.' },
    ],
    processTitle: 'Hoe een maatwerkproject verloopt',
    process: [
      { title: 'Scherpstellen', text: 'We vertalen uw probleem naar concrete requirements en een haalbare scope.' },
      { title: 'Eerste werkende versie', text: 'We bouwen eerst het kernstuk dat de meeste waarde levert.' },
      { title: 'Uitbreiden', text: 'We voegen stapsgewijs functionaliteit toe op basis van gebruik.' },
      { title: 'Onderhoud', text: 'We houden de software veilig, actueel en aanpasbaar.' },
    ],
    outcomesTitle: 'Wat u overhoudt',
    outcomesLead: 'Software die aansluit op hoe u werkt, met koppelingen en oog voor de lange termijn.',
    faqTitle: 'Veelgestelde vragen over maatwerksoftware',
    faq: [
      { q: 'Wanneer is maatwerksoftware interessanter dan standaardsoftware?', a: 'Wanneer u uw proces zou moeten aanpassen aan het pakket in plaats van omgekeerd, of wanneer losse tools en veel handwerk nodig zijn om één proces rond te krijgen.' },
      { q: 'Wat kost maatwerksoftware?', a: 'Dat hangt af van de omvang en complexiteit; een vaste prijs bestaat niet. We bouwen gefaseerd, te beginnen met het onderdeel dat de meeste waarde levert.' },
      { q: 'Kan maatwerksoftware koppelen met bestaande systemen?', a: 'Ja. Integraties met uw huidige software zijn meestal een kernonderdeel, zodat gegevens op één plek blijven kloppen.' },
      { q: 'Hoe verloopt de ontwikkeling van maatwerksoftware?', a: 'We starten met heldere requirements, bouwen eerst een werkende kernversie en breiden daarna stapsgewijs uit, met onderhoud erna.' },
    ],
    finalTitle: 'Bespreek uw softwarevraagstuk',
    finalText: 'Vertel ons waar standaardsoftware tekortschiet en we bekijken of maatwerk de juiste stap is.',
    finalCta: 'Bespreek uw softwarevraagstuk',
    finalSecondaryLabel: 'Bekijk alle diensten',
    finalSecondaryHref: '/services',
  },

  '3d-configurators': {
    metaTitle: '3D-productconfigurator laten bouwen · semanu.eu',
    metaDescription:
      'Maak configureerbare producten online verkoopbaar: realtime 3D, configuratieregels, prijslogica en koppelingen met uw webshop, CRM of ERP.',
    ogDescription:
      'semanu bouwt 3D-configuratoren waarmee klanten uw product samenstellen, de prijs zien en een aanvraag versturen, gekoppeld aan uw systemen.',
    heroHeadline: 'Van complexe producten naar online verkoop.',
    heroSub:
      '3D-productconfiguratoren op maat voor fabrikanten, waarmee klanten complexe producten online kunnen configureren, direct de prijs zien en bestellen.',
    trust: ['Gebruiksvriendelijk', 'Prijs in realtime', 'Stuklijsten en meer', 'Augmented reality (AR)', 'ERP en CRM-connectie'],
    scenario: {
      title: 'Een meubelmaker, bedolven onder de mails',
      problem: 'Een meubelmaker beantwoordde elke maatwerkvraag met de hand, in lange mailketens over houtsoort, maten en prijs.',
      solution: 'semanu bouwde een configurator waarin klanten hun stuk samenstellen en meteen een richtprijs zien.',
      result: 'De aanvragen zijn nu concreet en de werkplaats verliest minder tijd met offertes met de hand.',
    },
    problemTitle: 'Configureerbare producten verkopen kost veel uitleg',
    problemIntro: 'Wie producten met veel varianten verkoopt, kent deze hindernissen.',
    problemCards: [
      { title: 'Eindeloze mailketens', text: 'Elke variant wordt met de hand besproken, wat tijd en geduld kost.' },
      { title: 'Vage aanvragen', text: 'Zonder preview en prijs weten klanten niet wat mogelijk is en wat het kost.' },
      { title: 'Verloren klanten', text: 'Zonder duidelijke volgende stap haken mensen af en vragen elders.' },
    ],
    engineTitle: 'Van keuze tot\nconcrete aanvraag',
    engineText:
      'Uw klant kiest opties en maten, de regels sluiten ongeldige combinaties uit en elke keuze werkt de preview en de prijs live bij. De afgewerkte configuratie bereikt u als een concrete aanvraag of order, via een koppeling met uw webshop, CRM of ERP.',
    flow: {
      title: 'Van productkeuze tot concrete aanvraag',
      intro:
        'Met een 3D-productconfigurator stellen klanten eenvoudig hun product online samen. De configurator controleert automatisch welke opties en combinaties mogelijk zijn, toont het resultaat direct in 3D en zet de gekozen configuratie om in bruikbare gegevens voor verkoop en productie.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Uw klant kiest opties, uitvoeringen en afmetingen in een interactieve 3D-productconfigurator.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'De 3D-productconfigurator zet geldige configuraties automatisch om in prijzen, offertes, specificaties, stuklijsten en productiedocumenten.',
        },
        {
          label: 'INTEGRATIE',
          title: '',
          text: 'Koppel de 3D-productconfigurator aan uw website, webshop, CRM, ERP of productiesysteem.',
        },
      ],
    },
    exports: {
      title: 'Offerte, stuklijst of productiefile?\nGeen probleem!',
      intro:
        'Geen vrijblijvend speeltje: elke configuratie levert meteen de documenten die uw proces nodig heeft. Een prijsofferte voor de klant, een technische tekening voor de werkvoorbereiding en een stuklijst voor inkoop of ERP. Andere exports zijn ook mogelijk, zoals snijbestanden voor CNC-machines of aansturingsdata voor productieapparatuur. Dit is de brug van verkoop naar productie.',
      docs: [
        { label: 'PRIJSOFFERTE · PDF', img: '/configurator-exports/offerte.jpg', alt: 'Voorbeeld van een prijsofferte als PDF uit de configurator', caption: 'Een prijsofferte voor de klant, klaar om te versturen.' },
        { label: 'TECHNISCHE TEKENING · PDF', img: '/configurator-exports/tekening.jpg', alt: 'Voorbeeld van een technische tekening als PDF uit de configurator', caption: 'Voor de werkvoorbereiding, zonder tekenkamer.' },
        { label: 'STUKLIJST · BOM', img: '/configurator-exports/stuklijst.jpg', alt: 'Voorbeeld van een stuklijst of bill of materials uit de configurator', caption: 'Klaar voor inkoop of ERP.' },
      ],
    },
    integrations: {
      title: 'Verbonden met uw\nbestaande systemen',
      intro:
        'Een configurator staat niet op zichzelf. Wij koppelen hem rechtstreeks aan de platformen die u al gebruikt zodat een order automatisch doorstroomt zonder overtypen. Van een nieuwe aanvraag in uw CRM tot een stuklijst in uw ERP of een snijbestand voor uw CNC-machine. Zo loopt alles van verkoop tot productie in één keten.',
      items: ['ERP', 'CRM', 'PIM', 'CNC-machines', 'Webshop', 'Boekhouding', 'Productieapparatuur', 'Magazijn en logistiek'],
      logos: [
        { name: 'SAP' },
        { name: 'Microsoft Dynamics' },
        { name: 'Odoo' },
        { name: 'Exact' },
        { name: 'Teamleader' },
        { name: 'HubSpot' },
        { name: 'Salesforce' },
        { name: 'Shopify' },
        { name: 'WooCommerce' },
        { name: 'Pipedrive' },
        { name: 'Autodesk' },
        { name: 'SolidWorks' },
      ],
    },
    visual: ['Opties', 'Regels', 'Preview', 'Prijs', 'Aanvraag'],
    visualCaption: 'Van de eerste keuze tot een concrete aanvraag, in één flow.',
    buildsTitle: 'Wat een semanu configurator kan',
    buildsLead: 'Van één product tot een hele reeks varianten.',
    useCasesTitle: 'Voor welke producten\neen configurator past',
    useCasesLead: 'Vooral producten met veel varianten die anders veel offertewerk vragen.',
    useCases: [
      { title: 'Meubel en interieur', text: 'Configureer tafels, kasten, zitmeubels en volledige interieurs op model, materiaal, kleur en afmetingen.' },
      { title: 'Ramen, trappen en poorten', text: 'Stel type, maat, materiaal en afwerking in voor ramen, trappen, leuningen en poorten met een richtprijs.' },
      { title: 'Machines op maat', text: 'Stel machines en machineonderdelen samen met verschillende opties, varianten en technische specificaties.' },
      { title: 'Deuren en gevels', text: 'Configureer binnendeuren en buitendeuren, gevels en vliesgevels op type, materiaal, kleur en prestatie.' },
      { title: 'Rekken en opbergsystemen', text: 'Bouw rekken, stellingen en opbergoplossingen op maat, draagkracht en afwerking voor elke sector.' },
      { title: 'Industriële behuizingen en kasten', text: 'Configureer schakelkasten, besturingskasten en behuizingen op afmetingen, materiaal, beschermingsgraad en opties.' },
      { title: 'Zonwering en buitenleven', text: 'Stel pergola’s, zonneschermen, screens en buitenstructuren samen op maat, stof, kleur en montageoptie.' },
      { title: 'Modulaire gebouwen', text: 'Configureer modulaire gebouwen, containers en units met de juiste indeling, afmetingen en technische kenmerken.' },
      { title: 'Transport en aanhangwagens', text: 'Configureer aanhangwagens, opbouwen en transportoplossingen op afmetingen, laadvermogen, chassis en accessoires.' },
    ],
    processTitle: 'Zo pakken we een configurator aan',
    process: [
      { title: 'Varianten', text: 'We brengen uw opties, varianten en regels in kaart, inclusief de prijslogica.' },
      { title: 'Design', text: 'We bouwen de configurator in uw huisstijl en in uw website.' },
      { title: 'Integratie', text: 'We koppelen preview, prijs en aanvraag aan uw systemen.' },
      { title: 'Begeleiding', text: 'We houden varianten en prijzen actueel wanneer uw aanbod wijzigt.' },
    ],
    outcomesTitle: 'Wat u gewint',
    outcomesLead: 'Minder offertewerk met de hand en concretere aanvragen.',
    faqTitle: 'Veelgestelde vragen over 3D-configuratoren',
    faq: [
      { q: 'Was ist ein 3D-Produktkonfigurator?', a: 'Ein 3D-Produktkonfigurator ist eine interaktive Software, mit der Kunden Produkte online individuell zusammenstellen können. Sie wählen beispielsweise Masse, Materialien, Farben und Ausführungen aus und sehen die Änderungen direkt in einer dreidimensionalen Darstellung. Je nach Umsetzung werden auch Preise automatisch berechnet. Dadurch vereinfachen Unternehmen den Verkaufsprozess und reduzieren den Aufwand für manuelle Offerten.' },
      { q: 'Was ist der Unterschied zwischen einem 3D-Viewer und einem 3D-Konfigurator?', a: 'Ein 3D-Viewer ermöglicht es, ein Produkt aus verschiedenen Perspektiven zu betrachten. Ein 3D-Konfigurator geht einen Schritt weiter: Kunden können das Produkt selbst verändern, beispielsweise durch die Auswahl unterschiedlicher Masse, Materialien oder Ausführungen. Dabei berücksichtigt der Konfigurator technische Regeln und kann automatisch passende Preise berechnen. So wird aus einer einfachen Produktvisualisierung ein interaktives Verkaufswerkzeug.' },
      { q: 'Für welche Produkte eignet sich ein 3D-Konfigurator?', a: 'Ein 3D-Produktkonfigurator eignet sich besonders für Produkte mit vielen Varianten oder individuellen Anpassungsmöglichkeiten. Typische Beispiele sind Möbel, Fenster, Türen, Treppen, Pergolen, Maschinen und industrielle Bauteile. Besonders sinnvoll ist ein Konfigurator, wenn Kunden heute viele Rückfragen stellen oder individuelle Offerten manuell erstellt werden müssen. Ein Konfigurator vereinfacht diesen Prozess und macht komplexe Produkte leichter verständlich.' },
      { q: 'Was kostet die Entwicklung eines 3D-Produktkonfigurators?', a: 'Die Kosten setzen sich bei semanu aus einmaligen Implementierungskosten und einem festen monatlichen Abonnement zusammen. Die Implementierungskosten hängen unter anderem von der Produktkomplexität, der Anzahl der Varianten, den benötigten 3D-Modellen und den gewünschten Integrationen ab. In einem ersten Gespräch analysieren wir Ihre Anforderungen und zeigen Ihnen, welche Lösung für Ihr Produkt sinnvoll ist.' },
      { q: 'Wie lange dauert die Entwicklung eines 3D-Konfigurators?', a: 'Die Entwicklungsdauer hängt von der Komplexität Ihres Produkts und den gewünschten Funktionen ab. Ein Konfigurator mit wenigen Varianten ist schneller umsetzbar als eine Lösung mit umfangreichen Produktregeln, automatischer Preisberechnung und ERP-Anbindung. Auch die Verfügbarkeit bestehender 3D-Modelle spielt eine Rolle. Nach einer ersten Analyse können wir den Aufwand einschätzen und einen realistischen Zeitplan erstellen.' },
      { q: 'Benötigen wir bereits 3D-Modelle unserer Produkte?', a: 'Nicht unbedingt. Wenn bereits geeignete 3D-Modelle vorhanden sind, können diese möglicherweise als Grundlage für den Konfigurator verwendet werden. Falls keine Modelle existieren, muss zunächst geprüft werden, wie die benötigten 3D-Daten erstellt werden können. Entscheidend sind die Komplexität des Produkts und die gewünschten Konfigurationsmöglichkeiten. Wir klären gemeinsam, welche Daten benötigt werden und wie sich Ihr Produkt am besten visualisieren lässt.' },
      { q: 'Kann ein 3D-Konfigurator in unsere bestehende Website oder unseren Webshop integriert werden?', a: 'Ja. Ein 3D-Produktkonfigurator kann in eine bestehende Website oder einen Webshop integriert werden, sofern die technischen Voraussetzungen erfüllt sind. Kunden können ihre Produkte dadurch direkt auf Ihrer Website konfigurieren, ohne eine separate Plattform besuchen zu müssen. Je nach Integration lassen sich Konfigurationen auch an Ihren Warenkorb, Ihr CRM oder Ihr ERP-System übertragen.' },
      { q: 'Kann ein 3D-Konfigurator automatisch Preise und Offerten erstellen?', a: 'Ja. Ein 3D-Konfigurator kann anhand Ihrer hinterlegten Preisregeln automatisch den Preis einer individuellen Produktkonfiguration berechnen. Dabei werden beispielsweise Masse, Materialien, Ausführungen und zusätzliche Optionen berücksichtigt. Auf dieser Grundlage können auch Offerten, Stücklisten und technische Dokumente generiert werden. Dadurch reduzieren Sie manuelle Berechnungen, vermeiden Fehler und beschleunigen die Bearbeitung von Kundenanfragen.' },
      { q: 'Kann ein 3D-Konfigurator mit unserem ERP- oder CRM-System verbunden werden?', a: 'Ja. Unsere 3D-Produktkonfiguratoren können über geeignete Schnittstellen mit bestehenden ERP-, CRM- und Produktionssystemen verbunden werden. So lassen sich Produktkonfigurationen, Kundeninformationen, Preise und Bestellungen automatisch übertragen. Dadurch kann eine Kundenanfrage direkt in Ihren bestehenden Verkaufs- oder Produktionsprozess einfliessen. Welche Integrationen möglich sind, hängt von den technischen Schnittstellen Ihrer Systeme ab.' },
    ],
    finalTitle: 'Bespreek uw productconfigurator',
    finalText: 'Vertel ons over uw product en we tonen hoe een configurator er in uw website kan uitzien.',
    finalCta: 'Bespreek uw productconfigurator',
    finalSecondaryLabel: 'Bekijk een live configurator',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const en: DetailMap = {
  consultancy: {
    metaTitle: 'Digital consultancy for SMEs · semanu.eu',
    metaDescription:
      'Independent advice on digitalisation and AI. semanu analyses your processes and delivers a clear roadmap with priorities for Swiss SMEs.',
    ogDescription:
      'Know what to digitalise and where AI truly adds value, before you invest. semanu maps your processes and options clearly.',
    heroHeadline: 'Digital consultancy that thinks first and builds later.',
    heroSub:
      'semanu helps Swiss SMEs decide what to digitalise and where AI really adds value. You get a well founded roadmap instead of a sales pitch.',
    trust: [
      'honest advice, even when the answer is not to build',
      'process analysis and roadmap',
      'advice separate from the build',
    ],
    problemTitle: 'Investing in digitalisation without direction costs money',
    problemIntro: 'Many SMEs sense things could be more efficient but do not yet know what to invest in.',
    problemCards: [
      { title: 'Disconnected tools', text: 'Systems that do not work together, with no clear starting point to fix it.' },
      { title: 'AI as a question mark', text: 'Doubt whether AI really delivers or is mostly a buzzword.' },
      { title: 'Investment without certainty', text: 'A big choice ahead, with no basis to defend it.' },
    ],
    engineTitle: 'How an advisory track\nunfolds',
    engineText:
      'We map your processes and systems, determine where the biggest gains are and weigh off the shelf software, custom work, automation and AI against each other per opportunity. You get a concrete roadmap with a logical order. Because we build ourselves, we know what is feasible and affordable, without the advice being steered by it.',
    flow: {
      title: 'When consultancy makes the difference',
      intro: '',
      tiles: [
        {
          label: 'TEST THE IDEA',
          title: '',
          text: 'You have a software idea but do not know if it is worth the investment. We test what it needs to do at a minimum, roughly what it costs and whether it already exists.',
        },
        {
          label: 'OPTIMISE THE ECOSYSTEM',
          title: '',
          text: 'Your tools do not talk to each other and data is entered twice. We map what you can keep, connect or drop.',
        },
        {
          label: 'DIGITAL STRATEGY',
          title: '',
          text: 'You want to know which digital steps carry your growth in the coming years and where AI really pays off. You get a clear order.',
        },
      ],
    },
    takeaways: {
      title: 'What you take away',
      items: [
        { q: 'Should I build this?', a: 'A go or no go with what it needs to do at a minimum.' },
        { q: 'What can go and what must talk?', a: 'A map of your tools: keep, connect or drop.' },
        { q: 'What do I do first?', a: 'A one page roadmap.' },
      ],
    },
    visual: ['Process analysis', 'Opportunities', 'Priorities', 'Technology choice', 'Roadmap'],
    visualCaption: 'From an unclear setup to a clear digital plan.',
    buildsTitle: 'What consultancy covers',
    buildsLead: 'Independent advice around your business, not a sales talk for a tool.',
    useCasesTitle: 'When consultancy\nmakes sense',
    useCasesLead: 'A few situations where a short advisory track makes the difference.',
    useCases: [
      { title: 'Disconnected tools', text: 'You work with systems that do not talk to each other and do not know where to start.' },
      { title: 'Weighing AI', text: 'You want to know whether AI means anything for you before you invest in it.' },
      { title: 'A big choice', text: 'You face an investment and want certainty about the direction first.' },
    ],
    processTitle: 'How we approach an advisory track',
    process: [
      { title: 'Process analysis', text: 'We map your key processes, systems and bottlenecks.' },
      { title: 'Opportunities and priorities', text: 'We determine where the biggest gains are and what should happen first.' },
      { title: 'Technology choice', text: 'Per opportunity we weigh off the shelf software, custom work, automation and AI.' },
      { title: 'Roadmap', text: 'You get a concrete step by step plan with a logical order and dependencies.' },
    ],
    outcomesTitle: 'What you are left with',
    outcomesLead: 'A well founded plan you can defend internally and execute even without us.',
    faqTitle: 'Frequently asked questions about digital consultancy',
    faq: [
      { q: 'What does a digital consultant do?', a: 'A digital consultant analyses how you work and advises which processes to digitalise and which technology fits. The end product is a well founded plan, not software.' },
      { q: 'When does my business need digital consultancy?', a: 'Mainly when you want to invest in digitalisation or AI but are not yet sure what in. A short advisory track prevents you from putting money into the wrong solution.' },
      { q: 'Where can AI create value within an SME?', a: 'Where a process has to interpret unstructured information, such as documents, emails or customer questions. For simple, regular tasks classic automation is usually better.' },
      { q: 'Do you also build what you advise?', a: 'Yes. The advice is separate from the build. That keeps the recommendation independent. You are never obliged to put the execution with us.' },
      { q: 'Do I need to know what I want already?', a: 'No. You may come with a vague idea or a problem. We sharpen together what is really needed and what it should solve first.' },
      { q: 'Can we execute the roadmap ourselves afterwards?', a: 'Yes. The plan is set up so you can defend it internally and execute it even without us.' },
    ],
    finalTitle: 'Discuss your digital challenge',
    finalText: 'Tell us briefly where you get stuck and we look together at what matters first and what can wait.',
    finalCta: 'Discuss your digital challenge',
    finalSecondaryLabel: 'See all services',
    finalSecondaryHref: '/services',
  },

  'marketing-automation': {
    metaTitle: 'Workflow automation for SMEs · semanu.eu',
    metaDescription:
      'Automate repetitive work and connect your systems through integrations and API. semanu reduces manual work and errors for Swiss SMEs.',
    ogDescription:
      'semanu connects your existing software and automates recurring steps, from CRM and ERP to document processing.',
    heroHeadline: 'Workflow automation that makes your systems work together.',
    heroSub:
      'semanu automates recurring steps and connects your existing software, so your team retypes less and makes fewer errors. For Swiss SMEs without a large IT team.',
    trust: ['connects existing systems', 'less manual work', 'AI only where it counts'],
    problemTitle: 'Recurring manual work quietly costs time every week',
    problemIntro: 'Anyone working with disconnected systems recognises these bottlenecks.',
    problemCards: [
      { title: 'Retyping between systems', text: 'The same data moves by hand from one system to another.' },
      { title: 'Errors from manual work', text: 'Every manual step is a place where something can go wrong or get stuck.' },
      { title: 'Disconnected tools', text: 'Applications that do not talk to each other, so no one keeps the overview.' },
    ],
    engineTitle: 'From separate steps\nto one flow',
    engineText:
      'We look at the workflow as it really runs today, determine which steps lend themselves to automation and build the connections through API and integrations. So you do not have to replace your systems. We use AI in a targeted way, only where a step has to interpret unstructured information.',
    visual: ['Form', 'Lead saved', 'Email sent', 'Team notified', 'Follow up'],
    visualCaption: 'One event, the next steps handled automatically.',
    buildsTitle: 'What semanu sets up',
    buildsLead: 'Internal and customer facing processes that run quietly in the background.',
    useCasesTitle: 'Which processes\nyou can automate',
    useCasesLead: 'Processes that recur and follow fixed rules lend themselves best.',
    useCases: [
      { title: 'System integrations', text: 'Letting two or more applications work together automatically.' },
      { title: 'CRM and ERP', text: 'Keeping leads, orders or customer data in sync between systems.' },
      { title: 'Document processing', text: 'Reading and processing invoices, forms or order slips.' },
    ],
    processTitle: 'How we approach an automation',
    process: [
      { title: 'Mapping', text: 'We look at the workflow as it really runs, including the exceptions.' },
      { title: 'Scoping', text: 'We determine which steps lend themselves to automation and which are better left manual.' },
      { title: 'Build and test', text: 'We build the connections and test them on your real cases.' },
      { title: 'Follow up', text: 'We keep an eye on the workflow and adjust when your process changes.' },
    ],
    outcomesTitle: 'What it delivers',
    outcomesLead: 'Less manual work, fewer errors and more oversight of your processes.',
    faqTitle: 'Frequently asked questions about workflow automation',
    faq: [
      { q: 'What is workflow automation?', a: 'Automatically running or connecting recurring steps in a business process, so staff no longer do that work by hand.' },
      { q: 'Which business processes can be automated?', a: 'Processes that recur and follow fixed rules, such as moving data between systems, processing documents or sending confirmations and reminders.' },
      { q: 'Can automation connect to existing software?', a: 'Yes. Through API and integrations we connect systems you already use, so you do not have to replace them.' },
      { q: 'When is AI needed for automation?', a: 'Only when a step has to interpret unstructured information, such as a freely written email. For rule based steps classic automation is better.' },
      { q: 'What is the difference with RPA?', a: 'RPA imitates actions in a program’s screens. An API connection works directly between systems and is usually more stable. We choose RPA only when a connection is missing.' },
    ],
    finalTitle: 'Let us review your workflow',
    finalText: 'Tell us which recurring work costs you time and we show what semanu can automate of it.',
    finalCta: 'Let us review your workflow',
    finalSecondaryLabel: 'See all services',
    finalSecondaryHref: '/services',
  },

  'business-systems': {
    metaTitle: 'Custom software for SMEs · semanu.eu',
    metaDescription:
      'Software built to fit when off the shelf packages do not: web applications, portals and internal tools, with connections to your systems.',
    ogDescription:
      'semanu builds custom software that matches how you work: portals, internal tools and web applications, with integrations and attention to maintenance.',
    heroHeadline: 'Custom software for when off the shelf packages do not fit.',
    heroSub:
      'semanu builds web applications, portals and internal tools that match how your business really works. For Swiss SMEs that get stuck on standard software.',
    trust: ['fits your process', 'connects with your systems', 'attention to maintenance and ownership'],
    hubCenter: 'Custom',
    problemTitle: 'When standard software holds your business back',
    problemIntro: 'Standard software is often the starting point. Sometimes it simply does not fit.',
    problemCards: [
      { title: 'Bending your process to the tool', text: 'You rebuild how you work to fit the package, instead of the other way around.' },
      { title: 'Many disconnected tools', text: 'Several packages and a lot of manual work to complete one work process.' },
      { title: 'Growth held back', text: 'Existing software does not connect or cannot keep up with what you need.' },
    ],
    engineTitle: 'One platform, your systems\nconnected around it',
    engineText:
      'We translate your problem into concrete requirements and first build the part with the most value. Then we expand step by step, with integrations to your existing systems so data is correct in one place. Software keeps living, so we keep it secure, current and adaptable.',
    visual: ['Web applications', 'Portals', 'Internal tools', 'Integrations', 'Maintenance'],
    visualCaption: 'A custom platform, built around your business.',
    buildsTitle: 'What semanu builds',
    buildsLead: 'Custom work around your business, not a generic template.',
    useCasesTitle: 'What we build',
    useCasesLead: 'A few forms custom software often takes.',
    useCases: [
      { title: 'Internal business applications', text: 'Tools that support a specific work process.' },
      { title: 'Customer and partner portals', text: 'A secure environment where customers or partners handle things themselves.' },
      { title: 'Legacy modernisation', text: 'Replacing an outdated system in phases without halting your operation.' },
    ],
    processTitle: 'How a custom project unfolds',
    process: [
      { title: 'Sharpening', text: 'We translate your problem into concrete requirements and a feasible scope.' },
      { title: 'First working version', text: 'We first build the core piece that delivers the most value.' },
      { title: 'Expand', text: 'We add functionality step by step based on usage.' },
      { title: 'Maintenance', text: 'We keep the software secure, current and adaptable.' },
    ],
    outcomesTitle: 'What you are left with',
    outcomesLead: 'Software that matches how you work, with connections and an eye on the long term.',
    faqTitle: 'Frequently asked questions about custom software',
    faq: [
      { q: 'When is custom software more interesting than standard software?', a: 'When you would have to adapt your process to the package instead of the other way around or when disconnected tools and a lot of manual work are needed to complete one process.' },
      { q: 'What does custom software cost?', a: 'That depends on the size and complexity; a fixed price does not exist. We build in phases, starting with the part that delivers the most value.' },
      { q: 'Can custom software connect to existing systems?', a: 'Yes. Integrations with your current software are usually a core part, so data stays correct in one place.' },
      { q: 'How does the development of custom software work?', a: 'We start with clear requirements, first build a working core version and then expand step by step, with maintenance afterwards.' },
    ],
    finalTitle: 'Discuss your software question',
    finalText: 'Tell us where standard software falls short and we look at whether custom work is the right step.',
    finalCta: 'Discuss your software question',
    finalSecondaryLabel: 'See all services',
    finalSecondaryHref: '/services',
  },

  '3d-configurators': {
    metaTitle: 'Have a 3D product configurator built · semanu.eu',
    metaDescription:
      'Make configurable products sellable online: real time 3D, configuration rules, pricing logic and connections to your webshop, CRM or ERP.',
    ogDescription:
      'semanu builds 3D configurators that let customers compose your product, see the price and send a request, connected to your systems.',
    heroHeadline: 'Turn complex products into online sales.',
    heroSub:
      'Custom 3D product configurators for manufacturers that let customers configure, price and order complex products online.',
    trust: ['User-friendly', 'Real-time pricing', 'Parts lists and more', 'Augmented reality (AR)', 'ERP and CRM connection'],
    scenario: {
      title: 'A furniture maker, buried in emails',
      problem: 'A furniture maker answered every custom question by hand, in long email chains about wood type, dimensions and price.',
      solution: 'semanu built a configurator where customers compose their piece and see an indicative price straight away.',
      result: 'Requests are now concrete and the workshop loses less time on quotes by hand.',
    },
    problemTitle: 'Selling configurable products takes a lot of explaining',
    problemIntro: 'Anyone selling products with many variants knows these hurdles.',
    problemCards: [
      { title: 'Endless email chains', text: 'Every variant is discussed by hand, which costs time and patience.' },
      { title: 'Vague requests', text: 'Without a preview and price, customers do not know what is possible and what it costs.' },
      { title: 'Lost customers', text: 'Without a clear next step people drop off and ask elsewhere.' },
    ],
    engineTitle: 'From choice to\nconcrete request',
    engineText:
      'Your customer picks options and dimensions, the rules rule out invalid combinations and every choice updates the preview and the price live. The finished configuration reaches you as a concrete request or order, through a connection with your webshop, CRM or ERP.',
    flow: {
      title: 'From product choice to concrete request',
      intro:
        'With a 3D product configurator customers put together their product online with ease. The configurator automatically checks which options and combinations are possible, shows the result instantly in 3D and turns the chosen configuration into usable data for sales and production.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Your customer chooses options, finishes and dimensions in an interactive 3D product configurator.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'The 3D product configurator automatically turns valid configurations into prices, quotes, specifications, parts lists and production documents.',
        },
        {
          label: 'INTEGRATION',
          title: '',
          text: 'Connect the 3D product configurator to your website, webshop, CRM, ERP or production system.',
        },
      ],
    },
    visual: ['Options', 'Rules', 'Preview', 'Price', 'Request'],
    visualCaption: 'From the first choice to a concrete request, in one flow.',
    buildsTitle: 'What an semanu configurator can do',
    buildsLead: 'From a single product to a whole range of variants.',
    useCasesTitle: 'For which products\na configurator fits',
    useCasesLead: 'Mainly products with many variants that otherwise require a lot of quoting work.',
    useCases: [
      { title: 'Furniture and interior', text: 'Configure tables, cabinets, seating and complete interiors by model, material, colour and dimensions.' },
      { title: 'Windows, stairs and gates', text: 'Set the right type, size, material and finish for windows, staircases, railings and gates with an indicative price.' },
      { title: 'Custom machines', text: 'Compose machines and machine components with different options, variants and technical specifications.' },
      { title: 'Doors and façades', text: 'Configure internal and external doors, façades and curtain wall systems by type, material, colour and performance.' },
      { title: 'Shelving and storage systems', text: 'Build shelving, racks and storage solutions to size, load capacity and finish for any industry.' },
      { title: 'Industrial enclosures and cabinets', text: 'Configure electrical enclosures, control cabinets and housings by dimensions, material, IP rating and options.' },
      { title: 'Sun shading and outdoor living', text: 'Compose pergolas, awnings, screens and outdoor structures by size, fabric, colour and mounting option.' },
      { title: 'Modular buildings', text: 'Configure modular buildings, containers and shelters with the right layout, dimensions and technical features.' },
      { title: 'Transport and trailers', text: 'Configure trailers, bodies and transport solutions by dimensions, load capacity, chassis and accessories.' },
    ],
    processTitle: 'How we approach a configurator',
    process: [
      { title: 'Variants', text: 'We map your options, variants and rules, including the pricing logic.' },
      { title: 'Design', text: 'We build the configurator in your house style and in your website.' },
      { title: 'Integration', text: 'We connect preview, price and request to your systems.' },
      { title: 'Support', text: 'We keep variants and prices current when your offer changes.' },
    ],
    outcomesTitle: 'What you gain',
    outcomesLead: 'Less quoting work by hand and more concrete requests.',
    faqTitle: 'Frequently asked questions about 3D configurators',
    faq: [
      { q: 'What is a 3D product configurator?', a: 'An interactive tool that lets a customer compose a product themselves, see the choices in 3D and get the matching price and availability straight away.' },
      { q: 'What is the difference between a 3D viewer and a 3D configurator?', a: 'A viewer shows a fixed product you can look at. A configurator lets the customer change the product, with rules and prices per choice.' },
      { q: 'For which products is a 3D configurator interesting?', a: 'For products with many variants that today require a lot of explaining or quoting work, such as furniture, windows, stairs, gates or custom machines.' },
      { q: 'Can a configurator calculate prices?', a: 'Yes, based on your pricing rules per chosen combination. You decide whether that is a final price or an indicative one.' },
      { q: 'What does a 3D configurator cost?', a: 'A 3D configurator always works with a one off implementation cost and a fixed monthly subscription. The implementation cost depends on the product and your wishes; our subscription cost is fixed.' },
      { q: 'Can a 3D configurator connect to ERP or CRM?', a: 'Yes. Through integrations the configuration can go to your CRM, ERP or webshop, so a request or order lands straight in your existing process.' },
    ],
    finalTitle: 'Discuss your product configurator',
    finalText: 'Tell us about your product and we show how a configurator could look in your website.',
    finalCta: 'Discuss your product configurator',
    finalSecondaryLabel: 'See a live configurator',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const de: DetailMap = {
  consultancy: {
    metaTitle: 'Digitale Beratung für KMU · semanu.eu',
    metaDescription:
      'Unabhängige Beratung zu Digitalisierung und AI. semanu analysiert Ihre Prozesse und liefert eine klare Roadmap mit Prioritäten für Schweizer KMU.',
    ogDescription:
      'Wissen, was zu digitalisieren ist und wo AI wirklich Mehrwert hat, bevor Sie investieren. semanu bildet Ihre Prozesse und Optionen klar ab.',
    heroHeadline: 'Digitale Beratung, die erst nachdenkt und dann baut.',
    heroSub:
      'semanu hilft Schweizer KMU zu bestimmen, was sie digitalisieren sollten und wo AI wirklich Mehrwert bringt. Sie erhalten eine fundierte Roadmap statt eines Verkaufsgesprächs.',
    trust: [
      'ehrliche Beratung, auch wenn die Antwort nicht bauen lautet',
      'Prozessanalyse und Roadmap',
      'Beratung losgelöst vom Bau',
    ],
    problemTitle: 'In Digitalisierung investieren ohne Richtung kostet Geld',
    problemIntro: 'Viele KMU spüren, dass es effizienter geht, wissen aber noch nicht, worin sie investieren sollen.',
    problemCards: [
      { title: 'Lose Tools', text: 'Systeme, die nicht zusammenarbeiten, ohne klaren Startpunkt, das zu lösen.' },
      { title: 'AI als Fragezeichen', text: 'Zweifel, ob AI wirklich etwas bringt oder vor allem ein Modewort ist.' },
      { title: 'Investition ohne Sicherheit', text: 'Eine grosse Entscheidung steht an, ohne Grundlage, sie zu verteidigen.' },
    ],
    engineTitle: 'Wie ein Beratungstrack\nabläuft',
    engineText:
      'Wir bilden Ihre Prozesse und Systeme ab, bestimmen, wo der grösste Gewinn liegt und wägen pro Chance Standardsoftware, Massarbeit, Automatisierung und AI gegeneinander ab. Sie erhalten eine konkrete Roadmap mit einer logischen Reihenfolge. Weil wir selbst bauen, wissen wir, was machbar und bezahlbar ist, ohne dass die Beratung dadurch gesteuert wird.',
    flow: {
      title: 'Wann Beratung den Unterschied macht',
      intro: '',
      tiles: [
        {
          label: 'IDEE PRÜFEN',
          title: '',
          text: 'Sie haben eine Softwareidee, wissen aber nicht, ob sie die Investition wert ist. Wir prüfen, was sie mindestens können muss, was sie ungefähr kostet und ob es sie schon gibt.',
        },
        {
          label: 'ÖKOSYSTEM OPTIMIEREN',
          title: '',
          text: 'Ihre Tools sprechen nicht miteinander und es wird doppelt erfasst. Wir bilden ab, was Sie behalten, verbinden oder streichen können.',
        },
        {
          label: 'DIGITALE STRATEGIE',
          title: '',
          text: 'Sie möchten wissen, welche digitalen Schritte Ihr Wachstum in den kommenden Jahren tragen und wo AI wirklich etwas bringt. Sie erhalten eine klare Reihenfolge.',
        },
      ],
    },
    takeaways: {
      title: 'Was Sie mitnehmen',
      items: [
        { q: 'Soll ich das bauen?', a: 'Ein Go oder No-Go mit dem, was es mindestens können muss.' },
        { q: 'Was kann weg und was muss sprechen?', a: 'Eine Karte Ihrer Tools: behalten, verbinden oder streichen.' },
        { q: 'Was mache ich zuerst?', a: 'Eine Roadmap auf einer Seite.' },
      ],
    },
    visual: ['Prozessanalyse', 'Chancen', 'Prioritäten', 'Technologiewahl', 'Roadmap'],
    visualCaption: 'Von einer unklaren Aufstellung zu einem klaren digitalen Plan.',
    buildsTitle: 'Was Beratung umfasst',
    buildsLead: 'Unabhängige Beratung rund um Ihr Unternehmen, kein Verkaufsgespräch für ein Tool.',
    useCasesTitle: 'Wann Beratung\nsinnvoll ist',
    useCasesLead: 'Einige Situationen, in denen ein kurzer Beratungstrack den Unterschied macht.',
    useCases: [
      { title: 'Lose Tools', text: 'Sie arbeiten mit Systemen, die nicht miteinander sprechen und wissen nicht, wo anfangen.' },
      { title: 'AI abwägen', text: 'Sie möchten wissen, ob AI etwas für Sie bedeutet, bevor Sie investieren.' },
      { title: 'Grosse Entscheidung', text: 'Sie stehen vor einer Investition und möchten zuerst Sicherheit über die Richtung.' },
    ],
    processTitle: 'So gehen wir einen Beratungstrack an',
    process: [
      { title: 'Prozessanalyse', text: 'Wir bilden Ihre wichtigsten Prozesse, Systeme und Engpässe ab.' },
      { title: 'Chancen und Prioritäten', text: 'Wir bestimmen, wo der grösste Gewinn liegt und was zuerst geschehen sollte.' },
      { title: 'Technologiewahl', text: 'Pro Chance wägen wir Standardsoftware, Massarbeit, Automatisierung und AI ab.' },
      { title: 'Roadmap', text: 'Sie erhalten einen konkreten Stufenplan mit logischer Reihenfolge und Abhängigkeiten.' },
    ],
    outcomesTitle: 'Was Ihnen bleibt',
    outcomesLead: 'Ein fundierter Plan, den Sie intern verteidigen und auch ohne uns umsetzen können.',
    faqTitle: 'Häufige Fragen zur digitalen Beratung',
    faq: [
      { q: 'Was macht ein digitaler Berater?', a: 'Ein digitaler Berater analysiert, wie Sie arbeiten und empfiehlt, welche Prozesse Sie besser digitalisieren und welche Technologie dazu passt. Das Endprodukt ist ein fundierter Plan, keine Software.' },
      { q: 'Wann braucht mein Unternehmen digitale Beratung?', a: 'Vor allem, wenn Sie in Digitalisierung oder AI investieren möchten aber noch nicht sicher sind, worin. Ein kurzer Beratungstrack verhindert, dass Sie Geld in die falsche Lösung stecken.' },
      { q: 'Wo kann AI in einem KMU Mehrwert schaffen?', a: 'Dort, wo ein Prozess unstrukturierte Informationen interpretieren muss, etwa Dokumente, Emails oder Kundenfragen. Für einfache, regelmässige Aufgaben ist klassische Automatisierung meist besser.' },
      { q: 'Bauen Sie auch, was Sie empfehlen?', a: 'Ja. Die Beratung ist vom Bau losgelöst. So bleibt die Empfehlung unabhängig. Sie sind nie verpflichtet, die Umsetzung uns zu überlassen.' },
      { q: 'Muss ich schon wissen, was ich will?', a: 'Nein. Sie dürfen mit einer vagen Idee oder einem Problem kommen. Wir schärfen gemeinsam, was wirklich nötig ist und was es zuerst lösen soll.' },
      { q: 'Können wir die Roadmap danach selbst umsetzen?', a: 'Ja. Der Plan ist so aufgebaut, dass Sie ihn intern verteidigen und auch ohne uns umsetzen können.' },
    ],
    finalTitle: 'Besprechen Sie Ihre digitale Herausforderung',
    finalText: 'Erzählen Sie kurz, wo Sie feststecken und wir schauen gemeinsam, was zuerst zählt und was warten kann.',
    finalCta: 'Besprechen Sie Ihre digitale Herausforderung',
    finalSecondaryLabel: 'Alle Dienstleistungen ansehen',
    finalSecondaryHref: '/services',
  },

  'marketing-automation': {
    metaTitle: 'Workflowautomatisierung für KMU · semanu.eu',
    metaDescription:
      'Automatisieren Sie wiederkehrende Arbeit und verbinden Sie Ihre Systeme über Integrationen und API. semanu reduziert manuelle Arbeit und Fehler für Schweizer KMU.',
    ogDescription:
      'semanu verbindet Ihre bestehende Software und automatisiert wiederkehrende Schritte, von CRM und ERP bis Dokumentenverarbeitung.',
    heroHeadline: 'Workflowautomatisierung, die Ihre Systeme zusammenarbeiten lässt.',
    heroSub:
      'semanu automatisiert wiederkehrende Schritte und verbindet Ihre bestehende Software, damit Ihr Team weniger abtippt und weniger Fehler macht. Für Schweizer KMU ohne grosses IT Team.',
    trust: ['verbindet bestehende Systeme', 'weniger manuelle Arbeit', 'AI nur wo es zählt'],
    problemTitle: 'Wiederkehrende Handarbeit kostet still jede Woche Zeit',
    problemIntro: 'Wer mit losen Systemen arbeitet, kennt diese Engpässe.',
    problemCards: [
      { title: 'Abtippen zwischen Systemen', text: 'Dieselben Daten gehen von Hand von einem System ins andere.' },
      { title: 'Fehler durch Handarbeit', text: 'Jeder manuelle Schritt ist eine Stelle, an der etwas schiefgehen oder liegen bleiben kann.' },
      { title: 'Lose Tools', text: 'Anwendungen, die nicht miteinander sprechen, sodass niemand den Überblick behält.' },
    ],
    engineTitle: 'Von losen Schritten\nzu einem Flow',
    engineText:
      'Wir betrachten den Workflow, wie er heute wirklich abläuft, bestimmen, welche Schritte sich für Automatisierung eignen und bauen die Verbindungen über API und Integrationen. So müssen Sie Ihre Systeme nicht ersetzen. AI setzen wir gezielt ein, nur dort, wo ein Schritt unstrukturierte Informationen interpretieren muss.',
    visual: ['Formular', 'Lead gespeichert', 'Email versendet', 'Team benachrichtigt', 'Nachverfolgung'],
    visualCaption: 'Ein Ereignis, die nächsten Schritte automatisch erledigt.',
    buildsTitle: 'Was semanu aufsetzt',
    buildsLead: 'Interne und kundenorientierte Prozesse, die still im Hintergrund laufen.',
    useCasesTitle: 'Welche Prozesse\nSie automatisieren können',
    useCasesLead: 'Prozesse, die wiederkehren und festen Regeln folgen, eignen sich am besten.',
    useCases: [
      { title: 'Systemintegrationen', text: 'Zwei oder mehr Anwendungen automatisch zusammenarbeiten lassen.' },
      { title: 'CRM und ERP', text: 'Leads, Bestellungen oder Kundendaten zwischen Systemen synchron halten.' },
      { title: 'Dokumentenverarbeitung', text: 'Rechnungen, Formulare oder Bestellscheine auslesen und verarbeiten.' },
    ],
    processTitle: 'So gehen wir eine Automatisierung an',
    process: [
      { title: 'Abbilden', text: 'Wir betrachten den Workflow, wie er wirklich abläuft, inklusive der Ausnahmen.' },
      { title: 'Abgrenzen', text: 'Wir bestimmen, welche Schritte sich für Automatisierung eignen und welche besser manuell bleiben.' },
      { title: 'Bauen und testen', text: 'Wir bauen die Verbindungen und testen sie an Ihren echten Fällen.' },
      { title: 'Nachverfolgen', text: 'Wir behalten den Workflow im Auge und passen an, wenn sich Ihr Prozess ändert.' },
    ],
    outcomesTitle: 'Was es bringt',
    outcomesLead: 'Weniger Handarbeit, weniger Fehler und mehr Überblick über Ihre Prozesse.',
    faqTitle: 'Häufige Fragen zur Workflowautomatisierung',
    faq: [
      { q: 'Was ist Workflowautomatisierung?', a: 'Das automatische Ausführen oder Verbinden wiederkehrender Schritte in einem Geschäftsprozess, damit Mitarbeiter diese Arbeit nicht mehr von Hand erledigen.' },
      { q: 'Welche Geschäftsprozesse lassen sich automatisieren?', a: 'Prozesse, die wiederkehren und festen Regeln folgen, etwa Daten zwischen Systemen übertragen, Dokumente verarbeiten oder Bestätigungen und Erinnerungen versenden.' },
      { q: 'Lässt sich Automatisierung mit bestehender Software verbinden?', a: 'Ja. Über API und Integrationen verbinden wir Systeme, die Sie bereits nutzen, sodass Sie sie nicht ersetzen müssen.' },
      { q: 'Wann ist AI für Automatisierung nötig?', a: 'Nur wenn ein Schritt unstrukturierte Informationen interpretieren muss, etwa eine frei geschriebene Email. Für regelbasierte Schritte ist klassische Automatisierung besser.' },
      { q: 'Was ist der Unterschied zu RPA?', a: 'RPA ahmt Handlungen in den Bildschirmen eines Programms nach. Eine API Verbindung arbeitet direkt zwischen Systemen und ist meist stabiler. Wir wählen RPA nur, wenn eine Verbindung fehlt.' },
    ],
    finalTitle: 'Lassen Sie uns Ihren Workflow ansehen',
    finalText: 'Erzählen Sie, welche wiederkehrende Arbeit Sie Zeit kostet und wir zeigen, was semanu davon automatisieren kann.',
    finalCta: 'Lassen Sie uns Ihren Workflow ansehen',
    finalSecondaryLabel: 'Alle Dienstleistungen ansehen',
    finalSecondaryHref: '/services',
  },

  'business-systems': {
    metaTitle: 'Massgeschneiderte Software für KMU · semanu.eu',
    metaDescription:
      'Software nach Mass, wenn Standardpakete nicht passen: Webanwendungen, Portale und interne Tools, mit Verbindungen zu Ihren Systemen.',
    ogDescription:
      'semanu baut massgeschneiderte Software, die zu Ihrer Arbeitsweise passt: Portale, interne Tools und Webanwendungen, mit Integrationen und Blick auf Wartung.',
    heroHeadline: 'Massgeschneiderte Software für den Fall, dass Standardpakete nicht passen.',
    heroSub:
      'semanu baut Webanwendungen, Portale und interne Tools, die zu Ihrer tatsächlichen Arbeitsweise passen. Für Schweizer KMU, die an Standardsoftware anstehen.',
    trust: ['passt zu Ihrem Prozess', 'verbindet mit Ihren Systemen', 'Blick auf Wartung und Eigentum'],
    hubCenter: 'Massarbeit',
    problemTitle: 'Wenn Standardsoftware Ihr Unternehmen ausbremst',
    problemIntro: 'Standardsoftware ist oft der Ausgangspunkt. Manchmal passt sie einfach nicht.',
    problemCards: [
      { title: 'Prozess an das Tool anpassen', text: 'Sie bauen Ihre Arbeitsweise um, damit sie ins Paket passt, statt umgekehrt.' },
      { title: 'Viele lose Tools', text: 'Mehrere Pakete und viel Handarbeit, um einen Arbeitsprozess zu vervollständigen.' },
      { title: 'Wachstum ausgebremst', text: 'Bestehende Software verbindet sich nicht oder kann nicht mit dem mithalten, was Sie brauchen.' },
    ],
    engineTitle: 'Eine Plattform, Ihre Systeme\ndrumherum verbunden',
    engineText:
      'Wir übersetzen Ihr Problem in konkrete Anforderungen und bauen zuerst den Teil mit dem meisten Mehrwert. Danach erweitern wir schrittweise, mit Integrationen zu Ihren bestehenden Systemen, damit Daten an einer Stelle stimmen. Software lebt weiter, daher halten wir sie sicher, aktuell und anpassbar.',
    visual: ['Webanwendungen', 'Portale', 'Interne Tools', 'Integrationen', 'Wartung'],
    visualCaption: 'Eine Plattform nach Mass, rund um Ihr Unternehmen gebaut.',
    buildsTitle: 'Was semanu baut',
    buildsLead: 'Massarbeit rund um Ihr Unternehmen, keine generische Vorlage.',
    useCasesTitle: 'Was wir bauen',
    useCasesLead: 'Einige Formen, die massgeschneiderte Software oft annimmt.',
    useCases: [
      { title: 'Interne Unternehmensanwendungen', text: 'Tools, die einen spezifischen Arbeitsprozess unterstützen.' },
      { title: 'Kunden- und Partnerportale', text: 'Eine sichere Umgebung, in der Kunden oder Partner Dinge selbst regeln.' },
      { title: 'Legacy Modernisierung', text: 'Ein veraltetes System phasenweise ersetzen, ohne Ihren Betrieb lahmzulegen.' },
    ],
    processTitle: 'Wie ein Massprojekt abläuft',
    process: [
      { title: 'Scharfstellen', text: 'Wir übersetzen Ihr Problem in konkrete Anforderungen und einen machbaren Scope.' },
      { title: 'Erste funktionierende Version', text: 'Wir bauen zuerst das Kernstück, das den meisten Mehrwert liefert.' },
      { title: 'Erweitern', text: 'Wir fügen schrittweise Funktionalität auf Basis der Nutzung hinzu.' },
      { title: 'Wartung', text: 'Wir halten die Software sicher, aktuell und anpassbar.' },
    ],
    outcomesTitle: 'Was Ihnen bleibt',
    outcomesLead: 'Software, die zu Ihrer Arbeitsweise passt, mit Verbindungen und Blick auf die lange Sicht.',
    faqTitle: 'Häufige Fragen zu massgeschneiderter Software',
    faq: [
      { q: 'Wann ist massgeschneiderte Software interessanter als Standardsoftware?', a: 'Wenn Sie Ihren Prozess an das Paket anpassen müssten statt umgekehrt oder wenn lose Tools und viel Handarbeit nötig sind, um einen Prozess zu vervollständigen.' },
      { q: 'Was kostet massgeschneiderte Software?', a: 'Das hängt von Umfang und Komplexität ab; einen Fixpreis gibt es nicht. Wir bauen phasenweise, beginnend mit dem Teil, der den meisten Mehrwert liefert.' },
      { q: 'Kann massgeschneiderte Software mit bestehenden Systemen verbinden?', a: 'Ja. Integrationen mit Ihrer aktuellen Software sind meist ein Kernbestandteil, damit Daten an einer Stelle stimmen.' },
      { q: 'Wie läuft die Entwicklung massgeschneiderter Software ab?', a: 'Wir starten mit klaren Anforderungen, bauen zuerst eine funktionierende Kernversion und erweitern danach schrittweise, mit anschliessender Wartung.' },
    ],
    finalTitle: 'Besprechen Sie Ihre Softwarefrage',
    finalText: 'Erzählen Sie uns, wo Standardsoftware zu kurz greift und wir schauen, ob Massarbeit der richtige Schritt ist.',
    finalCta: 'Besprechen Sie Ihre Softwarefrage',
    finalSecondaryLabel: 'Alle Dienstleistungen ansehen',
    finalSecondaryHref: '/services',
  },

  '3d-configurators': {
    metaTitle: '3D-Produktkonfigurator bauen lassen · semanu.eu',
    metaDescription:
      'Machen Sie konfigurierbare Produkte online verkäuflich: Echtzeit 3D, Konfigurationsregeln, Preislogik und Verbindungen zu Ihrem Webshop, CRM oder ERP.',
    ogDescription:
      'semanu baut 3D-Konfiguratoren, mit denen Kunden Ihr Produkt zusammenstellen, den Preis sehen und eine Anfrage senden, verbunden mit Ihren Systemen.',
    heroHeadline: 'Komplexe Produkte erfolgreich online verkaufen.',
    heroSub:
      'Massgeschneiderte 3D-Produktkonfiguratoren für Hersteller, mit denen Kunden komplexe Produkte online konfigurieren, Preise berechnen und direkt bestellen können.',
    trust: ['Benutzerfreundlich', 'Preis in Echtzeit', 'Stücklisten und mehr', 'Augmented Reality (AR)', 'ERP- und CRM-Anbindung'],
    scenario: {
      title: 'Ein Möbelbauer, begraben unter Mails',
      problem: 'Ein Möbelbauer beantwortete jede Massanfrage von Hand, in langen Mailketten über Holzart, Masse und Preis.',
      solution: 'semanu baute einen Konfigurator, in dem Kunden ihr Stück zusammenstellen und sofort einen Richtpreis sehen.',
      result: 'Die Anfragen sind nun konkret und die Werkstatt verliert weniger Zeit mit Offerten von Hand.',
    },
    problemTitle: 'Konfigurierbare Produkte zu verkaufen kostet viel Erklärung',
    problemIntro: 'Wer Produkte mit vielen Varianten verkauft, kennt diese Hürden.',
    problemCards: [
      { title: 'Endlose Mailketten', text: 'Jede Variante wird von Hand besprochen, was Zeit und Geduld kostet.' },
      { title: 'Vage Anfragen', text: 'Ohne Preview und Preis wissen Kunden nicht, was möglich ist und was es kostet.' },
      { title: 'Verlorene Kunden', text: 'Ohne klaren nächsten Schritt springen Menschen ab und fragen anderswo.' },
    ],
    engineTitle: 'Von der Auswahl zur\nkonkreten Anfrage',
    engineText:
      'Ihr Kunde wählt Optionen und Masse, die Regeln schliessen ungültige Kombinationen aus und jede Wahl aktualisiert Preview und Preis live. Die fertige Konfiguration erreicht Sie als konkrete Anfrage oder Bestellung, über eine Verbindung mit Ihrem Webshop, CRM oder ERP.',
    flow: {
      title: 'Von der Produktauswahl zur konkreten Anfrage',
      intro:
        'Mit einem 3D-Produktkonfigurator stellen Kunden ihr Produkt einfach online zusammen. Der Konfigurator prüft automatisch, welche Optionen und Kombinationen möglich sind, zeigt das Ergebnis sofort in 3D und wandelt die gewählte Konfiguration in nutzbare Daten für Verkauf und Produktion um.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Ihr Kunde wählt Optionen, Ausführungen und Masse in einem interaktiven 3D-Produktkonfigurator.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'Der 3D-Produktkonfigurator wandelt gültige Konfigurationen automatisch in Preise, Offerten, Spezifikationen, Stücklisten und Produktionsdokumente um.',
        },
        {
          label: 'INTEGRATION',
          title: '',
          text: 'Verbinden Sie den 3D-Produktkonfigurator mit Ihrer Website, Ihrem Webshop, CRM, ERP oder Produktionssystem.',
        },
      ],
    },
    visual: ['Optionen', 'Regeln', 'Preview', 'Preis', 'Anfrage'],
    visualCaption: 'Von der ersten Wahl zu einer konkreten Anfrage, in einem Flow.',
    buildsTitle: 'Was ein semanu Konfigurator kann',
    buildsLead: 'Von einem Produkt bis zu einer ganzen Reihe von Varianten.',
    useCasesTitle: 'Für welche Produkte\nein Konfigurator passt',
    useCasesLead: 'Vor allem Produkte mit vielen Varianten, die sonst viel Offertenarbeit erfordern.',
    useCases: [
      { title: 'Möbel und Interieur', text: 'Konfigurieren Sie Tische, Schränke, Sitzmöbel und ganze Interieurs nach Modell, Material, Farbe und Massen.' },
      { title: 'Fenster, Treppen und Tore', text: 'Legen Sie Typ, Grösse, Material und Ausführung für Fenster, Treppen, Geländer und Tore mit einem Richtpreis fest.' },
      { title: 'Massgefertigte Maschinen', text: 'Stellen Sie Maschinen und Maschinenkomponenten mit verschiedenen Optionen, Varianten und technischen Spezifikationen zusammen.' },
      { title: 'Türen und Fassaden', text: 'Konfigurieren Sie Innentüren und Aussentüren, Fassaden und Vorhangfassaden nach Typ, Material, Farbe und Leistung.' },
      { title: 'Regale und Lagersysteme', text: 'Bauen Sie Regale, Gestelle und Lagerlösungen nach Mass, Traglast und Ausführung für jede Branche.' },
      { title: 'Industriegehäuse und Schränke', text: 'Konfigurieren Sie Schaltschränke, Steuerschränke und Gehäuse nach Massen, Material, Schutzart und Optionen.' },
      { title: 'Sonnenschutz und Aussenbereich', text: 'Stellen Sie Pergolen, Markisen, Screens und Aussenstrukturen nach Mass, Stoff, Farbe und Montageoption zusammen.' },
      { title: 'Modulare Gebäude', text: 'Konfigurieren Sie modulare Gebäude, Container und Unterkünfte mit der richtigen Aufteilung, Massen und technischen Merkmalen.' },
      { title: 'Transport und Anhänger', text: 'Konfigurieren Sie Anhänger, Aufbauten und Transportlösungen nach Massen, Nutzlast, Fahrgestell und Zubehör.' },
    ],
    processTitle: 'So gehen wir einen Konfigurator an',
    process: [
      { title: 'Varianten', text: 'Wir bilden Ihre Optionen, Varianten und Regeln ab, inklusive Preislogik.' },
      { title: 'Design', text: 'Wir bauen den Konfigurator in Ihrem Erscheinungsbild und in Ihrer Website.' },
      { title: 'Integration', text: 'Wir verbinden Preview, Preis und Anfrage mit Ihren Systemen.' },
      { title: 'Begleitung', text: 'Wir halten Varianten und Preise aktuell, wenn sich Ihr Angebot ändert.' },
    ],
    outcomesTitle: 'Was Sie gewinnen',
    outcomesLead: 'Weniger Offertenarbeit von Hand und konkretere Anfragen.',
    faqTitle: 'Häufige Fragen zu 3D-Konfiguratoren',
    faq: [
      { q: 'Was ist ein 3D-Produktkonfigurator?', a: 'Ein interaktives Tool, mit dem ein Kunde ein Produkt selbst zusammenstellt, die Auswahl in 3D sieht und sofort den passenden Preis und die Verfügbarkeit erhält.' },
      { q: 'Was ist der Unterschied zwischen einem 3D-Viewer und einem 3D-Konfigurator?', a: 'Ein Viewer zeigt ein festes Produkt, das Sie betrachten können. Ein Konfigurator lässt den Kunden das Produkt anpassen, mit Regeln und Preisen pro Wahl.' },
      { q: 'Für welche Produkte ist ein 3D-Konfigurator interessant?', a: 'Für Produkte mit vielen Varianten, die heute viel Erklärung oder Offertenarbeit erfordern, etwa Möbel, Fenster, Treppen, Tore oder massgefertigte Maschinen.' },
      { q: 'Kann ein Konfigurator Preise berechnen?', a: 'Ja, auf Basis Ihrer Preisregeln pro gewählter Kombination. Sie bestimmen, ob das ein endgültiger Preis oder ein Richtpreis ist.' },
      { q: 'Was kostet ein 3D-Konfigurator?', a: 'Ein 3D-Konfigurator arbeitet immer mit einmaligen Implementierungskosten und einem festen Monatsabo. Die Implementierungskosten hängen vom Produkt und Ihren Wünschen ab; unsere Abokosten liegen fest.' },
      { q: 'Kann ein 3D-Konfigurator mit ERP oder CRM verbunden werden?', a: 'Ja. Über Integrationen kann die Konfiguration an Ihr CRM, ERP oder Webshop gehen, sodass eine Anfrage oder Bestellung direkt in Ihrem bestehenden Prozess landet.' },
    ],
    finalTitle: 'Besprechen Sie Ihren Produktkonfigurator',
    finalText: 'Erzählen Sie uns von Ihrem Produkt und wir zeigen, wie ein Konfigurator in Ihrer Website aussehen kann.',
    finalCta: 'Besprechen Sie Ihren Produktkonfigurator',
    finalSecondaryLabel: 'Einen Live-Konfigurator ansehen',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const fr: DetailMap = {
  consultancy: {
    metaTitle: 'Conseil digital pour PME · semanu.eu',
    metaDescription:
      'Conseil indépendant en digitalisation et AI. semanu analyse vos processus et livre une feuille de route claire avec des priorités pour les PME suisses.',
    ogDescription:
      'Savoir quoi digitaliser et où l’AI a vraiment de la valeur, avant d’investir. semanu cartographie clairement vos processus et vos options.',
    heroHeadline: 'Un conseil digital qui réfléchit d’abord et construit ensuite.',
    heroSub:
      'semanu aide les PME suisses à déterminer quoi digitaliser et où l’AI apporte vraiment de la valeur. Vous obtenez une feuille de route fondée plutôt qu’un argumentaire de vente.',
    trust: [
      'un conseil honnête, même quand la réponse est de ne pas construire',
      'analyse des processus et feuille de route',
      'conseil distinct de la construction',
    ],
    problemTitle: 'Investir dans la digitalisation sans direction coûte de l’argent',
    problemIntro: 'Beaucoup de PME sentent que cela peut être plus efficace mais ne savent pas encore dans quoi investir.',
    problemCards: [
      { title: 'Outils dispersés', text: 'Des systèmes qui ne collaborent pas, sans point de départ clair pour y remédier.' },
      { title: 'l’AI comme point d’interrogation', text: 'Le doute que l’AI apporte vraiment quelque chose ou soit surtout un mot à la mode.' },
      { title: 'Un investissement sans certitude', text: 'Un grand choix se présente, sans base pour le défendre.' },
    ],
    engineTitle: 'Comment se déroule\nune mission de conseil',
    engineText:
      'Nous cartographions vos processus et systèmes, déterminons où se trouve le plus grand gain et évaluons pour chaque opportunité le logiciel standard, le sur mesure, l’automatisation et l’AI. Vous obtenez une feuille de route concrète avec un ordre logique. Comme nous construisons nous mêmes, nous savons ce qui est faisable et abordable, sans que le conseil en soit orienté.',
    flow: {
      title: 'Quand le conseil fait la différence',
      intro: '',
      tiles: [
        {
          label: 'TESTER L’IDÉE',
          title: '',
          text: 'Vous avez une idée de logiciel mais ne savez pas si elle vaut l’investissement. Nous testons ce qu’elle doit au minimum pouvoir faire, combien elle coûte environ et si elle existe déjà.',
        },
        {
          label: 'OPTIMISER L’ÉCOSYSTÈME',
          title: '',
          text: 'Vos outils ne se parlent pas et les données sont saisies deux fois. Nous cartographions ce que vous pouvez garder, relier ou supprimer.',
        },
        {
          label: 'STRATÉGIE DIGITALE',
          title: '',
          text: 'Vous voulez savoir quelles étapes digitales porteront votre croissance dans les années à venir et où l’AI apporte vraiment quelque chose. Vous obtenez un ordre clair.',
        },
      ],
    },
    takeaways: {
      title: 'Ce que vous emportez',
      items: [
        { q: 'Je construis ou pas ?', a: 'Un go ou no-go avec ce qu’il doit au minimum pouvoir faire.' },
        { q: 'Que garder et que faire communiquer ?', a: 'Une carte de vos outils : garder, relier ou supprimer.' },
        { q: 'Par quoi je commence ?', a: 'Une feuille de route sur une page.' },
      ],
    },
    visual: ['Analyse des processus', 'Opportunités', 'Priorités', 'Choix technologique', 'Feuille de route'],
    visualCaption: 'D’une configuration floue à un plan digital clair.',
    buildsTitle: 'Ce que comprend le conseil',
    buildsLead: 'Un conseil indépendant autour de votre entreprise, pas un entretien de vente pour un outil.',
    useCasesTitle: 'Quand le conseil\na du sens',
    useCasesLead: 'Quelques situations où une courte mission de conseil fait la différence.',
    useCases: [
      { title: 'Outils dispersés', text: 'Vous travaillez avec des systèmes qui ne se parlent pas et ne savez pas par où commencer.' },
      { title: 'Évaluer l’AI', text: 'Vous voulez savoir si l’AI vous apporte quelque chose avant d’y investir.' },
      { title: 'Un grand choix', text: 'Vous faites face à un investissement et voulez d’abord une certitude sur la direction.' },
    ],
    processTitle: 'Comment nous abordons une mission de conseil',
    process: [
      { title: 'Analyse des processus', text: 'Nous cartographions vos processus clés, vos systèmes et vos points de blocage.' },
      { title: 'Opportunités et priorités', text: 'Nous déterminons où se trouve le plus grand gain et ce qui doit se faire en premier.' },
      { title: 'Choix technologique', text: 'Par opportunité, nous évaluons logiciel standard, sur mesure, automatisation et AI.' },
      { title: 'Feuille de route', text: 'Vous obtenez un plan d’étapes concret avec un ordre logique et des dépendances.' },
    ],
    outcomesTitle: 'Ce qu’il vous reste',
    outcomesLead: 'Un plan fondé que vous pouvez défendre en interne et exécuter même sans nous.',
    faqTitle: 'Questions fréquentes sur le conseil digital',
    faq: [
      { q: 'Que fait un consultant digital?', a: 'Un consultant digital analyse votre façon de travailler et conseille quels processus digitaliser et quelle technologie convient. Le produit final est un plan fondé, pas un logiciel.' },
      { q: 'Quand mon entreprise a besoin de conseil digital?', a: 'Surtout quand vous voulez investir dans la digitalisation ou l’AI sans savoir encore dans quoi. Une courte mission de conseil évite de mettre de l’argent dans la mauvaise solution.' },
      { q: 'Où l’AI peut créer de la valeur dans une PME?', a: 'Là où un processus doit interpréter de l’information non structurée, comme des documents, des emails ou des questions clients. Pour des tâches simples et régulières, l’automatisation classique est souvent meilleure.' },
      { q: 'Construisez vous aussi ce que vous conseillez?', a: 'Oui. Le conseil est distinct de la construction. La recommandation reste ainsi indépendante. Vous n’êtes jamais obligé de nous confier l’exécution.' },
      { q: 'Je dois déjà savoir ce que je veux ?', a: 'Non. Vous pouvez venir avec une idée vague ou un problème. Nous précisons ensemble ce qui est vraiment nécessaire et ce qu’il faut résoudre en premier.' },
      { q: 'Pouvons nous exécuter la feuille de route nous mêmes ensuite ?', a: 'Oui. Le plan est conçu pour que vous puissiez le défendre en interne et l’exécuter même sans nous.' },
    ],
    finalTitle: 'Parlons de votre défi digital',
    finalText: 'Dites nous brièvement où vous bloquez et nous regardons ensemble ce qui compte d’abord et ce qui peut attendre.',
    finalCta: 'Parlons de votre défi digital',
    finalSecondaryLabel: 'Voir tous les services',
    finalSecondaryHref: '/services',
  },

  'marketing-automation': {
    metaTitle: 'Automatisation des workflows pour PME · semanu.eu',
    metaDescription:
      'Automatisez le travail répétitif et reliez vos systèmes via des intégrations et une API. semanu réduit le travail manuel et les erreurs pour les PME suisses.',
    ogDescription:
      'semanu relie vos logiciels existants et automatise les étapes récurrentes, du CRM et ERP au traitement de documents.',
    heroHeadline: 'Une automatisation des workflows qui fait collaborer vos systèmes.',
    heroSub:
      'semanu automatise les étapes récurrentes et relie vos logiciels existants, pour que votre équipe recopie moins et fasse moins d’erreurs. Pour les PME suisses sans grande équipe IT.',
    trust: ['relie les systèmes existants', 'moins de travail manuel', 'l’AI seulement là où elle compte'],
    problemTitle: 'Le travail manuel récurrent coûte du temps chaque semaine, en silence',
    problemIntro: 'Quiconque travaille avec des systèmes dispersés reconnaît ces blocages.',
    problemCards: [
      { title: 'Recopier entre systèmes', text: 'Les mêmes données passent à la main d’un système à l’autre.' },
      { title: 'Des erreurs dues au manuel', text: 'Chaque étape manuelle est un endroit où quelque chose peut déraper ou rester en attente.' },
      { title: 'Outils dispersés', text: 'Des applications qui ne se parlent pas, si bien que personne ne garde la vue d’ensemble.' },
    ],
    engineTitle: 'D’étapes isolées\nà un seul flux',
    engineText:
      'Nous regardons le workflow tel qu’il se déroule réellement aujourd’hui, déterminons quelles étapes se prêtent à l’automatisation et construisons les connexions via API et intégrations. Vous n’avez donc pas à remplacer vos systèmes. Nous utilisons l’AI de manière ciblée, seulement là où une étape doit interpréter de l’information non structurée.',
    visual: ['Formulaire', 'Lead enregistré', 'Email envoyé', 'Équipe avertie', 'Relance'],
    visualCaption: 'Un événement, les étapes suivantes traitées automatiquement.',
    buildsTitle: 'Ce que semanu met en place',
    buildsLead: 'Des processus internes et orientés client qui tournent en silence en arrière plan.',
    useCasesTitle: 'Quels processus\nvous pouvez automatiser',
    useCasesLead: 'Les processus qui reviennent et suivent des règles fixes se prêtent le mieux.',
    useCases: [
      { title: 'Intégrations de systèmes', text: 'Faire collaborer automatiquement deux applications ou plus.' },
      { title: 'CRM et ERP', text: 'Garder leads, commandes ou données clients synchronisés entre systèmes.' },
      { title: 'Traitement de documents', text: 'Lire et traiter factures, formulaires ou bons de commande.' },
    ],
    processTitle: 'Comment nous abordons une automatisation',
    process: [
      { title: 'Cartographie', text: 'Nous regardons le workflow tel qu’il se déroule vraiment, y compris les exceptions.' },
      { title: 'Délimitation', text: 'Nous déterminons quelles étapes se prêtent à l’automatisation et lesquelles restent mieux manuelles.' },
      { title: 'Construire et tester', text: 'Nous construisons les connexions et les testons sur vos cas réels.' },
      { title: 'Suivi', text: 'Nous gardons un oeil sur le workflow et ajustons quand votre processus change.' },
    ],
    outcomesTitle: 'Ce que cela apporte',
    outcomesLead: 'Moins de travail manuel, moins d’erreurs et plus de visibilité sur vos processus.',
    faqTitle: 'Questions fréquentes sur l’automatisation des workflows',
    faq: [
      { q: 'L’automatisation des workflows, c’est quoi?', a: 'Exécuter ou relier automatiquement des étapes récurrentes d’un processus métier, pour que les collaborateurs ne fassent plus ce travail à la main.' },
      { q: 'Quels processus métier peuvent être automatisés?', a: 'Des processus qui reviennent et suivent des règles fixes, comme transférer des données entre systèmes, traiter des documents ou envoyer des confirmations et des rappels.' },
      { q: 'L’automatisation peut elle se connecter aux logiciels existants?', a: 'Oui. Via API et intégrations, nous relions les systèmes que vous utilisez déjà, pour que vous n’ayez pas à les remplacer.' },
      { q: 'Quand l’AI est elle nécessaire pour l’automatisation?', a: 'Seulement quand une étape doit interpréter de l’information non structurée, comme un email rédigé librement. Pour des étapes basées sur des règles, l’automatisation classique est meilleure.' },
      { q: 'Quelle est la différence avec le RPA?', a: 'Le RPA imite des actions dans les écrans d’un programme. Une connexion API travaille directement entre systèmes et est généralement plus stable. Nous choisissons le RPA seulement quand une connexion manque.' },
    ],
    finalTitle: 'Analysons votre workflow',
    finalText: 'Dites nous quel travail récurrent vous coûte du temps et nous montrons ce que semanu peut en automatiser.',
    finalCta: 'Analysons votre workflow',
    finalSecondaryLabel: 'Voir tous les services',
    finalSecondaryHref: '/services',
  },

  'business-systems': {
    metaTitle: 'Logiciel sur mesure pour PME · semanu.eu',
    metaDescription:
      'Un logiciel sur mesure quand les solutions standard ne suffisent pas: applications web, portails et outils internes, avec des connexions à vos systèmes.',
    ogDescription:
      'semanu construit un logiciel sur mesure qui colle à votre façon de travailler: portails, outils internes et applications web, avec des intégrations et une attention à la maintenance.',
    heroHeadline: 'Un logiciel sur mesure pour quand les solutions standard ne conviennent pas.',
    heroSub:
      'semanu construit des applications web, des portails et des outils internes qui collent à la façon dont votre entreprise travaille vraiment. Pour les PME suisses qui bloquent sur un logiciel standard.',
    trust: ['colle à votre processus', 'se connecte à vos systèmes', 'attention à la maintenance et à la propriété'],
    hubCenter: 'Sur mesure',
    problemTitle: 'Quand le logiciel standard freine votre entreprise',
    problemIntro: 'Le logiciel standard est souvent le point de départ. Parfois, il ne convient tout simplement pas.',
    problemCards: [
      { title: 'Adapter le processus à l’outil', text: 'Vous refaites votre façon de travailler pour entrer dans le paquet, au lieu de l’inverse.' },
      { title: 'Beaucoup d’outils dispersés', text: 'Plusieurs paquets et beaucoup de travail manuel pour boucler un seul processus.' },
      { title: 'Croissance freinée', text: 'Le logiciel existant ne se connecte pas ou ne suit pas ce dont vous avez besoin.' },
    ],
    engineTitle: 'Une plateforme, vos systèmes\nreliés autour',
    engineText:
      'Nous traduisons votre problème en exigences concrètes et construisons d’abord la partie à la plus grande valeur. Ensuite, nous étendons pas à pas, avec des intégrations à vos systèmes existants pour que les données soient justes à un seul endroit. Un logiciel continue de vivre, nous le gardons donc sûr, à jour et adaptable.',
    visual: ['Applications web', 'Portails', 'Outils internes', 'Intégrations', 'Maintenance'],
    visualCaption: 'Une plateforme sur mesure, construite autour de votre entreprise.',
    buildsTitle: 'Ce que semanu construit',
    buildsLead: 'Du sur mesure autour de votre entreprise, pas un modèle générique.',
    useCasesTitle: 'Ce que nous construisons',
    useCasesLead: 'Quelques formes que prend souvent le logiciel sur mesure.',
    useCases: [
      { title: 'Applications métier internes', text: 'Des outils qui soutiennent un processus de travail spécifique.' },
      { title: 'Portails clients et partenaires', text: 'Un environnement sécurisé où clients ou partenaires règlent eux mêmes leurs affaires.' },
      { title: 'Modernisation du legacy', text: 'Remplacer un système obsolète par phases sans arrêter votre activité.' },
    ],
    processTitle: 'Comment se déroule un projet sur mesure',
    process: [
      { title: 'Cadrer', text: 'Nous traduisons votre problème en exigences concrètes et un périmètre réalisable.' },
      { title: 'Première version fonctionnelle', text: 'Nous construisons d’abord la pièce maîtresse qui apporte le plus de valeur.' },
      { title: 'Étendre', text: 'Nous ajoutons des fonctionnalités pas à pas selon l’usage.' },
      { title: 'Maintenance', text: 'Nous gardons le logiciel sûr, à jour et adaptable.' },
    ],
    outcomesTitle: 'Ce qu’il vous reste',
    outcomesLead: 'Un logiciel qui colle à votre façon de travailler, avec des connexions et une vue sur le long terme.',
    faqTitle: 'Questions fréquentes sur le logiciel sur mesure',
    faq: [
      { q: 'Quand le logiciel sur mesure est il plus intéressant que le standard?', a: 'Quand vous devriez adapter votre processus au paquet au lieu de l’inverse ou quand des outils dispersés et beaucoup de travail manuel sont nécessaires pour boucler un processus.' },
      { q: 'Combien coûte un logiciel sur mesure?', a: 'Cela dépend de l’ampleur et de la complexité; il n’y a pas de prix fixe. Nous construisons par phases, en commençant par la partie qui apporte le plus de valeur.' },
      { q: 'Un logiciel sur mesure peut il se connecter aux systèmes existants?', a: 'Oui. Les intégrations avec votre logiciel actuel sont souvent un élément central, pour que les données restent justes à un seul endroit.' },
      { q: 'Comment se déroule le développement d’un logiciel sur mesure?', a: 'Nous commençons par des exigences claires, construisons d’abord une version de base fonctionnelle puis étendons pas à pas, avec une maintenance ensuite.' },
    ],
    finalTitle: 'Parlons de votre besoin logiciel',
    finalText: 'Dites nous où le logiciel standard est insuffisant et nous regardons si le sur mesure est la bonne étape.',
    finalCta: 'Parlons de votre besoin logiciel',
    finalSecondaryLabel: 'Voir tous les services',
    finalSecondaryHref: '/services',
  },

  '3d-configurators': {
    metaTitle: 'Faire construire un configurateur de produit 3D · semanu.eu',
    metaDescription:
      'Rendez vos produits configurables vendables en ligne: 3D en temps réel, règles de configuration, logique de prix et connexions à votre boutique, CRM ou ERP.',
    ogDescription:
      'semanu construit des configurateurs 3D qui laissent les clients composer votre produit, voir le prix et envoyer une demande, reliés à vos systèmes.',
    heroHeadline: 'Transformez vos produits complexes en ventes en ligne.',
    heroSub:
      'Des configurateurs de produits 3D sur mesure pour les fabricants, permettant aux clients de configurer des produits complexes, d’obtenir leur prix et de les commander en ligne.',
    trust: ['Simple et intuitif', 'Prix calculé en temps réel', 'Nomenclatures et plus', 'Réalité augmentée (AR)', 'Connexion ERP et CRM'],
    scenario: {
      title: 'Un fabricant de meubles, enseveli sous les mails',
      problem: 'Un fabricant de meubles répondait à chaque demande sur mesure à la main, dans de longues chaînes de mails sur l’essence de bois, les dimensions et le prix.',
      solution: 'semanu a construit un configurateur où les clients composent leur pièce et voient tout de suite un prix indicatif.',
      result: 'Les demandes sont maintenant concrètes et l’atelier perd moins de temps avec des devis à la main.',
    },
    problemTitle: 'Vendre des produits configurables demande beaucoup d’explications',
    problemIntro: 'Quiconque vend des produits à nombreuses variantes connaît ces obstacles.',
    problemCards: [
      { title: 'Chaînes de mails sans fin', text: 'Chaque variante se discute à la main, ce qui coûte du temps et de la patience.' },
      { title: 'Demandes vagues', text: 'Sans aperçu ni prix, les clients ne savent pas ce qui est possible et ce que cela coûte.' },
      { title: 'Clients perdus', text: 'Sans étape suivante claire, les gens décrochent et demandent ailleurs.' },
    ],
    engineTitle: 'Du choix à la\ndemande concrète',
    engineText:
      'Votre client choisit des options et des dimensions, les règles excluent les combinaisons invalides et chaque choix met à jour l’aperçu et le prix en direct. La configuration finie vous parvient comme une demande ou une commande concrète, via une connexion à votre boutique, CRM ou ERP.',
    flow: {
      title: 'Du choix du produit à la demande concrète',
      intro:
        'Avec un configurateur de produit 3D, les clients composent leur produit en ligne en toute simplicité. Le configurateur vérifie automatiquement quelles options et combinaisons sont possibles, montre le résultat tout de suite en 3D et transforme la configuration choisie en données utiles pour la vente et la production.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Votre client choisit les options, les finitions et les dimensions dans un configurateur de produit 3D interactif.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'Le configurateur de produit 3D transforme automatiquement les configurations valides en prix, devis, spécifications, nomenclatures et documents de production.',
        },
        {
          label: 'INTÉGRATION',
          title: '',
          text: 'Reliez le configurateur de produit 3D à votre site, votre boutique en ligne, CRM, ERP ou système de production.',
        },
      ],
    },
    visual: ['Options', 'Règles', 'Aperçu', 'Prix', 'Demande'],
    visualCaption: 'Du premier choix à une demande concrète, en un seul flux.',
    buildsTitle: 'Ce que peut un configurateur semanu',
    buildsLead: 'D’un seul produit à toute une gamme de variantes.',
    useCasesTitle: 'Pour quels produits\nun configurateur convient',
    useCasesLead: 'Surtout des produits à nombreuses variantes qui demandent sinon beaucoup de travail de devis.',
    useCases: [
      { title: 'Meuble et intérieur', text: 'Configurez tables, armoires, sièges et intérieurs complets par modèle, matériau, couleur et dimensions.' },
      { title: 'Fenêtres, escaliers et portails', text: 'Définissez le bon type, la taille, le matériau et la finition pour fenêtres, escaliers, rampes et portails avec un prix indicatif.' },
      { title: 'Machines sur mesure', text: 'Composez machines et composants de machine avec différentes options, variantes et spécifications techniques.' },
      { title: 'Portes et façades', text: 'Configurez portes intérieures et portes extérieures, façades et murs rideaux par type, matériau, couleur et performance.' },
      { title: 'Rayonnages et systèmes de rangement', text: 'Construisez rayonnages, racks et solutions de rangement selon dimensions, charge et finition pour tout secteur.' },
      { title: 'Coffrets et armoires industriels', text: 'Configurez coffrets électriques, armoires de commande et boîtiers par dimensions, matériau, indice de protection et options.' },
      { title: 'Protection solaire et extérieur', text: 'Composez pergolas, stores, screens et structures extérieures selon dimensions, toile, couleur et option de montage.' },
      { title: 'Bâtiments modulaires', text: 'Configurez bâtiments modulaires, conteneurs et abris avec la bonne disposition, les dimensions et les caractéristiques techniques.' },
      { title: 'Transport et remorques', text: 'Configurez remorques, carrosseries et solutions de transport selon dimensions, charge utile, châssis et accessoires.' },
    ],
    processTitle: 'Comment nous abordons un configurateur',
    process: [
      { title: 'Variantes', text: 'Nous cartographions vos options, variantes et règles, y compris la logique de prix.' },
      { title: 'Design', text: 'Nous construisons le configurateur à votre identité et dans votre site.' },
      { title: 'Intégration', text: 'Nous relions aperçu, prix et demande à vos systèmes.' },
      { title: 'Accompagnement', text: 'Nous gardons variantes et prix à jour quand votre offre change.' },
    ],
    outcomesTitle: 'Ce que vous gagnez',
    outcomesLead: 'Moins de travail de devis à la main et des demandes plus concrètes.',
    faqTitle: 'Questions fréquentes sur les configurateurs 3D',
    faq: [
      { q: 'Un configurateur de produit 3D, c’est quoi?', a: 'Un outil interactif qui laisse un client composer lui même un produit, voir les choix en 3D et obtenir tout de suite le prix et la disponibilité correspondants.' },
      { q: 'Quelle est la différence entre un visualiseur 3D et un configurateur 3D?', a: 'Un visualiseur montre un produit fixe que vous pouvez regarder. Un configurateur laisse le client modifier le produit, avec des règles et des prix par choix.' },
      { q: 'Pour quels produits un configurateur 3D est il intéressant?', a: 'Pour des produits à nombreuses variantes qui demandent aujourd’hui beaucoup d’explications ou de travail de devis, comme meubles, fenêtres, escaliers, portails ou machines sur mesure.' },
      { q: 'Un configurateur peut il calculer des prix?', a: 'Oui, sur la base de vos règles de prix par combinaison choisie. Vous décidez si c’est un prix définitif ou indicatif.' },
      { q: 'Combien coûte un configurateur 3D?', a: 'Un configurateur 3D fonctionne toujours avec un coût d’implémentation unique et un abonnement mensuel fixe. Le coût d’implémentation dépend du produit et de vos souhaits; notre coût d’abonnement est fixe.' },
      { q: 'Un configurateur 3D peut il se connecter à un ERP ou un CRM?', a: 'Oui. Via des intégrations, la configuration peut aller vers votre CRM, ERP ou boutique, pour qu’une demande ou commande arrive directement dans votre processus existant.' },
    ],
    finalTitle: 'Parlons de votre configurateur produit',
    finalText: 'Parlez nous de votre produit et nous montrons à quoi un configurateur pourrait ressembler dans votre site.',
    finalCta: 'Parlons de votre configurateur produit',
    finalSecondaryLabel: 'Voir un configurateur en ligne',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const es: DetailMap = {
  consultancy: {
    metaTitle: 'Consultoría digital para pymes · semanu.eu',
    metaDescription:
      'Asesoramiento independiente sobre digitalización y AI. semanu analiza sus procesos y entrega una hoja de ruta clara con prioridades para pymes suizas.',
    ogDescription:
      'Saber qué digitalizar y dónde la AI aporta valor de verdad, antes de invertir. semanu mapea con claridad sus procesos y opciones.',
    heroHeadline: 'Consultoría digital que primero piensa y luego construye.',
    heroSub:
      'semanu ayuda a las pymes suizas a decidir qué digitalizar y dónde la AI aporta valor real. Obtiene una hoja de ruta fundamentada en lugar de un discurso de venta.',
    trust: [
      'asesoramiento honesto, también cuando la respuesta es no construir',
      'análisis de procesos y hoja de ruta',
      'asesoramiento separado de la construcción',
    ],
    problemTitle: 'Invertir en digitalización sin dirección cuesta dinero',
    problemIntro: 'Muchas pymes sienten que se puede hacer de forma más eficiente pero aún no saben en qué invertir.',
    problemCards: [
      { title: 'Herramientas sueltas', text: 'Sistemas que no colaboran, sin un punto de partida claro para resolverlo.' },
      { title: 'La AI como interrogante', text: 'Dudas sobre si la AI realmente aporta o es sobre todo una palabra de moda.' },
      { title: 'Inversión sin certeza', text: 'Una gran decisión por delante, sin base para defenderla.' },
    ],
    engineTitle: 'Cómo transcurre\nun proyecto de asesoramiento',
    engineText:
      'Mapeamos sus procesos y sistemas, determinamos dónde está la mayor ganancia y sopesamos por oportunidad el software estándar, el trabajo a medida, la automatización y la AI. Obtiene una hoja de ruta concreta con un orden lógico. Como construimos nosotros mismos, sabemos qué es viable y asequible, sin que el asesoramiento quede por ello sesgado.',
    flow: {
      title: 'Cuándo la consultoría marca la diferencia',
      intro: '',
      tiles: [
        {
          label: 'PROBAR LA IDEA',
          title: '',
          text: 'Tiene una idea de software pero no sabe si vale la inversión. Comprobamos qué debe poder hacer como mínimo, cuánto cuesta aproximadamente y si ya existe.',
        },
        {
          label: 'OPTIMIZAR EL ECOSISTEMA',
          title: '',
          text: 'Sus herramientas no se hablan y se introducen datos por duplicado. Mapeamos qué puede mantener, conectar o eliminar.',
        },
        {
          label: 'ESTRATEGIA DIGITAL',
          title: '',
          text: 'Quiere saber qué pasos digitales sostienen su crecimiento en los próximos años y dónde la AI aporta de verdad. Obtiene un orden claro.',
        },
      ],
    },
    takeaways: {
      title: 'Qué se lleva',
      items: [
        { q: '¿Debo construir esto?', a: 'Un sí o no con lo que debe poder hacer como mínimo.' },
        { q: '¿Qué puede irse y qué debe comunicarse?', a: 'Un mapa de sus herramientas: mantener, conectar o eliminar.' },
        { q: '¿Por dónde empiezo?', a: 'Una hoja de ruta de una página.' },
      ],
    },
    visual: ['Análisis de procesos', 'Oportunidades', 'Prioridades', 'Elección tecnológica', 'Hoja de ruta'],
    visualCaption: 'De una configuración poco clara a un plan digital claro.',
    buildsTitle: 'Qué incluye la consultoría',
    buildsLead: 'Asesoramiento independiente en torno a su empresa, no una charla de venta de una herramienta.',
    useCasesTitle: 'Cuándo la consultoría\ntiene sentido',
    useCasesLead: 'Algunas situaciones en las que un breve proyecto de asesoramiento marca la diferencia.',
    useCases: [
      { title: 'Herramientas sueltas', text: 'Trabaja con sistemas que no se hablan y no sabe por dónde empezar.' },
      { title: 'Sopesar la AI', text: 'Quiere saber si la AI le aporta algo antes de invertir en ella.' },
      { title: 'Una gran decisión', text: 'Se enfrenta a una inversión y quiere primero certeza sobre la dirección.' },
    ],
    processTitle: 'Así abordamos un proyecto de asesoramiento',
    process: [
      { title: 'Análisis de procesos', text: 'Mapeamos sus procesos clave, sistemas y cuellos de botella.' },
      { title: 'Oportunidades y prioridades', text: 'Determinamos dónde está la mayor ganancia y qué debe hacerse primero.' },
      { title: 'Elección tecnológica', text: 'Por oportunidad sopesamos software estándar, a medida, automatización y AI.' },
      { title: 'Hoja de ruta', text: 'Obtiene un plan de pasos concreto con un orden lógico y dependencias.' },
    ],
    outcomesTitle: 'Qué le queda',
    outcomesLead: 'Un plan fundamentado que puede defender internamente y ejecutar incluso sin nosotros.',
    faqTitle: 'Preguntas frecuentes sobre la consultoría digital',
    faq: [
      { q: '¿Qué hace un consultor digital?', a: 'Un consultor digital analiza cómo trabaja y aconseja qué procesos digitalizar y qué tecnología encaja. El producto final es un plan fundamentado, no software.' },
      { q: '¿Cuándo necesita mi empresa consultoría digital?', a: 'Sobre todo cuando quiere invertir en digitalización o AI pero aún no sabe en qué. Un breve proyecto de asesoramiento evita poner dinero en la solución equivocada.' },
      { q: '¿Dónde puede la AI crear valor en una pyme?', a: 'Donde un proceso debe interpretar información no estructurada, como documentos, correos o preguntas de clientes. Para tareas simples y regulares, la automatización clásica suele ser mejor.' },
      { q: '¿También construyen lo que aconsejan?', a: 'Sí. El asesoramiento es independiente de la construcción. Así la recomendación sigue siendo independiente. Nunca está obligado a dejarnos la ejecución.' },
      { q: '¿Debo saber ya lo que quiero?', a: 'No. Puede venir con una idea vaga o un problema. Afinamos juntos qué hace falta de verdad y qué debe resolverse primero.' },
      { q: '¿Podemos ejecutar la hoja de ruta nosotros mismos después?', a: 'Sí. El plan está diseñado para que pueda defenderlo internamente y ejecutarlo incluso sin nosotros.' },
    ],
    finalTitle: 'Hablemos de su reto digital',
    finalText: 'Cuéntenos brevemente dónde se atasca y vemos juntos qué importa primero y qué puede esperar.',
    finalCta: 'Hablemos de su reto digital',
    finalSecondaryLabel: 'Ver todos los servicios',
    finalSecondaryHref: '/services',
  },

  'marketing-automation': {
    metaTitle: 'Automatización de flujos para pymes · semanu.eu',
    metaDescription:
      'Automatice el trabajo repetitivo y conecte sus sistemas mediante integraciones y API. semanu reduce el trabajo manual y los errores para pymes suizas.',
    ogDescription:
      'semanu conecta su software existente y automatiza pasos recurrentes, desde CRM y ERP hasta el procesamiento de documentos.',
    heroHeadline: 'Automatización de flujos que hace colaborar sus sistemas.',
    heroSub:
      'semanu automatiza pasos recurrentes y conecta su software existente, para que su equipo reescriba menos y cometa menos errores. Para pymes suizas sin un gran equipo de IT.',
    trust: ['conecta los sistemas existentes', 'menos trabajo manual', 'AI solo donde cuenta'],
    problemTitle: 'El trabajo manual recurrente cuesta tiempo cada semana, en silencio',
    problemIntro: 'Quien trabaja con sistemas sueltos reconoce estos cuellos de botella.',
    problemCards: [
      { title: 'Reescribir entre sistemas', text: 'Los mismos datos pasan a mano de un sistema a otro.' },
      { title: 'Errores por el trabajo manual', text: 'Cada paso manual es un punto donde algo puede fallar o quedar pendiente.' },
      { title: 'Herramientas sueltas', text: 'Aplicaciones que no se hablan, de modo que nadie mantiene la visión de conjunto.' },
    ],
    engineTitle: 'De pasos sueltos\na un solo flujo',
    engineText:
      'Observamos el flujo tal como funciona hoy de verdad, determinamos qué pasos se prestan a la automatización y construimos las conexiones mediante API e integraciones. Así no tiene que reemplazar sus sistemas. Usamos la AI de forma específica, solo donde un paso debe interpretar información no estructurada.',
    visual: ['Formulario', 'Lead guardado', 'Correo enviado', 'Equipo avisado', 'Seguimiento'],
    visualCaption: 'Un evento, los siguientes pasos gestionados automáticamente.',
    buildsTitle: 'Qué pone en marcha semanu',
    buildsLead: 'Procesos internos y de cara al cliente que corren en silencio en segundo plano.',
    useCasesTitle: 'Qué procesos\npuede automatizar',
    useCasesLead: 'Los procesos que se repiten y siguen reglas fijas se prestan mejor.',
    useCases: [
      { title: 'Integraciones de sistemas', text: 'Hacer que dos o más aplicaciones colaboren automáticamente.' },
      { title: 'CRM y ERP', text: 'Mantener leads, pedidos o datos de clientes sincronizados entre sistemas.' },
      { title: 'Procesamiento de documentos', text: 'Leer y procesar facturas, formularios o albaranes.' },
    ],
    processTitle: 'Así abordamos una automatización',
    process: [
      { title: 'Mapeo', text: 'Observamos el flujo tal como funciona de verdad, incluidas las excepciones.' },
      { title: 'Delimitar', text: 'Determinamos qué pasos se prestan a la automatización y cuáles conviene dejar manuales.' },
      { title: 'Construir y probar', text: 'Construimos las conexiones y las probamos con sus casos reales.' },
      { title: 'Seguimiento', text: 'Vigilamos el flujo y ajustamos cuando su proceso cambia.' },
    ],
    outcomesTitle: 'Qué aporta',
    outcomesLead: 'Menos trabajo manual, menos errores y más visibilidad sobre sus procesos.',
    faqTitle: 'Preguntas frecuentes sobre la automatización de flujos',
    faq: [
      { q: '¿Qué es la automatización de flujos?', a: 'Ejecutar o conectar automáticamente pasos recurrentes de un proceso de negocio, para que el personal ya no haga ese trabajo a mano.' },
      { q: '¿Qué procesos de negocio se pueden automatizar?', a: 'Procesos que se repiten y siguen reglas fijas, como transferir datos entre sistemas, procesar documentos o enviar confirmaciones y recordatorios.' },
      { q: '¿La automatización puede conectarse con el software existente?', a: 'Sí. Mediante API e integraciones conectamos sistemas que ya usa, para que no tenga que reemplazarlos.' },
      { q: '¿Cuándo hace falta AI para la automatización?', a: 'Solo cuando un paso debe interpretar información no estructurada, como un correo escrito libremente. Para pasos basados en reglas, la automatización clásica es mejor.' },
      { q: '¿Cuál es la diferencia con el RPA?', a: 'El RPA imita acciones en las pantallas de un programa. Una conexión API trabaja directamente entre sistemas y suele ser más estable. Elegimos el RPA solo cuando falta una conexión.' },
    ],
    finalTitle: 'Analicemos su flujo de trabajo',
    finalText: 'Cuéntenos qué trabajo recurrente le cuesta tiempo y mostramos qué puede automatizar semanu de ello.',
    finalCta: 'Analicemos su flujo de trabajo',
    finalSecondaryLabel: 'Ver todos los servicios',
    finalSecondaryHref: '/services',
  },

  'business-systems': {
    metaTitle: 'Software a medida para pymes · semanu.eu',
    metaDescription:
      'Software a medida cuando los paquetes estándar no encajan: aplicaciones web, portales y herramientas internas, con conexiones a sus sistemas.',
    ogDescription:
      'semanu construye software a medida que se ajusta a su forma de trabajar: portales, herramientas internas y aplicaciones web, con integraciones y atención al mantenimiento.',
    heroHeadline: 'Software a medida para cuando los paquetes estándar no encajan.',
    heroSub:
      'semanu construye aplicaciones web, portales y herramientas internas que se ajustan a cómo trabaja de verdad su empresa. Para pymes suizas que se atascan con el software estándar.',
    trust: ['se ajusta a su proceso', 'conecta con sus sistemas', 'atención al mantenimiento y la propiedad'],
    hubCenter: 'A medida',
    problemTitle: 'Cuando el software estándar frena su empresa',
    problemIntro: 'El software estándar suele ser el punto de partida. A veces, sencillamente no encaja.',
    problemCards: [
      { title: 'Adaptar el proceso a la herramienta', text: 'Rehace su forma de trabajar para encajar en el paquete, en lugar de al revés.' },
      { title: 'Muchas herramientas sueltas', text: 'Varios paquetes y mucho trabajo manual para completar un solo proceso.' },
      { title: 'Crecimiento frenado', text: 'El software existente no conecta o no puede seguir lo que necesita.' },
    ],
    engineTitle: 'Una plataforma, sus sistemas\nconectados alrededor',
    engineText:
      'Traducimos su problema en requisitos concretos y construimos primero la parte con más valor. Después ampliamos paso a paso, con integraciones a sus sistemas existentes para que los datos sean correctos en un solo lugar. El software sigue vivo, así que lo mantenemos seguro, actual y adaptable.',
    visual: ['Aplicaciones web', 'Portales', 'Herramientas internas', 'Integraciones', 'Mantenimiento'],
    visualCaption: 'Una plataforma a medida, construida en torno a su empresa.',
    buildsTitle: 'Qué construye semanu',
    buildsLead: 'Trabajo a medida en torno a su empresa, no una plantilla genérica.',
    useCasesTitle: 'Qué construimos',
    useCasesLead: 'Algunas formas que suele tomar el software a medida.',
    useCases: [
      { title: 'Aplicaciones internas de negocio', text: 'Herramientas que apoyan un proceso de trabajo específico.' },
      { title: 'Portales de clientes y socios', text: 'Un entorno seguro donde clientes o socios gestionan las cosas por su cuenta.' },
      { title: 'Modernización de legacy', text: 'Reemplazar un sistema obsoleto por fases sin detener su operación.' },
    ],
    processTitle: 'Cómo transcurre un proyecto a medida',
    process: [
      { title: 'Afinar', text: 'Traducimos su problema en requisitos concretos y un alcance viable.' },
      { title: 'Primera versión funcional', text: 'Construimos primero la pieza central que aporta más valor.' },
      { title: 'Ampliar', text: 'Añadimos funcionalidad paso a paso según el uso.' },
      { title: 'Mantenimiento', text: 'Mantenemos el software seguro, actual y adaptable.' },
    ],
    outcomesTitle: 'Qué le queda',
    outcomesLead: 'Software que se ajusta a cómo trabaja, con conexiones y mirada al largo plazo.',
    faqTitle: 'Preguntas frecuentes sobre el software a medida',
    faq: [
      { q: '¿Cuándo el software a medida es más interesante que el estándar?', a: 'Cuando tendría que adaptar su proceso al paquete en lugar de al revés o cuando hacen falta herramientas sueltas y mucho trabajo manual para completar un proceso.' },
      { q: '¿Cuánto cuesta el software a medida?', a: 'Depende del tamaño y la complejidad; no existe un precio fijo. Construimos por fases, empezando por la parte que aporta más valor.' },
      { q: '¿El software a medida puede conectar con sistemas existentes?', a: 'Sí. Las integraciones con su software actual suelen ser una parte central, para que los datos sigan siendo correctos en un solo lugar.' },
      { q: '¿Cómo transcurre el desarrollo de software a medida?', a: 'Empezamos con requisitos claros, construimos primero una versión central funcional y después ampliamos paso a paso, con mantenimiento después.' },
    ],
    finalTitle: 'Hablemos de su necesidad de software',
    finalText: 'Cuéntenos dónde se queda corto el software estándar y vemos si lo a medida es el paso correcto.',
    finalCta: 'Hablemos de su necesidad de software',
    finalSecondaryLabel: 'Ver todos los servicios',
    finalSecondaryHref: '/services',
  },

  '3d-configurators': {
    metaTitle: 'Mandar construir un configurador de producto 3D · semanu.eu',
    metaDescription:
      'Haga vendibles en línea sus productos configurables: 3D en tiempo real, reglas de configuración, lógica de precios y conexiones a su tienda, CRM o ERP.',
    ogDescription:
      'semanu construye configuradores 3D con los que los clientes componen su producto, ven el precio y envían una solicitud, conectados a sus sistemas.',
    heroHeadline: 'Convierta productos complejos en ventas online.',
    heroSub:
      'Configuradores de productos 3D a medida para fabricantes, que permiten a los clientes configurar productos complejos, calcular su precio y pedirlos online.',
    trust: ['Fácil de usar', 'Precio en tiempo real', 'Listas de piezas y más', 'Realidad aumentada (AR)', 'Conexión ERP y CRM'],
    scenario: {
      title: 'Un ebanista, sepultado en correos',
      problem: 'Un ebanista respondía cada pregunta a medida a mano, en largas cadenas de correos sobre tipo de madera, medidas y precio.',
      solution: 'semanu construyó un configurador donde los clientes componen su pieza y ven al instante un precio orientativo.',
      result: 'Las solicitudes ahora son concretas y el taller pierde menos tiempo con presupuestos a mano.',
    },
    problemTitle: 'Vender productos configurables exige mucha explicación',
    problemIntro: 'Quien vende productos con muchas variantes conoce estos obstáculos.',
    problemCards: [
      { title: 'Cadenas de correos interminables', text: 'Cada variante se discute a mano, lo que cuesta tiempo y paciencia.' },
      { title: 'Solicitudes vagas', text: 'Sin vista previa ni precio, los clientes no saben qué es posible y qué cuesta.' },
      { title: 'Clientes perdidos', text: 'Sin un siguiente paso claro, la gente abandona y pregunta en otro sitio.' },
    ],
    engineTitle: 'De la elección a la\nsolicitud concreta',
    engineText:
      'Su cliente elige opciones y medidas, las reglas descartan combinaciones no válidas y cada elección actualiza la vista previa y el precio en directo. La configuración terminada le llega como una solicitud o pedido concreto, mediante una conexión con su tienda, CRM o ERP.',
    flow: {
      title: 'De la elección del producto a la solicitud concreta',
      intro:
        'Con un configurador de producto 3D los clientes componen su producto en línea con facilidad. El configurador comprueba automáticamente qué opciones y combinaciones son posibles, muestra el resultado al instante en 3D y convierte la configuración elegida en datos útiles para ventas y producción.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Su cliente elige opciones, acabados y medidas en un configurador de producto 3D interactivo.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'El configurador de producto 3D convierte automáticamente las configuraciones válidas en precios, presupuestos, especificaciones, listas de piezas y documentos de producción.',
        },
        {
          label: 'INTEGRACIÓN',
          title: '',
          text: 'Conecte el configurador de producto 3D con su web, tienda en línea, CRM, ERP o sistema de producción.',
        },
      ],
    },
    visual: ['Opciones', 'Reglas', 'Vista previa', 'Precio', 'Solicitud'],
    visualCaption: 'De la primera elección a una solicitud concreta, en un solo flujo.',
    buildsTitle: 'Qué puede un configurador de semanu',
    buildsLead: 'De un solo producto a toda una gama de variantes.',
    useCasesTitle: 'Para qué productos\nencaja un configurador',
    useCasesLead: 'Sobre todo productos con muchas variantes que de otro modo exigen mucho trabajo de presupuestos.',
    useCases: [
      { title: 'Mueble e interior', text: 'Configure mesas, armarios, asientos e interiores completos por modelo, material, color y dimensiones.' },
      { title: 'Ventanas, escaleras y portones', text: 'Defina el tipo, el tamaño, el material y el acabado para ventanas, escaleras, barandillas y portones con un precio orientativo.' },
      { title: 'Máquinas a medida', text: 'Componga máquinas y componentes de máquina con distintas opciones, variantes y especificaciones técnicas.' },
      { title: 'Puertas y fachadas', text: 'Configure puertas interiores y puertas exteriores, fachadas y muros cortina por tipo, material, color y rendimiento.' },
      { title: 'Estanterías y sistemas de almacenaje', text: 'Construya estanterías, racks y soluciones de almacenaje según medida, capacidad de carga y acabado para cualquier sector.' },
      { title: 'Envolventes y armarios industriales', text: 'Configure envolventes eléctricas, armarios de control y cajas por dimensiones, material, grado de protección y opciones.' },
      { title: 'Protección solar y vida exterior', text: 'Componga pérgolas, toldos, screens y estructuras exteriores según medida, tejido, color y opción de montaje.' },
      { title: 'Edificios modulares', text: 'Configure edificios modulares, contenedores y módulos con la distribución correcta, las dimensiones y las características técnicas.' },
      { title: 'Transporte y remolques', text: 'Configure remolques, carrocerías y soluciones de transporte por dimensiones, capacidad de carga, chasis y accesorios.' },
    ],
    processTitle: 'Así abordamos un configurador',
    process: [
      { title: 'Variantes', text: 'Mapeamos sus opciones, variantes y reglas, incluida la lógica de precios.' },
      { title: 'Diseño', text: 'Construimos el configurador con su identidad y en su sitio web.' },
      { title: 'Integración', text: 'Conectamos vista previa, precio y solicitud a sus sistemas.' },
      { title: 'Acompañamiento', text: 'Mantenemos variantes y precios actuales cuando su oferta cambia.' },
    ],
    outcomesTitle: 'Qué gana',
    outcomesLead: 'Menos trabajo de presupuestos a mano y solicitudes más concretas.',
    faqTitle: 'Preguntas frecuentes sobre los configuradores 3D',
    faq: [
      { q: '¿Qué es un configurador de producto 3D?', a: 'Una herramienta interactiva con la que un cliente compone un producto por su cuenta, ve las opciones en 3D y obtiene al instante el precio y la disponibilidad correspondientes.' },
      { q: '¿Cuál es la diferencia entre un visor 3D y un configurador 3D?', a: 'Un visor muestra un producto fijo que puede mirar. Un configurador deja que el cliente modifique el producto, con reglas y precios por elección.' },
      { q: '¿Para qué productos es interesante un configurador 3D?', a: 'Para productos con muchas variantes que hoy exigen mucha explicación o trabajo de presupuestos, como muebles, ventanas, escaleras, portones o máquinas a medida.' },
      { q: '¿Un configurador puede calcular precios?', a: 'Sí, según sus reglas de precio por combinación elegida. Usted decide si es un precio definitivo o uno orientativo.' },
      { q: '¿Cuánto cuesta un configurador 3D?', a: 'Un configurador 3D funciona siempre con un coste de implementación único y una suscripción mensual fija. El coste de implementación depende del producto y de sus deseos; nuestro coste de suscripción es fijo.' },
      { q: '¿Un configurador 3D puede conectarse a un ERP o CRM?', a: 'Sí. Mediante integraciones, la configuración puede ir a su CRM, ERP o tienda, para que una solicitud o pedido entre directamente en su proceso existente.' },
    ],
    finalTitle: 'Hablemos de su configurador de producto',
    finalText: 'Cuéntenos sobre su producto y mostramos cómo podría verse un configurador en su sitio web.',
    finalCta: 'Hablemos de su configurador de producto',
    finalSecondaryLabel: 'Ver un configurador en vivo',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

export const SERVICE_DETAIL: Record<ServicesLocale, DetailMap> = {
  en,
  de,
  fr,
  es,
  nl,
};

/** Look up the detail content for a service id. */
export function getServiceDetail(locale: ServicesLocale, id: string): ServiceDetail | null {
  return SERVICE_DETAIL[locale]?.[id] ?? SERVICE_DETAIL.nl[id] ?? null;
}
