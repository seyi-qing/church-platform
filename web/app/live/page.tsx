import { apiFetch } from "@/lib/api";

type LiveSession = {
  id: number;
  title: string;
  status: string;
  playback_url: string | null;
  youtube_url: string | null;
  mux_playback_id: string | null;
};

async function getLive(): Promise<LiveSession | null> {
  try {
    return await apiFetch<LiveSession | null>("/livestream/sessions/live");
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const live = await getLive();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Live</h1>
        <p className="mt-2 text-slate-600">Watch our service in real time.</p>
      </div>

      {!live ? (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          We are not live right now. Check back on Sunday.
        </p>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{live.title}</h2>
          {live.youtube_url && (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                className="h-full w-full"
                src={live.youtube_url.replace("watch?v=", "embed/")}
                allowFullScreen
                title={live.title}
              />
            </div>
          )}
          {live.playback_url && !live.youtube_url && (
            <video className="w-full rounded-xl" controls src={live.playback_url} />
          )}
        </div>
      )}
    </div>
  );
}
