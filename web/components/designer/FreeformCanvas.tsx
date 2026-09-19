"use client";

import { useState } from "react";
import { DesignerElement, newElement } from "@/lib/designer";

export function FreeformCanvas({
  initial = [],
  onChange,
}: {
  initial?: DesignerElement[];
  onChange?: (els: DesignerElement[]) => void;
}) {
  const [els, setEls] = useState<DesignerElement[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);

  function update(next: DesignerElement[]) {
    setEls(next);
    onChange?.(next);
  }

  function add(type: DesignerElement["type"]) {
    update([...els, newElement(type)]);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["text", "image", "button", "box"] as const).map((t) => (
          <button key={t} type="button" onClick={() => add(t)} className="rounded border px-2 py-1 text-xs">
            + {t}
          </button>
        ))}
      </div>
      <div className="relative h-[480px] overflow-hidden rounded-xl border bg-white">
        {els.map((el) => (
          <div
            key={el.id}
            onClick={() => setSelected(el.id)}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              border: selected === el.id ? "2px solid #2563eb" : "1px solid #e2e8f0",
              padding: 8,
              background: el.type === "box" ? "#f1f5f9" : "#fff",
              cursor: "pointer",
            }}
          >
            {el.type === "text" && <span>{el.props.text || "Text"}</span>}
            {el.type === "button" && (
              <span className="rounded bg-brand-600 px-3 py-1 text-sm text-white">{el.props.label || "Button"}</span>
            )}
            {el.type === "image" && <span className="text-xs text-slate-400">Image</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
