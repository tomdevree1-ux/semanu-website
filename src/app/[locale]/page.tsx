import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo/metadata';
import { Link } from '@/i18n/navigation';
import { SiteShell } from '@/components/SiteShell';
import { BrandText } from '@/components/BrandText';
import { ServicesPuzzle } from '@/components/ServicesPuzzle';
import { HomeFacts } from '@/components/HomeFacts';
import { JsonLd } from '@/components/JsonLd';
import { serviceLinks, type ServicesLocale } from '@/content/services';
import { env } from '@/lib/env';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    de: 'amai · Digitaler Partner für Schweizer KMU',
    fr: 'amai · Partenaire digital pour PME suisses',
    en: 'amai · Digital partner for Swiss SMEs',
    es: 'amai · Socio digital para pymes suizas',
    nl: 'amai · Digitale partner voor Zwitserse kmo’s',
  };
  const descriptions: Record<string, string> = {
    de: 'amai ist der digitale Partner für Schweizer KMU: 3D-Konfiguratoren und Unternehmenssoftware nach Mass, mit AI als Motor. Schneller und günstiger digitalisieren.',
    fr: 'amai est le partenaire digital des PME suisses: configurateurs 3D et logiciels d’entreprise sur mesure, avec l’AI comme moteur. Digitaliser plus vite et à moindre coût.',
    en: 'amai is the digital partner for Swiss SMEs: 3D configurators and custom business software, with AI as the engine. Digitalise faster and more affordably.',
    es: 'amai es el socio digital para pymes suizas: configuradores 3D y software empresarial a medida, con la AI como motor. Digitalizar más rápido y más económico.',
    nl: 'amai is de digitale partner voor Zwitserse kmo’s: 3D-configuratoren en bedrijfssoftware op maat, met AI als motor. Sneller en voordeliger digitaliseren.',
  };
  const title = titles[locale] ?? titles.nl;
  return pageMetadata({ title, description: descriptions[locale] ?? descriptions.nl, path: '', locale });
}

// Shared, locale-independent media for the two featured cases.
const CASE_MEDIA = [
  { img: '/portfolio/poortland-mockup.jpg', href: '/referenzen' },
  { img: '/portfolio/amai-kastenconfigurator.jpg', href: '/referenzen' },
];

type HomeContent = {
  hero: { h1: string; sub: string; cta: string };
  kloof: { title: string; p1: string; p2: string };
  servicesHead: { title: string };
  trio: { title: string; text: string }[];
  factsHead: { title: string; link: string };
  facts: { value: number | null; prefix?: string; label: string; desc: string }[];
  aiNative: { body: string; cta: string };
  refHead: { title: string; link: string };
  refIntro: string;
  cases: { label: string; client: string; text: string; alt: string }[];
  final: { title: string; cta: string };
};

const en: HomeContent = {
  hero: {
    h1: 'Turning ambition into digital advantage.',
    sub: 'amai! is the digital partner for Swiss SMEs. We build 3D configurators and custom business software. With AI as the engine you digitalise faster and more affordably than with a traditional approach.',
    cta: 'Start the conversation',
  },
  kloof: {
    title: 'Falling behind digitally',
    p1: 'Your team copies data between systems, quotes take manual work and customer information is scattered across CRM, ERP and spreadsheets. Existing software no longer fits your processes or systems work together poorly. That costs time, causes errors and makes further growth harder.',
    p2: 'At the same time the digital standard in the market keeps rising. Customers expect speed, simplicity and a seamless experience across every touchpoint. When your organisation cannot keep up with that evolution, friction grows with direct consequences for efficiency, conversion, customer retention and your position in the market.',
  },
  servicesHead: { title: 'From advice to execution.' },
  trio: [
    { title: 'One plan', text: 'Strong results start with a clear plan that connects your processes and goals.' },
    { title: 'One team', text: 'Advice, design and engineering in one team, with AI as an amplifier instead of silos.' },
    { title: 'One partner', text: 'From strategy to execution, without handovers or gaps in the flow. Focused on the long term.' },
  ],
  factsHead: { title: 'Why businesses choose amai!', link: 'About us' },
  facts: [
    { value: 1, label: 'point of contact', desc: 'You always talk to the same person.' },
    { value: 10, prefix: '+', label: 'years experience', desc: 'More than ten years of digital projects for SMEs.' },
    { value: 125, prefix: '+', label: 'projects', desc: 'Delivered for SMEs across many sectors.' },
    { value: null, prefix: 'AI', label: 'driven', desc: 'AI as the engine but only where it is demonstrably useful.' },
  ],
  aiNative: {
    body: 'We use AI as an amplifier, not a replacement. Our experts combine AI with human expertise to make software development, business processes and digital workflows faster and smarter. Control stays with our people: through continuous feedback they review and improve what AI produces. The result is better software, more efficient processes and faster digital solutions for your business.',
    cta: 'Start the conversation',
  },
  refHead: { title: 'From expertise to measurable results.', link: 'All client stories' },
  refIntro:
    'See how amai! helps Swiss SMEs digitalise with 3D configurators and custom business software, with concrete results from practice.',
  cases: [
    {
      label: 'Business software',
      client: 'Poortland',
      text: 'From first customer contact to installation: quoting, production and planning connected in one digital flow.',
      alt: 'Poortland website on a laptop',
    },
    {
      label: '3D configurator',
      client: 'amai! interactive kiosk',
      text: 'Customers configure their products themselves on an immersive interactive kiosk, live in 3D and with the right price straight away.',
      alt: 'amai! interactive kiosk in a showroom',
    },
  ],
  final: { title: 'Ready to grow digitally without the technical hassle?', cta: 'Start the conversation' },
};

