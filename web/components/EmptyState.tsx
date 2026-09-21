import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
