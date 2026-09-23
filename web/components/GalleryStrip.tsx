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
 * Horizontal gallery strip with gentle auto-advance.
 * Pauses on hover / touch; respects prefers-reduced-motion.
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const children = el.children;
    if (!children.length) return;
    const n = ((i % children.length) + children.length) % children.length;
    const child = children[n] as HTMLElement;
    child?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
    setIndex(n);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || paused || photos.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % photos.length;
        const el = scrollerRef.current;
        if (el && el.children[next]) {
          (el.children[next] as HTMLElement).scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
        return next;
      });
    }, 4500);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, photos.length]);

  if (!photos.length) return null;

  return (
    <section aria-label="Photo gallery">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Life at {brandName}</h2>
          <p className="text-sm text-slate-500">From our gallery</p>
        </div>
        <Link href="/gallery" className="text-sm font-semibold text-brand-600 hover:underline">
          Full gallery
        </Link>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
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
        <div className="mt-2 flex items-center justify-center gap-1.5" role="tablist" aria-label="Gallery slides">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-brand-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
