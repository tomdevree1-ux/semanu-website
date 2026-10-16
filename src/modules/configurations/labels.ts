/** English labels for the configurator line keys (the portal is English). */
export const LINE_LABEL: Record<string, string> = {
  base: 'Website subscription (base)',
  extraPages: 'Extra pages',
  webshop: 'Webshop',
  webshopProducts: 'Above 100 products',
  productImport: 'Product import',
  logo: 'Logo and brand guidelines',
  extraLanguage: 'Extra language',
  structuredData: 'Extended structured data',
  migration: 'Migration and redirect plan',
  audit: 'Crawler and indexing audit',
  answerBlocks: 'Answer blocks rewrite',
  entityLocal: 'Entity and local findability',
  analyticsConsent: 'Analytics and consent',
  visibilityLoop: 'Visibility loop',
  visibilityLoopSetup: 'Visibility loop setup',
  googleAds: 'Google Ads',
  googleAdsSetup: 'Google Ads setup',
  contentRetainer: 'Content retainer',
  reviewManagement: 'Review management',
};

export function lineLabel(key: string): string {
  return LINE_LABEL[key] ?? key;
}
