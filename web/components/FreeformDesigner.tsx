"use client";

import { useCallback, useState } from "react";
import { DesignerElement, newElement } from "@/lib/designer";

/** Lightweight freeform canvas (drag + resize handles simplified). */
export function FreeformDesigner({
  value,
  onChange,
}: {
  value: DesignerElement[];
  onChange: (els: DesignerElement[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; ox: number; oy: number; sx: number; sy: number } | null>(
    null
  );

  const update = useCallback(
    (id: string, patch: Partial<DesignerElement>) => {
      onChange(value.map((el) => (el.id === id ? { ...el, ...patch } : el)));
    },
    [onChange, value]
  );

  function onPointerDown(e: React.PointerEvent, el: DesignerElement) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(el.id);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDrag({ id: el.id, ox: e.clientX, oy: e.clientY, sx: el.x, sy: el.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.ox;
    const dy = e.clientY - drag.oy;
    update(drag.id, {
      x: Math.max(0, drag.sx + dx),
      y: Math.max(0, drag.sy + dy),
    });
  }

  function onPointerUp() {
    setDrag(null);
  }

  const sel = value.find((e) => e.id === selected);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["text", "image", "button", "box"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange([...value, newElement(t)])}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-slate-700 hover:bg-slate-50"
          >
            + {t}
          </button>
        ))}
        {selected && (
          <button
            type="button"
            onClick={() => {
              onChange(value.filter((e) => e.id !== selected));
              setSelected(null);
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            Delete selected
          </button>
        )}
      </div>

      <div
        className="relative h-[420px] overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[length:20px_20px] bg-white"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => setSelected(null)}
      >
        {value.map((el) => (
          <div
            key={el.id}
            onPointerDown={(e) => onPointerDown(e, el)}
            onClick={(e) => e.stopPropagation()}
            className={`absolute cursor-move select-none rounded border bg-white shadow-sm ${
              selected === el.id ? "ring-2 ring-blue-500" : "border-slate-200"
            }`}
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
            }}
          >
            {el.type === "text" && (
              <div className="flex h-full items-center px-2 text-sm font-medium text-slate-800">
                {el.props.text || "Text"}
              </div>
            )}
            {el.type === "button" && (
              <div className="flex h-full items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
                {el.props.label || "Button"}
              </div>
            )}
            {el.type === "image" && (
              <div className="flex h-full items-center justify-center bg-slate-100 text-xs text-slate-500">
                {el.props.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={el.props.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  "Image"
                )}
              </div>
            )}
            {el.type === "box" && (
              <div
                className="h-full w-full"
                style={{ background: el.props.color || "#e2e8f0" }}
              />
            )}
          </div>
        ))}
        {value.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Add elements and drag them freely on the canvas
          </p>
        )}
      </div>

      {sel && (
        <div className="grid gap-2 rounded-lg border bg-slate-50 p-3 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500">
            Edit {sel.type}
          </p>
          {sel.type === "text" && (
            <input
              className="rounded border px-2 py-1.5 text-sm sm:col-span-2"
              value={sel.props.text || ""}
              onChange={(e) =>
                update(sel.id, { props: { ...sel.props, text: e.target.value } })
              }
              placeholder="Text content"
            />
          )}
          {sel.type === "button" && (
            <>
              <input
                className="rounded border px-2 py-1.5 text-sm"
                value={sel.props.label || ""}
                onChange={(e) =>
                  update(sel.id, { props: { ...sel.props, label: e.target.value } })
                }
                placeholder="Button label"
              />
              <input
                className="rounded border px-2 py-1.5 text-sm"
                value={sel.props.href || ""}
                onChange={(e) =>
                  update(sel.id, { props: { ...sel.props, href: e.target.value } })
                }
                placeholder="Link href"
              />
            </>
          )}
          {sel.type === "image" && (
            <input
              className="rounded border px-2 py-1.5 text-sm sm:col-span-2"
              value={sel.props.src || ""}
              onChange={(e) =>
                update(sel.id, { props: { ...sel.props, src: e.target.value } })
              }
              placeholder="Image URL https://…"
            />
          )}
          {sel.type === "box" && (
            <input
              type="color"
              className="h-9 w-full"
              value={sel.props.color || "#e2e8f0"}
              onChange={(e) =>
                update(sel.id, { props: { ...sel.props, color: e.target.value } })
              }
            />
          )}
          <div className="flex gap-2 sm:col-span-2">
            <label className="flex flex-1 items-center gap-1 text-xs">
              W
              <input
                type="number"
                className="w-full rounded border px-2 py-1"
                value={sel.width}
                onChange={(e) => update(sel.id, { width: Number(e.target.value) || 40 })}
              />
            </label>
            <label className="flex flex-1 items-center gap-1 text-xs">
              H
              <input
                type="number"
                className="w-full rounded border px-2 py-1"
                value={sel.height}
                onChange={(e) => update(sel.id, { height: Number(e.target.value) || 40 })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
