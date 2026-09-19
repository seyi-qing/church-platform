import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";

async function getPage(slug: string) {
  try {
    return await apiFetch<any>(`/cms/pages/${slug}`);
  } catch {
    return null;
  }
}

export default async function PublicCmsPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  return (
    <article className="prose mx-auto max-w-3xl">
      <h1>{page.title}</h1>
      {page.content && (
        <div dangerouslySetInnerHTML={{ __html: page.content.startsWith("[") ? `<p>${page.title}</p>` : page.content }} />
      )}
    </article>
  );
}
