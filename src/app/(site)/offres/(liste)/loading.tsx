/** Squelette affiché pendant le chargement des résultats. */
export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-label="Chargement des offres">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-navy-100" />
      <div className="mt-5 h-16 max-w-4xl animate-pulse rounded-2xl bg-navy-50" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-navy-50" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-card bg-surface ring-1 ring-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
