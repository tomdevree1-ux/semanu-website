/**
 * Shared portfolio projects, used by the auto-sliding marquee on both the homepage
 * and the references page (/referenzen). Single source so the two stay in sync.
 * Images live under public/portfolio/.
 */
export type PortfolioProject = {
  title: string;
  tag: string;
  img: string;
  alt: string;
  href: string | null;
  live: boolean;
};

export const PROJECTS: readonly PortfolioProject[] = [
  // Live cases first (better for paid traffic), then projects in development.
  { title: 'SEMANU', tag: 'Platform', img: '/portfolio/semanu.jpg', alt: 'SEMANU client platform homepage built by amai!', href: 'https://semanu.be', live: true },
  { title: '3D Configurator', tag: 'Webshop', img: '/portfolio/configurator.png', alt: '3D product configurator for made to measure aluminium plates', href: null, live: true },
  { title: 'amai.ch', tag: 'Website Abo', img: '/portfolio/amai-homepage.jpg', alt: 'amai.ch website homepage', href: 'https://www.amai.ch', live: true },
  { title: 'NORA', tag: 'Juice Brand', img: '/portfolio/nora.png', alt: 'NORA cold pressed juice brand and webshop', href: null, live: false },
  { title: 'BIKESTORE', tag: 'Bike Shop', img: '/portfolio/bikestore.png', alt: 'BIKESTORE online bike shop storefront', href: null, live: false },
  { title: 'Maison Rosé', tag: 'Beauty Salon', img: '/portfolio/salon.jpg', alt: 'Maison Rosé beauty salon website', href: null, live: false },
];
