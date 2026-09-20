import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Event = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
};

async function getEvents(): Promise<Event[]> {
  try {
    return await apiFetch<Event[]>("/events?limit=20", { cache: "no-store" });
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="mt-2 text-slate-600">Upcoming gatherings and opportunities.</p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No upcoming events listed right now.
        </p>
      ) : (
        <ul className="space-y-4">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(e.start_at).toLocaleString()}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.description && (
                <p className="mt-3 text-slate-600">{e.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
