// FAQ page content (/faq), one block per locale, grouped by topic:
//   1. 3D configurators    -> reuses the FAQ of /services/3d-configurators (serviceDetail.ts)
//   2. Business software   -> reuses the FAQ of /services/business-software (aiNativeFaq.ts)
//                             plus two workflow automation questions (serviceDetail.ts)
//   3. Working with semanu -> general questions, only with facts already stated on the site
//                             (contact page, about page, llms.txt, service FAQs)
// Reusing the service FAQs keeps the answers in one place; edit them there.
//
// House style in every language: no em/en dashes, no comma before a coordinating
// conjunction, standard German spelling (ß), no prices (only "on request").
// All five locales keep the same groups in the same order with the same counts.

import { AI_NATIVE_FAQ } from './aiNativeFaq';
import { getServiceDetail } from './serviceDetail';

export type FaqLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

export type FaqQA = { q: string; a: string };

export type FaqService = {
  id: string;
  /** oklch accent string used for the dot next to the group heading. */
  accent: string;
  name: string;
  faqs: FaqQA[];
};

export type FaqUi = {
  brandTag: string;
  heroH1a: string;
  heroH1b: string;
  heroSub: string;
  askMore: string;
  ctaStart: string;
  searchPlaceholder: string;
  searchEmpty: string;
  searchClear: string;
};

export const FAQ_UI: Record<FaqLocale, FaqUi> = {
  nl: {
    brandTag: 'FAQ',
    heroH1a: 'Twee diensten.',
    heroH1b: 'Alle antwoorden.',
    heroSub:
      'Vragen over 3D-configuratoren, bedrijfssoftware op maat en samenwerken met semanu, op één pagina. Zoek meteen of blader per thema.',
    askMore: 'Nog een vraag? Schrijf ons',
    ctaStart: 'Nu starten',
    searchPlaceholder: 'Zoek in de vragen…',
    searchEmpty: 'Geen resultaten voor',
    searchClear: 'Zoekopdracht wissen',
  },
  en: {
    brandTag: 'FAQ',
    heroH1a: 'Two services.',
    heroH1b: 'Every answer.',
    heroSub:
      'Questions about 3D configurators, custom business software and working with semanu, on one page. Search right away or browse by topic.',
    askMore: 'Another question? Get in touch',
    ctaStart: 'Get started',
    searchPlaceholder: 'Search the questions…',
    searchEmpty: 'No results for',
    searchClear: 'Clear search',
  },
  de: {
    brandTag: 'FAQ',
    heroH1a: 'Zwei Leistungen.',
    heroH1b: 'Alle Antworten.',
    heroSub:
      'Fragen zu 3D-Konfiguratoren, maßgeschneiderter Unternehmenssoftware und zur Zusammenarbeit mit semanu auf einer Seite. Suchen Sie direkt oder blättern Sie nach Thema.',
    askMore: 'Noch eine Frage? Schreiben Sie uns',
    ctaStart: 'Jetzt starten',
    searchPlaceholder: 'Fragen durchsuchen…',
    searchEmpty: 'Keine Treffer für',
    searchClear: 'Suche zurücksetzen',
  },
  fr: {
    brandTag: 'FAQ',
    heroH1a: 'Deux services.',
    heroH1b: 'Toutes les réponses.',
    heroSub:
      'Les questions sur les configurateurs 3D, les logiciels d’entreprise sur mesure et la collaboration avec semanu, sur une seule page. Cherchez directement ou parcourez par thème.',
    askMore: 'Une autre question ? On vous répond',
    ctaStart: 'Commencer',
    searchPlaceholder: 'Rechercher dans les questions…',
    searchEmpty: 'Aucun résultat pour',
    searchClear: 'Réinitialiser la recherche',
  },
  es: {
    brandTag: 'FAQ',
    heroH1a: 'Dos servicios.',
    heroH1b: 'Todas las respuestas.',
    heroSub:
      'Preguntas sobre configuradores 3D, software empresarial a medida y cómo es trabajar con semanu, en una sola página. Busque directamente o explore por tema.',
    askMore: '¿Otra pregunta? Escríbanos',
    ctaStart: 'Empezar ahora',
    searchPlaceholder: 'Buscar en las preguntas…',
    searchEmpty: 'Sin resultados para',
    searchClear: 'Borrar búsqueda',
  },
};

