"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export type GalleryStripPhoto = {
  id: number;
  title: string;
  image_url: string;
  caption?: string | null;
};

/**
 * Horizontal gallery strip with reliable auto-advance via scrollLeft.
 */
export function GalleryStrip({
  photos,
  brandName = "Grace Church",
}: {
  photos: GalleryStripPhoto[];
  brandName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchPauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el || !el.children.length) return;
      const n = ((i % el.children.length) + el.children.length) % el.children.length;
      const child = el.children[n] as HTMLElement;
      if (!child) return;
      const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({
        left: Math.max(0, left),
        behavior: reduceMotion ? "auto" : "smooth",
      });
      setIndex(n);
    },
    [reduceMotion]
  );

  useEffect(() => {
    if (reduceMotion || paused || photos.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % photos.length;
        requestAnimationFrame(() => {
          const el = scrollerRef.current;
          if (!el || !el.children[next]) return;
          const child = el.children[next] as HTMLElement;
          const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
          el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        });
        return next;
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, photos.length]);

  function onTouchPause() {
    setPaused(true);
    if (touchPauseTimer.current) clearTimeout(touchPauseTimer.current);
    touchPauseTimer.current = setTimeout(() => setPaused(false), 6000);
  }

  if (!photos.length) return null;

  return (
    <section aria-label="Photo gallery" className="w-full">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Life at {brandName}</h2>
          <p className="text-sm text-slate-500">From our gallery · slides automatically</p>
        </div>
        <Link href="/gallery" className="text-sm font-semibold text-brand-600 hover:underline">
          Full gallery
        </Link>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchPause}
        onScroll={() => {
          const el = scrollerRef.current;
          if (!el || !el.children.length) return;
          let best = 0;
          let bestDist = Infinity;
          const mid = el.scrollLeft + el.clientWidth / 2;
          for (let i = 0; i < el.children.length; i++) {
            const c = el.children[i] as HTMLElement;
            const cMid = c.offsetLeft + c.clientWidth / 2;
            const d = Math.abs(cMid - mid);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          }
          if (best !== index) setIndex(best);
        }}
      >
        {photos.map((p) => (
          <Link
            key={p.id}
            href="/gallery"
            className="w-[78%] shrink-0 snap-center overflow-hidden rounded-xl border bg-white shadow-sm sm:w-[42%] md:w-[30%]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image_url}
              alt={p.title}
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <p className="truncate px-3 py-2 text-sm font-medium text-slate-800">{p.title}</p>
          </Link>
        ))}
      </div>

      {photos.length > 1 && (
        <div
          className="mt-2 flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Gallery slides"
        >
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => goTo(i)}
              className="shrink-0 rounded-full border-0 p-0"
              style={{
                width: 6,
                height: 6,
                minWidth: 6,
                minHeight: 6,
                maxWidth: 6,
                maxHeight: 6,
                backgroundColor: i === index ? "#2563eb" : "#cbd5e1",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
