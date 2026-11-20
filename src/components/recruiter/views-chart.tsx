/** Histogramme des vues quotidiennes (SVG, sans bibliothèque). */
export function ViewsChart({ data }: { data: { day: string; views: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.views));
  const total = data.reduce((s, d) => s + d.views, 0);
  const W = 600, H = 140, gap = 3;
  const bw = (W - gap * (data.length - 1)) / data.length;
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
  const first = data[0], last = data[data.length - 1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="h-auto w-full" role="img" aria-label={`${total} vues sur ${data.length} jours`}>
        <line x1="0" x2={W} y1={H} y2={H} className="stroke-line-strong" strokeWidth="1" />
        {data.map((d, i) => {
          const h = (d.views / max) * (H - 8);
          return (
            <rect key={d.day} x={i * (bw + gap)} y={H - h} width={bw} height={Math.max(h, d.views ? 2 : 0)} rx="2" className={i === data.length - 1 ? "fill-electric-500" : "fill-electric-200"}>
              <title>{`${fmt.format(new Date(d.day))} : ${d.views} vue${d.views > 1 ? "s" : ""}`}</title>
            </rect>
          );
        })}
        {first && <text x="0" y={H + 16} className="fill-ink-subtle text-[11px]">{fmt.format(new Date(first.day))}</text>}
        {last && <text x={W} y={H + 16} textAnchor="end" className="fill-ink-subtle text-[11px]">Aujourd&apos;hui</text>}
        <text x="0" y="12" className="fill-ink-subtle text-[11px]">max {max} vue{max > 1 ? "s" : ""}/jour</text>
      </svg>
    </figure>
  );
}