const GROUP_NAMES: Record<FaqLocale, { configurators: string; software: string; working: string }> = {
  nl: { configurators: '3D-configuratoren', software: 'Bedrijfssoftware', working: 'Samenwerken met semanu' },
  en: { configurators: '3D configurators', software: 'Business software', working: 'Working with semanu' },
  de: { configurators: '3D-Konfiguratoren', software: 'Unternehmenssoftware', working: 'Zusammenarbeit mit semanu' },
  fr: { configurators: 'Configurateurs 3D', software: 'Logiciel d’entreprise', working: 'Travailler avec semanu' },
  es: { configurators: 'Configuradores 3D', software: 'Software empresarial', working: 'Trabajar con semanu' },
};

// General questions about working with semanu. Every fact here is already stated
// elsewhere on the site: reply within one working day and no obligation (contact
// page), written quote in EUR excl. VAT and prices on request (llms.txt, service
// FAQs), direct contact with the founder (about page), source code plus usage right
// with IP staying at semanu (business software FAQ), one-off implementation plus a monthly
// fee for SLA, hosting and maintenance (3D configurator and business software FAQ), EU hosting at Hetzner in Germany or Finland,
// five languages and ongoing support (llms.txt, contact page, service process steps).
const WORKING_WITH_US: Record<FaqLocale, FaqQA[]> = {
  nl: [
    {
      q: 'Hoe start een project met semanu?',
      a: 'U neemt contact op via het contactformulier, per e-mail of telefonisch. Meestal krijgt u binnen één werkdag een persoonlijk antwoord, vrijblijvend. In een eerste gesprek brengen we uw noden in kaart. Daarna ontvangt u een schriftelijke offerte.',
    },
    {
      q: 'Wat kost een project?',
      a: 'Prijzen zijn op aanvraag. U betaalt een eenmalige implementatie en daarna een maandbedrag voor SLA, hosting en onderhoud. Elk project krijgt een schriftelijke offerte op basis van de scope die we samen afbakenen. Alle bedragen zijn in euro, exclusief btw.',
    },
    {
      q: 'Met wie werk ik samen?',
      a: 'semanu wordt geleid door oprichter Tom de Vree en is gevestigd in Antwerpen. U praat rechtstreeks met de persoon die uw oplossing bouwt en onderhoudt, niet met een anoniem ticketsysteem. We werken met kmo’s en fabrikanten in heel Europa.',
    },
    {
      q: 'Wat mag ik met de broncode doen?',
      a: 'U krijgt de volledige broncode en een blijvend gebruiksrecht voor uw eigen bedrijf. U mag de software laten hosten, onderhouden en aanpassen, ook door een andere ontwikkelaar. U kunt dus altijd zonder ons verder. De intellectuele eigendom blijft bij semanu: de software mag niet verkocht, in licentie gegeven of voor andere bedrijven gekopieerd worden.',
    },
    {
      q: 'Waar worden de oplossingen gehost?',
      a: 'In de EU, op servers van Hetzner in Duitsland of Finland. Uw gegevens blijven zo binnen Europa.',
    },
    {
      q: 'Zorgen jullie ook voor onderhoud en ondersteuning na de lancering?',
      a: 'Ja. semanu verzorgt ontwerp, bouw, hosting en de verdere ondersteuning. Software houden we veilig, actueel en aanpasbaar. Bij een 3D-configurator houden we varianten en prijzen actueel wanneer uw aanbod wijzigt.',
    },
    {
      q: 'In welke talen kunnen we samenwerken?',
      a: 'U kunt ons aanspreken in het Nederlands, Engels, Duits, Frans of Spaans.',
    },
  ],
  en: [
    {
      q: 'How does a project with semanu start?',
      a: 'You get in touch through the contact form, by email or by phone. You usually get a personal reply within one working day, without obligation. In a first conversation we map out your needs. After that you receive a written quote.',
    },
    {
      q: 'What does a project cost?',
      a: 'Prices are on request. You pay a one-off implementation fee and then a monthly fee for SLA, hosting and maintenance. Every project gets a written quote based on the scope we define together. All amounts are in euro, excluding VAT.',
    },
    {
      q: 'Who will I be working with?',
      a: 'semanu is led by founder Tom de Vree and is based in Antwerp. You talk directly to the person who builds and maintains your solution, not to an anonymous ticket system. We work with SMEs and manufacturers across Europe.',
    },
    {
      q: 'What may I do with the source code?',
      a: 'You receive the full source code and a perpetual right to use it for your own company. You may have the software hosted, maintained and modified, also by another developer. So you can always continue without us. The intellectual property stays with semanu: the software may not be sold, licensed or copied for other companies.',
    },
    {
      q: 'Where are the solutions hosted?',
      a: 'In the EU, on Hetzner servers in Germany or Finland. That way your data stays within Europe.',
    },
    {
      q: 'Do you also take care of maintenance and support after launch?',
      a: 'Yes. semanu handles design, build, hosting and ongoing support. We keep software secure, up to date and adaptable. For a 3D configurator we keep variants and prices current when your range changes.',
    },
    {
      q: 'In which languages can we work together?',
      a: 'You can talk to us in Dutch, English, German, French or Spanish.',
    },
  ],
  de: [
    {
      q: 'Wie beginnt ein Projekt mit semanu?',
      a: 'Sie nehmen über das Kontaktformular, per E-Mail oder telefonisch Kontakt auf. In der Regel erhalten Sie innerhalb eines Werktags eine persönliche Antwort, unverbindlich. In einem ersten Gespräch klären wir Ihre Anforderungen. Danach erhalten Sie ein schriftliches Angebot.',
    },
    {
      q: 'Was kostet ein Projekt?',
      a: 'Preise auf Anfrage. Sie zahlen eine einmalige Implementierung und danach einen Monatsbetrag für SLA, Hosting und Wartung. Jedes Projekt erhält ein schriftliches Angebot auf Basis des Umfangs, den wir gemeinsam festlegen. Alle Beträge verstehen sich in Euro, zuzüglich MwSt.',
    },
    {
      q: 'Mit wem arbeite ich zusammen?',
      a: 'semanu wird von Gründer Tom de Vree geführt und hat seinen Sitz in Antwerpen. Sie sprechen direkt mit der Person, die Ihre Lösung entwickelt und betreut, nicht mit einem anonymen Ticketsystem. Wir arbeiten mit KMU und Herstellern in ganz Europa.',
    },
    {
      q: 'Was darf ich mit dem Quellcode tun?',
      a: 'Sie erhalten den vollständigen Quellcode und ein unbefristetes Nutzungsrecht für Ihr eigenes Unternehmen. Sie dürfen die Software hosten, warten und anpassen lassen, auch durch einen anderen Entwickler. Sie können also jederzeit ohne uns weitermachen. Das geistige Eigentum bleibt bei semanu: Die Software darf nicht verkauft, lizenziert oder für andere Unternehmen kopiert werden.',
    },
    {
      q: 'Wo werden die Lösungen gehostet?',
      a: 'In der EU, auf Servern von Hetzner in Deutschland oder Finnland. So bleiben Ihre Daten in Europa.',
    },
    {
      q: 'Übernehmen Sie auch Wartung und Support nach dem Start?',
      a: 'Ja. semanu übernimmt Design, Entwicklung, Hosting und die laufende Betreuung. Software halten wir sicher, aktuell und anpassbar. Bei einem 3D-Konfigurator halten wir Varianten und Preise aktuell, wenn sich Ihr Sortiment ändert.',
    },
    {
      q: 'In welchen Sprachen können wir zusammenarbeiten?',
      a: 'Sie können uns auf Niederländisch, Englisch, Deutsch, Französisch oder Spanisch ansprechen.',
    },
  ],
  fr: [
    {
      q: 'Comment démarre un projet avec semanu ?',
      a: 'Vous prenez contact via le formulaire, par e-mail ou par téléphone. Vous recevez en général une réponse personnelle dans un délai d’un jour ouvrable, sans engagement. Lors d’un premier entretien, nous clarifions vos besoins. Vous recevez ensuite un devis écrit.',
    },
    {
      q: 'Combien coûte un projet ?',
      a: 'Les prix sont sur demande. Vous payez une implémentation unique puis un montant mensuel pour le SLA, l’hébergement et la maintenance. Chaque projet fait l’objet d’un devis écrit basé sur le périmètre que nous définissons ensemble. Tous les montants sont en euros, hors TVA.',
    },
    {
      q: 'Avec qui vais-je travailler ?',
      a: 'semanu est dirigé par son fondateur Tom de Vree et est basé à Anvers. Vous parlez directement à la personne qui construit et entretient votre solution, pas à un système de tickets anonyme. Nous travaillons avec des PME et des fabricants dans toute l’Europe.',
    },
    {
      q: 'Que puis-je faire du code source ?',
      a: 'Vous recevez le code source complet et un droit d’utilisation permanent pour votre propre entreprise. Vous pouvez faire héberger, maintenir et modifier le logiciel, y compris par un autre développeur. Vous pouvez donc toujours continuer sans nous. La propriété intellectuelle reste chez semanu : le logiciel ne peut être ni vendu, ni concédé sous licence, ni copié pour d’autres entreprises.',
    },
    {
      q: 'Où les solutions sont-elles hébergées ?',
      a: 'Dans l’UE, sur des serveurs Hetzner en Allemagne ou en Finlande. Vos données restent ainsi en Europe.',
    },
    {
      q: 'Assurez-vous aussi la maintenance et le support après le lancement ?',
      a: 'Oui. semanu prend en charge le design, le développement, l’hébergement et le suivi. Nous gardons les logiciels sûrs, à jour et adaptables. Pour un configurateur 3D, nous tenons les variantes et les prix à jour quand votre offre change.',
    },
    {
      q: 'Dans quelles langues pouvons-nous travailler ensemble ?',
      a: 'Vous pouvez nous contacter en néerlandais, anglais, allemand, français ou espagnol.',
    },
  ],
  es: [
    {
      q: '¿Cómo empieza un proyecto con semanu?',
      a: 'Usted se pone en contacto a través del formulario, por correo electrónico o por teléfono. Normalmente recibe una respuesta personal en un día laborable, sin compromiso. En una primera conversación aclaramos sus necesidades. Después recibe un presupuesto por escrito.',
    },
    {
      q: '¿Cuánto cuesta un proyecto?',
      a: 'Los precios son bajo petición. Paga una implementación única y después una cuota mensual por el SLA, el alojamiento y el mantenimiento. Cada proyecto recibe un presupuesto por escrito según el alcance que definimos juntos. Todos los importes son en euros, sin IVA.',
    },
    {
      q: '¿Con quién voy a trabajar?',
      a: 'semanu está dirigida por su fundador Tom de Vree y tiene su sede en Amberes. Usted habla directamente con la persona que desarrolla y mantiene su solución, no con un sistema de tickets anónimo. Trabajamos con pymes y fabricantes de toda Europa.',
    },
    {
      q: '¿Qué puedo hacer con el código fuente?',
      a: 'Recibe el código fuente completo y un derecho de uso permanente para su propia empresa. Puede encargar el alojamiento, el mantenimiento y la adaptación del software, también a otro desarrollador. Así siempre puede continuar sin nosotros. La propiedad intelectual sigue siendo de semanu: el software no puede venderse, licenciarse ni copiarse para otras empresas.',
    },
    {
      q: '¿Dónde se alojan las soluciones?',
      a: 'En la UE, en servidores de Hetzner en Alemania o Finlandia. Así sus datos se quedan en Europa.',
    },
    {
      q: '¿También se encargan del mantenimiento y el soporte tras el lanzamiento?',
      a: 'Sí. semanu se ocupa del diseño, el desarrollo, el hosting y el soporte continuo. Mantenemos el software seguro, actualizado y adaptable. En un configurador 3D mantenemos al día las variantes y los precios cuando cambia su oferta.',
    },
    {
      q: '¿En qué idiomas podemos trabajar juntos?',
      a: 'Puede dirigirse a nosotros en neerlandés, inglés, alemán, francés o español.',
    },
  ],
};

