// FAQ for the AI-native business software page (/services/ai-native), one block
// per locale. The German block is Tom's original (meaning kept verbatim, standard German spelling with ß since 2026-10);
// nl/en/fr/es are faithful translations with the same structure and order.
// House style in every language: no em/en dashes, no comma before a
// coordinating conjunction. The literal "semanu" is rendered as the wordmark.

import type { ServicesLocale } from './services';

export type FaqItem = { q: string; a: string };

export type AiNativeFaq = { title: string; items: FaqItem[] };

export const AI_NATIVE_FAQ: Record<ServicesLocale, AiNativeFaq> = {
  nl: {
    title: 'Veelgestelde vragen over bedrijfssoftware op maat',
    items: [
      {
        q: 'Wat is AI-native bedrijfssoftware?',
        a: 'AI-native bedrijfssoftware is software waarin artificiële intelligentie van bij het begin is meegedacht. Ze helpt bedrijven om bedrijfsprocessen te automatiseren, gegevens slim te verwerken en terugkerende taken te verminderen. Bij semanu combineren we die aanpak met een AI-first ontwikkelmethode. Zo ontstaat software op maat die precies is afgestemd op uw bedrijfsprocessen.',
      },
      {
        q: 'Wat kost de ontwikkeling van bedrijfssoftware op maat?',
        a: 'De kosten hangen af van de functionaliteit, de complexiteit en de nodige integraties. Dankzij onze AI-first ontwikkelmethode kunnen we software op maat efficiënter ontwikkelen. U hoeft niet meteen te investeren in een volledig platform: u kunt starten met één functie en die stap voor stap uitbreiden. In een eerste gesprek brengen we uw noden in kaart en maken we een passende offerte.',
      },
      {
        q: 'Hoe lang duurt de ontwikkeling van software op maat?',
        a: 'De ontwikkelduur hangt af van de omvang en de complexiteit van uw project. Eén functie of een overzichtelijke module is doorgaans sneller klaar dan een volledig bedrijfsplatform. Door AI gericht in te zetten in het ontwikkelproces kunnen we veel stappen versnellen. Samen bepalen we de belangrijkste functies en een realistische planning.',
      },
      {
        q: 'Kan de software gekoppeld worden aan ons bestaande ERP of CRM?',
        a: 'Ja. Onze bedrijfssoftware op maat kan gekoppeld worden aan bestaande ERP-, CRM- en productiesystemen, zolang er geschikte interfaces beschikbaar zijn. Zo wordt informatie automatisch uitgewisseld tussen verschillende systemen. Dat vermindert handmatige invoer, voorkomt dubbel werk en zorgt voor efficiëntere bedrijfsprocessen.',
      },
      {
        q: 'Moeten we onze bestaande software vervangen?',
        a: 'Nee. U hoeft uw bestaande systemen niet volledig te vervangen. We kunnen gericht afzonderlijke processen digitaliseren en nieuwe functies ontwikkelen die uw huidige software aanvullen. Bestaande ERP-, CRM- of andere bedrijfssystemen blijft u daarbij gewoon gebruiken. Zo verbetert u uw werking stap voor stap zonder uw volledige IT-infrastructuur om te gooien.',
      },
      {
        q: 'Kunnen we met één functie starten en later uitbreiden?',
        a: 'Ja. Onze bedrijfssoftware is modulair opgebouwd. U kunt bijvoorbeeld starten met een oplossing voor offertes, tijdsregistratie of productieplanning. Groeit uw onderneming of ontstaan er nieuwe noden, dan voegen we extra modules toe. Zo investeert u alleen in de functies die u echt nodig heeft en houdt u de kosten in de hand.',
      },
      {
        q: 'Welke bedrijfsprocessen kunnen we met AI automatiseren?',
        a: 'AI kan heel wat terugkerende taken in uw onderneming ondersteunen of automatiseren. Denk aan het verwerken van klantvragen, het opmaken van offertes, het analyseren van documenten of het voorbereiden van productiegegevens. Welke processen zich zinvol laten automatiseren, hangt af van uw huidige werking. Samen bekijken we waar AI de grootste meerwaarde biedt.',
      },
      {
        q: 'Van wie zijn de ontwikkelde software en de broncode?',
        a: 'Bij semanu wordt u eigenaar van uw bedrijfssoftware op maat, inclusief de broncode. Zo houdt u de controle over uw oplossing en zit u niet vast aan één leverancier. U kunt uw software op lange termijn verder laten ontwikkelen, aanpassen of door andere ontwikkelaars laten onderhouden. Wij kiezen voor transparante samenwerking en flexibiliteit op lange termijn.',
      },
    ],
  },
  en: {
    title: 'Frequently asked questions about custom business software',
    items: [
      {
        q: 'What is AI-native business software?',
        a: 'AI-native business software is software designed around artificial intelligence from the start. It helps companies automate business processes, handle data intelligently and reduce repetitive tasks. At semanu we combine this approach with an AI-first development method. The result is custom software tailored precisely to your business processes.',
      },
      {
        q: 'How much does custom business software cost to develop?',
        a: 'The cost depends on the scope of features, the complexity and the integrations required. Thanks to our AI-first development method we can build custom software more efficiently. You do not have to invest in a complete platform straight away: you can start with a single feature and expand it step by step. In a first conversation we clarify your requirements and prepare a suitable quote.',
      },
      {
        q: 'How long does it take to develop custom software?',
        a: 'The development time depends on the scope and complexity of your project. A single feature or a contained module can usually be delivered faster than a complete business platform. By using AI deliberately in the development process we can speed up many steps. Together we define the most important features and a realistic timeline.',
      },
      {
        q: 'Can the software connect to our existing ERP or CRM?',
        a: 'Yes. Our custom business software can be connected to existing ERP, CRM and production systems, provided suitable interfaces are available. Information is then exchanged automatically between the different systems. This reduces manual data entry, prevents duplicate work and makes business processes more efficient.',
      },
      {
        q: 'Do we have to replace our existing software?',
        a: 'No. You do not have to replace your existing systems entirely. We can digitise specific processes and develop new features that complement your current software. Existing ERP, CRM or other business systems stay in use. That way you improve your operations step by step without overhauling your entire IT infrastructure.',
      },
      {
        q: 'Can we start with a single feature and expand later?',
        a: 'Yes. Our business software is built in modules. You can start with a solution for quotes, time tracking or production planning, for example. As your company grows or new needs arise, further modules can be added. That way you only invest in the features you actually need and keep costs under control.',
      },
      {
        q: 'Which business processes can be automated with AI?',
        a: 'AI can support or automate many repetitive tasks in your company. Examples include handling customer enquiries, drawing up quotes, analysing documents or preparing production data. Which processes are worth automating depends on how you work today. Together we work out where AI adds the most value.',
      },
      {
        q: 'Who owns the software and the source code?',
        a: 'At semanu you become the owner of your custom business software, including the source code. You stay in control of your solution and are not permanently tied to a single supplier. You can continue to develop and adapt your software over the long term or have other developers maintain it. We believe in transparent collaboration and long term flexibility.',
      },
    ],
  },
  de: {
    title: 'Häufige Fragen zu maßgeschneiderter Unternehmenssoftware',
    items: [
      {
        q: 'Was ist AI-native Unternehmenssoftware?',
        a: 'AI-native Unternehmenssoftware ist eine Software, bei der künstliche Intelligenz von Anfang an mitgedacht wird. Sie unterstützt Unternehmen dabei, Geschäftsprozesse zu automatisieren, Daten intelligent zu verarbeiten und wiederkehrende Aufgaben zu reduzieren. Bei semanu kombinieren wir diesen Ansatz mit einer AI-first Entwicklungsmethode. So entsteht maßgeschneiderte Software, die genau auf Ihre Geschäftsprozesse abgestimmt ist.',
      },
      {
        q: 'Was kostet die Entwicklung einer individuellen Unternehmenssoftware?',
        a: 'Die Kosten hängen vom Funktionsumfang, der Komplexität und den benötigten Integrationen ab. Dank unserer AI-first Entwicklungsmethode können wir maßgeschneiderte Software effizienter entwickeln. Sie müssen nicht direkt in eine komplette Plattform investieren, sondern können mit einer einzelnen Funktion starten und diese schrittweise erweitern. In einem ersten Gespräch klären wir Ihre Anforderungen und erstellen eine passende Offerte.',
      },
      {
        q: 'Wie lange dauert die Entwicklung einer individuellen Software?',
        a: 'Die Entwicklungsdauer hängt vom Umfang und der Komplexität Ihres Projekts ab. Eine einzelne Funktion oder ein überschaubares Modul lässt sich in der Regel schneller umsetzen als eine vollständige Unternehmensplattform. Durch den gezielten Einsatz von KI im Entwicklungsprozess können wir viele Arbeitsschritte beschleunigen. Gemeinsam definieren wir die wichtigsten Funktionen und einen realistischen Zeitplan.',
      },
      {
        q: 'Kann die Software mit unserem bestehenden ERP oder CRM verbunden werden?',
        a: 'Ja. Unsere maßgeschneiderte Unternehmenssoftware kann mit bestehenden ERP-, CRM- und Produktionssystemen verbunden werden, sofern entsprechende Schnittstellen verfügbar sind. Dadurch können Informationen automatisch zwischen verschiedenen Systemen ausgetauscht werden. Das reduziert manuelle Dateneingaben, verhindert doppelte Arbeit und sorgt für effizientere Geschäftsprozesse.',
      },
      {
        q: 'Müssen wir unsere bestehende Software ersetzen?',
        a: 'Nein. Sie müssen Ihre bestehenden Systeme nicht vollständig ersetzen. Wir können gezielt einzelne Prozesse digitalisieren und neue Funktionen entwickeln, die Ihre aktuelle Software ergänzen. Bestehende ERP-, CRM- oder andere Unternehmenssysteme können dabei weiterhin genutzt werden. So verbessern Sie Ihre Abläufe schrittweise, ohne Ihre gesamte IT-Infrastruktur umstellen zu müssen.',
      },
      {
        q: 'Können wir mit einer einzelnen Funktion starten und später erweitern?',
        a: 'Ja. Unsere Unternehmenssoftware ist modular aufgebaut. Sie können beispielsweise mit einer Lösung für die Angebotserstellung, Zeiterfassung oder Produktionsplanung beginnen. Wenn Ihr Unternehmen wächst oder neue Anforderungen entstehen, lassen sich weitere Module ergänzen. So investieren Sie nur in die Funktionen, die Sie tatsächlich benötigen und behalten die Kosten unter Kontrolle.',
      },
      {
        q: 'Welche Geschäftsprozesse lassen sich mit KI automatisieren?',
        a: 'KI kann zahlreiche wiederkehrende Aufgaben in Ihrem Unternehmen unterstützen oder automatisieren. Dazu gehören beispielsweise die Verarbeitung von Kundenanfragen, die Erstellung von Angeboten, die Auswertung von Dokumenten oder die Aufbereitung von Produktionsdaten. Welche Prozesse sich sinnvoll automatisieren lassen, hängt von Ihren bestehenden Abläufen ab. Wir analysieren gemeinsam, wo KI den größten Mehrwert bietet.',
      },
      {
        q: 'Wem gehört die entwickelte Software und der Quellcode?',
        a: 'Bei semanu werden Sie Eigentümer Ihrer individuell entwickelten Unternehmenssoftware, einschließlich des Quellcodes. Dadurch behalten Sie die Kontrolle über Ihre Lösung und sind nicht dauerhaft an einen einzelnen Anbieter gebunden. Sie können Ihre Software langfristig weiterentwickeln, anpassen oder durch andere Entwickler betreuen lassen. Wir setzen auf transparente Zusammenarbeit und langfristige Flexibilität.',
      },
    ],
  },
  fr: {
    title: 'Questions fréquentes sur le logiciel d’entreprise sur mesure',
    items: [
      {
        q: 'Un logiciel d’entreprise AI-native, c’est quoi?',
        a: 'Un logiciel d’entreprise AI-native est conçu dès le départ autour de l’intelligence artificielle. Il aide les entreprises à automatiser leurs processus, à traiter les données de manière intelligente et à réduire les tâches répétitives. Chez semanu, nous combinons cette approche avec une méthode de développement AI-first. Vous obtenez ainsi un logiciel sur mesure parfaitement adapté à vos processus métier.',
      },
      {
        q: 'Combien coûte le développement d’un logiciel d’entreprise sur mesure?',
        a: 'Le coût dépend des fonctionnalités, de la complexité et des intégrations nécessaires. Grâce à notre méthode de développement AI-first, nous développons des logiciels sur mesure plus efficacement. Vous n’êtes pas obligé d’investir d’emblée dans une plateforme complète. Vous pouvez commencer par une seule fonction et l’étendre progressivement. Lors d’un premier entretien, nous clarifions vos besoins et établissons un devis adapté.',
      },
      {
        q: 'Quelle est la durée de développement d’un logiciel sur mesure?',
        a: 'La durée de développement dépend de l’ampleur et de la complexité de votre projet. Une fonction isolée ou un module de taille limitée se réalise généralement plus vite qu’une plateforme d’entreprise complète. En utilisant l’AI de manière ciblée dans le processus de développement, nous accélérons de nombreuses étapes. Ensemble, nous définissons les fonctions prioritaires et un calendrier réaliste.',
      },
      {
        q: 'Connecter le logiciel à notre ERP ou CRM existant, c’est possible?',
        a: 'Oui. Notre logiciel d’entreprise sur mesure peut être relié à des systèmes ERP, CRM et de production existants, pour autant que des interfaces adaptées soient disponibles. Les informations s’échangent alors automatiquement entre les différents systèmes. Cela réduit la saisie manuelle, évite le travail en double et rend vos processus plus efficaces.',
      },
      {
        q: 'Nous devons remplacer notre logiciel actuel?',
        a: 'Non. Vous ne devez pas remplacer entièrement vos systèmes existants. Nous pouvons digitaliser des processus précis et développer de nouvelles fonctions qui complètent votre logiciel actuel. Vos systèmes ERP, CRM ou autres logiciels d’entreprise restent en service. Vous améliorez ainsi votre fonctionnement pas à pas sans devoir revoir toute votre infrastructure informatique.',
      },
      {
        q: 'Nous pouvons commencer par une seule fonction et étendre ensuite?',
        a: 'Oui. Notre logiciel d’entreprise est modulaire. Vous pouvez par exemple commencer par une solution pour les devis, l’enregistrement du temps de travail ou la planification de la production. Quand votre entreprise grandit ou que de nouveaux besoins apparaissent, d’autres modules viennent s’ajouter. Vous n’investissez ainsi que dans les fonctions dont vous avez réellement besoin et vous gardez les coûts sous contrôle.',
      },
      {
        q: 'Quels processus métier automatiser avec l’AI?',
        a: 'L’AI peut soutenir ou automatiser de nombreuses tâches répétitives dans votre entreprise. Pensez au traitement des demandes clients, à l’établissement de devis, à l’analyse de documents ou à la préparation de données de production. Les processus qu’il est judicieux d’automatiser dépendent de votre fonctionnement actuel. Ensemble, nous analysons où l’AI apporte la plus grande valeur ajoutée.',
      },
      {
        q: 'À qui appartiennent le logiciel développé et le code source?',
        a: 'Chez semanu, vous devenez propriétaire de votre logiciel d’entreprise sur mesure, code source compris. Vous gardez ainsi le contrôle de votre solution et vous n’êtes pas lié durablement à un seul fournisseur. Vous pouvez faire évoluer votre logiciel à long terme, l’adapter ou en confier la maintenance à d’autres développeurs. Nous misons sur une collaboration transparente et une flexibilité à long terme.',
      },
    ],
  },
  es: {
    title: 'Preguntas frecuentes sobre software empresarial a medida',
    items: [
      {
        q: '¿Qué es el software empresarial AI-native?',
        a: 'El software empresarial AI-native es software concebido desde el principio en torno a la inteligencia artificial. Ayuda a las empresas a automatizar procesos de negocio, tratar los datos de forma inteligente y reducir las tareas repetitivas. En semanu combinamos este enfoque con un método de desarrollo AI-first. Así nace un software a medida, ajustado exactamente a sus procesos de negocio.',
      },
      {
        q: '¿Cuánto cuesta desarrollar software empresarial a medida?',
        a: 'El coste depende de las funcionalidades, la complejidad y las integraciones necesarias. Gracias a nuestro método de desarrollo AI-first podemos desarrollar software a medida de forma más eficiente. No tiene que invertir de entrada en una plataforma completa: puede empezar con una sola función y ampliarla paso a paso. En una primera conversación aclaramos sus necesidades y preparamos un presupuesto adecuado.',
      },
      {
        q: '¿Cuánto tiempo lleva desarrollar software a medida?',
        a: 'El plazo de desarrollo depende del alcance y la complejidad de su proyecto. Una sola función o un módulo acotado suele realizarse más rápido que una plataforma empresarial completa. Gracias al uso específico de la AI en el proceso de desarrollo podemos acelerar muchos pasos. Juntos definimos las funciones más importantes y un calendario realista.',
      },
      {
        q: '¿Se puede conectar el software con nuestro ERP o CRM actual?',
        a: 'Sí. Nuestro software empresarial a medida puede conectarse con sistemas ERP, CRM y de producción existentes, siempre que haya interfaces adecuadas disponibles. Así la información se intercambia automáticamente entre los distintos sistemas. Esto reduce la introducción manual de datos, evita el trabajo duplicado y hace que los procesos de negocio sean más eficientes.',
      },
      {
        q: '¿Tenemos que sustituir nuestro software actual?',
        a: 'No. No tiene que sustituir por completo sus sistemas actuales. Podemos digitalizar procesos concretos y desarrollar nuevas funciones que complementen su software actual. Puede seguir utilizando sus sistemas ERP, CRM u otros sistemas empresariales. Así mejora sus procesos paso a paso sin tener que cambiar toda su infraestructura informática.',
      },
      {
        q: '¿Podemos empezar con una sola función y ampliar más adelante?',
        a: 'Sí. Nuestro software empresarial tiene una estructura modular. Puede empezar por ejemplo con una solución para la elaboración de presupuestos, el registro de horas o la planificación de la producción. Cuando su empresa crezca o surjan nuevas necesidades, se pueden añadir más módulos. Así solo invierte en las funciones que realmente necesita y mantiene los costes bajo control.',
      },
      {
        q: '¿Qué procesos de negocio se pueden automatizar con AI?',
        a: 'La AI puede apoyar o automatizar numerosas tareas repetitivas en su empresa. Piense en el tratamiento de consultas de clientes, la elaboración de presupuestos, el análisis de documentos o la preparación de datos de producción. Qué procesos conviene automatizar depende de su forma de trabajar actual. Juntos analizamos dónde aporta la AI el mayor valor.',
      },
      {
        q: '¿De quién son el software desarrollado y el código fuente?',
        a: 'En semanu usted se convierte en propietario de su software empresarial a medida, incluido el código fuente. Así mantiene el control sobre su solución y no queda ligado de forma permanente a un único proveedor. Puede seguir desarrollando su software a largo plazo, adaptarlo o encargar su mantenimiento a otros desarrolladores. Apostamos por una colaboración transparente y por la flexibilidad a largo plazo.',
      },
    ],
  },
};

/** FAQ for the AI-native page in the given locale, falling back to Dutch. */
export function getAiNativeFaq(locale: string): AiNativeFaq {
  return AI_NATIVE_FAQ[locale as ServicesLocale] ?? AI_NATIVE_FAQ.nl;
}
