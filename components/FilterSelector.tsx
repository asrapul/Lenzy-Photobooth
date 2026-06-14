"use client";

type Filter = "normal" | "grayscale" | "sepia";

interface FilterSelectorProps {
  active: Filter;
  onChange: (filter: Filter) => void;
}

const FILTERS: { key: Filter; label: string; description: string; swatch: string }[] = [
  {
    key: "normal",
    label: "Normal",
    description: "Warna asli",
    swatch: "linear-gradient(135deg, #d4c9b8 0%, #9a8878 100%)",
  },
  {
    key: "grayscale",
    label: "B&W",
    description: "Hitam putih",
    swatch: "linear-gradient(135deg, #c0c0c0 0%, #606060 100%)",
  },
  {
    key: "sepia",
    label: "Sepia",
    description: "Vintage",
    swatch: "linear-gradient(135deg, #c8a070 0%, #7a4e28 100%)",
  },
];

export default function FilterSelector({ active, onChange }: FilterSelectorProps) {
  return (
    <div className="flex gap-2 w-full">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            id={`filter-${f.key}`}
            onClick={() => onChange(f.key)}
            className="flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none active:scale-[0.97]"
            style={{
              background: isActive ? "rgba(230,224,212,0.15)" : "rgba(0,0,0,0.2)",
              border: isActive
                ? "2px solid #e6e0d4"
                : "1.5px solid rgba(230,224,212,0.12)",
              boxShadow: isActive
                ? "0 4px 12px rgba(0,0,0,0.2)"
                : "none",
            }}
            aria-pressed={isActive}
            aria-label={`Apply ${f.label} filter`}
          >
            {/* Colour swatch — 36×36 square */}
            <div
              className="rounded-lg flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                background: f.swatch,
              }}
            />
            {/* Text */}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: isActive ? "#e6e0d4" : "rgba(230,224,212,0.5)" }}
              >
                {f.label}
              </span>
              <span
                className="text-[10px]"
                style={{ color: isActive ? "rgba(230,224,212,0.6)" : "rgba(230,224,212,0.28)" }}
              >
                {f.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
