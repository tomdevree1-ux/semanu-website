// Single source of truth for the pricing configurator (Website tab).
// All amounts in CHF, excluding 8.1 percent MWST. Prices come from the owner's
// final price list. Keep in sync with the AGB (36 month minimum term) and the
// pricing tiles. House style: no hyphenated compounds, Swiss ss, "und" not "&".
//
// The calculation is pure and runs client side; nothing is sent until the
// visitor requests a quote.

export const PRICES = {
  base: 99, // monthly, new site, up to 25 pages
  base26: 199, // monthly, new site, 26 pages or more
  webshop: 150, // monthly, on top of the base
  // Product catalogue surcharges (monthly, on top of the webshop base). Three
  // graduated tiers; 5000 or more products is a flat top tier, not a quote.
  webshopTier1: 150, // 1000 to 2500 products
  webshopTier2: 300, // 2500 to 5000 products
  webshopTier3: 500, // 5000 or more products
  // extra page one time packages (cheapest combination)
  pagePack10: 890,
  pagePack5: 490,
  pagePer: 120,
  // one time, new site
  extraLanguage: 290, // per language, 1 to 3
  structuredData: 350,
  migration: 290,
  logo: 750,
  // one time, webshop
  productImport: 490,
  // one time, existing site
  audit: 190,
  extraLanguageExisting: 490, // per language, 1 to 3
  structuredDataExisting: 490,
  answerBlockPer: 75,
  answerBlockPack10: 690,
  entityLocal: 490,
  analyticsConsent: 290,
  cwvFrom: 390, // quote based, not counted
  accessibilityFrom: 690, // quote based, not counted
  // monthly add ons, both situations
  visibilityLoop: 190,
  visibilityLoopSetup: 490, // one time
  googleAdsMonthly: 190,
  googleAdsSetup: 490, // one time
  contentRetainer: 390,
  reviewManagement: 95,
} as const;

export const PAGE_MIN = 10;
export const PAGE_MAX = 50;
export const PAGE_STEP_199 = 26; // total pages where the monthly becomes 199
export const PRODUCT_MIN = 100;
export const PRODUCT_MAX = 5000; // at the max the slider reads "5000 or more" (flat top tier)
export const PRODUCT_STEP = 100; // the slider jumps per 100
export const WEBSHOP_TIER1 = 1000; // a monthly surcharge starts above 1000 products
export const WEBSHOP_TIER2 = 2500; // a higher surcharge starts above 2500 products

/** Monthly product surcharge on top of the webshop base, by catalogue size. */
export function webshopProductMonthly(products: number): number {
  if (products <= WEBSHOP_TIER1) return 0; // up to 1000
  if (products <= WEBSHOP_TIER2) return PRICES.webshopTier1; // up to 2500
  if (products < PRODUCT_MAX) return PRICES.webshopTier2; // 2500 to 5000
  return PRICES.webshopTier3; // 5000 or more
}

/** Cheapest combination of the 10 / 5 / single page packages for the pages above 10. */
export function extraPagesOneTime(pages: number): number {
  let extra = Math.max(0, pages - PAGE_MIN);
  let price = 0;
  while (extra >= 10) {
    price += PRICES.pagePack10;
    extra -= 10;
  }
  while (extra >= 5) {
    price += PRICES.pagePack5;
    extra -= 5;
  }
  price += extra * PRICES.pagePer;
  return price;
}

/** Same package principle for rewriting answer blocks on an existing site. */
export function answerBlocksOneTime(pages: number): number {
  let n = Math.max(1, pages);
  let price = 0;
  while (n >= 10) {
    price += PRICES.answerBlockPack10;
    n -= 10;
  }
  price += n * PRICES.answerBlockPer;
  return price;
}