const de: HomeContent = {
  hero: {
    h1: 'Von Ambition zu digitalem Vorsprung.',
    sub: 'amai! ist der digitale Partner für Schweizer KMU. Wir bauen 3D-Konfiguratoren und Unternehmenssoftware nach Mass. Mit AI als Motor digitalisieren Sie schneller und günstiger als mit einem traditionellen Ansatz.',
    cta: 'Gespräch starten',
  },
  kloof: {
    title: 'Digital im Rückstand',
    p1: 'Ihr Team kopiert Daten zwischen Systemen, Offerten erfordern manuelle Arbeit und Kundendaten sind über CRM, ERP und Tabellen verteilt. Bestehende Software passt nicht mehr zu Ihren Prozessen oder Systeme arbeiten zu wenig zusammen. Das kostet Zeit, verursacht Fehler und erschwert weiteres Wachstum.',
    p2: 'Gleichzeitig steigt der digitale Standard im Markt. Kunden erwarten Tempo, Einfachheit und ein nahtloses Erlebnis über jeden Kontaktpunkt. Wenn Ihre Organisation dieser Entwicklung nicht folgen kann, wächst die Reibung mit direkten Folgen für Effizienz, Conversion, Kundenbindung und Ihre Position im Markt.',
  },
  servicesHead: { title: 'Von Beratung bis Umsetzung.' },
  trio: [
    { title: 'Ein Plan', text: 'Starke Resultate beginnen mit einem klaren Plan, der Ihre Prozesse und Ziele verbindet.' },
    { title: 'Ein Team', text: 'Beratung, Design und Entwicklung in einem Team, mit AI als Verstärker statt Silos.' },
    { title: 'Ein Partner', text: 'Von der Strategie bis zur Umsetzung, ohne Übergaben oder Lücken im Ablauf. Auf lange Sicht ausgerichtet.' },
  ],
  factsHead: { title: 'Warum Unternehmen amai! wählen.', link: 'Über uns' },
  facts: [
    { value: 1, label: 'Ansprechpartner', desc: 'Sie sprechen immer mit derselben Person.' },
    { value: 10, prefix: '+', label: 'Jahre Erfahrung', desc: 'Über zehn Jahre digitale Projekte für KMU.' },
    { value: 125, prefix: '+', label: 'Projekte', desc: 'Für KMU in unterschiedlichen Branchen umgesetzt.' },
    { value: null, prefix: 'AI', label: 'driven', desc: 'AI als Motor aber nur dort, wo es nachweisbar nützlich ist.' },
  ],
  aiNative: {
    body: 'Wir setzen AI als Verstärker ein, nicht als Ersatz. Unsere Experten kombinieren AI mit menschlicher Expertise, um Softwareentwicklung, Geschäftsprozesse und digitale Workflows schneller und intelligenter zu machen. Die Kontrolle bleibt bei unseren Menschen: über kontinuierliches Feedback prüfen und verbessern sie die Ergebnisse der AI. So entstehen bessere Software, effizientere Prozesse und schnellere digitale Lösungen für Ihr Unternehmen.',
    cta: 'Gespräch starten',
  },
  refHead: { title: 'Von Expertise zu messbarem Resultat.', link: 'Alle Referenzen' },
  refIntro:
    'Entdecken Sie, wie amai! Schweizer KMU beim Digitalisieren hilft mit 3D-Konfiguratoren und Unternehmenssoftware nach Mass, mit konkreten Resultaten aus der Praxis.',
  cases: [
    {
      label: 'Unternehmenssoftware',
      client: 'Poortland',
      text: 'Vom ersten Kundenkontakt bis zur Montage: Offerte, Produktion und Planung verbunden in einem digitalen Ablauf.',
      alt: 'Poortland Website auf einem Laptop',
    },
    {
      label: '3D-Konfigurator',
      client: 'amai! interaktiver Kiosk',
      text: 'Kunden stellen ihre Produkte selbst an einem immersiven interaktiven Kiosk zusammen, live in 3D und sofort mit dem richtigen Preis.',
      alt: 'amai! interaktiver Kiosk in einem Showroom',
    },
  ],
  final: { title: 'Bereit, digital zu wachsen ohne technischen Aufwand?', cta: 'Gespräch starten' },
};

