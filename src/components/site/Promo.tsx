import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import promoImg from "@/assets/cat-perfume.jpg";

export function Promo() {
  return (
    <section className="container-page py-20">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border">
        <img
          src={promoImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative grid md:grid-cols-2 gap-10 p-10 md:p-16 min-h-[420px] items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-primary">
              Promoção da semana
            </div>
            <h2 className="mt-4 font-display text-4xl md:text-6xl leading-[1] tracking-tight">
              Descontos <span className="text-gradient italic">progressivos</span>
              <br />até <span className="text-primary">30% off</span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-md">
              Leve mais, pague menos. 2 itens com 20% off. 3 ou mais com 30% off em
              produtos selecionados.
            </p>
            <Link
              to="/produtos"
              className="mt-8 inline-flex items-center gap-2 rounded-full gradient-primary px-7 h-14 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              Aproveitar oferta <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-4">
            {[
              ["2", "itens", "20", "off"],
              ["3+", "itens", "30", "off"],
            ].map(([n, l, d, o]) => (
              <div
                key={n}
                className="rounded-3xl border border-border bg-card/70 backdrop-blur p-6 text-center hover-lift"
              >
                <div className="font-display text-5xl">{n}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {l}
                </div>
                <div className="mt-6 grid place-items-center h-24 w-24 mx-auto rounded-full gradient-primary text-primary-foreground">
                  <div className="font-display text-3xl leading-none">
                    {d}
                    <span className="text-xs align-top">%</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest -mt-1">{o}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
