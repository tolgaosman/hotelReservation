import { api } from "./api";

// The backend caps pagination per request; endpoints with more records than
// that (e.g. payments, reservations) silently truncate on a single
// `per_page=1000` call, which corrupts anything aggregated from the full
// history (like the dashboard revenue graph). Walk every page instead.
//
// The first page tells us how many pages exist, so the rest are fetched in
// parallel rather than one round-trip at a time — as data grows past a
// single page this stays a small number of concurrent requests instead of a
// serial chain.
export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const perPage = 1000;

  const first = await api.get(url, { params: { per_page: perPage, page: 1 } });
  const items: T[] = first.data.data.items;
  const lastPage: number = first.data.data.meta.lastPage;

  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        api.get(url, { params: { per_page: perPage, page: i + 2 } }).then(res => res.data.data.items as T[])
      )
    );
    for (const page of rest) items.push(...page);
  }

  return items;
}
