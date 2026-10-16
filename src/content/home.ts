// Long-form homepage content as a typed module per locale (like so-funktioniert
// and the landing pages), so the copy stays readable and the message files stay
// lean. Honest copy only: no invented metrics, rankings or quotes. The homepage
// tells the broad "one digital partner" story; website-only detail (the abo terms,
// the SEO breakdown) lives on the Websites service page and the pricing page.

export type HomeLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

type TitleText = { title: string; text: string };
type Faq = { q: string; a: string };

export type HomeContent = {
  pillars: {
    eyebrow: string;
    servicesWord: string;
    partner: string;
    center: string;
    intro: string;
    belowServices: string;
  };
  problem: { eyebrow: string; heading: string; intro: string; cards: TitleText[] };
  solution: {
    eyebrow: string;
    heading: string;
    intro: string;
    points: TitleText[];
    ctaLead: string;
    cta: string;
  };
  compare: {
    eyebrow: string;
    heading: string;
    klassiekLabel: string;
    semanuLabel: string;
    klassiek: string[];
    semanu: string[];
  };
  model: {
    eyebrow: string;
    heading: string;
    intro: string;
    includedTitle: string;
    included: string[];
    excludedTitle: string;
    excluded: string[];
    cta: string;
  };
  process: { eyebrow: string; heading: string; intro: string; steps: TitleText[]; cta: string };
  faq: { eyebrow: string; heading: string; items: Faq[] };
};