// Workflow automation is part of business software; two of its questions add to the
// business software FAQ without repeating it (0: what is it, 3: when is AI needed).
const WORKFLOW_QUESTIONS = [0, 3];

function buildFaq(loc: FaqLocale): FaqService[] {
  const names = GROUP_NAMES[loc];
  const configurator = getServiceDetail(loc, '3d-configurators');
  const workflow = getServiceDetail(loc, 'marketing-automation');
  return [
    {
      id: '3d-configurators',
      accent: 'oklch(0.85 0.10 178)',
      name: names.configurators,
      faqs: configurator?.faq ?? [],
    },
    {
      id: 'business-software',
      accent: 'oklch(0.84 0.10 212)',
      name: names.software,
      faqs: [
        ...AI_NATIVE_FAQ[loc].items,
        ...WORKFLOW_QUESTIONS.map((i) => workflow?.faq[i]).filter((f): f is FaqQA => Boolean(f)),
      ],
    },
    {
      id: 'working-with-semanu',
      accent: 'oklch(0.84 0.09 258)',
      name: names.working,
      faqs: WORKING_WITH_US[loc],
    },
  ];
}

export const FAQ_SERVICES: Record<FaqLocale, FaqService[]> = {
  nl: buildFaq('nl'),
  en: buildFaq('en'),
  de: buildFaq('de'),
  fr: buildFaq('fr'),
  es: buildFaq('es'),
};
