// Long-form content for the trust-focused "how it works" page, kept as a typed
// module (like the SEO landing pages) so the copy stays readable and the message
// files stay lean. One ProcessContent per locale.

export type ProcessCard = { title: string; text: string };
export type ProcessFaq = { q: string; a: string };
export type ProcessStep = {
  title: string;
  happens: string;
  semanuDoes: string;
  weNeed: string;
  result: string;
  note?: string;
};
export type ProcessLink = { href: string; label: string };

export type ProcessContent = {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  sub: string;
  support: string;
  heroBullets: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  reassureHeading: string;
  reassureText: string;
  reassureCards: ProcessCard[];
  timelineHeading: string;
  timelineIntro: string;
  timelineSteps: string[];
  stepsHeading: string;
  stepLabels: { happens: string; semanuDoes: string; weNeed: string; result: string };
  steps: ProcessStep[];
  notYouHeading: string;
  notYouIntro: string;
  notYouItems: string[];
  notYouClosing: string;
  weNeedHeading: string;
  weNeedIntro: string;
  weNeedItems: string[];
  weNeedClosing: string;
  afterHeading: string;
  afterText: string;
  afterCards: ProcessCard[];
  whyHeading: string;
  whyText: string;
  entitySentence: string;
  whyPoints: ProcessCard[];
  faqHeading: string;
  faq: ProcessFaq[];
  finalHeading: string;
  finalText: string;
  linksHeading: string;
  links: ProcessLink[];
};

