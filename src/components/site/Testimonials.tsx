import { Quote, Star } from "lucide-react";
import { SectionHeader } from "./Categories";

const items = [
  {
    name: "Marina R.",
    role: "Cliente desde 2023",
    text: "O sérum Amber virou obsessão. Textura leve, resultado visível em duas semanas.",
  },
  {
    name: "Carla T.",
    role: "Cliente desde 2024",
    text: "Embalagem impecável, entrega rápida e o perfume Noir é sofisticadíssimo.",
  },
  {
    name: "Lívia S.",
    role: "Cliente desde 2022",
    text: "Atendimento humano, produtos honestos. Voltei três vezes só esse mês.",
  },
];

export function Testimonials() {
  return (
    <section className="container-page py-24">
      <SectionHeader
        eyebrow="Depoimentos"
        title="Quem experimenta, volta."
        subtitle="Milhares de avaliações reais de quem faz parte da nossa comunidade."
      />
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div
            key={i}
            className="relative rounded-3xl border border-border bg-card p-8 hover-lift"
          >
            <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/40" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="mt-6 text-lg leading-relaxed">"{it.text}"</p>
            <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-primary-foreground font-semibold">
                {it.name[0]}
              </div>
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
