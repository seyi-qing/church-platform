"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { FreeformDesigner } from "@/components/FreeformDesigner";
import { DesignerElement } from "@/lib/designer";

function parseContent(raw: string): { mode: "freeform" | "text"; elements: DesignerElement[]; text: string } {
  try {
    const j = JSON.parse(raw || "{}");
    if (j && j.mode === "freeform" && Array.isArray(j.elements)) {
      return { mode: "freeform", elements: j.elements, text: "" };
    }
  } catch {
    /* plain text */
  }
  return { mode: "text", elements: [], text: raw || "" };
}

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"freeform" | "text">("freeform");
  const [elements, setElements] = useState<DesignerElement[]>([]);
  const [text, setText] = useState("");
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<any>(`/cms/pages/id/${id}`)
      .then((p) => {
        setTitle(p.title);
        setPublished(p.is_published);
        setSlug(p.slug);
        const parsed = parseContent(p.content || "");
        setMode(parsed.mode);
        setElements(parsed.elements);
        setText(parsed.text);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const content =
        mode === "freeform"
          ? JSON.stringify({ mode: "freeform", elements })
          : text;
      await apiFetch(`/cms/pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, content, is_published: published }),
      });
      router.push("/admin/pages");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Edit page</h1>
        <Link href="/admin/pages" className="text-sm font-semibold text-blue-600">
          ← Pages
        </Link>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <p className="text-sm text-slate-500">Public URL: /p/{slug}</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 font-semibold"
        placeholder="Page title"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("freeform")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            mode === "freeform" ? "bg-blue-600 text-white" : "border bg-white"
          }`}
        >
          Freeform canvas
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            mode === "text" ? "bg-blue-600 text-white" : "border bg-white"
          }`}
        >
          Text / markdown
        </button>
      </div>

      {mode === "freeform" ? (
        <FreeformDesigner value={elements} onChange={setElements} />
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          className="w-full rounded-lg border px-3 py-2 font-mono text-sm"
          placeholder="Markdown or plain text"
        />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published
      </label>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save page"}
      </button>
    </div>
  );
}
