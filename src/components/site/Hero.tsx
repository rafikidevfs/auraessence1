import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { heroImage } from "@/lib/data-service";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="absolute inset-0 gradient-radial-primary opacity-70 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="container-page grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center py-12 md:py-20">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Coleção de inverno
          </div>

          <h1 className="mt-6 font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
            Beleza que <span className="text-gradient italic">acende</span>
            <br />o que você é.
          </h1>

          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Produtos autorais de skincare, perfumaria e cuidado corporal — formulados
            com ingredientes ativos e desenhados para durar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/produtos"
              className="group inline-flex items-center gap-2 rounded-full gradient-primary px-7 h-14 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Comprar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-7 h-14 text-sm font-semibold hover:border-primary/60 hover:text-primary transition-colors"
            >
              Explorar coleções
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {[
              ["500+", "produtos"],
              ["4.9★", "avaliações"],
              ["48h", "entrega"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-3xl">{v}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-[3rem] bg-primary/15 blur-3xl" />
          <Link
            to="/produto/$id"
            params={{ id: "p-1" }}
            className="relative block aspect-[5/6] rounded-[2.5rem] overflow-hidden border border-border bg-surface float-slow"
          >
            <img
              src={heroImage}
              alt="Frasco premium em iluminação dramática"
              className="h-full w-full object-cover"
              width={1600}
              height={1400}
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl gradient-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-primary">Destaque</div>
                <div className="font-medium truncate">Sérum Amber · Edição limitada</div>
              </div>
              <div className="ml-auto font-display text-xl shrink-0">R$ 249</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
