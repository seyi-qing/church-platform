import Link from "next/link";
import type { Block } from "@/lib/blocks";

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((b) => {
        switch (b.type) {
          case "hero":
            return (
              <section key={b.id} className="rounded-2xl bg-brand-800 px-8 py-16 text-white">
                <h1 className="text-4xl font-bold">{b.data.title}</h1>
                <p className="mt-3 text-brand-100">{b.data.subtitle}</p>
                {b.data.cta && (
                  <Link href={b.data.ctaHref || "/"} className="mt-6 inline-block rounded-lg bg-white px-5 py-2 font-semibold text-brand-800">
                    {b.data.cta}
                  </Link>
                )}
              </section>
            );
          case "text":
            return <div key={b.id} className="prose" dangerouslySetInnerHTML={{ __html: b.data.html || "" }} />;
          case "give_cta":
            return (
              <section key={b.id} className="rounded-xl border bg-white p-8 text-center">
                <h2 className="text-2xl font-bold">{b.data.title}</h2>
                <p className="mt-2 text-slate-600">{b.data.body}</p>
                <Link href={b.data.href || "/give"} className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2 text-white">
                  Give
                </Link>
              </section>
            );
          default:
            return (
              <div key={b.id} className="rounded border border-dashed p-4 text-sm text-slate-400">
                Block: {b.type}
              </div>
            );
        }
      })}
    </div>
  );
}
