// Rich, flow-specific detail content for the individual service pages
// (/services/<slug>). Restructured 2026-10; only 3d-configurators is still routed
// through /services/[service] (Consultancy was dropped; Workflowautomatisering and
// Maatwerksoftware moved to /services/business-software). The other two blocks stay as
// related-service data until they are cleaned up.
//
// The internal service ids are kept from the previous structure to avoid a
// risky id-wide rename; only their public meaning, slug and copy changed:
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
  'marketing-automation': 'automation',
  'business-systems': 'systems',
  '3d-configurators': 'automation',
};

/**
 * Related services shown at the foot of each service page (max 2 each), chosen so
 * the cross links map real topical relationships without cannibalising.
 */
export const RELATED_SERVICES: Record<string, string[]> = {
  'marketing-automation': ['business-systems', '3d-configurators'],
  'business-systems': ['marketing-automation', '3d-configurators'],
  '3d-configurators': ['business-systems', 'marketing-automation'],
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
  // optional "from choice to request" flow: intro + big tiles (configurator). The tiles render their label as the title; `title`/`intro`
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
  'marketing-automation': {
    metaTitle: 'Workflowautomatisering voor kmo · semanu.eu',
    metaDescription:
      'Automatiseer terugkerend werk en verbind uw systemen via integraties en API. semanu vermindert manueel werk en fouten voor kmo’s.',
    ogDescription:
      'semanu verbindt uw bestaande software en automatiseert terugkerende stappen, van CRM en ERP tot documentverwerking.',
    heroHeadline: 'Workflowautomatisering die uw systemen laat samenwerken.',
    heroSub:
      'semanu automatiseert terugkerende stappen en verbindt uw bestaande software, zodat uw team minder overtypt en minder fouten maakt. Voor kmo’s zonder groot IT team.',
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
    finalSecondaryHref: '/services/business-software',
  },

  'business-systems': {
    metaTitle: 'Maatwerksoftware voor kmo · semanu.eu',
    metaDescription:
      'Software op maat wanneer standaardpakketten niet passen: webapplicaties, portalen en interne tools met koppelingen naar uw systemen.',
    ogDescription:
      'semanu bouwt software op maat die aansluit op hoe u werkt: portalen, interne tools en webapplicaties met integraties en oog voor onderhoud.',
    heroHeadline: 'Maatwerksoftware voor wanneer standaardpakketten niet passen.',
    heroSub:
      'semanu bouwt webapplicaties, portalen en interne tools die aansluiten op hoe uw bedrijf echt werkt. Voor kmo’s die vastlopen op standaardsoftware.',
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
      'We vertalen uw probleem naar concrete requirements en bouwen eerst het onderdeel met de meeste waarde. Daarna breiden we stapsgewijs uit met integraties naar uw bestaande systemen zodat gegevens op één plek kloppen. Software blijft leven, dus we houden ze veilig, actueel en aanpasbaar.',
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
    outcomesLead: 'Software die aansluit op hoe u werkt met koppelingen en oog voor de lange termijn.',
    faqTitle: 'Veelgestelde vragen over maatwerksoftware',
    faq: [
      { q: 'Wanneer is maatwerksoftware interessanter dan standaardsoftware?', a: 'Wanneer u uw proces zou moeten aanpassen aan het pakket in plaats van omgekeerd of wanneer losse tools en veel handwerk nodig zijn om één proces rond te krijgen.' },
      { q: 'Wat kost maatwerksoftware?', a: 'Dat hangt af van de omvang en complexiteit; een vaste prijs bestaat niet. We bouwen gefaseerd, te beginnen met het onderdeel dat de meeste waarde levert.' },
      { q: 'Kan maatwerksoftware koppelen met bestaande systemen?', a: 'Ja. Integraties met uw huidige software zijn meestal een kernonderdeel, zodat gegevens op één plek blijven kloppen.' },
      { q: 'Hoe verloopt de ontwikkeling van maatwerksoftware?', a: 'We starten met heldere requirements, bouwen eerst een werkende kernversie en breiden daarna stapsgewijs uit met onderhoud erna.' },
    ],
    finalTitle: 'Bespreek uw softwarevraagstuk',
    finalText: 'Vertel ons waar standaardsoftware tekortschiet en we bekijken of maatwerk de juiste stap is.',
    finalCta: 'Bespreek uw softwarevraagstuk',
    finalSecondaryLabel: 'Bekijk alle diensten',
    finalSecondaryHref: '/services/business-software',
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
      { q: 'Wat is een 3D-productconfigurator?', a: 'Een 3D-productconfigurator is interactieve software waarmee klanten online zelf een product samenstellen. Ze kiezen bijvoorbeeld afmetingen, materialen, kleuren en uitvoeringen en zien de wijzigingen meteen in een driedimensionale weergave. Afhankelijk van de uitwerking worden ook de prijzen automatisch berekend. Zo vereenvoudigen bedrijven hun verkoopproces en besteden ze minder tijd aan offertes met de hand.' },
      { q: 'Wat is het verschil tussen een 3D-viewer en een 3D-configurator?', a: 'Met een 3D-viewer bekijkt u een product vanuit verschillende hoeken. Een 3D-configurator gaat een stap verder: klanten passen het product zelf aan, bijvoorbeeld door andere afmetingen, materialen of uitvoeringen te kiezen. De configurator houdt daarbij rekening met technische regels en kan automatisch de juiste prijs berekenen. Zo wordt een eenvoudige productvisualisatie een interactief verkoopinstrument.' },
      { q: 'Voor welke producten is een 3D-configurator geschikt?', a: 'Een 3D-productconfigurator is vooral geschikt voor producten met veel varianten of mogelijkheden op maat. Typische voorbeelden zijn meubels, ramen, deuren, trappen, pergola’s, machines en industriële onderdelen. Een configurator is vooral zinvol wanneer klanten vandaag veel bijkomende vragen stellen of wanneer offertes op maat met de hand moeten worden opgemaakt. Een configurator vereenvoudigt dat proces en maakt complexe producten makkelijker te begrijpen.' },
      { q: 'Wat kost de ontwikkeling van een 3D-productconfigurator?', a: 'Bij semanu bestaan de kosten uit een eenmalige implementatiekost en een vast maandelijks abonnement. De implementatiekost hangt onder meer af van de complexiteit van het product, het aantal varianten, de nodige 3D-modellen en de gewenste integraties. In een eerste gesprek analyseren we uw noden en tonen we welke oplossing zinvol is voor uw product.' },
      { q: 'Hoe lang duurt de ontwikkeling van een 3D-configurator?', a: 'De ontwikkelduur hangt af van de complexiteit van uw product en de gewenste functies. Een configurator met weinig varianten is sneller klaar dan een oplossing met uitgebreide productregels, automatische prijsberekening en een ERP-koppeling. Ook de beschikbaarheid van bestaande 3D-modellen speelt mee. Na een eerste analyse kunnen we de inspanning inschatten en een realistische planning opstellen.' },
      { q: 'Hebben we al 3D-modellen van onze producten nodig?', a: 'Niet noodzakelijk. Als er al geschikte 3D-modellen zijn, kunnen die mogelijk dienen als basis voor de configurator. Zijn er geen modellen, dan bekijken we eerst hoe de nodige 3D-gegevens kunnen worden gemaakt. Doorslaggevend zijn de complexiteit van het product en de gewenste configuratiemogelijkheden. Samen bepalen we welke gegevens nodig zijn en hoe uw product het best in beeld komt.' },
      { q: 'Kan een 3D-configurator in onze bestaande website of webshop worden geïntegreerd?', a: 'Ja. Een 3D-productconfigurator kan in een bestaande website of webshop worden geïntegreerd, zolang aan de technische voorwaarden is voldaan. Klanten configureren hun producten dan rechtstreeks op uw website zonder naar een apart platform te moeten. Afhankelijk van de integratie kunnen configuraties ook worden doorgestuurd naar uw winkelmandje, uw CRM of uw ERP-systeem.' },
      { q: 'Kan een 3D-configurator automatisch prijzen en offertes maken?', a: 'Ja. Een 3D-configurator kan op basis van uw ingestelde prijsregels automatisch de prijs van een configuratie op maat berekenen. Daarbij houdt hij bijvoorbeeld rekening met afmetingen, materialen, uitvoeringen en extra opties. Op basis daarvan kunnen ook offertes, stuklijsten en technische documenten worden gegenereerd. Zo vermindert u manuele berekeningen, voorkomt u fouten en behandelt u klantaanvragen sneller.' },
      { q: 'Kan een 3D-configurator gekoppeld worden aan ons ERP- of CRM-systeem?', a: 'Ja. Onze 3D-productconfiguratoren kunnen via geschikte interfaces gekoppeld worden aan bestaande ERP-, CRM- en productiesystemen. Zo worden productconfiguraties, klantgegevens, prijzen en bestellingen automatisch doorgestuurd. Een klantaanvraag stroomt dan rechtstreeks door naar uw bestaande verkoop- of productieproces. Welke integraties mogelijk zijn, hangt af van de technische interfaces van uw systemen.' },
    ],
    finalTitle: 'Bespreek uw productconfigurator',
    finalText: 'Vertel ons over uw product en we tonen hoe een configurator er in uw website kan uitzien.',
    finalCta: 'Bespreek uw productconfigurator',
    finalSecondaryLabel: 'Bekijk een live configurator',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const en: DetailMap = {
  'marketing-automation': {
    metaTitle: 'Workflow automation for SMEs · semanu.eu',
    metaDescription:
      'Automate repetitive work and connect your systems through integrations and API. semanu reduces manual work and errors for SMEs.',
    ogDescription:
      'semanu connects your existing software and automates recurring steps, from CRM and ERP to document processing.',
    heroHeadline: 'Workflow automation that makes your systems work together.',
    heroSub:
      'semanu automates recurring steps and connects your existing software, so your team retypes less and makes fewer errors. For SMEs without a large IT team.',
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
    finalSecondaryHref: '/services/business-software',
  },

  'business-systems': {
    metaTitle: 'Custom software for SMEs · semanu.eu',
    metaDescription:
      'Software built to fit when off the shelf packages do not: web applications, portals and internal tools with connections to your systems.',
    ogDescription:
      'semanu builds custom software that matches how you work: portals, internal tools and web applications with integrations and attention to maintenance.',
    heroHeadline: 'Custom software for when off the shelf packages do not fit.',
    heroSub:
      'semanu builds web applications, portals and internal tools that match how your business really works. For SMEs that get stuck on standard software.',
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
      'We translate your problem into concrete requirements and first build the part with the most value. Then we expand step by step with integrations to your existing systems so data is correct in one place. Software keeps living, so we keep it secure, current and adaptable.',
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
    outcomesLead: 'Software that matches how you work with connections and an eye on the long term.',
    faqTitle: 'Frequently asked questions about custom software',
    faq: [
      { q: 'When is custom software more interesting than standard software?', a: 'When you would have to adapt your process to the package instead of the other way around or when disconnected tools and a lot of manual work are needed to complete one process.' },
      { q: 'What does custom software cost?', a: 'That depends on the size and complexity; a fixed price does not exist. We build in phases, starting with the part that delivers the most value.' },
      { q: 'Can custom software connect to existing systems?', a: 'Yes. Integrations with your current software are usually a core part, so data stays correct in one place.' },
      { q: 'How does the development of custom software work?', a: 'We start with clear requirements, first build a working core version and then expand step by step with maintenance afterwards.' },
    ],
    finalTitle: 'Discuss your software question',
    finalText: 'Tell us where standard software falls short and we look at whether custom work is the right step.',
    finalCta: 'Discuss your software question',
    finalSecondaryLabel: 'See all services',
    finalSecondaryHref: '/services/business-software',
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
      { q: 'What is a 3D product configurator?', a: 'A 3D product configurator is interactive software that lets customers put together a product online themselves. They choose for example dimensions, materials, colours and finishes and see the changes straight away in a 3D view. Depending on the implementation, prices are also calculated automatically. This simplifies the sales process and reduces the effort spent on manual quotes.' },
      { q: 'What is the difference between a 3D viewer and a 3D configurator?', a: 'A 3D viewer lets you look at a product from different angles. A 3D configurator goes a step further: customers can change the product themselves, for example by choosing different dimensions, materials or finishes. The configurator takes technical rules into account and can calculate the matching price automatically. A simple product visualisation becomes an interactive sales tool.' },
      { q: 'Which products is a 3D configurator suitable for?', a: 'A 3D product configurator is particularly suited to products with many variants or custom options. Typical examples are furniture, windows, doors, stairs, pergolas, machines and industrial components. A configurator makes most sense when customers currently ask a lot of follow up questions or when custom quotes have to be prepared by hand. A configurator simplifies this process and makes complex products easier to understand.' },
      { q: 'How much does it cost to develop a 3D product configurator?', a: 'At semanu the cost consists of a one off implementation fee and a fixed monthly subscription. The implementation fee depends on factors such as the complexity of the product, the number of variants, the 3D models required and the integrations you want. In a first conversation we analyse your requirements and show you which solution makes sense for your product.' },
      { q: 'How long does it take to develop a 3D configurator?', a: 'The development time depends on the complexity of your product and the features you want. A configurator with a few variants can be delivered faster than a solution with extensive product rules, automatic pricing and an ERP connection. The availability of existing 3D models also plays a role. After an initial analysis we can estimate the effort and draw up a realistic timeline.' },
      { q: 'Do we already need 3D models of our products?', a: 'Not necessarily. If suitable 3D models already exist, they may serve as the basis for the configurator. If there are no models yet, we first look at how the required 3D data can be created. What matters is the complexity of the product and the configuration options you want. Together we determine which data is needed and how your product can best be visualised.' },
      { q: 'Can a 3D configurator be integrated into our existing website or webshop?', a: 'Yes. A 3D product configurator can be integrated into an existing website or webshop, provided the technical requirements are met. Customers can then configure their products directly on your website without having to visit a separate platform. Depending on the integration, configurations can also be passed on to your shopping basket, your CRM or your ERP system.' },
      { q: 'Can a 3D configurator create prices and quotes automatically?', a: 'Yes. A 3D configurator can automatically calculate the price of a custom configuration based on the pricing rules you set. It takes into account dimensions, materials, finishes and additional options, for example. On that basis it can also generate quotes, bills of materials and technical documents. This reduces manual calculations, avoids errors and speeds up the handling of customer enquiries.' },
      { q: 'Can a 3D configurator connect to our ERP or CRM system?', a: 'Yes. Our 3D product configurators can be connected to existing ERP, CRM and production systems through suitable interfaces. Product configurations, customer details, prices and orders can then be transferred automatically. A customer enquiry flows straight into your existing sales or production process. Which integrations are possible depends on the technical interfaces of your systems.' },
    ],
    finalTitle: 'Discuss your product configurator',
    finalText: 'Tell us about your product and we show how a configurator could look in your website.',
    finalCta: 'Discuss your product configurator',
    finalSecondaryLabel: 'See a live configurator',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const de: DetailMap = {
  'marketing-automation': {
    metaTitle: 'Workflowautomatisierung für KMU · semanu.eu',
    metaDescription:
      'Automatisieren Sie wiederkehrende Arbeit und verbinden Sie Ihre Systeme über Integrationen und API. semanu reduziert manuelle Arbeit und Fehler für KMU.',
    ogDescription:
      'semanu verbindet Ihre bestehende Software und automatisiert wiederkehrende Schritte, von CRM und ERP bis Dokumentenverarbeitung.',
    heroHeadline: 'Workflowautomatisierung, die Ihre Systeme zusammenarbeiten lässt.',
    heroSub:
      'semanu automatisiert wiederkehrende Schritte und verbindet Ihre bestehende Software, damit Ihr Team weniger abtippt und weniger Fehler macht. Für KMU ohne großes IT Team.',
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
    finalSecondaryHref: '/services/business-software',
  },

  'business-systems': {
    metaTitle: 'Maßgeschneiderte Software für KMU · semanu.eu',
    metaDescription:
      'Software nach Maß, wenn Standardpakete nicht passen: Webanwendungen, Portale und interne Tools mit Verbindungen zu Ihren Systemen.',
    ogDescription:
      'semanu baut maßgeschneiderte Software, die zu Ihrer Arbeitsweise passt: Portale, interne Tools und Webanwendungen mit Integrationen und Blick auf Wartung.',
    heroHeadline: 'Maßgeschneiderte Software für den Fall, dass Standardpakete nicht passen.',
    heroSub:
      'semanu baut Webanwendungen, Portale und interne Tools, die zu Ihrer tatsächlichen Arbeitsweise passen. Für KMU, die mit Standardsoftware nicht weiterkommen.',
    trust: ['passt zu Ihrem Prozess', 'verbindet mit Ihren Systemen', 'Blick auf Wartung und Eigentum'],
    hubCenter: 'Maßarbeit',
    problemTitle: 'Wenn Standardsoftware Ihr Unternehmen ausbremst',
    problemIntro: 'Standardsoftware ist oft der Ausgangspunkt. Manchmal passt sie einfach nicht.',
    problemCards: [
      { title: 'Prozess an das Tool anpassen', text: 'Sie bauen Ihre Arbeitsweise um, damit sie ins Paket passt, statt umgekehrt.' },
      { title: 'Viele lose Tools', text: 'Mehrere Pakete und viel Handarbeit, um einen Arbeitsprozess zu vervollständigen.' },
      { title: 'Wachstum ausgebremst', text: 'Bestehende Software verbindet sich nicht oder kann nicht mit dem mithalten, was Sie brauchen.' },
    ],
    engineTitle: 'Eine Plattform, Ihre Systeme\ndrumherum verbunden',
    engineText:
      'Wir übersetzen Ihr Problem in konkrete Anforderungen und bauen zuerst den Teil mit dem meisten Mehrwert. Danach erweitern wir schrittweise mit Integrationen zu Ihren bestehenden Systemen, damit Daten an einer Stelle stimmen. Software lebt weiter, daher halten wir sie sicher, aktuell und anpassbar.',
    visual: ['Webanwendungen', 'Portale', 'Interne Tools', 'Integrationen', 'Wartung'],
    visualCaption: 'Eine Plattform nach Maß, rund um Ihr Unternehmen gebaut.',
    buildsTitle: 'Was semanu baut',
    buildsLead: 'Maßarbeit rund um Ihr Unternehmen, keine generische Vorlage.',
    useCasesTitle: 'Was wir bauen',
    useCasesLead: 'Einige Formen, die maßgeschneiderte Software oft annimmt.',
    useCases: [
      { title: 'Interne Unternehmensanwendungen', text: 'Tools, die einen spezifischen Arbeitsprozess unterstützen.' },
      { title: 'Kunden- und Partnerportale', text: 'Eine sichere Umgebung, in der Kunden oder Partner Dinge selbst regeln.' },
      { title: 'Legacy Modernisierung', text: 'Ein veraltetes System phasenweise ersetzen, ohne Ihren Betrieb lahmzulegen.' },
    ],
    processTitle: 'Wie ein Maßprojekt abläuft',
    process: [
      { title: 'Scharfstellen', text: 'Wir übersetzen Ihr Problem in konkrete Anforderungen und einen machbaren Scope.' },
      { title: 'Erste funktionierende Version', text: 'Wir bauen zuerst das Kernstück, das den meisten Mehrwert liefert.' },
      { title: 'Erweitern', text: 'Wir fügen schrittweise Funktionalität auf Basis der Nutzung hinzu.' },
      { title: 'Wartung', text: 'Wir halten die Software sicher, aktuell und anpassbar.' },
    ],
    outcomesTitle: 'Was Ihnen bleibt',
    outcomesLead: 'Software, die zu Ihrer Arbeitsweise passt mit Verbindungen und Blick auf die lange Sicht.',
    faqTitle: 'Häufige Fragen zu maßgeschneiderter Software',
    faq: [
      { q: 'Wann ist maßgeschneiderte Software interessanter als Standardsoftware?', a: 'Wenn Sie Ihren Prozess an das Paket anpassen müssten statt umgekehrt oder wenn lose Tools und viel Handarbeit nötig sind, um einen Prozess zu vervollständigen.' },
      { q: 'Was kostet maßgeschneiderte Software?', a: 'Das hängt von Umfang und Komplexität ab; einen Fixpreis gibt es nicht. Wir bauen phasenweise, beginnend mit dem Teil, der den meisten Mehrwert liefert.' },
      { q: 'Kann maßgeschneiderte Software mit bestehenden Systemen verbinden?', a: 'Ja. Integrationen mit Ihrer aktuellen Software sind meist ein Kernbestandteil, damit Daten an einer Stelle stimmen.' },
      { q: 'Wie läuft die Entwicklung maßgeschneiderter Software ab?', a: 'Wir starten mit klaren Anforderungen, bauen zuerst eine funktionierende Kernversion und erweitern danach schrittweise mit anschließender Wartung.' },
    ],
    finalTitle: 'Besprechen Sie Ihre Softwarefrage',
    finalText: 'Erzählen Sie uns, wo Standardsoftware zu kurz greift und wir schauen, ob Maßarbeit der richtige Schritt ist.',
    finalCta: 'Besprechen Sie Ihre Softwarefrage',
    finalSecondaryLabel: 'Alle Dienstleistungen ansehen',
    finalSecondaryHref: '/services/business-software',
  },

  '3d-configurators': {
    metaTitle: '3D-Produktkonfigurator bauen lassen · semanu.eu',
    metaDescription:
      'Machen Sie konfigurierbare Produkte online verkäuflich: Echtzeit 3D, Konfigurationsregeln, Preislogik und Verbindungen zu Ihrem Webshop, CRM oder ERP.',
    ogDescription:
      'semanu baut 3D-Konfiguratoren mit denen Kunden Ihr Produkt zusammenstellen, den Preis sehen und eine Anfrage senden, verbunden mit Ihren Systemen.',
    heroHeadline: 'Komplexe Produkte erfolgreich online verkaufen.',
    heroSub:
      'Maßgeschneiderte 3D-Produktkonfiguratoren für Hersteller mit denen Kunden komplexe Produkte online konfigurieren, Preise berechnen und direkt bestellen können.',
    trust: ['Benutzerfreundlich', 'Preis in Echtzeit', 'Stücklisten und mehr', 'Augmented Reality (AR)', 'ERP- und CRM-Anbindung'],
    scenario: {
      title: 'Ein Möbelbauer, begraben unter Mails',
      problem: 'Ein Möbelbauer beantwortete jede Maßanfrage von Hand, in langen Mailketten über Holzart, Maße und Preis.',
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
      'Ihr Kunde wählt Optionen und Maße, die Regeln schließen ungültige Kombinationen aus und jede Wahl aktualisiert Preview und Preis live. Die fertige Konfiguration erreicht Sie als konkrete Anfrage oder Bestellung, über eine Verbindung mit Ihrem Webshop, CRM oder ERP.',
    flow: {
      title: 'Von der Produktauswahl zur konkreten Anfrage',
      intro:
        'Mit einem 3D-Produktkonfigurator stellen Kunden ihr Produkt einfach online zusammen. Der Konfigurator prüft automatisch, welche Optionen und Kombinationen möglich sind, zeigt das Ergebnis sofort in 3D und wandelt die gewählte Konfiguration in nutzbare Daten für Verkauf und Produktion um.',
      tiles: [
        {
          label: 'INPUT',
          title: '',
          text: 'Ihr Kunde wählt Optionen, Ausführungen und Maße in einem interaktiven 3D-Produktkonfigurator.',
        },
        {
          label: 'OUTPUT',
          title: '',
          text: 'Der 3D-Produktkonfigurator wandelt gültige Konfigurationen automatisch in Preise, Angebote, Spezifikationen, Stücklisten und Produktionsdokumente um.',
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
    useCasesLead: 'Vor allem Produkte mit vielen Varianten, die sonst viel Angebotsarbeit erfordern.',
    useCases: [
      { title: 'Möbel und Interieur', text: 'Konfigurieren Sie Tische, Schränke, Sitzmöbel und ganze Interieurs nach Modell, Material, Farbe und Maßen.' },
      { title: 'Fenster, Treppen und Tore', text: 'Legen Sie Typ, Größe, Material und Ausführung für Fenster, Treppen, Geländer und Tore mit einem Richtpreis fest.' },
      { title: 'Maßgefertigte Maschinen', text: 'Stellen Sie Maschinen und Maschinenkomponenten mit verschiedenen Optionen, Varianten und technischen Spezifikationen zusammen.' },
      { title: 'Türen und Fassaden', text: 'Konfigurieren Sie Innentüren und Außentüren, Fassaden und Vorhangfassaden nach Typ, Material, Farbe und Leistung.' },
      { title: 'Regale und Lagersysteme', text: 'Bauen Sie Regale, Gestelle und Lagerlösungen nach Maß, Traglast und Ausführung für jede Branche.' },
      { title: 'Industriegehäuse und Schränke', text: 'Konfigurieren Sie Schaltschränke, Steuerschränke und Gehäuse nach Maßen, Material, Schutzart und Optionen.' },
      { title: 'Sonnenschutz und Außenbereich', text: 'Stellen Sie Pergolen, Markisen, Screens und Außenstrukturen nach Maß, Stoff, Farbe und Montageoption zusammen.' },
      { title: 'Modulare Gebäude', text: 'Konfigurieren Sie modulare Gebäude, Container und Unterkünfte mit der richtigen Aufteilung, Maßen und technischen Merkmalen.' },
      { title: 'Transport und Anhänger', text: 'Konfigurieren Sie Anhänger, Aufbauten und Transportlösungen nach Maßen, Nutzlast, Fahrgestell und Zubehör.' },
    ],
    processTitle: 'So gehen wir einen Konfigurator an',
    process: [
      { title: 'Varianten', text: 'Wir bilden Ihre Optionen, Varianten und Regeln ab, inklusive Preislogik.' },
      { title: 'Design', text: 'Wir bauen den Konfigurator in Ihrem Erscheinungsbild und in Ihrer Website.' },
      { title: 'Integration', text: 'Wir verbinden Preview, Preis und Anfrage mit Ihren Systemen.' },
      { title: 'Begleitung', text: 'Wir halten Varianten und Preise aktuell, wenn sich Ihr Angebot ändert.' },
    ],
    outcomesTitle: 'Was Sie gewinnen',
    outcomesLead: 'Weniger Angebotsarbeit von Hand und konkretere Anfragen.',
    faqTitle: 'Häufige Fragen zu 3D-Konfiguratoren',
    faq: [
      { q: 'Was ist ein 3D-Produktkonfigurator?', a: 'Ein 3D-Produktkonfigurator ist eine interaktive Software mit der Kunden Produkte online individuell zusammenstellen können. Sie wählen beispielsweise Maße, Materialien, Farben und Ausführungen aus und sehen die Änderungen direkt in einer dreidimensionalen Darstellung. Je nach Umsetzung werden auch Preise automatisch berechnet. Dadurch vereinfachen Unternehmen den Verkaufsprozess und reduzieren den Aufwand für manuelle Offerten.' },
      { q: 'Was ist der Unterschied zwischen einem 3D-Viewer und einem 3D-Konfigurator?', a: 'Ein 3D-Viewer ermöglicht es, ein Produkt aus verschiedenen Perspektiven zu betrachten. Ein 3D-Konfigurator geht einen Schritt weiter: Kunden können das Produkt selbst verändern, beispielsweise durch die Auswahl unterschiedlicher Maße, Materialien oder Ausführungen. Dabei berücksichtigt der Konfigurator technische Regeln und kann automatisch passende Preise berechnen. So wird aus einer einfachen Produktvisualisierung ein interaktives Verkaufswerkzeug.' },
      { q: 'Für welche Produkte eignet sich ein 3D-Konfigurator?', a: 'Ein 3D-Produktkonfigurator eignet sich besonders für Produkte mit vielen Varianten oder individuellen Anpassungsmöglichkeiten. Typische Beispiele sind Möbel, Fenster, Türen, Treppen, Pergolen, Maschinen und industrielle Bauteile. Besonders sinnvoll ist ein Konfigurator, wenn Kunden heute viele Rückfragen stellen oder individuelle Angebote manuell erstellt werden müssen. Ein Konfigurator vereinfacht diesen Prozess und macht komplexe Produkte leichter verständlich.' },
      { q: 'Was kostet die Entwicklung eines 3D-Produktkonfigurators?', a: 'Die Kosten setzen sich bei semanu aus einmaligen Implementierungskosten und einem festen monatlichen Abonnement zusammen. Die Implementierungskosten hängen unter anderem von der Produktkomplexität, der Anzahl der Varianten, den benötigten 3D-Modellen und den gewünschten Integrationen ab. In einem ersten Gespräch analysieren wir Ihre Anforderungen und zeigen Ihnen, welche Lösung für Ihr Produkt sinnvoll ist.' },
      { q: 'Wie lange dauert die Entwicklung eines 3D-Konfigurators?', a: 'Die Entwicklungsdauer hängt von der Komplexität Ihres Produkts und den gewünschten Funktionen ab. Ein Konfigurator mit wenigen Varianten ist schneller umsetzbar als eine Lösung mit umfangreichen Produktregeln, automatischer Preisberechnung und ERP-Anbindung. Auch die Verfügbarkeit bestehender 3D-Modelle spielt eine Rolle. Nach einer ersten Analyse können wir den Aufwand einschätzen und einen realistischen Zeitplan erstellen.' },
      { q: 'Benötigen wir bereits 3D-Modelle unserer Produkte?', a: 'Nicht unbedingt. Wenn bereits geeignete 3D-Modelle vorhanden sind, können diese möglicherweise als Grundlage für den Konfigurator verwendet werden. Falls keine Modelle existieren, muss zunächst geprüft werden, wie die benötigten 3D-Daten erstellt werden können. Entscheidend sind die Komplexität des Produkts und die gewünschten Konfigurationsmöglichkeiten. Wir klären gemeinsam, welche Daten benötigt werden und wie sich Ihr Produkt am besten visualisieren lässt.' },
      { q: 'Kann ein 3D-Konfigurator in unsere bestehende Website oder unseren Webshop integriert werden?', a: 'Ja. Ein 3D-Produktkonfigurator kann in eine bestehende Website oder einen Webshop integriert werden, sofern die technischen Voraussetzungen erfüllt sind. Kunden können ihre Produkte dadurch direkt auf Ihrer Website konfigurieren, ohne eine separate Plattform besuchen zu müssen. Je nach Integration lassen sich Konfigurationen auch an Ihren Warenkorb, Ihr CRM oder Ihr ERP-System übertragen.' },
      { q: 'Kann ein 3D-Konfigurator automatisch Preise und Angebote erstellen?', a: 'Ja. Ein 3D-Konfigurator kann anhand Ihrer hinterlegten Preisregeln automatisch den Preis einer individuellen Produktkonfiguration berechnen. Dabei werden beispielsweise Maße, Materialien, Ausführungen und zusätzliche Optionen berücksichtigt. Auf dieser Grundlage können auch Angebote, Stücklisten und technische Dokumente generiert werden. Dadurch reduzieren Sie manuelle Berechnungen, vermeiden Fehler und beschleunigen die Bearbeitung von Kundenanfragen.' },
      { q: 'Kann ein 3D-Konfigurator mit unserem ERP- oder CRM-System verbunden werden?', a: 'Ja. Unsere 3D-Produktkonfiguratoren können über geeignete Schnittstellen mit bestehenden ERP-, CRM- und Produktionssystemen verbunden werden. So lassen sich Produktkonfigurationen, Kundeninformationen, Preise und Bestellungen automatisch übertragen. Dadurch kann eine Kundenanfrage direkt in Ihren bestehenden Verkaufs- oder Produktionsprozess einfließen. Welche Integrationen möglich sind, hängt von den technischen Schnittstellen Ihrer Systeme ab.' },
    ],
    finalTitle: 'Besprechen Sie Ihren Produktkonfigurator',
    finalText: 'Erzählen Sie uns von Ihrem Produkt und wir zeigen, wie ein Konfigurator in Ihrer Website aussehen kann.',
    finalCta: 'Besprechen Sie Ihren Produktkonfigurator',
    finalSecondaryLabel: 'Einen Live-Konfigurator ansehen',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const fr: DetailMap = {
  'marketing-automation': {
    metaTitle: 'Automatisation des workflows pour PME · semanu.eu',
    metaDescription:
      'Automatisez le travail répétitif et reliez vos systèmes via des intégrations et une API. semanu réduit le travail manuel et les erreurs pour les PME.',
    ogDescription:
      'semanu relie vos logiciels existants et automatise les étapes récurrentes, du CRM et ERP au traitement de documents.',
    heroHeadline: 'Une automatisation des workflows qui fait collaborer vos systèmes.',
    heroSub:
      'semanu automatise les étapes récurrentes et relie vos logiciels existants, pour que votre équipe recopie moins et fasse moins d’erreurs. Pour les PME sans grande équipe IT.',
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
    finalSecondaryHref: '/services/business-software',
  },

  'business-systems': {
    metaTitle: 'Logiciel sur mesure pour PME · semanu.eu',
    metaDescription:
      'Un logiciel sur mesure quand les solutions standard ne suffisent pas: applications web, portails et outils internes avec des connexions à vos systèmes.',
    ogDescription:
      'semanu construit un logiciel sur mesure qui colle à votre façon de travailler: portails, outils internes et applications web avec des intégrations et une attention à la maintenance.',
    heroHeadline: 'Un logiciel sur mesure pour quand les solutions standard ne conviennent pas.',
    heroSub:
      'semanu construit des applications web, des portails et des outils internes qui collent à la façon dont votre entreprise travaille vraiment. Pour les PME qui bloquent sur un logiciel standard.',
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
      'Nous traduisons votre problème en exigences concrètes et construisons d’abord la partie à la plus grande valeur. Ensuite, nous étendons pas à pas avec des intégrations à vos systèmes existants pour que les données soient justes à un seul endroit. Un logiciel continue de vivre, nous le gardons donc sûr, à jour et adaptable.',
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
    outcomesLead: 'Un logiciel qui colle à votre façon de travailler avec des connexions et une vue sur le long terme.',
    faqTitle: 'Questions fréquentes sur le logiciel sur mesure',
    faq: [
      { q: 'Quand le logiciel sur mesure est il plus intéressant que le standard?', a: 'Quand vous devriez adapter votre processus au paquet au lieu de l’inverse ou quand des outils dispersés et beaucoup de travail manuel sont nécessaires pour boucler un processus.' },
      { q: 'Combien coûte un logiciel sur mesure?', a: 'Cela dépend de l’ampleur et de la complexité; il n’y a pas de prix fixe. Nous construisons par phases, en commençant par la partie qui apporte le plus de valeur.' },
      { q: 'Un logiciel sur mesure peut il se connecter aux systèmes existants?', a: 'Oui. Les intégrations avec votre logiciel actuel sont souvent un élément central, pour que les données restent justes à un seul endroit.' },
      { q: 'Comment se déroule le développement d’un logiciel sur mesure?', a: 'Nous commençons par des exigences claires, construisons d’abord une version de base fonctionnelle puis étendons pas à pas avec une maintenance ensuite.' },
    ],
    finalTitle: 'Parlons de votre besoin logiciel',
    finalText: 'Dites nous où le logiciel standard est insuffisant et nous regardons si le sur mesure est la bonne étape.',
    finalCta: 'Parlons de votre besoin logiciel',
    finalSecondaryLabel: 'Voir tous les services',
    finalSecondaryHref: '/services/business-software',
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
      { q: 'Un configurateur de produit 3D, c’est quoi?', a: 'Un configurateur de produit 3D est un logiciel interactif qui permet à vos clients de personnaliser un produit en ligne. Ils choisissent par exemple les dimensions, les matériaux, les couleurs et les finitions et voient les modifications directement dans une vue en trois dimensions. Selon la réalisation, les prix sont aussi calculés automatiquement. Les entreprises simplifient ainsi leur processus de vente et réduisent le travail consacré aux devis manuels.' },
      { q: 'Quelle est la différence entre un visualiseur 3D et un configurateur 3D?', a: 'Un visualiseur 3D permet de regarder un produit sous différents angles. Un configurateur 3D va plus loin, car les clients peuvent modifier le produit, par exemple en choisissant d’autres dimensions, matériaux ou finitions. Le configurateur tient compte des règles techniques et peut calculer automatiquement le prix correspondant. Une simple visualisation de produit devient ainsi un outil de vente interactif.' },
      { q: 'Pour quels produits choisir un configurateur 3D?', a: 'Un configurateur de produit 3D convient particulièrement aux produits qui comptent de nombreuses variantes ou possibilités de personnalisation. Des exemples typiques sont les meubles, fenêtres, portes, escaliers, pergolas, machines et composants industriels. Un configurateur est surtout utile lorsque vos clients posent aujourd’hui beaucoup de questions ou lorsque des devis personnalisés doivent être établis à la main. Le configurateur simplifie ce processus et rend les produits complexes plus faciles à comprendre.' },
      { q: 'Combien coûte le développement d’un configurateur de produit 3D?', a: 'Chez semanu, le coût se compose de frais d’implémentation uniques et d’un abonnement mensuel fixe. Les frais d’implémentation dépendent notamment de la complexité du produit, du nombre de variantes, des modèles 3D nécessaires et des intégrations souhaitées. Lors d’un premier entretien, nous analysons vos besoins et vous montrons quelle solution est pertinente pour votre produit.' },
      { q: 'Quelle est la durée de développement d’un configurateur 3D?', a: 'La durée de développement dépend de la complexité de votre produit et des fonctions souhaitées. Un configurateur avec peu de variantes se réalise plus vite qu’une solution comportant de nombreuses règles produit, un calcul de prix automatique et une connexion à l’ERP. La disponibilité de modèles 3D existants joue aussi un rôle. Après une première analyse, nous pouvons estimer l’effort et établir un calendrier réaliste.' },
      { q: 'Nous devons déjà avoir des modèles 3D de nos produits?', a: 'Pas forcément. Si des modèles 3D adaptés existent déjà, ils peuvent éventuellement servir de base au configurateur. S’il n’existe aucun modèle, nous examinons d’abord comment créer les données 3D nécessaires. Ce qui compte, c’est la complexité du produit et les possibilités de configuration souhaitées. Ensemble, nous déterminons quelles données sont nécessaires et comment visualiser au mieux votre produit.' },
      { q: 'Intégrer un configurateur 3D à notre site web ou notre boutique en ligne, c’est possible?', a: 'Oui. Un configurateur de produit 3D peut être intégré à un site web ou à une boutique en ligne existants, pour autant que les conditions techniques soient remplies. Vos clients configurent alors leurs produits directement sur votre site sans devoir passer par une plateforme séparée. Selon l’intégration, les configurations peuvent aussi être transmises à votre panier, à votre CRM ou à votre ERP.' },
      { q: 'Calculer automatiquement les prix et établir des devis avec un configurateur 3D, c’est possible?', a: 'Oui. Sur la base des règles de prix que vous définissez, un configurateur 3D calcule automatiquement le prix d’une configuration personnalisée. Il tient compte par exemple des dimensions, des matériaux, des finitions et des options supplémentaires. Sur cette base, il peut aussi générer des devis, des nomenclatures et des documents techniques. Vous réduisez ainsi les calculs manuels, évitez les erreurs et traitez plus rapidement les demandes de vos clients.' },
      { q: 'Connecter un configurateur 3D à notre ERP ou CRM, c’est possible?', a: 'Oui. Nos configurateurs de produit 3D peuvent être reliés à des systèmes ERP, CRM et de production existants via des interfaces adaptées. Les configurations de produits, les données clients, les prix et les commandes sont ainsi transmis automatiquement. Une demande client arrive alors directement dans votre processus de vente ou de production existant. Les intégrations possibles dépendent des interfaces techniques de vos systèmes.' },
    ],
    finalTitle: 'Parlons de votre configurateur produit',
    finalText: 'Parlez nous de votre produit et nous montrons à quoi un configurateur pourrait ressembler dans votre site.',
    finalCta: 'Parlons de votre configurateur produit',
    finalSecondaryLabel: 'Voir un configurateur en ligne',
    finalSecondaryHref: '/configurator/cabinet',
  },
};

const es: DetailMap = {
  'marketing-automation': {
    metaTitle: 'Automatización de flujos para pymes · semanu.eu',
    metaDescription:
      'Automatice el trabajo repetitivo y conecte sus sistemas mediante integraciones y API. semanu reduce el trabajo manual y los errores para pymes.',
    ogDescription:
      'semanu conecta su software existente y automatiza pasos recurrentes, desde CRM y ERP hasta el procesamiento de documentos.',
    heroHeadline: 'Automatización de flujos que hace colaborar sus sistemas.',
    heroSub:
      'semanu automatiza pasos recurrentes y conecta su software existente, para que su equipo reescriba menos y cometa menos errores. Para pymes sin un gran equipo de IT.',
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
    finalSecondaryHref: '/services/business-software',
  },

  'business-systems': {
    metaTitle: 'Software a medida para pymes · semanu.eu',
    metaDescription:
      'Software a medida cuando los paquetes estándar no encajan: aplicaciones web, portales y herramientas internas con conexiones a sus sistemas.',
    ogDescription:
      'semanu construye software a medida que se ajusta a su forma de trabajar: portales, herramientas internas y aplicaciones web con integraciones y atención al mantenimiento.',
    heroHeadline: 'Software a medida para cuando los paquetes estándar no encajan.',
    heroSub:
      'semanu construye aplicaciones web, portales y herramientas internas que se ajustan a cómo trabaja de verdad su empresa. Para pymes que se atascan con el software estándar.',
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
      'Traducimos su problema en requisitos concretos y construimos primero la parte con más valor. Después ampliamos paso a paso con integraciones a sus sistemas existentes para que los datos sean correctos en un solo lugar. El software sigue vivo, así que lo mantenemos seguro, actual y adaptable.',
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
    outcomesLead: 'Software que se ajusta a cómo trabaja con conexiones y mirada al largo plazo.',
    faqTitle: 'Preguntas frecuentes sobre el software a medida',
    faq: [
      { q: '¿Cuándo el software a medida es más interesante que el estándar?', a: 'Cuando tendría que adaptar su proceso al paquete en lugar de al revés o cuando hacen falta herramientas sueltas y mucho trabajo manual para completar un proceso.' },
      { q: '¿Cuánto cuesta el software a medida?', a: 'Depende del tamaño y la complejidad; no existe un precio fijo. Construimos por fases, empezando por la parte que aporta más valor.' },
      { q: '¿El software a medida puede conectar con sistemas existentes?', a: 'Sí. Las integraciones con su software actual suelen ser una parte central, para que los datos sigan siendo correctos en un solo lugar.' },
      { q: '¿Cómo transcurre el desarrollo de software a medida?', a: 'Empezamos con requisitos claros, construimos primero una versión central funcional y después ampliamos paso a paso con mantenimiento después.' },
    ],
    finalTitle: 'Hablemos de su necesidad de software',
    finalText: 'Cuéntenos dónde se queda corto el software estándar y vemos si lo a medida es el paso correcto.',
    finalCta: 'Hablemos de su necesidad de software',
    finalSecondaryLabel: 'Ver todos los servicios',
    finalSecondaryHref: '/services/business-software',
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
      { q: '¿Qué es un configurador de producto 3D?', a: 'Un configurador de producto 3D es un software interactivo con el que los clientes personalizan un producto en línea. Eligen por ejemplo medidas, materiales, colores y acabados y ven los cambios al instante en una vista tridimensional. Según la implementación, los precios también se calculan automáticamente. Así las empresas simplifican su proceso de venta y reducen el trabajo de elaborar presupuestos a mano.' },
      { q: '¿Cuál es la diferencia entre un visor 3D y un configurador 3D?', a: 'Un visor 3D permite ver un producto desde distintas perspectivas. Un configurador 3D va un paso más allá: los clientes pueden modificar el producto ellos mismos, por ejemplo eligiendo otras medidas, materiales o acabados. El configurador tiene en cuenta las reglas técnicas y puede calcular automáticamente el precio correspondiente. Así una simple visualización de producto se convierte en una herramienta de venta interactiva.' },
      { q: '¿Para qué productos es adecuado un configurador 3D?', a: 'Un configurador de producto 3D es especialmente adecuado para productos con muchas variantes u opciones de personalización. Ejemplos típicos son muebles, ventanas, puertas, escaleras, pérgolas, máquinas y componentes industriales. Un configurador tiene sentido sobre todo cuando hoy sus clientes hacen muchas preguntas o cuando los presupuestos personalizados se elaboran a mano. Un configurador simplifica ese proceso y hace que los productos complejos sean más fáciles de entender.' },
      { q: '¿Cuánto cuesta desarrollar un configurador de producto 3D?', a: 'En semanu el coste se compone de un coste de implementación único y una suscripción mensual fija. El coste de implementación depende entre otros factores de la complejidad del producto, el número de variantes, los modelos 3D necesarios y las integraciones deseadas. En una primera conversación analizamos sus necesidades y le mostramos qué solución tiene sentido para su producto.' },
      { q: '¿Cuánto tiempo lleva desarrollar un configurador 3D?', a: 'El plazo de desarrollo depende de la complejidad de su producto y de las funciones deseadas. Un configurador con pocas variantes se realiza más rápido que una solución con amplias reglas de producto, cálculo automático de precios y conexión al ERP. También influye la disponibilidad de modelos 3D existentes. Tras un primer análisis podemos estimar el esfuerzo y elaborar un calendario realista.' },
      { q: '¿Necesitamos ya modelos 3D de nuestros productos?', a: 'No necesariamente. Si ya existen modelos 3D adecuados, es posible que sirvan de base para el configurador. Si no existen, primero estudiamos cómo crear los datos 3D necesarios. Lo decisivo es la complejidad del producto y las opciones de configuración deseadas. Juntos aclaramos qué datos hacen falta y cuál es la mejor forma de visualizar su producto.' },
      { q: '¿Se puede integrar un configurador 3D en nuestro sitio web o tienda online actual?', a: 'Sí. Un configurador de producto 3D puede integrarse en un sitio web o una tienda online existente, siempre que se cumplan los requisitos técnicos. Sus clientes configuran entonces sus productos directamente en su sitio web sin tener que visitar otra plataforma. Según la integración, las configuraciones también pueden transferirse a su carrito, su CRM o su sistema ERP.' },
      { q: '¿Un configurador 3D puede calcular precios y crear presupuestos automáticamente?', a: 'Sí. Un configurador 3D puede calcular automáticamente el precio de una configuración personalizada a partir de las reglas de precio que usted defina. Tiene en cuenta por ejemplo medidas, materiales, acabados y opciones adicionales. Sobre esa base también puede generar presupuestos, listas de materiales y documentos técnicos. Así reduce los cálculos manuales, evita errores y agiliza la gestión de las solicitudes de sus clientes.' },
      { q: '¿Un configurador 3D puede conectarse con nuestro sistema ERP o CRM?', a: 'Sí. Nuestros configuradores de producto 3D pueden conectarse con sistemas ERP, CRM y de producción existentes mediante interfaces adecuadas. Así las configuraciones de producto, los datos de clientes, los precios y los pedidos se transfieren automáticamente. Una solicitud de un cliente puede entrar directamente en su proceso de venta o de producción. Las integraciones posibles dependen de las interfaces técnicas de sus sistemas.' },
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
