"use client";

export interface ChartSpec {
  type?: string;
  title?: string;
  unit?: string;
  categories?: string[] | string;
  values?: number[] | string;
  note?: string;
  mixedWith?: ChartSpec;
}

const PALETTE = ["#c96f1e", "#2f7151", "#d69b5b", "#4a7f8c", "#a2532e", "#6da894", "#8b6f39", "#7a5a8c"];

function toCategories(raw: string[] | string | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") return raw.trim().split(/\s+|\s*,\s*/).filter(Boolean);
  return [];
}

function toValues(raw: number[] | string | undefined): number[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string")
    return raw
      .trim()
      .split(/\s+|\s*,\s*/)
      .map(Number)
      .filter((value) => Number.isFinite(value));
  return [];
}

const TYPE_LABELS: Record<string, string> = {
  bar: "Chart",
  line: "Line chart",
  pie: "Pie chart",
  table: "Table",
  mixed: "Mixed charts",
  process: "Process diagram",
  diagram: "Diagram",
  map: "Map",
};

function BarBody({ categories, values }: { categories: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mt-3 flex h-44 items-end gap-3 border-b border-[#d8c8a8] px-2">
      {categories.map((category, index) => {
        const height = Math.round(((values[index] ?? 0) / max) * 100);
        return (
          <div key={category} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[10px] font-bold text-[#c96f1e]">{values[index] ?? 0}</span>
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-[#c96f1e] to-[#e8a35c] transition-all"
              style={{ height: `${Math.max(6, height)}px` }}
            />
            <span className="pb-1 font-mono text-[10px] font-bold text-[#8b8f88]">{category}</span>
          </div>
        );
      })}
    </div>
  );
}

function LineBody({ categories, values }: { categories: string[]; values: number[] }) {
  const width = 300;
  const height = 150;
  const padX = 18;
  const padTop = 18;
  const padBottom = 22;
  const max = Math.max(1, ...values);
  const n = Math.max(2, categories.length);
  const stepX = (width - padX * 2) / (n - 1);
  const points = values.map((value, index) => ({
    x: padX + index * stepX,
    y: padTop + (height - padTop - padBottom) * (1 - (value ?? 0) / max),
    value,
    label: categories[index] ?? "",
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Line chart">
        <line x1={padX} y1={height - padBottom} x2={width - padX} y2={height - padBottom} stroke="#d8c8a8" strokeWidth="1" />
        {points.map((point, index) => (
          <g key={index}>
            <text x={point.x} y={point.y - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#c96f1e">
              {point.value}
            </text>
            <circle cx={point.x} cy={point.y} r="3.5" fill="#c96f1e" />
            <text x={point.x} y={height - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#8b8f88">
              {point.label}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#c96f1e" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PieBody({ categories, values }: { categories: string[]; values: number[] }) {
  const total = values.reduce((sum, value) => sum + (value > 0 ? value : 0), 0) || values.length || 1;
  const segments = categories.map((category, index) => {
    const raw = values[index] ?? 0;
    const share = total > 0 ? raw / total : 1 / Math.max(1, categories.length);
    return { label: category, value: raw, pct: share };
  });
  const seen = total > 0 ? segments : segments.map((segment, index) => ({ ...segment, pct: 1 / Math.max(1, segments.length) }));
  let cursor = 0;
  const stops = seen.map((segment, index) => {
    const from = cursor;
    cursor += segment.pct * 100;
    return `${PALETTE[index % PALETTE.length]} ${from.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-6">
      <div
        className="relative h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label="Pie chart"
      >
        <div className="absolute inset-5 rounded-full bg-white shadow-inner" />
      </div>
      <ul className="min-w-32 space-y-1.5">
        {seen.map((segment, index) => (
          <li key={segment.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
            <span className="font-bold text-[#315149]">{segment.label}</span>
            <span className="ml-auto font-mono font-bold text-[#c96f1e]">{Math.round(segment.pct * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableBody({ categories, values }: { categories: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-[#d8c8a8] bg-[#17342f]/5 px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.14em] text-[#8b6f39]">
              Category
            </th>
            <th className="border border-[#d8c8a8] bg-[#17342f]/5 px-3 py-2 text-right text-[11px] font-black uppercase tracking-[0.14em] text-[#8b6f39]">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category} className={index % 2 ? "bg-[#17342f]/[0.03]" : ""}>
              <td className="border border-[#d8c8a8] px-3 py-2 font-semibold text-[#315149]">{category}</td>
              <td
                className="border border-[#d8c8a8] px-3 py-2 text-right font-mono font-bold text-[#17342f]"
                style={{ background: values[index] === max ? "#fbf4df" : undefined }}
              >
                {values[index] ?? "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlowBody({ categories, kind }: { categories: string[]; kind: "process" | "diagram" }) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {categories.map((step, index) => (
        <div key={step}>
          <div className="flex items-center gap-3 rounded-xl border border-[#d8c8a8] bg-[#fffdf7] px-3 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#17342f] font-mono text-xs font-black text-white">
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-[#315149]">{step}</span>
          </div>
          {index < categories.length - 1 ? (
            <div className="flex justify-center py-0.5 text-[#c96f1e]">↓</div>
          ) : null}
        </div>
      ))}
      {kind === "diagram" ? (
        <p className="mt-1 text-[11px] italic text-[#8b8f88]">The diagram shows how the parts work together in sequence.</p>
      ) : null}
    </div>
  );
}

function MapBody({ categories }: { categories: string[] }) {
  return (
    <div className="mt-3">
      <p className="rounded-lg bg-[#e4f0ea] px-3 py-1.5 text-[11px] font-bold text-[#2f7151]">Before → After · two periods</p>
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border-2 border-dashed border-[#d8c8a8] bg-[#fbfaf4] p-3 sm:grid-cols-3">
        {categories.map((landmark, index) => (
          <div
            key={landmark}
            className="flex items-center gap-1.5 rounded-lg border border-[#e3dac6] bg-white px-2 py-2"
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
            <span className="text-[11px] font-semibold leading-tight text-[#315149]">{landmark}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] italic text-[#8b8f88]">
        Schematic plan — the labels show the main features of the site in each period.
      </p>
    </div>
  );
}

function ChartBody({ chart }: { chart: ChartSpec }) {
  const categories = toCategories(chart.categories);
  const values = toValues(chart.values);
  const type = String(chart.type ?? "bar").toLowerCase();
  if (type === "line") return <LineBody categories={categories} values={values} />;
  if (type === "pie") return <PieBody categories={categories} values={values} />;
  if (type === "table") return <TableBody categories={categories} values={values} />;
  if (type === "process" || type === "diagram") return <FlowBody categories={categories} kind={type} />;
  if (type === "map") return <MapBody categories={categories} />;
  return <BarBody categories={categories} values={values} />;
}

export function ChartCard({ chart }: { chart: ChartSpec }) {
  const type = String(chart.type ?? "bar").toLowerCase();
  const label = TYPE_LABELS[type] ?? "Chart";
  const mixed = chart.mixedWith;
  return (
    <div className="mt-4 rounded-2xl border border-[#d8c8a8] bg-white/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">
        {label} · Task 1
        {mixed ? <span className="ml-2 rounded-full bg-[#f5eddc] px-2 py-0.5 text-[10px] text-[#8b5732]">two visuals</span> : null}
      </p>
      <p className="mt-1 text-sm font-bold text-[#17342f]">{chart.title}</p>
      {mixed ? (
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <ChartBody chart={chart} />
          <ChartBody chart={mixed} />
        </div>
      ) : (
        <ChartBody chart={chart} />
      )}
      {chart.unit ? <p className="mt-2 text-[11px] font-bold text-[#8b8f88]">Units: {chart.unit}</p> : null}
      {chart.note ? <p className="mt-1 text-[11px] italic text-[#8b8f88]">{chart.note}</p> : null}
    </div>
  );
}
