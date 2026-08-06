"use client";

export interface ChartSpec {
  type?: string;
  title?: string;
  unit?: string;
  categories?: string[] | string;
  values?: number[] | string;
}

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

export function ChartCard({ chart }: { chart: ChartSpec }) {
  const categories = toCategories(chart.categories);
  const values = toValues(chart.values);
  const max = Math.max(1, ...values);
  return (
    <div className="mt-4 rounded-2xl border border-[#d8c8a8] bg-white/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Chart · Task 1</p>
      <p className="mt-1 text-sm font-bold text-[#17342f]">{chart.title}</p>
      <div className="mt-4 flex h-44 items-end gap-3 border-b border-[#d8c8a8] px-2">
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
      {chart.unit ? <p className="mt-2 text-[11px] font-bold text-[#8b8f88]">Units: {chart.unit}</p> : null}
    </div>
  );
}