const fr: HomeContent = {
  hero: {
    h1: 'De l’ambition à l’avance digitale.',
    sub: 'amai! est le partenaire digital des PME suisses. Nous construisons des configurateurs 3D et des logiciels d’entreprise sur mesure. Avec l’AI comme moteur vous digitalisez plus vite et à moindre coût qu’avec une approche traditionnelle.',
    cta: 'Démarrer la conversation',
  },
  kloof: {
    title: 'En retard sur le digital',
    p1: 'Votre équipe copie des données entre les systèmes, les devis demandent un travail manuel et les informations clients sont dispersées entre CRM, ERP et tableurs. Les logiciels existants ne correspondent plus à vos processus ou les systèmes collaborent mal. Cela coûte du temps, génère des erreurs et complique la croissance.',
    p2: 'En même temps, le standard digital du marché ne cesse de monter. Les clients attendent de la rapidité, de la simplicité et une expérience fluide à chaque point de contact. Quand votre organisation ne suit pas cette évolution, la friction augmente avec des conséquences directes sur l’efficacité, la conversion, la fidélisation et votre position sur le marché.',
  },
  servicesHead: { title: 'Du conseil à l’exécution.' },
  trio: [
    { title: 'Un plan', text: 'Les bons résultats commencent par un plan clair qui relie vos processus et vos objectifs.' },
    { title: 'Une équipe', text: 'Conseil, design et développement dans une seule équipe, avec l’AI comme amplificateur plutôt que des silos.' },
    { title: 'Un partenaire', text: 'De la stratégie à l’exécution, sans transferts ni ruptures dans le flux. Orienté long terme.' },
  ],
  factsHead: { title: 'Pourquoi les entreprises choisissent amai!', link: 'À propos' },
  facts: [
    { value: 1, label: 'interlocuteur', desc: 'Vous parlez toujours à la même personne.' },
    { value: 10, prefix: '+', label: 'ans d’expérience', desc: 'Plus de dix ans de projets digitaux pour les PME.' },
    { value: 125, prefix: '+', label: 'projets', desc: 'Livrés pour des PME dans des secteurs variés.' },
    { value: null, prefix: 'AI', label: 'driven', desc: 'l’AI comme moteur mais seulement là où elle est réellement utile.' },
  ],
  aiNative: {
    body: 'Nous utilisons l’AI comme amplificateur, pas comme remplacement. Nos experts combinent l’AI avec l’expertise humaine pour rendre le développement logiciel, les processus métier et les workflows digitaux plus rapides et plus intelligents. Le contrôle reste chez nos équipes: grâce à un feedback continu, elles évaluent et améliorent les résultats de l’AI. Ainsi nous obtenons de meilleurs logiciels, des processus plus efficaces et des solutions digitales plus rapides pour votre entreprise.',
    cta: 'Démarrer la conversation',
  },
  refHead: { title: 'De l’expertise à des résultats mesurables.', link: 'Toutes les références' },
  refIntro:
    'Découvrez comment amai! aide les PME suisses à se digitaliser avec des configurateurs 3D et des logiciels d’entreprise sur mesure, avec des résultats concrets issus du terrain.',
  cases: [
    {
      label: 'Logiciel d’entreprise',
      client: 'Poortland',
      text: 'Du premier contact client à la pose: devis, production et planification reliés dans un seul flux digital.',
      alt: 'Site Poortland sur un ordinateur portable',
    },
    {
      label: 'Configurateur 3D',
      client: 'amai! kiosque interactif',
      text: 'Les clients configurent leurs produits sur un kiosque interactif immersif, en direct en 3D et avec le bon prix tout de suite.',
      alt: 'Kiosque interactif amai! dans un showroom',
    },
  ],
  final: { title: 'Prêt à grandir digitalement sans tracas technique?', cta: 'Démarrer la conversation' },
};

