// Structured content for the SEO landing pages. Kept as typed modules (not
// message JSON) so the long-form copy stays readable and the message files
// stay lean. One LandingContent per locale, per slug.

export type LandingSection = {
  heading: string;
  body: string;
  points?: string[];
  /** Optional icon for the section's visual panel (resolved by LandingIcon). */
  icon?: string;
};

export type LandingLink = {
  href: string;
  label: string;
  desc?: string;
};

export type LandingStat = {
  icon: string;
  value: string;
  label?: string;
};

export type LandingFeature = {
  /** Icon name resolved by LandingIcon. */
  icon: string;
  title: string;
  /** Short explanation, shown by default on the tile face (desktop). */
  text: string;
  /** Fuller explanation shown on hover (desktop) and inline on touch. */
  detail?: string;
  /** Two concrete points shown together with the detail. */
  points?: string[];
};

export type LandingCta = { label: string; href: string };

export type LandingBenefit = { icon: string; title: string; text: string };

/** A small title + text card (problem cards, process steps, reasons). */
export type LandingCard = { title: string; text: string };

/** A pricing teaser card. */
export type LandingPlanCard = { name: string; price: string; desc: string; points: string[] };

export type LandingFaq = { q: string; a: string };

export type LandingContent = {
  /** SEO <title> (without the "· semanu.eu" suffix, added by the page). */
  title: string;
  /** Meta description. */
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  /** Optional trust stats shown in a band under the hero. */
  stats?: LandingStat[];
  /** Optional heading above the feature tiles. */
  featuresHeading?: string;
  /** Optional hover hint under the heading (shown on desktop only). */
  featuresHint?: string;
  /** Feature layout: 'reveal' (hover-reveal tiles, default) or 'cards' (always-visible grid). */
  featuresLayout?: 'reveal' | 'cards';
  /** Optional feature tiles with hover-reveal explanations. */
  features?: LandingFeature[];
  sections: LandingSection[];
  /** Internal link cards. The first entry doubles as the hero's secondary CTA. */
  links: LandingLink[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;

  // ── Optional rich blocks. The fully-built SEO landing pages use these; older
  //    pages omit them and just render hero/stats/features/sections/links/CTA.
  /** Hero trust bullets, shown under the intro (visible in the first mobile viewport). */
  heroBullets?: string[];
  /** Hero secondary CTA. Defaults to /kontakt + ctaButton when omitted. */
  heroSecondaryCta?: LandingCta;
  /** Trust/benefit bar under the hero. */
  benefits?: LandingBenefit[];
  /** Problem-recognition block. */
  problem?: { heading: string; intro: string; cards?: LandingCard[] };
  /** Solution block (heading + body). */
  solution?: { heading: string; body: string };
  /** Numbered process steps. */
  process?: { heading: string; steps: LandingCard[] };
  /** Pricing teaser cards. */
  pricing?: {
    heading: string;
    intro: string;
    note: string;
    cta: LandingCta;
    cards: LandingPlanCard[];
  };
  /** Why-choose-us reasons, with an optional GEO entity sentence. */
  reasons?: { heading: string; entitySentence?: string; items: LandingCard[] };
  /** Ideal-customer block. */
  audience?: { heading: string; intro: string; items: string[]; closing?: string };
  /** FAQ accordion (also emitted as FAQPage schema). */
  faq?: { heading: string; items: LandingFaq[] };
};

export type LandingLocale = 'de' | 'fr' | 'en';
export type LandingLocales = Record<LandingLocale, LandingContent>;
