/**
 * Simple line icons for the seven semanu services. The `id` matches the `icon`
 * key in `src/content/services.ts` (websites, email, automation, booking,
 * systems, ai, audit). Stroke uses currentColor so the colour is set by the
 * parent. Decorative only (aria-hidden).
 */
export function ServiceIcon({ id, className }: { id: string; className?: string }) {
  const base = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (id) {
    case 'websites':
      return (
        <svg {...base}>
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <path d="M3 9h18" />
        </svg>
      );
    case 'email':
      return (
        <svg {...base}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M4 7.5l8 5 8-5" />
        </svg>
      );
    case 'automation':
      return (
        <svg {...base}>
          <path d="M20.5 7A8 8 0 1 0 21 12.5" />
          <path d="M20.5 3.5V7h-3.5" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case 'booking':
      return (
        <svg {...base}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
          <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'systems':
      return (
        <svg {...base}>
          <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
          <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
          <rect x="13" y="10" width="7.5" height="10.5" rx="1.5" />
          <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
        </svg>
      );
    case 'ai':
      return (
        <svg {...base}>
          <path d="M4 6h11a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H9.5l-3.5 3v-3H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
          <path d="M19.8 3l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...base}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="M20.5 20.5l-5.7-5.7" />
          <path d="M8 10.6l1.8 1.8L13.4 9" />
        </svg>
      );
    case 'pages': // browser window with text lines
      return (
        <svg {...base}>
          <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
          <path d="M3 9h18M7 13h10M7 16h6" />
        </svg>
      );
    case 'cart': // shopping cart
      return (
        <svg {...base}>
          <circle cx="9" cy="20" r="1.3" />
          <circle cx="17" cy="20" r="1.3" />
          <path d="M3 4h2l2.3 11.3a1.5 1.5 0 0 0 1.5 1.2h7.5a1.5 1.5 0 0 0 1.5-1.2L21 8H6" />
        </svg>
      );
    case 'star': // five point star
      return (
        <svg {...base}>
          <path d="M12 3.5l2.5 5.6 6.1.6-4.6 4.1 1.4 6L12 17l-5.4 2.8 1.4-6-4.6-4.1 6.1-.6z" />
        </svg>
      );
    case 'sun': // sun with rays
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
        </svg>
      );
    case 'target': // concentric target
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.4" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'people': // two people
      return (
        <svg {...base}>
          <circle cx="9" cy="8" r="3.1" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17.2" cy="9" r="2.3" />
          <path d="M16 14.2a4.5 4.5 0 0 1 4.5 4.3" />
        </svg>
      );
    case 'idcard': // portal card with avatar
      return (
        <svg {...base}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <circle cx="9" cy="11" r="2.1" />
          <path d="M5.9 16.4a3.3 3.3 0 0 1 6.2 0M14.5 10h4M14.5 13.5h3" />
        </svg>
      );
    case 'chart': // bar chart dashboard
      return (
        <svg {...base}>
          <rect x="3" y="3.5" width="18" height="17" rx="2.5" />
          <path d="M8 16.5v-3M12 16.5v-6M16 16.5v-4" />
        </svg>
      );
    case 'sparkle': // sparkle / AI
      return (
        <svg {...base}>
          <path d="M12 3.2l1.8 5L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          <path d="M18.6 15.4l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}
