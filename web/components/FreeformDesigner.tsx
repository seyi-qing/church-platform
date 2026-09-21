"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BREAKPOINT_WIDTH,
  DesignerBreakpoint,
  DesignerElement,
  newElement,
  resolvedLayout,
} from "@/lib/designer";

const MAX_HISTORY = 40;

export function FreeformDesigner({
  value,
  onChange,
}: {
  value: DesignerElement[];
  onChange: (els: DesignerElement[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [bp, setBp] = useState<DesignerBreakpoint>("desktop");
  const [history, setHistory] = useState<DesignerElement[][]>([value]);
  const [histIdx, setHistIdx] = useState(0);
  const [drag, setDrag] = useState<{
    id: string;
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);

  // Sync external value into history when loading a page
  useEffect(() => {
    setHistory([value]);
    setHistIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback(
    (next: DesignerElement[]) => {
      onChange(next);
      setHistory((h) => {
        const trimmed = h.slice(0, histIdx + 1);
        const updated = [...trimmed, next].slice(-MAX_HISTORY);
        setHistIdx(updated.length - 1);
        return updated;
      });
    },
    [histIdx, onChange]
  );

  function undo() {
    if (histIdx <= 0) return;
    const i = histIdx - 1;
    setHistIdx(i);
    onChange(history[i]);
  }

  function redo() {
    if (histIdx >= history.length - 1) return;
    const i = histIdx + 1;
    setHistIdx(i);
    onChange(history[i]);
  }

  const update = useCallback(
    (id: string, patch: Partial<DesignerElement>, record = true) => {
      const next = value.map((el) => {
        if (el.id !== id) return el;
        if (bp === "desktop") {
          return { ...el, ...patch };
        }
        // Store layout overrides on other breakpoints
        const layoutKeys = ["x", "y", "width", "height"] as const;
        const layoutPatch: Record<string, number> = {};
        const rest: Record<string, any> = {};
        for (const [k, v] of Object.entries(patch)) {
          if ((layoutKeys as readonly string[]).includes(k) && typeof v === "number") {
            layoutPatch[k] = v;
          } else {
            rest[k] = v;
          }
        }
        return {
          ...el,
          ...rest,
          responsive: {
            ...el.responsive,
            [bp]: { ...el.responsive?.[bp], ...layoutPatch },
          },
        };
      });
      if (record) commit(next);
      else onChange(next);
    },
    [bp, commit, onChange, value]
  );

  function onPointerDown(e: React.PointerEvent, el: DesignerElement) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(el.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const layout = resolvedLayout(el, bp);
    setDrag({ id: el.id, ox: e.clientX, oy: e.clientY, sx: layout.x, sy: layout.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    update(
      drag.id,
      {
        x: Math.max(0, drag.sx + (e.clientX - drag.ox)),
        y: Math.max(0, drag.sy + (e.clientY - drag.oy)),
      },
      false
    );
  }

  function onPointerUp() {
    if (drag) {
      // finalize history entry
      commit(value);
    }
    setDrag(null);
  }

  const sel = value.find((e) => e.id === selected);
  const canvasW = BREAKPOINT_WIDTH[bp];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["text", "image", "button", "box"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => commit([...value, newElement(t)])}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold capitalize text-slate-700"
          >
            + {t}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <button
          type="button"
          onClick={undo}
          disabled={histIdx <= 0}
          className="rounded-lg border px-2 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={histIdx >= history.length - 1}
          className="rounded-lg border px-2 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Redo
        </button>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        {(["desktop", "tablet", "mobile"] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBp(b)}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ${
              bp === b ? "bg-blue-600 text-white" : "border bg-white"
            }`}
          >
            {b}
          </button>
        ))}
        {selected && (
          <button
            type="button"
            onClick={() => {
              commit(value.filter((e) => e.id !== selected));
              setSelected(null);
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            Delete
          </button>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_200px]">
        <div className="overflow-auto rounded-xl border bg-slate-100 p-3">
          <div
            className="relative mx-auto overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-white shadow-sm"
            style={{ width: canvasW, height: 420, maxWidth: "100%" }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={() => setSelected(null)}
          >
            {value.map((el) => {
              const layout = resolvedLayout(el, bp);
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => onPointerDown(e, el)}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute cursor-move select-none rounded border bg-white shadow-sm ${
                    selected === el.id ? "ring-2 ring-blue-500" : "border-slate-200"
                  }`}
                  style={{
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height,
                  }}
                >
                  {el.type === "text" && (
                    <div className="flex h-full items-center px-2 text-sm font-medium">
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
                    <div className="h-full w-full" style={{ background: el.props.color || "#e2e8f0" }} />
                  )}
                </div>
              );
            })}
            {value.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                Add elements · drag freely · switch breakpoints
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Layers</p>
          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {[...value].reverse().map((el) => (
              <li key={el.id}>
                <button
                  type="button"
                  onClick={() => setSelected(el.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs ${
                    selected === el.id ? "bg-blue-50 font-semibold text-blue-800" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="capitalize">{el.type}</span>
                  <span className="truncate text-slate-400">
                    {el.props.text || el.props.label || el.props.src || el.id.slice(-4)}
                  </span>
                </button>
              </li>
            ))}
            {value.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">No layers</li>
            )}
          </ul>
          <div className="mt-2 flex gap-1">
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                const i = value.findIndex((e) => e.id === selected);
                if (i < 0 || i >= value.length - 1) return;
                const next = [...value];
                [next[i], next[i + 1]] = [next[i + 1], next[i]];
                commit(next);
              }}
              className="flex-1 rounded border px-1 py-1 text-[10px] font-semibold disabled:opacity-40"
            >
              Forward
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                const i = value.findIndex((e) => e.id === selected);
                if (i <= 0) return;
                const next = [...value];
                [next[i], next[i - 1]] = [next[i - 1], next[i]];
                commit(next);
              }}
              className="flex-1 rounded border px-1 py-1 text-[10px] font-semibold disabled:opacity-40"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {sel && (
        <div className="grid gap-2 rounded-lg border bg-slate-50 p-3 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase text-slate-500">
            Edit {sel.type} · {bp}
          </p>
          {sel.type === "text" && (
            <input
              className="rounded border px-2 py-1.5 text-sm sm:col-span-2"
              value={sel.props.text || ""}
              onChange={(e) => update(sel.id, { props: { ...sel.props, text: e.target.value } })}
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
                placeholder="Label"
              />
              <input
                className="rounded border px-2 py-1.5 text-sm"
                value={sel.props.href || ""}
                onChange={(e) =>
                  update(sel.id, { props: { ...sel.props, href: e.target.value } })
                }
                placeholder="Href"
              />
            </>
          )}
          {sel.type === "image" && (
            <input
              className="rounded border px-2 py-1.5 text-sm sm:col-span-2"
              value={sel.props.src || ""}
              onChange={(e) => update(sel.id, { props: { ...sel.props, src: e.target.value } })}
              placeholder="Image URL"
            />
          )}
          {sel.type === "box" && (
            <input
              type="color"
              className="h-9 w-full"
              value={sel.props.color || "#e2e8f0"}
              onChange={(e) => update(sel.id, { props: { ...sel.props, color: e.target.value } })}
            />
          )}
          <div className="flex gap-2 sm:col-span-2">
            {(["width", "height"] as const).map((dim) => {
              const layout = resolvedLayout(sel, bp);
              return (
                <label key={dim} className="flex flex-1 items-center gap-1 text-xs capitalize">
                  {dim[0].toUpperCase()}
                  <input
                    type="number"
                    className="w-full rounded border px-2 py-1"
                    value={layout[dim]}
                    onChange={(e) => update(sel.id, { [dim]: Number(e.target.value) || 40 })}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
