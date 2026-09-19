"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Page = {
  id: number;
  slug: string;
  title: string;
  is_published: boolean;
};

export default function AdminPagesList() {
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  async function load() {
    try {
      const data = await apiFetch<Page[]>("/cms/pages?published_only=false");
      setPages(data);
    } catch {
      setPages([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createPage() {
    if (!title || !slug) return;
    await apiFetch("/cms/pages", {
      method: "POST",
      body: JSON.stringify({ title, slug, is_published: false }),
    });
    setTitle("");
    setSlug("");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Website Pages</h1>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={createPage} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">New page</button>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {pages.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-slate-500">/{p.slug} · {p.is_published ? "published" : "draft"}</p>
            </div>
            <Link href={`/admin/pages/${p.id}`} className="text-sm text-brand-600">Edit</Link>
          </li>
        ))}
        {pages.length === 0 && <li className="px-4 py-8 text-center text-slate-500">No pages yet</li>}
      </ul>
    </div>
  );
}
