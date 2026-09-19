"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<any>(`/cms/pages/id/${id}`)
      .then((p) => {
        setTitle(p.title);
        setContent(p.content || "");
        setPublished(p.is_published);
        setSlug(p.slug);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function save() {
    try {
      await apiFetch(`/cms/pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, content, is_published: published }),
      });
      router.push("/admin/pages");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Edit page</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-slate-500">Slug: /{slug}</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border px-3 py-2" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="w-full rounded border px-3 py-2 font-mono text-sm" placeholder="Markdown or JSON blocks" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published
      </label>
      <button type="button" onClick={save} className="rounded-lg bg-brand-600 px-4 py-2 text-white">Save</button>
    </div>
  );
}
