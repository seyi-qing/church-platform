import { BRAND } from "@/lib/brand";

/** Simple mark + name. Pass `name` for multi-tenant branding. */
export function ChurchLogo({
  className = "",
  showText = true,
  size = 32,
  name,
}: {
  className?: string;
  showText?: boolean;
  size?: number;
  /** Overrides BRAND.name (tenant-aware public site / Act-as) */
  name?: string | null;
}) {
  const label = (name && name.trim()) || BRAND.name;
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="currentColor">
          <path d="M12 2L4 7v3h2v8H4v2h16v-2h-2V10h2V7l-8-5zm0 2.2L16 7v1H8V7l4-2.8zM9 10h6v8H9v-8z" />
        </svg>
      </span>
      {showText && (
        <span className="truncate text-lg font-extrabold tracking-tight text-brand-700">
          {label}
        </span>
      )}
    </span>
  );
}
