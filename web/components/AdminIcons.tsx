/** Small outline SVGs for admin quick actions — consistent stroke, no emoji. */

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconMedia({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEvent({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconLive({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <path d="M5.5 8.5a8 8 0 0 1 0 7M18.5 8.5a8 8 0 0 0 0 7M2.5 5.5a12 12 0 0 1 0 13M21.5 5.5a12 12 0 0 0 0 13" />
    </svg>
  );
}

export function IconPeople({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 19.5c0-3.2 2.9-5.5 6.5-5.5s6.5 2.3 6.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 19.5c.4-1.8 1.9-3.2 4-3.8" />
    </svg>
  );
}

export function IconAnnounce({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l3 4h2V5H9l-3 4H5a2 2 0 0 0-2 2z" />
      <path d="M16 9.5a4.5 4.5 0 0 1 0 5M18.5 7a8 8 0 0 1 0 10" />
    </svg>
  );
}

export function IconGive({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    </svg>
  );
}

export function IconFilm({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...stroke} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  );
}