export const soFunktioniert: Record<'de' | 'fr' | 'en' | 'es' | 'nl', ProcessContent> = {
  de: {
    title: 'So funktioniert die Zusammenarbeit mit semanu',
    description:
      'Erfahren Sie, wie die Zusammenarbeit mit semanu abläuft: Kennenlernen, Bedarf analysieren, Blueprint, Umsetzung, Launch und laufende Betreuung Ihrer digitalen Lösungen.',
    eyebrow: 'Ablauf · Digitale Zusammenarbeit',
    h1: 'So entsteht Ihre digitale Aufstellung mit semanu',
    sub: 'Ein klarer Prozess, persönliche Betreuung und transparente Schritte, von der ersten Idee bis zur laufenden Betreuung Ihrer digitalen Lösungen.',
    support:
      'Mit semanu müssen Sie keine technische Struktur planen, kein Hosting einrichten und keine Updates verwalten. Wir führen Sie Schritt für Schritt durch den Prozess und zeigen Ihnen jederzeit, was als Nächstes passiert.',
    heroBullets: [
      'Klarer Ablauf von der Analyse bis zum Launch',
      'Persönliche Begleitung statt anonymer Agenturprozess',
      'Feedback und Freigabe vor der finalen Umsetzung',
      'Websites, Portale, CRM, Automatisierungen und AI aus einer Hand',
    ],
    primaryCta: { label: 'Strategiegespräch buchen', href: '/kontakt' },
    secondaryCta: { label: 'Preise ansehen', href: '/website-abos' },
    reassureHeading: 'Ein Prozess, der Unsicherheit reduziert',
    reassureText:
      'semanu arbeitet mit einem klaren Ablauf, damit eine digitale Lösung nicht kompliziert wirkt. Sie wissen jederzeit, was passiert, was wir übernehmen und was wir von Ihnen brauchen, egal ob Website, Portal, CRM oder Automatisierung.',
    reassureCards: [
      {
        title: 'Sie wissen, was als Nächstes passiert',
        text: 'Jeder Schritt hat ein klares Ziel. Sie sehen, wann wir Informationen benötigen, wann Feedback gefragt ist und wann etwas freigegeben wird.',
      },
      {
        title: 'Sie brauchen kein technisches Wissen',
        text: 'Hosting, technische Umsetzung, Wartung und Betrieb Ihrer Lösungen übernehmen wir. Sie konzentrieren sich auf Ihr Unternehmen.',
      },
      {
        title: 'Sie geben Feedback vor dem Launch',
        text: 'Ihre Lösung wird nicht einfach ohne Rücksprache veröffentlicht. Sie erhalten die Möglichkeit, Entwürfe und Inhalte zu prüfen.',
      },
    ],
    timelineHeading: 'Der Ablauf in 5 klaren Schritten',
    timelineIntro:
      'Vom ersten Gespräch bis zur laufenden Betreuung bleibt der Prozess übersichtlich. Der genaue Zeitplan hängt vom Umfang, den Inhalten und dem Feedback ab.',
    timelineSteps: ['Kennenlernen', 'Bedarf analysieren', 'Blueprint erstellen', 'Design und Umsetzung', 'Launch und Betreuung'],
    stepsHeading: 'Jeder Schritt im Detail',
    stepLabels: {
      happens: 'Was passiert?',
      semanuDoes: 'Was übernimmt semanu?',
      weNeed: 'Was brauchen wir von Ihnen?',
      result: 'Ergebnis dieses Schritts',
    },
    steps: [
      {
        title: 'Kennenlernen und Ziele klären',
        happens:
          'Wir schauen gemeinsam, was Sie digital erreichen wollen: mehr Anfragen, ein professionellerer Auftritt, bessere Auffindbarkeit, effizientere Abläufe, eine engere Kundenbindung oder mehr Überblick über Ihre Daten.',
        semanuDoes:
          'Wir stellen die richtigen Fragen, prüfen Ihre Ausgangslage und geben eine ehrliche Einschätzung, welche digitale Aufstellung zu Ihrem Unternehmen passt.',
        weNeed:
          'Eine kurze Beschreibung Ihres Unternehmens, Ihrer Leistungen und Ihrer Ziele. Eine perfekte Vorbereitung ist nicht nötig.',
        result: 'Sie wissen, ob semanu zu Ihrem Vorhaben passt und worauf wir den Fokus legen.',
      },
      {
        title: 'Ihren Bedarf analysieren',
        happens:
          'Gemeinsam analysieren wir, welche digitalen Lösungen Ihr Unternehmen wirklich braucht: Website, CRM, Automatisierungen, Kundenportal, Dashboards oder AI Unterstützung.',
        semanuDoes:
          'Wir hören zu, prüfen Ihre Abläufe und empfehlen ehrlich, was zuerst sinnvoll ist und was warten kann.',
        weNeed:
          'Einen Einblick in Ihre aktuellen Abläufe und wo Sie heute Zeit verlieren oder Chancen liegen lassen.',
        result: 'Sie wissen, welche Lösungen Sinn machen und in welcher Reihenfolge.',
        note: 'Business Analyse für Software Projekte: Portale, CRM, Dashboards und Automatisierungen starten mit einer gründlichen Business Analyse. Wir prüfen, wie standardisiert Ihre Prozesse sind. Erwartungen und technische Kriterien halten wir vorab fest. Die Stärke dieser Projekte liegt in der Vorbereitung.',
      },
      {
        title: 'Blueprint, Struktur und Inhalte',
        happens:
          'Bevor gebaut wird, entsteht ein klarer Plan für Ihre Lösung. Wir definieren Struktur, Inhalte oder Datenflüsse, wichtigste Botschaften und die nächsten Schritte.',
        semanuDoes:
          'Wir strukturieren Ihre Lösung so, dass Besucher und Nutzer schnell verstehen, wer Sie sind, was Sie anbieten und wie alles zusammenspielt.',
        weNeed:
          'Vorhandene Texte, Stichpunkte, Logo, Bilder, Beispiele oder einen Blick in Ihre Tools, falls vorhanden. Wenn noch nicht alles fertig ist, helfen wir bei Struktur und Formulierung.',
        result: 'Ein klarer Blueprint für Ihre Lösung, der als Grundlage für Design und Umsetzung dient.',
      },
      {
        title: 'Design und technische Umsetzung',
        happens:
          'Auf Basis des Blueprints gestalten und entwickeln wir Ihre Lösung. Dabei achten wir auf klare Inhalte, mobile Darstellung, technische Sauberkeit und je nach Lösung auf SEO Grundlagen oder saubere Datenflüsse.',
        semanuDoes:
          'Wir kümmern uns um Design, responsive Umsetzung, technische Struktur, Integrationen, Automatisierungen und alles, was im Hintergrund laufen muss.',
        weNeed:
          'Feedback zu Entwurf, Inhalten und Gestaltung. Sie müssen keine technischen Entscheidungen treffen.',
        result:
          'Eine professionelle Lösung, die auf Desktop, Tablet und Smartphone funktioniert und bereit für die finale Prüfung ist.',
      },
      {
        title: 'Launch und laufende Betreuung',
        happens:
          'Nach Ihrer Freigabe geht Ihre Lösung live. Danach bleibt semanu für Hosting, Wartung, technische Pflege und Betreuung an Ihrer Seite.',
        semanuDoes:
          'Wir kümmern uns um den technischen Betrieb, Wartung, Sicherheit und je nach Abo oder Vereinbarung um spätere Anpassungen und Erweiterungen.',
        weNeed:
          'Ihre finale Freigabe und später Rückmeldung, falls Inhalte oder Funktionen angepasst werden sollen.',
        result: 'Ihre digitale Aufstellung ist live und bleibt technisch betreut.',
      },
    ],
    notYouHeading: 'Was Sie nicht selbst machen müssen',
    notYouIntro:
      'Viele Kundinnen und Kunden kommen zu semanu, weil sie eine professionelle digitale Aufstellung möchten und keine Zeit für Technik, Tools und Wartung haben.',
    notYouItems: [
      'Sie müssen kein Hosting einrichten.',
      'Sie müssen keine Updates oder Erweiterungen verwalten.',
      'Sie müssen keine technische Struktur planen.',
      'Sie müssen nicht wissen, wie SEO oder Integrationen im Detail funktionieren.',
      'Sie müssen keine perfekten Texte oder Daten mitbringen.',
      'Sie müssen keine Sicherheitsupdates verwalten.',
      'Sie müssen nicht mehrere Dienstleister koordinieren.',
      'Sie müssen keine Designentscheidungen allein treffen.',
    ],
    notYouClosing:
      'Wir führen Sie durch die wichtigen Entscheidungen und übernehmen den technischen Teil im Hintergrund.',
    weNeedHeading: 'Was wir von Ihnen brauchen',
    weNeedIntro:
      'Damit Ihre Lösung zu Ihrem Unternehmen passt, brauchen wir einige Informationen. Diese müssen nicht perfekt vorbereitet sein.',
    weNeedItems: [
      'eine kurze Beschreibung Ihres Unternehmens',
      'Ihre wichtigsten Leistungen oder Angebote',
      'vorhandenes Logo, Farben oder Gestaltungselemente, falls vorhanden',
      'bestehende Texte, Stichpunkte oder einen Einblick in Ihre Abläufe, falls vorhanden',
      'Bilder oder Bildideen, falls vorhanden',
      'gewünschte Kontaktmöglichkeiten oder Schnittstellen',
      'Feedback zu Struktur, Design und Inhalten',
      'finale Freigabe vor dem Launch',
    ],
    weNeedClosing: 'Wenn Ihnen Inhalte fehlen, helfen wir bei Struktur und Formulierung.',
    afterHeading: 'Nach dem Launch bleibt Ihre Lösung betreut',
    afterText:
      'Eine digitale Lösung ist nach dem Launch nicht einfach fertig. Technik, Sicherheit, Hosting und Inhalte müssen zuverlässig betreut werden. Genau deshalb ist die laufende Betreuung ein wichtiger Teil der Zusammenarbeit mit semanu.',
    afterCards: [
      {
        title: 'Hosting und technischer Betrieb',
        text: 'Ihre Lösung bleibt online und technisch betreut, ohne dass Sie selbst Hosting verwalten müssen.',
      },
      {
        title: 'Wartung und Sicherheit',
        text: 'Wir kümmern uns um technische Pflege und Sicherheitsgrundlagen, damit Ihre Lösung zuverlässig bleibt.',
      },
      {
        title: 'SEO Grundlagen',
        text: 'Ihre Website wird so aufgebaut, dass Google Inhalte, Struktur und Seiten besser verstehen kann. Rankings werden nicht garantiert.',
      },
      {
        title: 'Anpassungen und Erweiterungen bei Bedarf',
        text: 'Wenn später Inhalte, Seiten oder Funktionen angepasst oder ergänzt werden sollen, kann dies je nach Abo und Vereinbarung umgesetzt werden.',
      },
    ],
    whyHeading: 'Warum dieser Prozess für Schweizer KMU funktioniert',
    whyText:
      'KMU, Selbständige und lokale Unternehmen brauchen meist keine überkomplizierte Agenturstruktur. Sie brauchen einen klaren Ansprechpartner, verständliche Schritte, transparente Kosten und digitale Lösungen, die zuverlässig funktionieren.',
    entitySentence:
      'semanu ist ein digitaler Partner aus Bern und entwickelt Websites, Portale, CRM Systeme, Automatisierungen und AI Lösungen für Schweizer KMU, Selbständige und lokale Unternehmen, inklusive Design, Umsetzung, Hosting und laufende Betreuung.',
    whyPoints: [
      { title: 'Klarer Ablauf statt Projektchaos', text: 'Jeder Schritt hat ein Ziel und ein Ergebnis. Dadurch bleibt das Projekt übersichtlich.' },
      { title: 'Transparente Kosten', text: 'Das Abo Modell macht die Investition planbar und vermeidet eine hohe Einmalrechnung.' },
      { title: 'Weniger Technikaufwand', text: 'semanu übernimmt Hosting, Wartung und technische Pflege, damit Sie sich auf Ihr Geschäft konzentrieren können.' },
      { title: 'Lösungen mit langfristiger Betreuung', text: 'Nach dem Launch bleiben Ihre Lösungen nicht allein. Sie bleiben Teil eines betreuten Systems.' },
      { title: 'Schneller gebaut mit AI', text: 'Weil wir mit AI arbeiten, bauen wir Ihre Lösungen schneller und kosteneffizienter als klassische Agenturen, ohne Abstriche bei der Qualität.' },
    ],
    faqHeading: 'Häufige Fragen zum Ablauf',
    faq: [
      { q: 'Wie lange dauert es, bis meine Lösung live ist?', a: 'Das hängt vom Umfang, den vorhandenen Inhalten und dem Feedback ab. Einfache Lösungen können schneller umgesetzt werden als umfangreiche Projekte. Den konkreten Zeitplan besprechen wir vor dem Start transparent.' },
      { q: 'Wann beginnt das Projekt?', a: 'Der Projektstart erfolgt nach Auswahl der passenden Lösung, Zahlung und sobald die notwendigen Informationen vorliegen. Je nach Vereinbarung kann der Start innerhalb weniger Werktage erfolgen.' },
      { q: 'Muss ich schon fertige Texte oder Daten haben?', a: 'Nein. Vorhandene Texte, Stichpunkte oder Daten helfen und müssen nicht perfekt sein. semanu unterstützt bei Struktur, Formulierungen und klaren Inhalten.' },
      { q: 'Kann ich Feedback geben?', a: 'Ja. Feedback ist ein fester Teil des Prozesses. Sie prüfen Struktur, Inhalte und Design, bevor Ihre Lösung final live geht.' },
      { q: 'Was passiert, wenn ich keine Bilder habe?', a: 'Wenn keine passenden Bilder vorhanden sind, können wir gemeinsam klären, welche Bildwelt sinnvoll ist und welche Alternativen zur Verfügung stehen.' },
      { q: 'Was passiert nach dem Launch?', a: 'Nach dem Launch bleibt semanu für Hosting, Wartung, technische Pflege und Betreuung zuständig. Anpassungen können je nach Abo und Vereinbarung umgesetzt werden.' },
      { q: 'Kann ich später weitere Lösungen ergänzen?', a: 'Ja. Zusätzliche Seiten, Funktionen oder ganze Lösungen wie ein Portal oder eine Automatisierung können später je nach Abo, Umfang und Vereinbarung ergänzt werden.' },
      { q: 'Muss ich mich um Hosting oder Updates kümmern?', a: 'Nein. Hosting, technische Pflege und Wartung sind Teil der laufenden Betreuung.' },
      { q: 'Ist SEO im Ablauf enthalten?', a: 'Ja, bei Websites werden SEO Grundlagen von Anfang an berücksichtigt. Dazu gehören Struktur, Überschriften, Meta Daten, technische Grundlagen und verständliche Inhalte. Konkrete Rankings können nicht garantiert werden.' },
    ],
    finalHeading: 'Bereit für Ihre digitale Aufstellung ohne technischen Aufwand?',
    finalText:
      'Lassen Sie uns kurz anschauen, welche digitalen Lösungen zu Ihrem Unternehmen passen und wie der Ablauf für Ihr Projekt aussehen würde.',
    linksHeading: 'Mehr erfahren',
    links: [
      { href: '/services', label: 'Alle Leistungen' },
      { href: '/website-analyse', label: 'Kostenlose Website Analyse' },
      { href: '/website-abos', label: 'Preise und Abos' },
      { href: '/website-erstellen-lassen-schweiz', label: 'Website erstellen lassen' },
      { href: '/website-betreuung-schweiz', label: 'Website Betreuung' },
      { href: '/seo-basis-fuer-kmu', label: 'SEO Basis für KMU' },
      { href: '/referenzen', label: 'Referenzen' },
      { href: '/kontakt', label: 'Kontakt' },
    ],
  },

  fr: {
    title: 'Comment se passe la collaboration avec semanu',
    description:
      'Découvrez comment se déroule la collaboration avec semanu: faire connaissance, analyser les besoins, blueprint, réalisation, mise en ligne et suivi continu de vos solutions digitales.',
    eyebrow: 'Déroulement · Collaboration digitale',
    h1: 'Voici comment naît votre configuration digitale avec semanu',
    sub: 'Un processus clair, un suivi personnel et des étapes transparentes, de la première idée au suivi continu de vos solutions digitales.',
    support:
      'Avec semanu, vous n’avez ni structure technique à planifier, ni hébergement à configurer, ni mises à jour à gérer. Nous vous guidons étape par étape et vous montrons à tout moment ce qui se passe ensuite.',
    heroBullets: [
      'Déroulement clair, de l’analyse à la mise en ligne',
      'Un accompagnement personnel plutôt qu’un processus d’agence anonyme',
      'Retour et validation avant la réalisation finale',
      'Sites, portails, CRM, automatisations et AI d’une seule main',
    ],
    primaryCta: { label: 'Réserver un appel stratégique', href: '/kontakt' },
    secondaryCta: { label: 'Voir les prix', href: '/website-abos' },
    reassureHeading: 'Un processus qui réduit l’incertitude',
    reassureText:
      'semanu travaille avec un déroulement clair pour qu’une solution digitale ne paraisse pas compliquée. Vous savez à tout moment ce qui se passe, ce que nous prenons en charge et ce dont nous avons besoin de votre part, qu’il s’agisse d’un site, d’un portail, d’un CRM ou d’une automatisation.',
    reassureCards: [
      {
        title: 'Vous savez ce qui se passe ensuite',
        text: 'Chaque étape a un objectif clair. Vous voyez quand nous avons besoin d’informations, quand un retour est attendu et quand quelque chose est validé.',
      },
      {
        title: 'Vous n’avez pas besoin de connaissances techniques',
        text: 'Hébergement, réalisation technique, maintenance et exploitation de vos solutions sont de notre ressort. Vous vous concentrez sur votre entreprise.',
      },
      {
        title: 'Vous donnez votre avis avant la mise en ligne',
        text: 'Votre solution n’est pas publiée sans concertation. Vous avez la possibilité de vérifier les maquettes et les contenus.',
      },
    ],
    timelineHeading: 'Le déroulement en 5 étapes claires',
    timelineIntro:
      'Du premier échange au suivi continu, le processus reste clair. Le calendrier exact dépend de l’ampleur, des contenus et des retours.',
    timelineSteps: ['Faire connaissance', 'Analyser vos besoins', 'Créer le blueprint', 'Design et réalisation', 'Mise en ligne et suivi'],
    stepsHeading: 'Chaque étape en détail',
    stepLabels: {
      happens: 'Ce qui se passe',
      semanuDoes: 'Ce qu’semanu prend en charge',
      weNeed: 'Ce dont nous avons besoin de vous',
      result: 'Résultat de cette étape',
    },
    steps: [
      {
        title: 'Faire connaissance et clarifier les objectifs',
        happens:
          'Nous regardons ensemble ce que vous voulez atteindre sur le plan digital: plus de demandes, une image plus professionnelle, une meilleure visibilité, des processus plus efficaces, une relation client plus étroite ou plus de visibilité sur vos données.',
        semanuDoes:
          'Nous posons les bonnes questions, examinons votre situation et donnons un avis honnête sur la configuration digitale qui convient à votre entreprise.',
        weNeed:
          'Une courte description de votre entreprise, de vos prestations et de vos objectifs. Une préparation parfaite n’est pas nécessaire.',
        result: 'Vous savez si semanu convient à votre projet et sur quoi nous mettons l’accent.',
      },
      {
        title: 'Analyser vos besoins',
        happens:
          'Ensemble nous analysons de quelles solutions digitales votre entreprise a vraiment besoin: site web, CRM, automatisations, portail client, tableaux de bord ou support AI.',
        semanuDoes:
          'Nous écoutons, examinons vos processus et recommandons honnêtement ce qui a du sens en premier et ce qui peut attendre.',
        weNeed:
          'Un aperçu de vos processus actuels et de là où vous perdez du temps ou laissez passer des opportunités aujourd’hui.',
        result: 'Vous savez quelles solutions ont du sens et dans quel ordre.',
        note: 'Analyse business pour les projets logiciels: portails, CRM, tableaux de bord et automatisations commencent par une analyse business approfondie. Nous regardons à quel point vos processus sont standardisés. Nous définissons les attentes et les critères techniques à l’avance. La force de ces projets se trouve dans la préparation.',
      },
      {
        title: 'Blueprint, structure et contenus',
        happens:
          'Avant de construire, un plan clair de votre solution est établi. Nous définissons la structure, les contenus ou les flux de données, les messages les plus importants et les prochaines étapes.',
        semanuDoes:
          'Nous structurons votre solution pour que les visiteurs et les utilisateurs comprennent vite qui vous êtes, ce que vous proposez et comment tout s’articule.',
        weNeed:
          'Les textes existants, des notes, le logo, des images, des exemples ou un aperçu de vos outils, si disponibles. Si tout n’est pas encore prêt, nous aidons pour la structure et la formulation.',
        result: 'Un blueprint clair de votre solution, qui sert de base au design et à la réalisation.',
      },
      {
        title: 'Design et réalisation technique',
        happens:
          'Sur la base du blueprint, nous concevons et développons votre solution. Nous veillons à des contenus clairs, à l’affichage mobile, à une technique propre et, selon la solution, aux bases SEO ou à des flux de données propres.',
        semanuDoes:
          'Nous nous occupons du design, de la réalisation responsive, de la structure technique, des intégrations, des automatisations et de tout ce qui doit tourner en arrière-plan.',
        weNeed:
          'Vos retours sur la maquette, les contenus et le design. Vous n’avez aucune décision technique à prendre.',
        result:
          'Une solution professionnelle qui fonctionne sur ordinateur, tablette et smartphone et qui est prête pour la vérification finale.',
      },
      {
        title: 'Mise en ligne et suivi continu',
        happens:
          'Après votre validation, votre solution est mise en ligne. Ensuite semanu reste à vos côtés pour l’hébergement, la maintenance, l’entretien technique et le suivi.',
        semanuDoes:
          'Nous nous occupons de l’exploitation technique, de la maintenance, de la sécurité et, selon l’abonnement ou l’accord, des adaptations et extensions futures.',
        weNeed:
          'Votre validation finale et, plus tard, un retour si des contenus ou des fonctions doivent être adaptés.',
        result: 'Votre configuration digitale est en ligne et reste suivie sur le plan technique.',
      },
    ],
    notYouHeading: 'Ce que vous n’avez pas à gérer',
    notYouIntro:
      'Beaucoup de clientes et clients viennent chez semanu parce qu’ils veulent une configuration digitale professionnelle et n’ont pas le temps pour la technique, les outils et la maintenance.',
    notYouItems: [
      'Vous ne configurez aucun hébergement.',
      'Vous ne gérez aucune mise à jour ni extension.',
      'Vous ne planifiez aucune structure technique.',
      'Vous n’avez pas à savoir comment le SEO ou les intégrations fonctionnent en détail.',
      'Vous n’apportez pas de textes ni de données parfaits.',
      'Vous ne gérez aucune mise à jour de sécurité.',
      'Vous ne coordonnez pas plusieurs prestataires.',
      'Vous ne prenez aucune décision de design seul.',
    ],
    notYouClosing:
      'Nous vous guidons à travers les décisions importantes et prenons en charge la partie technique en arrière-plan.',
    weNeedHeading: 'Ce dont nous avons besoin de votre part',
    weNeedIntro:
      'Pour que votre solution corresponde à votre entreprise, nous avons besoin de quelques informations. Elles ne doivent pas être préparées parfaitement.',
    weNeedItems: [
      'une courte description de votre entreprise',
      'vos prestations ou offres les plus importantes',
      'un logo, des couleurs ou des éléments graphiques existants, si disponibles',
      'des textes existants, des notes ou un aperçu de vos processus, si disponibles',
      'des images ou des idées d’images, si disponibles',
      'les possibilités de contact ou les interfaces souhaitées',
      'des retours sur la structure, le design et les contenus',
      'la validation finale avant la mise en ligne',
    ],
    weNeedClosing: 'S’il vous manque des contenus, nous aidons pour la structure et la formulation.',
    afterHeading: 'Après la mise en ligne, votre solution reste suivie',
    afterText:
      'Une solution digitale n’est pas simplement terminée après sa mise en ligne. Technique, sécurité, hébergement et contenus doivent être suivis de façon fiable. C’est précisément pour cela que le suivi continu est une partie importante de la collaboration avec semanu.',
    afterCards: [
      {
        title: 'Hébergement et exploitation technique',
        text: 'Votre solution reste en ligne et suivie sur le plan technique, sans que vous deviez gérer l’hébergement.',
      },
      {
        title: 'Maintenance et sécurité',
        text: 'Nous nous occupons de l’entretien technique et des bases de sécurité, pour que votre solution reste fiable.',
      },
      {
        title: 'Bases SEO',
        text: 'Votre site est construit pour que Google comprenne mieux les contenus, la structure et les pages. Les classements ne sont pas garantis.',
      },
      {
        title: 'Adaptations et extensions au besoin',
        text: 'Si des contenus, des pages ou des fonctions doivent être adaptés ou ajoutés plus tard, cela peut être réalisé selon l’abonnement et l’accord.',
      },
    ],
    whyHeading: 'Pourquoi ce processus fonctionne pour les PME suisses',
    whyText:
      'Les PME, les indépendants et les commerces locaux n’ont en général pas besoin d’une structure d’agence trop complexe. Ils ont besoin d’un interlocuteur clair, d’étapes compréhensibles, de coûts transparents et de solutions digitales qui fonctionnent de façon fiable.',
    entitySentence:
      'semanu est un partenaire digital basé à Berne et développe des sites, des portails, des systèmes CRM, des automatisations et des solutions AI pour les PME suisses, les indépendants et les commerces locaux, design, réalisation, hébergement et suivi continu compris.',
    whyPoints: [
      { title: 'Déroulement clair plutôt que chaos de projet', text: 'Chaque étape a un objectif et un résultat. Le projet reste ainsi clair.' },
      { title: 'Coûts transparents', text: 'Le modèle d’abonnement rend l’investissement prévisible et évite une grosse facture unique.' },
      { title: 'Moins de charge technique', text: 'semanu prend en charge l’hébergement, la maintenance et l’entretien technique, pour que vous vous concentriez sur votre activité.' },
      { title: 'Des solutions avec un suivi durable', text: 'Après la mise en ligne, vos solutions ne sont pas laissées seules. Elles restent partie d’un système suivi.' },
      { title: 'Construit plus vite avec l’AI', text: 'Parce que nous travaillons avec l’AI, nous construisons vos solutions plus vite et à moindre coût que les agences classiques, sans compromis sur la qualité.' },
    ],
    faqHeading: 'Questions fréquentes sur le déroulement',
    faq: [
      { q: 'Combien de temps avant que ma solution soit en ligne?', a: 'Cela dépend de l’ampleur, des contenus disponibles et des retours. Les solutions simples peuvent être réalisées plus vite que les projets étendus. Nous discutons du calendrier concret de façon transparente avant le début.' },
      { q: 'Quand le projet commence?', a: 'Le démarrage a lieu après le choix de la solution adaptée, le paiement et dès que les informations nécessaires sont disponibles. Selon l’accord, le travail peut démarrer en quelques jours ouvrables.' },
      { q: 'Je dois déjà avoir des textes ou des données finis?', a: 'Non. Des textes existants, des notes ou des données aident et ne doivent pas être parfaits. semanu soutient pour la structure, les formulations et des contenus clairs.' },
      { q: 'Je peux donner mon avis?', a: 'Oui. Le retour fait partie intégrante du processus. Vous vérifiez la structure, les contenus et le design avant la mise en ligne finale de votre solution.' },
      { q: 'Et si je n’ai pas d’images?', a: 'S’il n’y a pas d’images adaptées, nous pouvons clarifier ensemble quel univers visuel a du sens et quelles alternatives existent.' },
      { q: 'Et après la mise en ligne?', a: 'Après la mise en ligne, semanu reste responsable de l’hébergement, de la maintenance, de l’entretien technique et du suivi. Les adaptations peuvent être réalisées selon l’abonnement et l’accord.' },
      { q: 'Je peux ajouter d’autres solutions plus tard?', a: 'Oui. Des pages, des fonctions ou des solutions entières comme un portail ou une automatisation peuvent être ajoutées plus tard selon l’abonnement, l’ampleur et l’accord.' },
      { q: 'Je dois m’occuper de l’hébergement ou des mises à jour?', a: 'Non. L’hébergement, l’entretien technique et la maintenance font partie du suivi continu.' },
      { q: 'Le SEO est compris dans le déroulement?', a: 'Oui, pour les sites les bases SEO sont prises en compte dès le début. Cela comprend la structure, les titres, les métadonnées, des bases techniques et des contenus compréhensibles. Les classements concrets ne peuvent pas être garantis.' },
    ],
    finalHeading: 'Prêt pour votre configuration digitale sans charge technique?',
    finalText:
      'Regardons brièvement quelles solutions digitales conviennent à votre entreprise et à quoi ressemblerait le déroulement pour votre projet.',
    linksHeading: 'En savoir plus',
    links: [
      { href: '/services', label: 'Tous les services' },
      { href: '/website-analyse', label: 'Analyse gratuite du site' },
      { href: '/website-abos', label: 'Prix et abonnements' },
      { href: '/website-erstellen-lassen-schweiz', label: 'Faire créer son site' },
      { href: '/website-betreuung-schweiz', label: 'Suivi de site' },
      { href: '/seo-basis-fuer-kmu', label: 'Bases SEO pour PME' },
      { href: '/referenzen', label: 'Références' },
      { href: '/kontakt', label: 'Contact' },
    ],
  },

  en: {
    title: 'How working with semanu works',
    description:
      'See how working with semanu works: getting to know you, analysing your needs, blueprint, build, launch and ongoing support of your digital solutions.',
    eyebrow: 'Process · Digital partnership',
    h1: 'How your digital setup comes to life with semanu',
    sub: 'A clear process, personal support and transparent steps, from the first idea to ongoing care of your digital solutions.',
    support:
      'With semanu you don’t plan a technical structure, set up hosting or manage updates. We guide you step by step through the process and show you at any time what happens next.',
    heroBullets: [
      'A clear process from analysis to launch',
      'Personal guidance instead of an anonymous agency process',
      'Feedback and approval before the final build',
      'Websites, portals, CRM, automations and AI from one partner',
    ],
    primaryCta: { label: 'Book a strategy call', href: '/kontakt' },
    secondaryCta: { label: 'See pricing', href: '/website-abos' },
    reassureHeading: 'A process that reduces uncertainty',
    reassureText:
      'semanu works with a clear process so a digital solution never feels complicated. You know at any time what happens, what we take care of and what we need from you, whether it is a website, a portal, a CRM or an automation.',
    reassureCards: [
      {
        title: 'You know what happens next',
        text: 'Every step has a clear goal. You see when we need information, when feedback is asked for and when something is approved.',
      },
      {
        title: 'You don’t need technical knowledge',
        text: 'Hosting, technical build, maintenance and running your solutions are on us. You focus on your business.',
      },
      {
        title: 'You give feedback before the launch',
        text: 'Your solution is not simply published without consultation. You get the chance to review drafts and content.',
      },
    ],
    timelineHeading: 'The process in 5 clear steps',
    timelineIntro:
      'From the first conversation to ongoing support, the process stays clear. The exact timeline depends on the scope, the content and the feedback.',
    timelineSteps: ['Getting to know you', 'Analyse your needs', 'Create the blueprint', 'Design and build', 'Launch and support'],
    stepsHeading: 'Every step in detail',
    stepLabels: {
      happens: 'What happens?',
      semanuDoes: 'What semanu takes care of',
      weNeed: 'What we need from you',
      result: 'Result of this step',
    },
    steps: [
      {
        title: 'Getting to know you and clarifying the goals',
        happens:
          'We look together at what you want to achieve digitally: more enquiries, a more professional image, better visibility, more efficient processes, closer customer relationships or more overview of your data.',
        semanuDoes:
          'We ask the right questions, review your starting point and give an honest assessment of which digital setup fits your business.',
        weNeed:
          'A short description of your business, your services and your goals. Perfect preparation is not needed.',
        result: 'You know whether semanu fits your plan and where we put the focus.',
      },
      {
        title: 'Analysing your needs',
        happens:
          'Together we analyse which digital solutions your business really needs: website, CRM, automations, customer portal, dashboards or AI support.',
        semanuDoes:
          'We listen, review your processes and honestly recommend what makes sense first and what can wait.',
        weNeed:
          'Insight into your current processes and where you lose time or miss opportunities today.',
        result: 'You know which solutions make sense and in which order.',
        note: 'Business analysis for software projects: portals, CRM, dashboards and automations start with a thorough business analysis. We look at how standardised your processes are. We set out the expectations and technical criteria upfront. The strength of these projects lies in the preparation.',
      },
      {
        title: 'Blueprint, structure and content',
        happens:
          'Before any build, a clear plan for your solution is created. We define the structure, content or data flows, key messages and the next steps.',
        semanuDoes:
          'We structure your solution so visitors and users quickly understand who you are, what you offer and how everything fits together.',
        weNeed:
          'Existing texts, notes, logo, images, examples or a look into your tools, if available. If not everything is ready, we help with structure and wording.',
        result: 'A clear blueprint for your solution that serves as the basis for design and build.',
      },
      {
        title: 'Design and technical build',
        happens:
          'Based on the blueprint, we design and develop your solution. We pay attention to clear content, mobile display, clean technology and, depending on the solution, SEO foundations or clean data flows.',
        semanuDoes:
          'We take care of design, responsive build, technical structure, integrations, automations and everything that needs to run in the background.',
        weNeed:
          'Feedback on the draft, content and design. You don’t have to make any technical decisions.',
        result:
          'A professional solution that works on desktop, tablet and smartphone and is ready for the final review.',
      },
      {
        title: 'Launch and ongoing support',
        happens:
          'After your approval your solution goes live. Then semanu stays at your side for hosting, maintenance, technical care and support.',
        semanuDoes:
          'We take care of the technical operation, maintenance, security and, depending on the plan or agreement, later adjustments and extensions.',
        weNeed:
          'Your final approval and, later, feedback if content or functions should be adjusted.',
        result: 'Your digital setup is live and stays technically supported.',
      },
    ],
    notYouHeading: 'What you don’t have to do yourself',
    notYouIntro:
      'Many customers come to semanu because they want a professional digital setup and don’t have time for technology, tools and maintenance.',
    notYouItems: [
      'You don’t set up hosting.',
      'You don’t manage any updates or extensions.',
      'You don’t plan a technical structure.',
      'You don’t need to know how SEO or integrations work in detail.',
      'You don’t bring perfect texts or data.',
      'You don’t manage any security updates.',
      'You don’t coordinate several providers.',
      'You don’t make design decisions alone.',
    ],
    notYouClosing:
      'We guide you through the important decisions and take care of the technical part in the background.',
    weNeedHeading: 'What we need from you',
    weNeedIntro:
      'So your solution fits your business, we need some information. It does not have to be perfectly prepared.',
    weNeedItems: [
      'a short description of your business',
      'your most important services or offers',
      'an existing logo, colours or design elements, if available',
      'existing texts, notes or a look into your processes, if available',
      'images or image ideas, if available',
      'the contact options or interfaces you want',
      'feedback on structure, design and content',
      'final approval before launch',
    ],
    weNeedClosing: 'If you are missing content, we help with structure and wording.',
    afterHeading: 'After launch your solution stays supported',
    afterText:
      'A digital solution is not simply finished after launch. Technology, security, hosting and content need to be supported reliably. That is exactly why ongoing support is an important part of working with semanu.',
    afterCards: [
      {
        title: 'Hosting and technical operation',
        text: 'Your solution stays online and technically supported, without you managing hosting yourself.',
      },
      {
        title: 'Maintenance and security',
        text: 'We take care of technical care and security basics, so your solution stays reliable.',
      },
      {
        title: 'SEO foundations',
        text: 'Your website is built so Google can better understand content, structure and pages. Rankings are not guaranteed.',
      },
      {
        title: 'Adjustments and extensions when needed',
        text: 'If content, pages or functions should be adjusted or added later, this can be done depending on the plan and agreement.',
      },
    ],
    whyHeading: 'Why this process works for Swiss SMEs',
    whyText:
      'SMEs, self employed people and local businesses usually don’t need an over complicated agency structure. They need a clear contact, understandable steps, transparent costs and digital solutions that work reliably.',
    entitySentence:
      'semanu is a digital partner from Bern and builds websites, portals, CRM systems, automations and AI solutions for Swiss SMEs, self employed people and local businesses, including design, build, hosting and ongoing support.',
    whyPoints: [
      { title: 'A clear process instead of project chaos', text: 'Every step has a goal and a result. That keeps the project clear.' },
      { title: 'Transparent costs', text: 'The subscription model makes the investment predictable and avoids a large one time invoice.' },
      { title: 'Less technical effort', text: 'semanu takes care of hosting, maintenance and technical care, so you can focus on your business.' },
      { title: 'Solutions with long term support', text: 'After launch your solutions are not left alone. They stay part of a supported system.' },
      { title: 'Built faster with AI', text: 'Because we work with AI, we build your solutions faster and at a lower cost than traditional agencies, without compromising on quality.' },
    ],
    faqHeading: 'Frequently asked questions about the process',
    faq: [
      { q: 'How long does it take until my solution is live?', a: 'That depends on the scope, the available content and the feedback. Simple solutions can be built faster than extensive projects. We discuss the concrete timeline transparently before the start.' },
      { q: 'When does the project start?', a: 'The project starts after choosing the right solution, payment and once the necessary information is available. Depending on the agreement, the work can start within a few working days.' },
      { q: 'Do I need finished texts or data already?', a: 'No. Existing texts, notes or data help and don’t have to be perfect. semanu supports with structure, wording and clear content.' },
      { q: 'Can I give feedback?', a: 'Yes. Feedback is a fixed part of the process. You review structure, content and design before your solution finally goes live.' },
      { q: 'What happens if I have no images?', a: 'If there are no suitable images, we can clarify together which visual style makes sense and which alternatives are available.' },
      { q: 'What happens after launch?', a: 'After launch semanu stays responsible for hosting, maintenance, technical care and support. Adjustments can be done depending on the plan and agreement.' },
      { q: 'Can I add more solutions later?', a: 'Yes. Additional pages, functions or whole solutions like a portal or an automation can be added later depending on the plan, scope and agreement.' },
      { q: 'Do I have to deal with hosting or updates?', a: 'No. Hosting, technical care and maintenance are part of the ongoing support.' },
      { q: 'Is SEO included in the process?', a: 'Yes, for websites SEO foundations are considered from the start. This includes structure, headings, meta data, technical foundations and understandable content. Concrete rankings cannot be guaranteed.' },
    ],
    finalHeading: 'Ready for your digital setup without technical effort?',
    finalText:
      'Let us briefly look at which digital solutions fit your business and what the process would look like for your project.',
    linksHeading: 'Learn more',
    links: [
      { href: '/services', label: 'All services' },
      { href: '/website-analyse', label: 'Free website analysis' },
      { href: '/website-abos', label: 'Pricing and plans' },
      { href: '/website-erstellen-lassen-schweiz', label: 'Have a website made' },
      { href: '/website-betreuung-schweiz', label: 'Website care' },
      { href: '/seo-basis-fuer-kmu', label: 'SEO basics for SMEs' },
      { href: '/referenzen', label: 'References' },
      { href: '/kontakt', label: 'Contact' },
    ],
  },

  es: {
    title: 'Así funciona la colaboración con semanu',
    description:
      'Descubra cómo se desarrolla la colaboración con semanu: conocernos, analizar las necesidades, blueprint, realización, lanzamiento y soporte continuo de sus soluciones digitales.',
    eyebrow: 'Proceso · Colaboración digital',
    h1: 'Así nace su configuración digital con semanu',
    sub: 'Un proceso claro, atención personal y pasos transparentes, desde la primera idea hasta el soporte continuo de sus soluciones digitales.',
    support:
      'Con semanu no tiene que planificar ninguna estructura técnica, configurar hosting ni gestionar actualizaciones. Le guiamos paso a paso por el proceso y le mostramos en todo momento lo que ocurre a continuación.',
    heroBullets: [
      'Proceso claro desde el análisis hasta el lanzamiento',
      'Acompañamiento personal en lugar de un proceso de agencia anónimo',
      'Feedback y aprobación antes de la realización final',
      'Websites, portales, CRM, automatizaciones y AI de una sola mano',
    ],
    primaryCta: { label: 'Reservar una llamada estratégica', href: '/kontakt' },
    secondaryCta: { label: 'Ver los precios', href: '/website-abos' },
    reassureHeading: 'Un proceso que reduce la incertidumbre',
    reassureText:
      'semanu trabaja con un proceso claro para que una solución digital no parezca complicada. Sabe en todo momento lo que ocurre, lo que asumimos nosotros y lo que necesitamos de usted, ya se trate de una web, un portal, un CRM o una automatización.',
    reassureCards: [
      {
        title: 'Sabe lo que ocurre a continuación',
        text: 'Cada paso tiene un objetivo claro. Ve cuándo necesitamos información, cuándo hace falta feedback y cuándo se aprueba algo.',
      },
      {
        title: 'No necesita conocimientos técnicos',
        text: 'Del hosting, la realización técnica, el mantenimiento y la operación de sus soluciones nos ocupamos nosotros. Usted se concentra en su empresa.',
      },
      {
        title: 'Da su feedback antes del lanzamiento',
        text: 'Su solución no se publica sin más sin consultarle. Recibe la posibilidad de revisar los borradores y los contenidos.',
      },
    ],
    timelineHeading: 'El proceso en 5 pasos claros',
    timelineIntro:
      'Desde la primera conversación hasta el soporte continuo, el proceso se mantiene claro. El calendario exacto depende del alcance, los contenidos y el feedback.',
    timelineSteps: ['Conocernos', 'Analizar las necesidades', 'Crear el blueprint', 'Diseño y realización', 'Lanzamiento y soporte'],
    stepsHeading: 'Cada paso en detalle',
    stepLabels: {
      happens: 'Qué ocurre?',
      semanuDoes: 'De qué se ocupa semanu?',
      weNeed: 'Qué necesitamos de usted?',
      result: 'Resultado de este paso',
    },
    steps: [
      {
        title: 'Conocernos y aclarar los objetivos',
        happens:
          'Vemos juntos lo que quiere lograr en el ámbito digital: más solicitudes, una imagen más profesional, mejor visibilidad, procesos más eficientes, una relación más estrecha con los clientes o más visión de conjunto sobre sus datos.',
        semanuDoes:
          'Hacemos las preguntas adecuadas, revisamos su situación de partida y damos una valoración honesta sobre qué configuración digital encaja con su empresa.',
        weNeed:
          'Una breve descripción de su empresa, sus servicios y sus objetivos. No hace falta una preparación perfecta.',
        result: 'Sabe si semanu encaja con su proyecto y en qué ponemos el foco.',
      },
      {
        title: 'Analizar sus necesidades',
        happens:
          'Juntos analizamos qué soluciones digitales necesita realmente su empresa: web, CRM, automatizaciones, portal de clientes, dashboards o soporte con AI.',
        semanuDoes:
          'Escuchamos, revisamos sus procesos y recomendamos con honestidad qué tiene sentido primero y qué puede esperar.',
        weNeed:
          'Una visión de sus procesos actuales y de dónde pierde tiempo hoy o deja pasar oportunidades.',
        result: 'Sabe qué soluciones tienen sentido y en qué orden.',
        note: 'Análisis de negocio para proyectos de software: los portales, el CRM, los dashboards y las automatizaciones empiezan con un análisis de negocio a fondo. Revisamos cuán estandarizados están sus procesos. Fijamos de antemano las expectativas y los criterios técnicos. La fuerza de estos proyectos está en la preparación.',
      },
      {
        title: 'Blueprint, estructura y contenidos',
        happens:
          'Antes de construir surge un plan claro para su solución. Definimos la estructura, los contenidos o los flujos de datos, los mensajes más importantes y los siguientes pasos.',
        semanuDoes:
          'Estructuramos su solución de forma que los visitantes y los usuarios entiendan rápido quién es usted, qué ofrece y cómo encaja todo.',
        weNeed:
          'Textos existentes, notas, logo, imágenes, ejemplos o una mirada a sus herramientas, si están disponibles. Si todavía no está todo listo, ayudamos con la estructura y la redacción.',
        result: 'Un blueprint claro para su solución que sirve de base para el diseño y la realización.',
      },
      {
        title: 'Diseño y realización técnica',
        happens:
          'Sobre la base del blueprint diseñamos y desarrollamos su solución. Cuidamos los contenidos claros, la visualización móvil, la limpieza técnica y las bases de SEO o unos flujos de datos limpios según la solución.',
        semanuDoes:
          'Nos ocupamos del diseño, la realización responsive, la estructura técnica, las integraciones, las automatizaciones y todo lo que debe funcionar en segundo plano.',
        weNeed:
          'Feedback sobre el borrador, los contenidos y el diseño. No tiene que tomar ninguna decisión técnica.',
        result:
          'Una solución profesional que funciona en ordenador, tablet y smartphone y está lista para la revisión final.',
      },
      {
        title: 'Lanzamiento y soporte continuo',
        happens:
          'Tras su aprobación su solución se pone en marcha. Después semanu permanece a su lado para el hosting, el mantenimiento, el cuidado técnico y el soporte.',
        semanuDoes:
          'Nos ocupamos de la operación técnica, del mantenimiento, de la seguridad y de posteriores ajustes y ampliaciones según el plan o el acuerdo.',
        weNeed:
          'Su aprobación final y más adelante su feedback si hay que ajustar contenidos o funciones.',
        result: 'Su configuración digital está en marcha y sigue con soporte técnico.',
      },
    ],
    notYouHeading: 'Lo que no tiene que hacer usted mismo',
    notYouIntro:
      'Muchos clientes acuden a semanu porque quieren una configuración digital profesional y no tienen tiempo para la tecnología, las herramientas y el mantenimiento.',
    notYouItems: [
      'No tiene que configurar hosting.',
      'No tiene que gestionar actualizaciones ni ampliaciones.',
      'No tiene que planificar ninguna estructura técnica.',
      'No tiene que saber cómo funcionan en detalle el SEO o las integraciones.',
      'No tiene que aportar textos o datos perfectos.',
      'No tiene que gestionar actualizaciones de seguridad.',
      'No tiene que coordinar varios proveedores.',
      'No tiene que tomar solo las decisiones de diseño.',
    ],
    notYouClosing:
      'Le guiamos a través de las decisiones importantes y asumimos la parte técnica en segundo plano.',
    weNeedHeading: 'Lo que necesitamos de usted',
    weNeedIntro:
      'Para que su solución encaje con su empresa necesitamos algo de información. No tiene que estar preparada a la perfección.',
    weNeedItems: [
      'una breve descripción de su empresa',
      'sus servicios u ofertas más importantes',
      'logo, colores o elementos de diseño existentes, si están disponibles',
      'textos existentes, notas o una mirada a sus procesos, si están disponibles',
      'imágenes o ideas de imágenes, si están disponibles',
      'las opciones de contacto o interfaces que desee',
      'feedback sobre la estructura, el diseño y los contenidos',
      'la aprobación final antes del lanzamiento',
    ],
    weNeedClosing: 'Si le faltan contenidos, ayudamos con la estructura y la redacción.',
    afterHeading: 'Tras el lanzamiento su solución sigue con soporte',
    afterText:
      'Una solución digital no está simplemente terminada tras el lanzamiento. La tecnología, la seguridad, el hosting y los contenidos necesitan un soporte fiable. Precisamente por eso el soporte continuo es una parte importante de la colaboración con semanu.',
    afterCards: [
      {
        title: 'Hosting y operación técnica',
        text: 'Su solución permanece en línea y con soporte técnico, sin que tenga que gestionar usted mismo el hosting.',
      },
      {
        title: 'Mantenimiento y seguridad',
        text: 'Nos ocupamos del cuidado técnico y las bases de seguridad, para que su solución siga siendo fiable.',
      },
      {
        title: 'Bases de SEO',
        text: 'Su web se construye de forma que Google pueda entender mejor los contenidos, la estructura y las páginas. No se garantizan los rankings.',
      },
      {
        title: 'Ajustes y ampliaciones cuando haga falta',
        text: 'Si más adelante hay que ajustar o ampliar contenidos, páginas o funciones, esto se puede realizar según el plan y el acuerdo.',
      },
    ],
    whyHeading: 'Por qué este proceso funciona para las pymes suizas',
    whyText:
      'Las pymes, los autónomos y las empresas locales no suelen necesitar una estructura de agencia demasiado complicada. Necesitan un contacto claro, pasos comprensibles, costes transparentes y soluciones digitales que funcionen de forma fiable.',
    entitySentence:
      'semanu es un partner digital de Berna y desarrolla websites, portales, sistemas CRM, automatizaciones y soluciones de AI para pymes suizas, autónomos y empresas locales, incluidos diseño, realización, hosting y soporte continuo.',
    whyPoints: [
      { title: 'Proceso claro en lugar de caos de proyecto', text: 'Cada paso tiene un objetivo y un resultado. Así el proyecto se mantiene claro.' },
      { title: 'Costes transparentes', text: 'El modelo de suscripción hace la inversión previsible y evita una factura única elevada.' },
      { title: 'Menos esfuerzo técnico', text: 'semanu asume el hosting, el mantenimiento y el cuidado técnico, para que pueda concentrarse en su negocio.' },
      { title: 'Soluciones con soporte a largo plazo', text: 'Tras el lanzamiento sus soluciones no se quedan solas. Siguen formando parte de un sistema con soporte.' },
      { title: 'Construido más rápido con AI', text: 'Como trabajamos con AI, construimos sus soluciones más rápido y de forma más rentable que las agencias clásicas, sin renunciar a la calidad.' },
    ],
    faqHeading: 'Preguntas frecuentes sobre el proceso',
    faq: [
      { q: 'Cuánto tarda hasta que mi solución está en marcha?', a: 'Depende del alcance, de los contenidos disponibles y del feedback. Las soluciones sencillas se pueden realizar más rápido que los proyectos amplios. El calendario concreto lo hablamos de forma transparente antes de empezar.' },
      { q: 'Cuándo empieza el proyecto?', a: 'El proyecto empieza tras elegir la solución adecuada, el pago y en cuanto está disponible la información necesaria. Según el acuerdo, el inicio puede producirse en pocos días laborables.' },
      { q: 'Tengo que tener ya textos o datos terminados?', a: 'No. Los textos, las notas o los datos existentes ayudan y no tienen que ser perfectos. semanu apoya con la estructura, las formulaciones y los contenidos claros.' },
      { q: 'Puedo dar feedback?', a: 'Sí. El feedback es una parte fija del proceso. Revisa la estructura, los contenidos y el diseño antes de que su solución se ponga en marcha definitivamente.' },
      { q: 'Qué pasa si no tengo imágenes?', a: 'Si no hay imágenes adecuadas, podemos aclarar juntos qué mundo visual tiene sentido y qué alternativas hay disponibles.' },
      { q: 'Qué pasa tras el lanzamiento?', a: 'Tras el lanzamiento semanu sigue siendo responsable del hosting, el mantenimiento, el cuidado técnico y el soporte. Los ajustes se pueden realizar según el plan y el acuerdo.' },
      { q: 'Puedo añadir más soluciones más adelante?', a: 'Sí. Páginas adicionales, funciones o soluciones enteras como un portal o una automatización se pueden añadir más adelante según el plan, el alcance y el acuerdo.' },
      { q: 'Tengo que ocuparme del hosting o de las actualizaciones?', a: 'No. El hosting, el cuidado técnico y el mantenimiento forman parte del soporte continuo.' },
      { q: 'Está el SEO incluido en el proceso?', a: 'Sí, en las webs las bases de SEO se tienen en cuenta desde el principio. Entre ellas están la estructura, los títulos, los metadatos, las bases técnicas y los contenidos comprensibles. No se pueden garantizar rankings concretos.' },
    ],
    finalHeading: 'Listo para su configuración digital sin esfuerzo técnico?',
    finalText:
      'Veamos brevemente qué soluciones digitales encajan con su empresa y cómo sería el proceso para su proyecto.',
    linksHeading: 'Más información',
    links: [
      { href: '/services', label: 'Todos los servicios' },
      { href: '/website-analyse', label: 'Análisis gratuito de la web' },
      { href: '/website-abos', label: 'Precios y suscripciones' },
      { href: '/website-erstellen-lassen-schweiz', label: 'Encargar una web' },
      { href: '/website-betreuung-schweiz', label: 'Mantenimiento web' },
      { href: '/seo-basis-fuer-kmu', label: 'Bases de SEO para pymes' },
      { href: '/referenzen', label: 'Referencias' },
      { href: '/kontakt', label: 'Contacto' },
    ],
  },

  nl: {
    title: 'Zo verloopt de samenwerking met semanu',
    description:
      'Ontdek hoe de samenwerking met semanu verloopt: kennismaken, behoeften analyseren, blueprint, uitvoering, lancering en doorlopende begeleiding van uw digitale oplossingen.',
    eyebrow: 'Verloop · Digitale samenwerking',
    h1: 'Zo ontstaat uw digitale opzet met semanu',
    sub: 'Een helder proces, persoonlijke begeleiding en transparante stappen, van het eerste idee tot de doorlopende begeleiding van uw digitale oplossingen.',
    support:
      'Met semanu hoeft u geen technische structuur te plannen, geen hosting in te richten en geen updates te beheren. Wij begeleiden u stap voor stap door het proces en tonen u op elk moment wat er als volgende gebeurt.',
    heroBullets: [
      'Helder verloop van de analyse tot de lancering',
      'Persoonlijke begeleiding in plaats van een anoniem agentschapsproces',
      'Feedback en goedkeuring voor de finale uitvoering',
      'Websites, portalen, CRM, automatiseringen en AI uit een hand',
    ],
    primaryCta: { label: 'Strategiegesprek boeken', href: '/kontakt' },
    secondaryCta: { label: 'Prijzen bekijken', href: '/website-abos' },
    reassureHeading: 'Een proces dat onzekerheid vermindert',
    reassureText:
      'semanu werkt met een helder verloop zodat een digitale oplossing niet ingewikkeld lijkt. U weet op elk moment wat er gebeurt, wat wij overnemen en wat wij van u nodig hebben. Dat geldt voor een website, een portaal, een CRM of een automatisering.',
    reassureCards: [
      {
        title: 'U weet wat er als volgende gebeurt',
        text: 'Elke stap heeft een helder doel. U ziet wanneer wij informatie nodig hebben, wanneer feedback wordt gevraagd en wanneer iets wordt goedgekeurd.',
      },
      {
        title: 'U hebt geen technische kennis nodig',
        text: 'Hosting, technische uitvoering, onderhoud en het draaien van uw oplossingen nemen wij op ons. U concentreert zich op uw onderneming.',
      },
      {
        title: 'U geeft feedback voor de lancering',
        text: 'Uw oplossing wordt niet zomaar zonder overleg gepubliceerd. U krijgt de kans om ontwerpen en inhoud te controleren.',
      },
    ],
    timelineHeading: 'Het verloop in 5 heldere stappen',
    timelineIntro:
      'Van het eerste gesprek tot de doorlopende begeleiding blijft het proces overzichtelijk. Het exacte tijdschema hangt af van de omvang, de inhoud en de feedback.',
    timelineSteps: ['Kennismaken', 'Behoeften analyseren', 'Blueprint opstellen', 'Design en uitvoering', 'Lancering en begeleiding'],
    stepsHeading: 'Elke stap in detail',
    stepLabels: {
      happens: 'Wat gebeurt er?',
      semanuDoes: 'Wat neemt semanu over?',
      weNeed: 'Wat hebben wij van u nodig?',
      result: 'Resultaat van deze stap',
    },
    steps: [
      {
        title: 'Kennismaken en doelen verhelderen',
        happens:
          'Wij kijken samen naar wat u digitaal wilt bereiken: meer aanvragen, een professioneler voorkomen, betere vindbaarheid, efficientere processen, een hechtere klantenbinding of meer overzicht over uw data.',
        semanuDoes:
          'Wij stellen de juiste vragen, bekijken uw uitgangssituatie en geven een eerlijke inschatting welke digitale opzet bij uw onderneming past.',
        weNeed:
          'Een korte beschrijving van uw onderneming, uw diensten en uw doelen. Een perfecte voorbereiding is niet nodig.',
        result: 'U weet of semanu bij uw plan past en waarop wij de focus leggen.',
      },
      {
        title: 'Uw behoeften analyseren',
        happens:
          'Samen analyseren wij welke digitale oplossingen uw onderneming echt nodig heeft: website, CRM, automatiseringen, klantenportaal, dashboards of AI ondersteuning.',
        semanuDoes:
          'Wij luisteren, bekijken uw processen en adviseren eerlijk wat eerst zinvol is en wat kan wachten.',
        weNeed:
          'Een inkijk in uw huidige processen en waar u vandaag tijd verliest of kansen laat liggen.',
        result: 'U weet welke oplossingen zinvol zijn en in welke volgorde.',
        note: 'Business analyse voor softwareprojecten: portalen, CRM, dashboards en automatiseringen starten met een grondige business analyse. Wij bekijken hoe gestandaardiseerd uw processen zijn. Verwachtingen en technische criteria leggen wij vooraf vast. De kracht van deze projecten ligt in de voorbereiding.',
      },
      {
        title: 'Blueprint, structuur en inhoud',
        happens:
          'Voordat er gebouwd wordt ontstaat een helder plan voor uw oplossing. Wij bepalen structuur, inhoud of dataflows, de belangrijkste boodschappen en de volgende stappen.',
        semanuDoes:
          'Wij structureren uw oplossing zo dat bezoekers en gebruikers snel begrijpen wie u bent, wat u aanbiedt en hoe alles samenwerkt.',
        weNeed:
          'Bestaande teksten, steekwoorden, logo, beelden, voorbeelden of een blik in uw tools, indien voorhanden. Als nog niet alles klaar is helpen wij bij structuur en formulering.',
        result: 'Een heldere blueprint voor uw oplossing die als basis voor design en uitvoering dient.',
      },
      {
        title: 'Design en technische uitvoering',
        happens:
          'Op basis van de blueprint ontwerpen en ontwikkelen wij uw oplossing. Daarbij letten wij op heldere inhoud, mobiele weergave, technische zuiverheid en afhankelijk van de oplossing op SEO grondslagen of zuivere dataflows.',
        semanuDoes:
          'Wij zorgen voor design, responsieve uitvoering, technische structuur, integraties, automatiseringen en alles wat op de achtergrond moet draaien.',
        weNeed:
          'Feedback op ontwerp, inhoud en vormgeving. U hoeft geen technische beslissingen te nemen.',
        result:
          'Een professionele oplossing die op desktop, tablet en smartphone werkt en klaar is voor de finale controle.',
      },
      {
        title: 'Lancering en doorlopende begeleiding',
        happens:
          'Na uw goedkeuring gaat uw oplossing live. Daarna blijft semanu voor hosting, onderhoud, technische verzorging en begeleiding aan uw zijde.',
        semanuDoes:
          'Wij zorgen voor het technische beheer, onderhoud, veiligheid en afhankelijk van abonnement of afspraak voor latere aanpassingen en uitbreidingen.',
        weNeed:
          'Uw finale goedkeuring en later terugkoppeling als inhoud of functies aangepast moeten worden.',
        result: 'Uw digitale opzet is live en blijft technisch begeleid.',
      },
    ],
    notYouHeading: 'Wat u niet zelf hoeft te doen',
    notYouIntro:
      'Veel klanten komen bij semanu omdat zij een professionele digitale opzet willen en geen tijd hebben voor techniek, tools en onderhoud.',
    notYouItems: [
      'U hoeft geen hosting in te richten.',
      'U hoeft geen updates of uitbreidingen te beheren.',
      'U hoeft geen technische structuur te plannen.',
      'U hoeft niet te weten hoe SEO of integraties in detail werken.',
      'U hoeft geen perfecte teksten of data mee te brengen.',
      'U hoeft geen veiligheidsupdates te beheren.',
      'U hoeft geen meerdere dienstverleners te coordineren.',
      'U hoeft geen designbeslissingen alleen te nemen.',
    ],
    notYouClosing:
      'Wij begeleiden u door de belangrijke beslissingen en nemen het technische deel op de achtergrond over.',
    weNeedHeading: 'Wat wij van u nodig hebben',
    weNeedIntro:
      'Opdat uw oplossing bij uw onderneming past hebben wij enkele gegevens nodig. Deze hoeven niet perfect voorbereid te zijn.',
    weNeedItems: [
      'een korte beschrijving van uw onderneming',
      'uw belangrijkste diensten of aanbiedingen',
      'bestaand logo, kleuren of vormgevingselementen, indien voorhanden',
      'bestaande teksten, steekwoorden of een inkijk in uw processen, indien voorhanden',
      'beelden of beeldideeen, indien voorhanden',
      'gewenste contactmogelijkheden of koppelingen',
      'feedback op structuur, design en inhoud',
      'finale goedkeuring voor de lancering',
    ],
    weNeedClosing: 'Als u inhoud mist helpen wij bij structuur en formulering.',
    afterHeading: 'Na de lancering blijft uw oplossing begeleid',
    afterText:
      'Een digitale oplossing is na de lancering niet zomaar klaar. Techniek, veiligheid, hosting en inhoud moeten betrouwbaar begeleid worden. Precies daarom is de doorlopende begeleiding een belangrijk deel van de samenwerking met semanu.',
    afterCards: [
      {
        title: 'Hosting en technisch beheer',
        text: 'Uw oplossing blijft online en technisch begeleid, zonder dat u zelf hosting hoeft te beheren.',
      },
      {
        title: 'Onderhoud en veiligheid',
        text: 'Wij zorgen voor technische verzorging en veiligheidsgrondslagen, zodat uw oplossing betrouwbaar blijft.',
      },
      {
        title: 'SEO grondslagen',
        text: 'Uw website wordt zo opgebouwd dat Google inhoud, structuur en paginas beter kan begrijpen. Rankings worden niet gegarandeerd.',
      },
      {
        title: 'Aanpassingen en uitbreidingen bij behoefte',
        text: 'Als later inhoud, paginas of functies aangepast of aangevuld moeten worden kan dit afhankelijk van abonnement en afspraak uitgevoerd worden.',
      },
    ],
    whyHeading: 'Waarom dit proces voor Zwitserse kmo werkt',
    whyText:
      'Kmo, zelfstandigen en lokale ondernemingen hebben meestal geen te ingewikkelde agentschapsstructuur nodig. Zij hebben een helder aanspreekpunt nodig, begrijpelijke stappen, transparante kosten en digitale oplossingen die betrouwbaar werken.',
    entitySentence:
      'semanu is een digitale partner uit Bern en ontwikkelt websites, portalen, CRM systemen, automatiseringen en AI oplossingen voor Zwitserse kmo, zelfstandigen en lokale ondernemingen, inclusief design, uitvoering, hosting en doorlopende begeleiding.',
    whyPoints: [
      { title: 'Helder verloop in plaats van projectchaos', text: 'Elke stap heeft een doel en een resultaat. Daardoor blijft het project overzichtelijk.' },
      { title: 'Transparante kosten', text: 'Het abonnementsmodel maakt de investering planbaar en vermijdt een hoge eenmalige rekening.' },
      { title: 'Minder technische inspanning', text: 'semanu neemt hosting, onderhoud en technische verzorging over, zodat u zich op uw zaak kunt concentreren.' },
      { title: 'Oplossingen met langdurige begeleiding', text: 'Na de lancering blijven uw oplossingen niet alleen. Zij blijven deel van een begeleid systeem.' },
      { title: 'Sneller gebouwd met AI', text: 'Omdat wij met AI werken bouwen wij uw oplossingen sneller en kostenefficienter dan klassieke agentschappen, zonder in te boeten op kwaliteit.' },
    ],
    faqHeading: 'Veelgestelde vragen over het verloop',
    faq: [
      { q: 'Hoe lang duurt het tot mijn oplossing live is?', a: 'Dat hangt af van de omvang, de aanwezige inhoud en de feedback. Eenvoudige oplossingen kunnen sneller uitgevoerd worden dan uitgebreide projecten. Het concrete tijdschema bespreken wij transparant voor de start.' },
      { q: 'Wanneer begint het project?', a: 'De projectstart gebeurt na keuze van de passende oplossing, betaling en zodra de nodige informatie voorhanden is. Afhankelijk van de afspraak kan de start binnen enkele werkdagen plaatsvinden.' },
      { q: 'Moet ik al klare teksten of data hebben?', a: 'Nee. Bestaande teksten, steekwoorden of data helpen en hoeven niet perfect te zijn. semanu ondersteunt bij structuur, formuleringen en heldere inhoud.' },
      { q: 'Kan ik feedback geven?', a: 'Ja. Feedback is een vast deel van het proces. U controleert structuur, inhoud en design voordat uw oplossing finaal live gaat.' },
      { q: 'Wat gebeurt er als ik geen beelden heb?', a: 'Als er geen passende beelden voorhanden zijn kunnen wij samen verhelderen welke beeldwereld zinvol is en welke alternatieven beschikbaar zijn.' },
      { q: 'Wat gebeurt er na de lancering?', a: 'Na de lancering blijft semanu verantwoordelijk voor hosting, onderhoud, technische verzorging en begeleiding. Aanpassingen kunnen afhankelijk van abonnement en afspraak uitgevoerd worden.' },
      { q: 'Kan ik later meer oplossingen aanvullen?', a: 'Ja. Extra paginas, functies of hele oplossingen zoals een portaal of een automatisering kunnen later afhankelijk van abonnement, omvang en afspraak aangevuld worden.' },
      { q: 'Moet ik mij om hosting of updates bekommeren?', a: 'Nee. Hosting, technische verzorging en onderhoud zijn deel van de doorlopende begeleiding.' },
      { q: 'Is SEO in het verloop inbegrepen?', a: 'Ja, bij websites worden SEO grondslagen van bij het begin meegenomen. Daarbij horen structuur, koppen, metadata, technische grondslagen en begrijpelijke inhoud. Concrete rankings kunnen niet gegarandeerd worden.' },
    ],
    finalHeading: 'Klaar voor uw digitale opzet zonder technische inspanning?',
    finalText:
      'Laten wij kort bekijken welke digitale oplossingen bij uw onderneming passen en hoe het verloop voor uw project eruit zou zien.',
    linksHeading: 'Meer weten',
    links: [
      { href: '/services', label: 'Alle diensten' },
      { href: '/website-analyse', label: 'Gratis website analyse' },
      { href: '/website-abos', label: 'Prijzen en abonnementen' },
      { href: '/website-erstellen-lassen-schweiz', label: 'Website laten maken' },
      { href: '/website-betreuung-schweiz', label: 'Website begeleiding' },
      { href: '/seo-basis-fuer-kmu', label: 'SEO basis voor kmo' },
      { href: '/referenzen', label: 'Referenties' },
      { href: '/kontakt', label: 'Contact' },
    ],
  },
};