const es: HomeContent = {
  hero: {
    h1: 'De la ambición a la ventaja digital.',
    sub: 'amai! es el socio digital para pymes suizas. Creamos configuradores 3D y software empresarial a medida. Con la AI como motor digitaliza más rápido y de forma más económica que con un enfoque tradicional.',
    cta: 'Iniciar la conversación',
  },
  kloof: {
    title: 'Rezago digital',
    p1: 'Su equipo copia datos entre sistemas, los presupuestos exigen trabajo manual y la información de clientes está dispersa entre CRM, ERP y hojas de cálculo. El software existente ya no encaja con sus procesos o los sistemas colaboran poco. Eso cuesta tiempo, provoca errores y dificulta seguir creciendo.',
    p2: 'Al mismo tiempo, el estándar digital del mercado no deja de subir. Los clientes esperan rapidez, sencillez y una experiencia fluida en cada punto de contacto. Cuando su organización no puede seguir esa evolución, la fricción crece con consecuencias directas en la eficiencia, la conversión, la retención de clientes y su posición en el mercado.',
  },
  servicesHead: { title: 'Del asesoramiento a la ejecución.' },
  trio: [
    { title: 'Un plan', text: 'Los buenos resultados empiezan con un plan claro que conecta sus procesos y objetivos.' },
    { title: 'Un equipo', text: 'Asesoramiento, diseño y desarrollo en un solo equipo, con la AI como amplificador en lugar de silos.' },
    { title: 'Un socio', text: 'De la estrategia a la ejecución, sin traspasos ni huecos en el flujo. Orientado al largo plazo.' },
  ],
  factsHead: { title: 'Por qué las empresas eligen amai!', link: 'Sobre nosotros' },
  facts: [
    { value: 1, label: 'interlocutor', desc: 'Siempre habla con la misma persona.' },
    { value: 10, prefix: '+', label: 'años de experiencia', desc: 'Más de diez años de proyectos digitales para pymes.' },
    { value: 125, prefix: '+', label: 'proyectos', desc: 'Entregados para pymes de sectores muy diversos.' },
    { value: null, prefix: 'AI', label: 'driven', desc: 'la AI como motor pero solo donde resulta demostrablemente útil.' },
  ],
  aiNative: {
    body: 'Usamos la AI como amplificador, no como sustituto. Nuestros expertos combinan la AI con la experiencia humana para hacer el desarrollo de software, los procesos de negocio y los flujos digitales más rápidos e inteligentes. El control sigue en manos de nuestro equipo: mediante feedback continuo revisan y mejoran los resultados de la AI. Así logramos mejor software, procesos más eficientes y soluciones digitales más rápidas para su empresa.',
    cta: 'Iniciar la conversación',
  },
  refHead: { title: 'De la experiencia a resultados medibles.', link: 'Todas las referencias' },
  refIntro:
    'Descubra cómo amai! ayuda a las pymes suizas a digitalizarse con configuradores 3D y software empresarial a medida, con resultados concretos de la práctica.',
  cases: [
    {
      label: 'Software empresarial',
      client: 'Poortland',
      text: 'Del primer contacto con el cliente a la instalación: presupuesto, producción y planificación conectados en un único flujo digital.',
      alt: 'Web de Poortland en un portátil',
    },
    {
      label: 'Configurador 3D',
      client: 'amai! quiosco interactivo',
      text: 'Los clientes configuran sus productos en un quiosco interactivo inmersivo, en directo en 3D y con el precio correcto al instante.',
      alt: 'Quiosco interactivo amai! en un showroom',
    },
  ],
  final: { title: '¿Listo para crecer digitalmente sin complicaciones técnicas?', cta: 'Iniciar la conversación' },
};