export const HOME: Record<HomeLocale, HomeContent> = {
  de: {
    pillars: {
      eyebrow: 'Was wir tun',
      servicesWord: 'Unsere digitalen Services',
      partner: 'damit Ihr Unternehmen wächst',
      center: 'Ihr Unternehmen',
      intro:
        'semanu ist Ihr digitaler Partner für Schweizer KMU. Von Website und Email Marketing über CRM, Automatisierungen und Dashboards bis zu Kundenportalen und AI Assistenten bringen wir die passenden Lösungen in eine klare Aufstellung.',
      belowServices:
        'Alles, was Ihr Unternehmen braucht, um effizienter zu arbeiten, verbunden durch einen Partner.',
    },
    problem: {
      eyebrow: 'Die Herausforderung',
      heading: 'Die Digitalisierung geht schnell. Die meisten KMU haben keine Zeit mitzuhalten.',
      intro:
        'Neue Tools, AI Lösungen, Automatisierungen und CRM Systeme entstehen laufend. Den meisten KMU fehlt die eigene IT, um mitzuhalten, sodass die digitale Aufstellung zum Flickwerk wird: Tools sprechen nicht miteinander und manuelle Arbeit nimmt zu. Genau dort setzt semanu an.',
      cards: [
        {
          title: 'Keine interne IT Abteilung',
          text: 'Die meisten KMU haben kein eigenes Team für Websites, Tools, Integrationen, Sicherheit, Updates und neue digitale Möglichkeiten.',
        },
        {
          title: 'Zu viele einzelne Anbieter',
          text: 'Einer baut die Website, einer macht das Marketing, ein Tool übernimmt Buchungen und jemand anderes kümmert sich um das CRM. Das schafft zusätzliche Koordination und unklare Verantwortung.',
        },
        {
          title: 'Technologie ändert sich zu schnell',
          text: 'AI, Automatisierung und digitale Tools entwickeln sich rasch. Es ist schwer zu wissen, was Ihr Unternehmen wirklich braucht und was warten kann.',
        },
        {
          title: 'Tools arbeiten nicht zusammen',
          text: 'Website, Formulare, CRM, Email Marketing, Dashboards und Kundenkommunikation laufen oft getrennt, was Doppelarbeit und verpasste Chancen verursacht.',
        },
        {
          title: 'Keine digitale Strategie',
          text: 'Ohne langfristigen Plan werden Tools einzeln gewählt und Wachstumschancen bleiben ungenutzt.',
        },
      ],
    },
    solution: {
      eyebrow: 'Die Lösung',
      heading: 'Ein Partner für Ihre gesamte digitale Aufstellung.',
      intro:
        'semanu wählt, baut, verbindet und betreut die Lösungen, die Ihr Unternehmen wirklich braucht: Website, Marketing, CRM, Automatisierungen, Dashboards, Kundenportale und AI, als eine verbundene Aufstellung statt einzelner Projekte.',
      points: [
        {
          title: 'Ein Ansprechpartner',
          text: 'Sie wissen immer, wen Sie anrufen. Kein Jagen nach verschiedenen Anbietern, kein technisches Hin und Her, keine Unklarheit über Zuständigkeiten.',
        },
        {
          title: 'Auf Ihr Unternehmen zugeschnitten',
          text: 'Wir drängen keine Tools um der Tools willen auf. Wir schauen, wie Ihr Betrieb arbeitet und bauen Lösungen, die Ihre echten Abläufe unterstützen.',
        },
        {
          title: 'Eine verbundene Aufstellung',
          text: 'Website, CRM, Formulare, Automatisierungen, Dashboards und Portale arbeiten als ein Ökosystem zusammen statt als einzelne Teile.',
        },
        {
          title: 'Planbar und laufend',
          text: 'Ein klares Abo deckt Support, Wartung und laufende Verbesserung ab. Keine versteckten Kosten, keine Überraschungsrechnungen. Wir wachsen mit Ihrem Unternehmen mit.',
        },
      ],
      ctaLead: 'Bereit, Ihre digitale Aufstellung zu vereinfachen?',
      cta: 'Lassen Sie uns sprechen',
    },
    compare: {
      eyebrow: 'Warum semanu',
      heading: '1 Ansprechpartner für Ihr gesamtes digitales Ökosystem.',
      klassiekLabel: 'Klassischer Ansatz',
      semanuLabel: 'Mit semanu',
      klassiek: ['Mehrere Anbieter', 'Tools die nicht miteinander sprechen', 'Unklare Verantwortung', 'Wechselnde Kosten'],
      semanu: ['1 fester Ansprechpartner', 'Verbundene Systeme', 'Alles inbegriffen', 'Fester Monatspreis'],
    },
    model: {
      eyebrow: 'Das Abo',
      heading: 'Ein klares Abo für laufende digitale Unterstützung.',
      intro:
        'Digitalisierung endet nicht mit dem Launch eines Projekts. Tools brauchen Updates, Prozesse verändern sich, neue Ideen entstehen und Ihr Unternehmen entwickelt sich weiter. Mit semanu arbeiten Sie in einem klaren Abo, das Support, Wartung und laufende Verbesserung Ihrer digitalen Aufstellung umfasst. Sie wissen, was enthalten ist, was möglich ist und was es kostet. Keine versteckten Kosten. Keine technischen Überraschungen. Kein Hin und Her zwischen verschiedenen Anbietern. Nur ein Partner, der Ihre digitalen Lösungen am Laufen hält und Schritt für Schritt verbessert.',
      includedTitle: 'Enthalten',
      included: [
        'Persönlicher Ansprechpartner',
        'Beratung und digitale Begleitung',
        'Wartung und Updates',
        'Support für Ihre gewählten Lösungen',
        'Kleine Verbesserungen und Anpassungen',
        'Klarer Fahrplan für künftige Erweiterungen',
      ],
      excludedTitle: 'Nicht enthalten',
      excluded: [
        'Neue Funktionen oder Module',
        'Grosse Redesigns',
        'Dringende Arbeiten ausserhalb der vereinbarten Betreuung',
        'Werbebudgets',
      ],
      cta: 'Preise ansehen',
    },
    process: {
      eyebrow: 'So funktioniert es',
      heading: 'Ihre Digitalisierung in fünf Schritten.',
      intro:
        'Vom ersten Gespräch bis zur laufenden Betreuung begleiten wir Sie persönlich. Sie müssen nicht genau wissen, welche Tools Sie brauchen. Wir helfen Ihnen, die richtige Aufstellung für Ihr Unternehmen zu definieren.',
      steps: [
        {
          title: 'Ihr Unternehmen kennenlernen',
          text: 'Wir besprechen Ihr Unternehmen, Ihre aktuellen Tools, Ihre digitalen Herausforderungen und wo Sie heute Zeit verlieren.',
        },
        {
          title: 'Die richtige Aufstellung definieren',
          text: 'Gemeinsam entscheiden wir, welche Lösungen Sinn machen: Website, CRM, Automatisierungen, Dashboards, Kundenportal, Marketingtools oder AI Unterstützung.',
        },
        {
          title: 'Einen klaren Plan erstellen',
          text: 'Wir übersetzen Ihren Bedarf in einen praktischen Fahrplan mit Prioritäten, Umfang und einem klaren Abomodell.',
        },
        {
          title: 'Bauen und verbinden',
          text: 'Wir bauen die gewählten Lösungen und sorgen dafür, dass sie als eine digitale Aufstellung zusammenarbeiten.',
        },
        {
          title: 'Betreuen und verbessern',
          text: 'Nach dem Launch bleiben wir an Bord. Wir warten, verbessern und erweitern Ihre digitale Aufstellung, während Ihr Unternehmen wächst.',
        },
      ],
      cta: 'So funktioniert es im Detail',
    },
    faq: {
      eyebrow: 'Häufige Fragen',
      heading: 'Antworten auf einen Blick.',
      items: [
        {
          q: 'Was kostet eine Website bei semanu?',
          a: 'Die Abos starten bei 99 CHF pro Monat. Der genaue Preis hängt vom gewählten Abo und vom Umfang ab. Alle Preise verstehen sich exkl. MWST.',
        },
        {
          q: 'Was ist im Abo enthalten?',
          a: 'Design, technische Umsetzung, Hosting, Wartung, Sicherheit und SEO Grundlagen. Sie kümmern sich nicht um Technik, Updates oder Sicherheit.',
        },
        {
          q: 'Gibt es eine hohe Einmalrechnung?',
          a: 'Nein. Statt einer grossen Einmalinvestition zahlen Sie einen klaren monatlichen Preis, in dem alles Wichtige enthalten ist.',
        },
        {
          q: 'Wie lange läuft das Abo?',
          a: 'Die Mindestlaufzeit beträgt 36 Monate. Danach ist das Abo monatlich kündbar. Die genauen Bedingungen stehen in den AGB.',
        },
        {
          q: 'Wem gehören Website, Inhalte und Domain?',
          a: 'Inhalte und Domain gehören Ihnen. Design und Code gehen nach der Mindestlaufzeit und vollständiger Zahlung in Ihr Eigentum über.',
        },
        {
          q: 'Was bedeutet SEO Grundlagen inklusive?',
          a: 'Saubere Struktur, schnelle Ladezeiten, korrekte Titel und Meta Beschreibungen, mobile Optimierung und Indexierbarkeit. Laufende Kampagnen und garantierte Rankings gehören nicht dazu.',
        },
        {
          q: 'Kann ich später Änderungen machen lassen?',
          a: 'Ja. Kleinere Anpassungen gehören zur Betreuung. Grössere Änderungen nach dem Launch verrechnen wir zu einem klaren, vorab vereinbarten Satz.',
        },
        {
          q: 'Für wen ist semanu geeignet?',
          a: 'Für KMU, Selbständige und lokale Unternehmen in der Schweiz, die professionell auftreten möchten, ohne grosse Anfangsinvestition.',
        },
        {
          q: 'Macht semanu mehr als Websites?',
          a: 'Ja. semanu entwickelt auch digitale Plattformen wie Dashboards, CRM Systeme und Kundenportale, dazu Consultancy, Automatisierungen und AI Lösungen. Viele Kunden starten mit einer Website und bauen Schritt für Schritt weiter.',
        },
        {
          q: 'Was kostet eine digitale Plattform?',
          a: 'Digitale Plattformen wie Dashboards, CRM Systeme und Kundenportale entwickeln wir auf Anfrage, je nach Umfang. Den genauen Umfang und Preis besprechen wir transparent vorab. Das Website Abo startet bei 99 CHF pro Monat.',
        },
      ],
    },
  },

  fr: {
    pillars: {
      eyebrow: 'Ce que nous faisons',
      servicesWord: 'Nos services digitaux',
      partner: 'pour faire grandir votre entreprise',
      center: 'Votre entreprise',
      intro:
        'semanu est votre partenaire digital pour les PME suisses. Des sites web et de l’email marketing au CRM, aux automatisations, aux tableaux de bord, aux portails clients et aux assistants AI, nous réunissons les bonnes solutions dans une configuration claire.',
      belowServices:
        'Tout ce dont votre entreprise a besoin pour travailler plus intelligemment, relié par un seul partenaire.',
    },
    problem: {
      eyebrow: 'Le défi',
      heading: 'La digitalisation va vite. La plupart des PME n’ont pas le temps de suivre.',
      intro:
        'De nouveaux outils, de l’AI, des automatisations et des systèmes CRM apparaissent chaque jour, plus vite que la plupart des PME ne peuvent les juger. Sans service informatique interne, leur configuration devient peu à peu un patchwork d’outils qui ne se parlent pas. C’est là qu’intervient semanu.',
      cards: [
        {
          title: 'Pas de service informatique interne',
          text: 'La plupart des PME n’ont pas d’équipe dédiée pour gérer sites web, outils, intégrations, sécurité, mises à jour et nouvelles opportunités digitales.',
        },
        {
          title: 'Trop de prestataires séparés',
          text: 'Une personne construit le site, une autre gère le marketing, un outil s’occupe des réservations et quelqu’un d’autre regarde le CRM. Cela crée de la coordination en plus et une responsabilité floue.',
        },
        {
          title: 'La technologie change trop vite',
          text: 'L’AI, l’automatisation et les outils digitaux évoluent vite. Difficile de savoir ce dont votre entreprise a vraiment besoin et ce qui peut attendre.',
        },
        {
          title: 'Les outils ne fonctionnent pas ensemble',
          text: 'Votre site, vos formulaires, votre CRM, votre email marketing, vos tableaux de bord et votre communication client tournent souvent séparément, ce qui crée des doublons et des occasions manquées.',
        },
        {
          title: 'Pas de stratégie digitale',
          text: 'Sans plan à long terme, les outils sont choisis séparément et les occasions de croissance restent inexploitées.',
        },
      ],
    },
    solution: {
      eyebrow: 'La solution',
      heading: 'Un seul partenaire pour toute votre configuration digitale.',
      intro:
        'semanu choisit, construit, relie et entretient les solutions digitales dont votre entreprise a vraiment besoin: site web, marketing, CRM, automatisations, tableaux de bord, portails clients et AI, comme une configuration reliée plutôt que des projets séparés.',
      points: [
        {
          title: 'Un seul interlocuteur',
          text: 'Vous savez toujours qui appeler. Pas de course entre prestataires, pas d’allers retours techniques, pas de confusion sur les responsabilités.',
        },
        {
          title: 'Construit autour de votre entreprise',
          text: 'Nous ne poussons pas des outils pour le plaisir des outils. Nous regardons comment votre entreprise fonctionne et construisons des solutions qui soutiennent vos vrais processus.',
        },
        {
          title: 'Une configuration reliée',
          text: 'Votre site, votre CRM, vos formulaires, vos automatisations, vos tableaux de bord et vos portails fonctionnent ensemble comme un écosystème plutôt que comme des pièces séparées.',
        },
        {
          title: 'Prévisible et continu',
          text: 'Un abonnement clair couvre le support, la maintenance et l’amélioration continue. Pas de coûts cachés, pas de factures surprises. Nous grandissons avec votre entreprise.',
        },
      ],
      ctaLead: 'Prêt à simplifier votre configuration digitale?',
      cta: 'Discutons',
    },
    compare: {
      eyebrow: 'Pourquoi semanu',
      heading: '1 point de contact pour tout votre écosystème digital.',
      klassiekLabel: 'Approche classique',
      semanuLabel: 'Avec semanu',
      klassiek: ['Plusieurs prestataires', 'Des outils qui ne communiquent pas', 'Responsabilité floue', 'Des coûts variables'],
      semanu: ['1 interlocuteur fixe', 'Des systèmes connectés', 'Tout inclus', 'Un prix mensuel fixe'],
    },
    model: {
      eyebrow: 'L’abonnement',
      heading: 'Un abonnement clair pour un accompagnement digital continu.',
      intro:
        'La digitalisation ne s’arrête pas après un projet. Les outils ont besoin de mises à jour, les processus changent, de nouvelles idées apparaissent et votre entreprise continue d’évoluer. Avec semanu vous travaillez avec un abonnement clair qui comprend le support, la maintenance et l’amélioration continue de votre configuration digitale. Vous savez ce qui est compris, ce qui est possible et ce que cela coûte. Pas de coûts cachés. Pas de surprises techniques. Juste un partenaire qui garde vos outils digitaux fonctionnels et en amélioration.',
      includedTitle: 'Compris',
      included: [
        'Interlocuteur personnel',
        'Conseil et accompagnement digital',
        'Maintenance et mises à jour',
        'Support pour vos solutions choisies',
        'Petites améliorations et ajustements',
        'Feuille de route claire pour les extensions futures',
      ],
      excludedTitle: 'Non compris',
      excluded: [
        'Nouvelles fonctionnalités ou modules',
        'Grandes refontes',
        'Travaux urgents hors du suivi convenu',
        'Budgets publicitaires',
      ],
      cta: 'Voir les prix',
    },
    process: {
      eyebrow: 'Comment ça marche',
      heading: 'Votre digitalisation en cinq étapes.',
      intro:
        'Du premier échange au suivi continu, nous vous accompagnons personnellement. Vous n’avez pas besoin de savoir exactement quels outils il vous faut. Nous vous aidons à définir la bonne configuration pour votre entreprise.',
      steps: [
        {
          title: 'Découvrir votre entreprise',
          text: 'Nous parlons de votre entreprise, de vos outils actuels, de vos défis digitaux et de là où vous perdez du temps aujourd’hui.',
        },
        {
          title: 'Définir la bonne configuration',
          text: 'Ensemble nous décidons quelles solutions ont du sens: site web, CRM, automatisations, tableaux de bord, portail client, outils marketing ou support AI.',
        },
        {
          title: 'Créer un plan clair',
          text: 'Nous traduisons vos besoins en une feuille de route pratique avec priorités, portée et un modèle d’abonnement clair.',
        },
        {
          title: 'Construire et relier',
          text: 'Nous construisons les solutions choisies et veillons à ce qu’elles fonctionnent ensemble comme une seule configuration digitale.',
        },
        {
          title: 'Accompagner et améliorer',
          text: 'Après le lancement nous restons impliqués. Nous entretenons, améliorons et étendons votre configuration digitale à mesure que votre entreprise grandit.',
        },
      ],
      cta: 'Comment ça marche en détail',
    },
    faq: {
      eyebrow: 'Questions fréquentes',
      heading: 'Des réponses en un coup d’œil.',
      items: [
        {
          q: 'Combien coûte un site chez semanu?',
          a: 'Les abonnements démarrent à 99 CHF par mois. Le prix exact dépend de l’abonnement choisi et de l’ampleur. Tous les prix hors TVA.',
        },
        {
          q: 'Que comprend l’abonnement?',
          a: 'Design, réalisation technique, hébergement, maintenance, sécurité et bases SEO. Vous ne vous occupez ni de la technique, ni des mises à jour, ni de la sécurité.',
        },
        {
          q: 'Y a une grosse facture unique?',
          a: 'Non. Plutôt qu’un gros investissement unique, vous payez un prix mensuel clair qui comprend tout l’essentiel.',
        },
        {
          q: 'Quelle est la durée de l’abonnement?',
          a: 'La durée minimale est de 36 mois. Ensuite l’abonnement est résiliable chaque mois. Les conditions exactes figurent dans les CGV.',
        },
        {
          q: 'À qui appartiennent le site, les contenus et le domaine?',
          a: 'Les contenus et le domaine vous appartiennent. Le design et le code deviennent votre propriété après la durée minimale et le paiement complet.',
        },
        {
          q: 'Que signifie bases SEO comprises?',
          a: 'Structure propre, temps de chargement rapides, titres et métadonnées corrects, optimisation mobile et indexation. Les campagnes continues et les classements garantis n’en font pas partie.',
        },
        {
          q: 'Je peux faire faire des modifications plus tard?',
          a: 'Oui. Les petits ajustements font partie du suivi. Les modifications importantes après le lancement sont facturées à un tarif clair, convenu à l’avance.',
        },
        {
          q: 'À qui semanu convient?',
          a: 'Aux PME, indépendants et commerces locaux en Suisse qui veulent paraître professionnels, sans grand investissement de départ.',
        },
        {
          q: 'semanu fait plus que des sites web ?',
          a: 'Oui. semanu développe aussi des plateformes digitales comme des tableaux de bord, systèmes CRM et portails clients, ainsi que du conseil, des automatisations et des solutions AI. Beaucoup de clients commencent par un site web et construisent ensuite étape par étape.',
        },
        {
          q: 'Combien coûte une plateforme digitale ?',
          a: 'Les plateformes digitales comme les tableaux de bord, systèmes CRM et portails clients sont développées sur demande, selon l’ampleur. Nous discutons de l’ampleur exacte et du prix de façon transparente à l’avance. L’abonnement site démarre à 99 CHF par mois.',
        },
      ],
    },
  },

  en: {
    pillars: {
      eyebrow: 'What we do',
      servicesWord: 'Our digital services',
      partner: 'to grow your business',
      center: 'Your business',
      intro:
        'semanu is your digital partner for Swiss SMEs. From websites and email marketing to CRM, automations, dashboards, customer portals and AI assistants, we bring the right solutions into one clear setup.',
      belowServices:
        'Everything your business needs to work smarter, connected by one partner.',
    },
    problem: {
      eyebrow: 'The challenge',
      heading: 'Digitalisation is moving fast. Most SMEs do not have time to keep up.',
      intro:
        'New tools, AI, automations and CRM systems appear every day, faster than most SMEs can judge them. Without in house IT their setup slowly becomes a patchwork of tools that do not talk to each other. That is where semanu comes in.',
      cards: [
        {
          title: 'No internal IT department',
          text: 'Most SMEs do not have a dedicated team to manage websites, tools, integrations, security, updates and new digital opportunities.',
        },
        {
          title: 'Too many separate suppliers',
          text: 'One person builds the website, another manages marketing, another handles bookings and someone else looks at CRM. That creates extra coordination and unclear responsibility.',
        },
        {
          title: 'Technology changes too quickly',
          text: 'AI, automation and digital tools evolve fast. It is hard to know what your business really needs and what can wait.',
        },
        {
          title: 'Tools do not work together',
          text: 'Your website, forms, CRM, email marketing, dashboards and customer communication often run separately, causing duplicate work and missed opportunities.',
        },
        {
          title: 'No digital strategy',
          text: 'Without a long term plan, tools get chosen in isolation and chances to grow are left on the table.',
        },
      ],
    },
    solution: {
      eyebrow: 'The solution',
      heading: 'One partner for your whole digital setup.',
      intro:
        'semanu chooses, builds, connects and maintains the digital solutions your business really needs: website, marketing, CRM, automations, dashboards, customer portals and AI, built as one connected setup instead of separate projects.',
      points: [
        {
          title: 'One point of contact',
          text: 'You always know who to call. No chasing different suppliers, no technical back and forth, no confusion about who is responsible.',
        },
        {
          title: 'Built around your business',
          text: 'We do not push tools for the sake of tools. We look at how your company works and build solutions that support your real processes.',
        },
        {
          title: 'One connected setup',
          text: 'Your website, CRM, forms, automations, dashboards and portals work together as one ecosystem instead of separate pieces.',
        },
        {
          title: 'Predictable and ongoing',
          text: 'A clear subscription covers support, maintenance and continuous improvement. No hidden costs, no surprise invoices. We grow with your business.',
        },
      ],
      ctaLead: 'Ready to simplify your digital setup?',
      cta: 'Let’s talk',
    },
    compare: {
      eyebrow: 'Why semanu',
      heading: '1 point of contact for your entire digital ecosystem.',
      klassiekLabel: 'The usual way',
      semanuLabel: 'With semanu',
      klassiek: ['Multiple providers', 'Tools that do not talk to each other', 'Unclear responsibility', 'Shifting costs'],
      semanu: ['1 fixed point of contact', 'Connected systems', 'Everything included', 'A fixed monthly price'],
    },
    model: {
      eyebrow: 'The subscription',
      heading: 'A clear subscription for ongoing digital support.',
      intro:
        'Digitalisation does not stop after one project. Tools need updates, processes change, new ideas appear and your business keeps evolving. With semanu you work with a clear subscription that includes support, maintenance and continuous improvement of your digital setup. You know what is included, what is possible and what it costs. No hidden costs. No technical surprises. Just one partner who keeps your digital tools working and improving.',
      includedTitle: 'Included',
      included: [
        'Personal contact',
        'Advice and digital guidance',
        'Maintenance and updates',
        'Support for your selected solutions',
        'Small improvements and adjustments',
        'Clear roadmap for future extensions',
      ],
      excludedTitle: 'Excluded',
      excluded: [
        'New features or modules',
        'Large redesigns',
        'Urgent work outside agreed support',
        'Advertising budgets',
      ],
      cta: 'See pricing',
    },
    process: {
      eyebrow: 'How it works',
      heading: 'Your digitalisation in five steps.',
      intro:
        'From the first conversation to ongoing support, we guide you personally. You do not need to know exactly which tools you need. We help you define the right setup for your business.',
      steps: [
        {
          title: 'Get to know your business',
          text: 'We discuss your company, your current tools, your digital challenges and where you lose time today.',
        },
        {
          title: 'Define the right setup',
          text: 'Together we decide which solutions make sense: website, CRM, automations, dashboards, customer portal, marketing tools or AI support.',
        },
        {
          title: 'Create a clear plan',
          text: 'We translate your needs into a practical roadmap with priorities, scope and a clear subscription model.',
        },
        {
          title: 'Build and connect',
          text: 'We build the selected solutions and make sure they work together as one digital setup.',
        },
        {
          title: 'Support and improve',
          text: 'After launch we stay involved. We maintain, improve and extend your digital setup as your business grows.',
        },
      ],
      cta: 'How it works in detail',
    },
    faq: {
      eyebrow: 'Frequently asked',
      heading: 'Answers at a glance.',
      items: [
        {
          q: 'What does a website at semanu cost?',
          a: 'The plans start at 99 CHF per month. The exact price depends on the chosen plan and the scope. All prices excl. VAT.',
        },
        {
          q: 'What is included in the subscription?',
          a: 'Design, technical build, hosting, maintenance, security and SEO foundations. You do not deal with technology, updates or security.',
        },
        {
          q: 'Is there a large one time invoice?',
          a: 'No. Instead of a large one time investment you pay a clear monthly price that includes everything essential.',
        },
        {
          q: 'How long does the subscription run?',
          a: 'The minimum term is 36 months. After that the subscription is cancellable monthly. The exact conditions are in our GTC.',
        },
        {
          q: 'Who owns the website, content and domain?',
          a: 'Content and domain are yours. Design and code become your property after the minimum term and full payment.',
        },
        {
          q: 'What does SEO foundations included mean?',
          a: 'Clean structure, fast load times, correct titles and meta descriptions, mobile optimisation and indexability. Ongoing campaigns and guaranteed rankings are not part of it.',
        },
        {
          q: 'Can I have changes made later?',
          a: 'Yes. Small adjustments are part of the care. Larger changes after launch are billed at a clear rate, agreed in advance.',
        },
        {
          q: 'Who is semanu for?',
          a: 'For SMEs, self employed people and local businesses in Switzerland that want to look professional, without a large upfront investment.',
        },
        {
          q: 'Does semanu do more than websites?',
          a: 'Yes. semanu also builds digital platforms like dashboards, CRM systems and customer portals, plus consultancy, automations and AI solutions. Many clients start with a website and build further step by step.',
        },
        {
          q: 'What does a digital platform cost?',
          a: 'Digital platforms like dashboards, CRM systems and customer portals are built on request, depending on the scope. We discuss the exact scope and price transparently upfront. The website subscription starts at 99 CHF per month.',
        },
      ],
    },
  },

  es: {
    pillars: {
      eyebrow: 'Lo que hacemos',
      servicesWord: 'Nuestros servicios digitales',
      partner: 'para hacer crecer su empresa',
      center: 'Su empresa',
      intro:
        'semanu es su socio digital para pymes suizas. Desde la web y el email marketing hasta CRM, automatizaciones, cuadros de mando, portales de clientes y asistentes AI, reunimos las soluciones adecuadas en una configuración clara.',
      belowServices:
        'Todo lo que su empresa necesita para trabajar de forma más eficiente, conectado por un solo socio.',
    },
    problem: {
      eyebrow: 'El reto',
      heading: 'La digitalización avanza rápido. La mayoría de las pymes no tiene tiempo de seguir el ritmo.',
      intro:
        'Cada día surgen nuevas herramientas, AI, automatizaciones y sistemas CRM, más rápido de lo que la mayoría de las pymes puede valorar. Sin un departamento de informática propio, su configuración se convierte poco a poco en un mosaico de herramientas que no se comunican entre sí. Ahí es donde entra semanu.',
      cards: [
        {
          title: 'Sin departamento de informática interno',
          text: 'La mayoría de las pymes no tiene un equipo propio para webs, herramientas, integraciones, seguridad, actualizaciones y nuevas posibilidades digitales.',
        },
        {
          title: 'Demasiados proveedores sueltos',
          text: 'Uno construye la web, otro hace el marketing, una herramienta gestiona las reservas y otra persona se ocupa del CRM. Eso genera coordinación adicional y responsabilidades poco claras.',
        },
        {
          title: 'La tecnología cambia demasiado rápido',
          text: 'La AI, la automatización y las herramientas digitales evolucionan deprisa. Es difícil saber qué necesita de verdad su empresa y qué puede esperar.',
        },
        {
          title: 'Las herramientas no trabajan juntas',
          text: 'Web, formularios, CRM, email marketing, cuadros de mando y comunicación con clientes suelen ir por separado, lo que provoca trabajo duplicado y oportunidades perdidas.',
        },
        {
          title: 'Sin estrategia digital',
          text: 'Sin un plan a largo plazo, las herramientas se eligen por separado y las oportunidades de crecer se quedan sin aprovechar.',
        },
      ],
    },
    solution: {
      eyebrow: 'La solución',
      heading: 'Un socio para toda su configuración digital.',
      intro:
        'semanu elige, construye, conecta y mantiene las soluciones digitales que su empresa realmente necesita: web, marketing, CRM, automatizaciones, cuadros de mando, portales de clientes y AI, como una configuración conectada en lugar de proyectos sueltos.',
      points: [
        {
          title: 'Un único contacto',
          text: 'Siempre sabe a quién llamar. Sin perseguir a distintos proveedores, sin idas y venidas técnicas, sin dudas sobre las responsabilidades.',
        },
        {
          title: 'Hecho a la medida de su empresa',
          text: 'No imponemos herramientas por imponerlas. Observamos cómo trabaja su negocio y construimos soluciones que apoyan sus procesos reales.',
        },
        {
          title: 'Una configuración conectada',
          text: 'Web, CRM, formularios, automatizaciones, cuadros de mando y portales trabajan juntos como un ecosistema en lugar de como piezas sueltas.',
        },
        {
          title: 'Previsible y continuo',
          text: 'Una suscripción clara cubre soporte, mantenimiento y mejora continua. Sin costes ocultos ni facturas sorpresa. Crecemos junto a su empresa.',
        },
      ],
      ctaLead: '¿Listo para simplificar su configuración digital?',
      cta: 'Hablemos',
    },
    compare: {
      eyebrow: 'Por qué semanu',
      heading: '1 punto de contacto para todo su ecosistema digital.',
      klassiekLabel: 'El enfoque habitual',
      semanuLabel: 'Con semanu',
      klassiek: ['Varios proveedores', 'Herramientas que no se comunican', 'Responsabilidad poco clara', 'Costes variables'],
      semanu: ['1 interlocutor fijo', 'Sistemas conectados', 'Todo incluido', 'Un precio mensual fijo'],
    },
    model: {
      eyebrow: 'La suscripción',
      heading: 'Una suscripción clara para apoyo digital continuo.',
      intro:
        'La digitalización no termina con el lanzamiento de un proyecto. Las herramientas necesitan actualizaciones, los procesos cambian, surgen nuevas ideas y su empresa sigue evolucionando. Con semanu trabaja en una suscripción clara que incluye soporte, mantenimiento y mejora continua de su configuración digital. Sabe qué está incluido, qué es posible y cuánto cuesta. Sin costes ocultos. Sin sorpresas técnicas. Sin idas y venidas entre distintos proveedores. Solo un socio que mantiene sus soluciones digitales en marcha y las mejora paso a paso.',
      includedTitle: 'Incluido',
      included: [
        'Contacto personal',
        'Asesoramiento y acompañamiento digital',
        'Mantenimiento y actualizaciones',
        'Soporte para las soluciones elegidas',
        'Pequeñas mejoras y ajustes',
        'Hoja de ruta clara para futuras ampliaciones',
      ],
      excludedTitle: 'No incluido',
      excluded: [
        'Nuevas funciones o módulos',
        'Grandes rediseños',
        'Trabajos urgentes fuera del acompañamiento acordado',
        'Presupuestos publicitarios',
      ],
      cta: 'Ver precios',
    },
    process: {
      eyebrow: 'Cómo funciona',
      heading: 'Su digitalización en cinco pasos.',
      intro:
        'Desde la primera conversación hasta el acompañamiento continuo, le guiamos de forma personal. No necesita saber exactamente qué herramientas le hacen falta. Le ayudamos a definir la configuración adecuada para su empresa.',
      steps: [
        {
          title: 'Conocer su empresa',
          text: 'Hablamos de su empresa, de sus herramientas actuales, de sus retos digitales y de dónde pierde tiempo hoy.',
        },
        {
          title: 'Definir la configuración adecuada',
          text: 'Juntos decidimos qué soluciones tienen sentido: web, CRM, automatizaciones, cuadros de mando, portal de clientes, herramientas de marketing o apoyo con AI.',
        },
        {
          title: 'Crear un plan claro',
          text: 'Traducimos sus necesidades en una hoja de ruta práctica con prioridades, alcance y un modelo de suscripción claro.',
        },
        {
          title: 'Construir y conectar',
          text: 'Construimos las soluciones elegidas y nos aseguramos de que trabajen juntas como una sola configuración digital.',
        },
        {
          title: 'Acompañar y mejorar',
          text: 'Tras el lanzamiento seguimos a bordo. Mantenemos, mejoramos y ampliamos su configuración digital a medida que su empresa crece.',
        },
      ],
      cta: 'Cómo funciona en detalle',
    },
    faq: {
      eyebrow: 'Preguntas frecuentes',
      heading: 'Respuestas de un vistazo.',
      items: [
        {
          q: '¿Cuánto cuesta una web en semanu?',
          a: 'Las suscripciones empiezan en 99 CHF al mes. El precio exacto depende de la suscripción elegida y del alcance. Todos los precios sin IVA.',
        },
        {
          q: '¿Qué incluye la suscripción?',
          a: 'Diseño, implementación técnica, hosting, mantenimiento, seguridad y bases de SEO. No se ocupa de la tecnología ni de las actualizaciones ni de la seguridad.',
        },
        {
          q: '¿Hay una factura única elevada?',
          a: 'No. En lugar de una gran inversión única paga un precio mensual claro que incluye todo lo esencial.',
        },
        {
          q: '¿Cuánto dura la suscripción?',
          a: 'La duración mínima es de 36 meses. Después la suscripción se puede cancelar mensualmente. Las condiciones exactas figuran en las CGC.',
        },
        {
          q: '¿De quién son la web, los contenidos y el dominio?',
          a: 'Los contenidos y el dominio son suyos. El diseño y el código pasan a ser de su propiedad tras la duración mínima y el pago completo.',
        },
        {
          q: '¿Qué significa bases de SEO incluidas?',
          a: 'Estructura limpia, tiempos de carga rápidos, títulos y meta descripciones correctos, optimización móvil e indexabilidad. Las campañas continuas y los rankings garantizados no forman parte de ello.',
        },
        {
          q: '¿Puedo pedir cambios más adelante?',
          a: 'Sí. Los ajustes pequeños forman parte del acompañamiento. Los cambios mayores tras el lanzamiento se facturan a una tarifa clara, acordada de antemano.',
        },
        {
          q: '¿Para quién es adecuado semanu?',
          a: 'Para pymes, autónomos y empresas locales en Suiza que quieren dar una imagen profesional sin una gran inversión inicial.',
        },
        {
          q: '¿Hace semanu algo más que webs?',
          a: 'Sí. semanu también desarrolla plataformas digitales como cuadros de mando, sistemas CRM y portales de clientes, además de consultoría, automatizaciones y soluciones AI. Muchos clientes empiezan con una web y siguen construyendo paso a paso.',
        },
        {
          q: '¿Cuánto cuesta una plataforma digital?',
          a: 'Las plataformas digitales como cuadros de mando, sistemas CRM y portales de clientes las desarrollamos a demanda, según el alcance. El alcance exacto y el precio los hablamos de forma transparente de antemano. La suscripción de web empieza en 99 CHF al mes.',
        },
      ],
    },
  },

  nl: {
    pillars: {
      eyebrow: 'Wat we doen',
      servicesWord: 'Onze digitale diensten',
      partner: 'om uw onderneming te laten groeien',
      center: 'Uw onderneming',
      intro:
        'semanu is uw digitale partner voor Zwitserse kmo’s. Van website en email marketing over CRM, automatiseringen, dashboards en klantenportalen tot AI assistenten brengen we de juiste oplossingen samen in een heldere opstelling.',
      belowServices:
        'Alles wat uw onderneming nodig heeft om efficiënter te werken, verbonden door één partner.',
    },
    problem: {
      eyebrow: 'De uitdaging',
      heading: 'Digitalisering gaat snel, de meeste bedrijven hebben geen tijd om bij te blijven.',
      intro:
        'Elke dag komen er nieuwe tools, AI, automatiseringen en CRM systemen bij, sneller dan de meeste kmo’s ze kunnen beoordelen. Zonder eigen IT wordt hun digitale opstelling stilaan een lappendeken van tools die niet met elkaar praten. Precies daar zet semanu op in.',
      cards: [
        {
          title: 'Geen interne IT afdeling',
          text: 'De meeste kmo’s hebben geen eigen team voor websites, tools, integraties, beveiliging, updates en nieuwe digitale mogelijkheden.',
        },
        {
          title: 'Te veel losse aanbieders',
          text: 'De ene bouwt de website, de andere doet de marketing, een tool neemt de boekingen over en iemand anders zorgt voor het CRM. Dat zorgt voor extra coördinatie en onduidelijke verantwoordelijkheid.',
        },
        {
          title: 'Technologie verandert te snel',
          text: 'AI, automatisering en digitale tools ontwikkelen zich razendsnel. Het is lastig te weten wat uw onderneming echt nodig heeft en wat kan wachten.',
        },
        {
          title: 'Tools werken niet samen',
          text: 'Website, formulieren, CRM, email marketing, dashboards en klantcommunicatie lopen vaak gescheiden, wat dubbel werk en gemiste kansen veroorzaakt.',
        },
        {
          title: 'Geen digitale strategie',
          text: 'Zonder plan op langere termijn worden tools los van elkaar gekozen en blijven kansen om te groeien liggen.',
        },
      ],
    },
    solution: {
      eyebrow: 'De oplossing',
      heading: 'Eén partner voor uw volledige digitale opstelling.',
      intro:
        'semanu kiest, bouwt, verbindt en onderhoudt de digitale oplossingen die uw onderneming echt nodig heeft: website, marketing, CRM, automatiseringen, dashboards, klantenportalen en AI, als één verbonden opstelling in plaats van losse projecten.',
      points: [
        {
          title: 'Eén aanspreekpunt',
          text: 'U weet altijd wie u moet bellen. Geen gejaag achter verschillende aanbieders, geen technisch heen en weer, geen onduidelijkheid over verantwoordelijkheden.',
        },
        {
          title: 'Op maat van uw onderneming',
          text: 'We dringen geen tools op om de tools zelf. We kijken hoe uw bedrijf werkt en bouwen oplossingen die uw echte processen ondersteunen.',
        },
        {
          title: 'Een verbonden opstelling',
          text: 'Website, CRM, formulieren, automatiseringen, dashboards en portalen werken samen als één ecosysteem in plaats van als losse onderdelen.',
        },
        {
          title: 'Voorspelbaar en doorlopend',
          text: 'Een helder abonnement dekt support, onderhoud en doorlopende verbetering. Geen verborgen kosten, geen verrassingsfacturen. We groeien mee met uw onderneming.',
        },
      ],
      ctaLead: 'Klaar om uw digitale opstelling te vereenvoudigen?',
      cta: 'Laten we praten',
    },
    compare: {
      eyebrow: 'Waarom semanu',
      heading: '1 aanspreekpunt voor heel uw digitale ecosysteem.',
      klassiekLabel: 'Klassieke aanpak',
      semanuLabel: 'Met semanu',
      klassiek: ['Meerdere leveranciers', 'Tools die niet met elkaar praten', 'Onduidelijke verantwoordelijkheid', 'Wisselende kosten'],
      semanu: ['1 vast aanspreekpunt', 'Verbonden systemen', 'Alles inbegrepen', 'Vast maandbedrag'],
    },
    model: {
      eyebrow: 'Het abonnement',
      heading: 'Een helder abonnement voor doorlopende digitale ondersteuning.',
      intro:
        'Digitalisering stopt niet bij de lancering van een project. Tools hebben updates nodig, processen veranderen, nieuwe ideeën ontstaan en uw onderneming blijft zich ontwikkelen. Met semanu werkt u in een helder abonnement dat support, onderhoud en doorlopende verbetering van uw digitale opstelling omvat. U weet wat inbegrepen is, wat mogelijk is en wat het kost. Geen verborgen kosten. Geen technische verrassingen. Geen heen en weer tussen verschillende aanbieders. Gewoon één partner die uw digitale oplossingen draaiende houdt en stap voor stap verbetert.',
      includedTitle: 'Inbegrepen',
      included: [
        'Persoonlijk aanspreekpunt',
        'Advies en digitale begeleiding',
        'Onderhoud en updates',
        'Support voor uw gekozen oplossingen',
        'Kleine verbeteringen en aanpassingen',
        'Helder plan voor toekomstige uitbreidingen',
      ],
      excludedTitle: 'Niet inbegrepen',
      excluded: [
        'Nieuwe functies of modules',
        'Grote redesigns',
        'Dringende werken buiten de afgesproken begeleiding',
        'Advertentiebudgetten',
      ],
      cta: 'Prijzen bekijken',
    },
    process: {
      eyebrow: 'Zo werkt het',
      heading: 'Uw digitalisering in vijf stappen.',
      intro:
        'Van het eerste gesprek tot de doorlopende begeleiding staan we u persoonlijk bij. U hoeft niet precies te weten welke tools u nodig heeft. Wij helpen u de juiste opstelling voor uw onderneming te bepalen.',
      steps: [
        {
          title: 'Uw onderneming leren kennen',
          text: 'We bespreken uw onderneming, uw huidige tools, uw digitale uitdagingen en waar u vandaag tijd verliest.',
        },
        {
          title: 'De juiste opstelling bepalen',
          text: 'Samen beslissen we welke oplossingen zinvol zijn: website, CRM, automatiseringen, dashboards, klantenportaal, marketingtools of AI ondersteuning.',
        },
        {
          title: 'Een helder plan opstellen',
          text: 'We vertalen uw behoefte naar een praktisch plan met prioriteiten, omvang en een helder abomodel.',
        },
        {
          title: 'Bouwen en verbinden',
          text: 'We bouwen de gekozen oplossingen en zorgen dat ze samenwerken als één digitale opstelling.',
        },
        {
          title: 'Begeleiden en verbeteren',
          text: 'Na de lancering blijven we aan boord. We onderhouden, verbeteren en breiden uw digitale opstelling uit terwijl uw onderneming groeit.',
        },
      ],
      cta: 'Zo werkt het in detail',
    },
    faq: {
      eyebrow: 'Veelgestelde vragen',
      heading: 'Antwoorden in één oogopslag.',
      items: [
        {
          q: 'Wat kost een website bij semanu?',
          a: 'De abonnementen starten vanaf 99 CHF per maand. De exacte prijs hangt af van het gekozen abonnement en de omvang. Alle prijzen excl. btw.',
        },
        {
          q: 'Wat is inbegrepen in het abonnement?',
          a: 'Design, technische uitvoering, hosting, onderhoud, beveiliging en SEO grondslagen. U bekommert zich niet om techniek, updates of beveiliging.',
        },
        {
          q: 'Is er een hoge eenmalige factuur?',
          a: 'Nee. In plaats van een grote eenmalige investering betaalt u een heldere maandprijs waarin alles belangrijks inbegrepen is.',
        },
        {
          q: 'Hoe lang loopt het abonnement?',
          a: 'De minimumlooptijd bedraagt 36 maanden. Daarna is het abonnement maandelijks opzegbaar. De exacte voorwaarden staan in de algemene voorwaarden.',
        },
        {
          q: 'Van wie zijn de website, de inhoud en het domein?',
          a: 'Inhoud en domein zijn van u. Design en code gaan na de minimumlooptijd en volledige betaling in uw eigendom over.',
        },
        {
          q: 'Wat betekent SEO grondslagen inbegrepen?',
          a: 'Nette structuur, snelle laadtijden, correcte titels en metabeschrijvingen, mobiele optimalisatie en indexeerbaarheid. Doorlopende campagnes en gegarandeerde rankings horen er niet bij.',
        },
        {
          q: 'Kan ik later aanpassingen laten doen?',
          a: 'Ja. Kleinere aanpassingen horen bij de begeleiding. Grotere wijzigingen na de lancering rekenen we aan tegen een helder, vooraf afgesproken tarief.',
        },
        {
          q: 'Voor wie is semanu geschikt?',
          a: 'Voor kmo’s, zelfstandigen en lokale ondernemingen in Zwitserland die professioneel willen overkomen zonder grote startinvestering.',
        },
        {
          q: 'Doet semanu meer dan websites?',
          a: 'Ja. semanu ontwikkelt ook digitale platformen zoals dashboards, CRM systemen en klantenportalen, daarnaast consultancy, automatiseringen en AI oplossingen. Veel klanten starten met een website en bouwen stap voor stap verder.',
        },
        {
          q: 'Wat kost een digitaal platform?',
          a: 'Digitale platformen zoals dashboards, CRM systemen en klantenportalen ontwikkelen we op aanvraag, afhankelijk van de omvang. De exacte omvang en prijs bespreken we transparant vooraf. Het website abonnement start vanaf 99 CHF per maand.',
        },
      ],
    },
  },
};
