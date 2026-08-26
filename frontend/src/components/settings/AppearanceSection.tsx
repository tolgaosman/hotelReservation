import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";

const PALETTE = [
  { name: "Zemin", value: "var(--canvas)" },
  { name: "Metin", value: "var(--ink)" },
  { name: "İkincil", value: "var(--muted)" },
  { name: "Aksan", value: "var(--accent)" },
  { name: "Nane", value: "var(--mint)" },
];

export function AppearanceSection() {
  return (
    <Card title="Görünüm" subtitle="Panel teması" padded>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
            <Check size={16} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Açık Tema</p>
            <p className="text-xs text-[var(--muted)]">Bu panel sabit bir açık tema kullanır.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {PALETTE.map((swatch) => (
            <span
              key={swatch.name}
              title={swatch.name}
              className="size-6 rounded-full border border-[var(--line)]"
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
