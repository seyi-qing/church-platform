import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  scripture: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

async function getSermons(): Promise<MediaItem[]> {
  try {
    return await apiFetch<MediaItem[]>("/media/items?media_type=sermon&limit=20", {
      cache: "no-store",
    });
  } catch {
    return [];
  }
}

export default async function SermonsPage() {
  const sermons = await getSermons();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sermons</h1>
        <p className="mt-2 text-slate-600">Recent messages from Sunday gatherings.</p>
      </div>

      {sermons.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No sermons published yet. Check back soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sermons.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              {s.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.thumbnail_url}
                  alt=""
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400">
                  Sermon
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold">{s.title}</h2>
                {s.speaker && (
                  <p className="mt-1 text-sm text-slate-500">{s.speaker}</p>
                )}
                {s.scripture && (
                  <p className="mt-1 text-sm text-blue-600">{s.scripture}</p>
                )}
                {s.description && (
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">{s.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