const nl: HomeContent = {
  hero: {
    h1: 'Van ambitie naar digitale voorsprong.',
    sub: 'amai! is de digitale partner voor Zwitserse kmo’s. Wij bouwen 3D-configuratoren en bedrijfssoftware op maat. Met AI als motor digitaliseert u sneller en voordeliger dan bij een traditionele aanpak.',
    cta: 'Start het gesprek',
  },
  kloof: {
    title: 'Digitaal achterop',
    p1: 'Uw team kopieert gegevens tussen systemen, offertes vragen manueel werk en klantinformatie zit verspreid over CRM, ERP en spreadsheets. Bestaande software sluit niet meer aan op uw processen of systemen werken onvoldoende samen. Dat kost tijd, veroorzaakt fouten en maakt verdere groei moeilijker.',
    p2: 'Tegelijkertijd stijgt de digitale standaard in de markt. Klanten verwachten snelheid, eenvoud en een naadloze ervaring over elk contactmoment. Wanneer uw organisatie die evolutie niet kan volgen, ontstaat er steeds meer frictie met directe gevolgen voor efficiëntie, conversie, klantretentie en uw positie in de markt.',
  },
  servicesHead: { title: 'Van advies tot uitvoering.' },
  trio: [
    { title: 'Eén plan', text: 'Sterke resultaten beginnen met een helder plan dat uw processen en doelen verbindt.' },
    { title: 'Eén team', text: 'Advies, ontwerp en ontwikkeling in één team, met AI als versterker in plaats van silo’s.' },
    { title: 'Eén partner', text: 'Van strategie tot uitvoering, zonder overdrachten of gaten in de flow. Gericht op lange termijn.' },
  ],
  factsHead: { title: 'Waarom bedrijven voor amai! kiezen.', link: 'Over ons' },
  facts: [
    { value: 1, label: 'aanspreekpunt', desc: 'U praat altijd met dezelfde persoon.' },
    { value: 10, prefix: '+', label: 'jaar ervaring', desc: 'Ruim tien jaar digitale projecten voor kmo’s.' },
    { value: 125, prefix: '+', label: 'projecten', desc: 'Opgeleverd voor kmo’s in uiteenlopende sectoren.' },
    { value: null, prefix: 'AI', label: 'driven', desc: 'AI als motor maar alleen daar waar het aantoonbaar nuttig is.' },
  ],
  aiNative: {
    body: 'Wij zetten AI in als versterker, niet als vervanger. Onze experts combineren AI met menselijke expertise om softwareontwikkeling, bedrijfsprocessen en digitale workflows sneller en slimmer te maken. De controle blijft bij onze mensen: via continue feedback beoordelen en verbeteren zij de output van AI. Zo realiseren we betere software, efficiëntere processen en snellere digitale oplossingen voor uw bedrijf.',
    cta: 'Start het gesprek',
  },
  refHead: { title: 'Van expertise naar meetbaar resultaat.', link: 'Alle referenties' },
  refIntro:
    'Ontdek hoe amai! Zwitserse kmo’s helpt digitaliseren met 3D-configuratoren en bedrijfssoftware op maat met concrete resultaten uit de praktijk.',
  cases: [
    {
      label: 'Bedrijfssoftware',
      client: 'Poortland',
      text: 'Van eerste klantcontact tot plaatsing: offerte, productie en planning verbonden in één digitale flow.',
      alt: 'Poortland website op een laptop',
    },
    {
      label: '3D-configurator',
      client: 'amai! interactieve kiosk',
      text: 'Klanten stellen immersief hun producten zelf samen op een interactieve kiosk, live in 3D en met meteen de juiste prijs.',
      alt: 'amai! interactieve kiosk in een showroom',
    },
  ],
  final: { title: 'Klaar om digitaal te groeien zonder technische rompslomp?', cta: 'Start het gesprek' },
};

const HOME: Record<ServicesLocale, HomeContent> = { en, de, fr, es, nl };

/** A reusable iO-style section header: a large title, an optional ghost pill link
 *  on the right and a hairline rule below. */
