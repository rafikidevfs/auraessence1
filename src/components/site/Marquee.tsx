import { Sparkles } from "lucide-react";

const items = [
  "Frete grátis acima de R$ 199",
  "Amostras exclusivas em toda compra",
  "Até 10x sem juros",
  "Entrega expressa em 48h",
  "Novos lançamentos toda semana",
];

export function Marquee() {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface py-4">
      <div className="flex gap-12 whitespace-nowrap marquee w-max">
        {loop.map((t, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="uppercase tracking-[0.25em] text-xs">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