/** Swiss thousands separator: 1'190, rounded to whole francs. */
export function formatCHF(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export type Situation = 'new' | 'existing';

export type ConfigState = {
  situation: Situation;
  pages: number;
  webshop: boolean;
  products: number;
  logo: boolean;
  extraLanguage: boolean;
  extraLanguageCount: number; // 1 to 3
  structuredData: boolean;
  migration: boolean;
  productImport: boolean;
  erpLink: boolean; // quote, not counted
  // existing site
  audit: boolean;
  answerBlocks: boolean;
  entityLocal: boolean;
  analyticsConsent: boolean;
  cwv: boolean; // quote, not counted
  accessibility: boolean; // quote, not counted
  // monthly add ons, both
  visibilityLoop: boolean;
  googleAds: boolean;
  contentRetainer: boolean;
  reviewManagement: boolean;
};

export const INITIAL_STATE: ConfigState = {
  situation: 'new',
  pages: 10,
  webshop: false,
  products: 500,
  logo: false,
  extraLanguage: false,
  extraLanguageCount: 1,
  structuredData: false,
  migration: false,
  productImport: false,
  erpLink: false,
  audit: false,
  answerBlocks: false,
  entityLocal: false,
  analyticsConsent: false,
  cwv: false,
  accessibility: false,
  visibilityLoop: false,
  googleAds: false,
  contentRetainer: false,
  reviewManagement: false,
};

export type QuoteLine = { key: string; amount: number; per: 'month' | 'once' };

export type QuoteResult = {
  monthly: number;
  oneTime: number;
  lines: QuoteLine[];
  /** true when a selected option is quote based (we send a price within 2 days). */
  needsManualQuote: boolean;
};

/** Pure price computation from a configurator state. */
export function computeQuote(s: ConfigState): QuoteResult {
  const lines: QuoteLine[] = [];
  let monthly = 0;
  let oneTime = 0;
  let needsManualQuote = false;

  const addMonthly = (key: string, amount: number) => {
    if (amount > 0) {
      monthly += amount;
      lines.push({ key, amount, per: 'month' });
    }
  };
  const addOnce = (key: string, amount: number) => {
    if (amount > 0) {
      oneTime += amount;
      lines.push({ key, amount, per: 'once' });
    }
  };

  if (s.situation === 'new') {
    const base = s.pages >= PAGE_STEP_199 ? PRICES.base26 : PRICES.base;
    addMonthly('base', base);

    const extraPages = extraPagesOneTime(s.pages);
    addOnce('extraPages', extraPages);

    if (s.webshop) {
      addMonthly('webshop', PRICES.webshop);
      const productSurcharge = webshopProductMonthly(s.products);
      if (productSurcharge > 0) addMonthly('webshopProducts', productSurcharge);
      if (s.productImport) addOnce('productImport', PRICES.productImport);
      if (s.erpLink) needsManualQuote = true;
    }

    if (s.logo) addOnce('logo', PRICES.logo);
    if (s.extraLanguage) addOnce('extraLanguage', PRICES.extraLanguage * clampLang(s.extraLanguageCount));
    if (s.structuredData) addOnce('structuredData', PRICES.structuredData);
    if (s.migration) addOnce('migration', PRICES.migration);
  } else {
    // existing site: no subscription, only one time services
    if (s.audit) addOnce('audit', PRICES.audit);
    if (s.extraLanguage) addOnce('extraLanguage', PRICES.extraLanguageExisting * clampLang(s.extraLanguageCount));
    if (s.structuredData) addOnce('structuredData', PRICES.structuredDataExisting);
    if (s.answerBlocks) addOnce('answerBlocks', answerBlocksOneTime(s.pages));
    if (s.entityLocal) addOnce('entityLocal', PRICES.entityLocal);
    if (s.analyticsConsent) addOnce('analyticsConsent', PRICES.analyticsConsent);
    if (s.cwv) needsManualQuote = true;
    if (s.accessibility) needsManualQuote = true;
  }

  // monthly add ons, both situations
  if (s.visibilityLoop) {
    addMonthly('visibilityLoop', PRICES.visibilityLoop);
    addOnce('visibilityLoopSetup', PRICES.visibilityLoopSetup);
  }
  if (s.googleAds) {
    addMonthly('googleAds', PRICES.googleAdsMonthly);
    addOnce('googleAdsSetup', PRICES.googleAdsSetup);
  }
  if (s.contentRetainer) addMonthly('contentRetainer', PRICES.contentRetainer);
  if (s.reviewManagement) addMonthly('reviewManagement', PRICES.reviewManagement);

  return { monthly, oneTime, lines, needsManualQuote };
}

function clampLang(n: number): number {
  return Math.min(MAX_LANGUAGES, Math.max(1, Math.round(n)));
}

export const MAX_LANGUAGES = 5;

/** High value preset applied by the "popular choice" button, per situation. */
export const POPULAR_NEW: Partial<ConfigState> = {
  visibilityLoop: true,
  extraLanguage: true,
  extraLanguageCount: 1,
};
export const POPULAR_EXISTING: Partial<ConfigState> = {
  audit: true,
  entityLocal: true,
  visibilityLoop: true,
};