function SectionHead({ title, link, href, onDark = false }: { title: string; link?: string; href?: string; onDark?: boolean }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <h2 className={`h2 max-w-[18ch] ${onDark ? 'text-white' : 'text-ink'}`}><BrandText>{title}</BrandText></h2>
        {link && href ? (
          <Link
            href={href}
            className={`btn ${onDark ? 'btn-ghost' : 'btn-ghost-ink'}`}
          >
            {link} <span aria-hidden className="btn-arrow" />
          </Link>
        ) : null}
      </div>
      <div className={`mt-7 h-px ${onDark ? 'bg-white/15' : 'bg-[var(--line)]'}`} />
    </>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = (['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale;
  // Two services only (3D configurators + business software); consultancy is no
  // longer featured on the homepage.
  const services = serviceLinks(loc).filter((s) => s.id !== 'consultancy');
  const h = HOME[loc];
  const cases = h.cases.map((c, i) => ({ ...CASE_MEDIA[i], ...c }));

  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: h.hero.h1,
    description: h.hero.sub.replace('amai!', 'amai'),
    url: `${env.siteUrl}/${locale}`,
    inLanguage: locale,
    isPartOf: { '@id': `${env.siteUrl}/#website` },
    about: { '@id': `${env.siteUrl}/#organization` },
    dateModified: new Date().toISOString().slice(0, 10),
  };

  return (
    <SiteShell>
      <JsonLd data={webPageLd} />

      {/* ── HERO: full-bleed photo (replaceable at /public/hero-home.jpg) ── */}
      <section className="relative -mt-[72px] flex min-h-[88vh] items-end overflow-hidden text-ink">
        <div aria-hidden className="absolute inset-0">
          <Image src="/hero-home.jpg" alt="" fill priority sizes="100vw" className="hero-kenburns object-cover object-center" />
          {/* left scrim keeps the dark text legible over the light sky */}
          <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/70 to-transparent" />
          {/* bottom fade dissolves the photo into the section below */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
        </div>

        <div className="container-site relative pb-[clamp(56px,9vh,120px)] pt-[140px]">
          {/* Fluid hero type: keeps scaling up on large screens so the composition
              stays proportional instead of looking small in a centred column. */}
          {/* Blended size: small vw factor + fixed base so laptop stays ~78px
              (like the earlier version) while large screens keep scaling to ~120px. */}
          <h1 className="max-w-[15ch] font-display font-semibold leading-[1.02] tracking-[-0.03em] text-ink text-[clamp(44px,30px_+_4.2vw,152px)]">
            {h.hero.h1}
          </h1>
          <p className="hero-inkin mt-[clamp(20px,2vw,34px)] max-w-[48ch] leading-[1.55] text-ink-soft text-[clamp(16px,1.35vw,24px)]">
            <BrandText>{h.hero.sub}</BrandText>
          </p>
          <div className="mt-[clamp(28px,3vw,44px)]">
            <Link href="/kontakt" className="btn btn-primary">
              {h.hero.cta} <span aria-hidden className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DE KLOOF GROEIT (problem narrative) ──────────────── */}
      <section className="bg-paper pb-[clamp(64px,10vh,120px)] pt-[clamp(64px,10vh,120px)] text-ink">
        <div className="container-site">
          <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-white lg:grid-cols-2">
            <div className="order-2 p-[clamp(28px,4vw,56px)] lg:order-1">
              <h2 className="h2 text-ink">{h.kloof.title}</h2>
              <p className="lead mt-6 text-ink-soft"><BrandText>{h.kloof.p1}</BrandText></p>
              <p className="mt-5 text-ink-soft"><BrandText>{h.kloof.p2}</BrandText></p>
            </div>
            <div className="relative order-1 min-h-[280px] lg:order-2 lg:min-h-[480px]">
              <Image src="/kloof.jpg" alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── AANPAK: één plan, één team, één partner ───────────── */}
      <section className="bg-band-tint py-[clamp(72px,11vh,140px)] text-ink">
        <div className="container-site">
          <div className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-[auto_1fr]">
            {/* The unifying "1": one approach that ties the three together */}
            <div>
              <span className="block font-display font-semibold leading-[0.74] tracking-[-0.04em] text-navy text-[clamp(150px,24vw,360px)]">
                1
              </span>
            </div>
            {/* Three editorial rows */}
            <div className="border-t border-[var(--line)]">
              {h.trio.map((t) => (
                <div
                  key={t.title}
                  className="grid gap-2 border-b border-[var(--line)] py-7 sm:grid-cols-[13rem_1fr] sm:gap-10 sm:py-8"
                >
                  <h3 className="font-display leading-tight text-navy text-[clamp(22px,2vw,32px)]">
                    <BrandText>{t.title}</BrandText>
                  </h3>
                  <p className="max-w-xl leading-relaxed text-ink-soft text-[clamp(17px,1.6vw,20px)]">
                    <BrandText>{t.text}</BrandText>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REFERENTIES: uitgelichte cases (vroeg op de pagina als proof) ── */}
      <section className="bg-paper py-[clamp(64px,10vh,120px)] text-ink">
        <div className="container-site">
          <SectionHead title={h.refHead.title} link={h.refHead.link} href="/referenzen" />
          <p className="mt-8 max-w-3xl text-[clamp(17px,1.6vw,20px)] text-ink-soft">
            <BrandText>{h.refIntro}</BrandText>
          </p>

          <div className="mt-14 grid gap-x-10 gap-y-14 md:grid-cols-2">
            {cases.map((c) => (
              <Link key={c.client} href={c.href} aria-label={c.client} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)] bg-paper-2">
                  <Image
                    src={c.img}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 768px) 46vw, 100vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-6 flex items-start justify-between gap-6 border-t border-[var(--line)] pt-5">
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-mint-deep">
                      {c.label}
                    </span>
                    <h3 className="mt-2 font-mono text-[22px] font-extrabold leading-tight tracking-[-0.015em] text-navy sm:text-[26px]">
                      {c.client}
                    </h3>
                    <p className="mt-2 max-w-[44ch] text-[clamp(17px,1.6vw,20px)] text-ink-soft">{c.text}</p>
                  </div>
                  <svg
                    aria-hidden
                    viewBox="0 0 14 20"
                    className="mt-1.5 h-5 w-3.5 shrink-0 text-mint-deep transition-transform duration-200 ease-out group-hover:translate-x-1"
                    fill="none"
                  >
                    <path d="M2.2 2.2L11.8 10L2.2 17.8" stroke="currentColor" strokeWidth="4.4" strokeLinejoin="miter" strokeLinecap="butt" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIENSTEN ─────────────────────────────────────────── */}
      <section className="bg-band-tint py-[clamp(64px,10vh,120px)] text-ink">
        <div className="container-site">
          <SectionHead title={h.servicesHead.title} />
          <div className="mt-14">
            <ServicesPuzzle services={services} />
          </div>

          {/* AI Native feature banner */}
          <div
            className="relative mt-16 overflow-hidden rounded-[32px] bg-navy p-[clamp(32px,5vw,72px)] text-white sm:rounded-[40px]"
            style={{
              backgroundImage:
                'radial-gradient(120% 140% at 88% 8%, rgba(147,230,190,0.20), rgba(147,230,190,0) 55%), radial-gradient(90% 120% at 0% 100%, rgba(147,230,190,0.10), rgba(147,230,190,0) 50%)',
            }}
          >
            <div className="relative">
              <h2 className="font-mono text-[clamp(34px,4.5vw,58px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                <span className="text-mint">AI</span> Native
              </h2>
              <p className="mt-5 text-[clamp(17px,1.6vw,20px)] leading-relaxed text-paper/80">{h.aiNative.body}</p>
              <Link href="/kontakt" className="btn btn-spark mt-8">
                {h.aiNative.cta} <span aria-hidden className="btn-arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FACTS & FIGURES (navy) ───────────────────────────── */}
      <section className="bg-paper pb-[clamp(64px,10vh,120px)] text-ink">
        <div className="container-site">
          <div className="rounded-[var(--radius-card)] bg-navy p-[clamp(32px,5vw,64px)] text-paper">
            <SectionHead title={h.factsHead.title} link={h.factsHead.link} href="/about" onDark />
            <HomeFacts facts={h.facts} />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="bg-ink py-[clamp(56px,8vh,100px)] text-paper">
        <div className="container-site flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <h2 className="h2 max-w-[20ch] text-white"><BrandText>{h.final.title}</BrandText></h2>
          <Link href="/kontakt" className="btn btn-spark shrink-0">
            {h.final.cta} <span aria-hidden className="btn-arrow" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
