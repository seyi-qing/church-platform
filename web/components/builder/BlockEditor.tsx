"use client";

import { useState } from "react";
import { Block, BlockType, newBlock, serializeBlocks, parseBlocks } from "@/lib/blocks";
import { BlockRenderer } from "./BlockRenderer";

const TYPES: BlockType[] = ["hero", "text", "give_cta", "sermons", "events", "image", "columns"];

export function BlockEditor({
  initialContent,
  onChange,
}: {
  initialContent?: string | null;
  onChange?: (json: string) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(initialContent || null));

  function update(next: Block[]) {
    setBlocks(next);
    onChange?.(serializeBlocks(next));
  }

  function add(type: BlockType) {
    update([...blocks, newBlock(type)]);
  }

  function remove(id: string) {
    update(blocks.filter((b) => b.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  }

  function patch(id: string, data: Record<string, any>) {
    update(blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="rounded border px-2 py-1 text-xs">
              + {t}
            </button>
          ))}
        </div>
        {blocks.map((b) => (
          <div key={b.id} className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>{b.type}</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => move(b.id, -1)}>↑</button>
                <button type="button" onClick={() => move(b.id, 1)}>↓</button>
                <button type="button" onClick={() => remove(b.id)} className="text-red-600">✕</button>
              </span>
            </div>
            {b.type === "hero" && (
              <div className="space-y-1">
                <input className="w-full rounded border px-2 py-1 text-sm" value={b.data.title || ""} onChange={(e) => patch(b.id, { title: e.target.value })} placeholder="Title" />
                <input className="w-full rounded border px-2 py-1 text-sm" value={b.data.subtitle || ""} onChange={(e) => patch(b.id, { subtitle: e.target.value })} placeholder="Subtitle" />
              </div>
            )}
            {b.type === "text" && (
              <textarea className="w-full rounded border px-2 py-1 text-sm" rows={4} value={b.data.html || ""} onChange={(e) => patch(b.id, { html: e.target.value })} />
            )}
            {b.type === "give_cta" && (
              <input className="w-full rounded border px-2 py-1 text-sm" value={b.data.title || ""} onChange={(e) => patch(b.id, { title: e.target.value })} />
            )}
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase text-slate-400">Preview</p>
        <BlockRenderer blocks={blocks} />
      </div>
    </div>
  );
}
