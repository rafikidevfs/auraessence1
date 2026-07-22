import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Categories } from "@/components/site/Categories";
import { ProductRow } from "@/components/site/ProductRow";
import { Promo } from "@/components/site/Promo";
import { Benefits } from "@/components/site/Benefits";
import { Testimonials } from "@/components/site/Testimonials";
import { Newsletter } from "@/components/site/Newsletter";
import { Footer } from "@/components/site/Footer";
import { useEffect, useState } from "react";
import { getBestsellers, getFeaturedProducts, getNewArrivals, type Product } from "@/lib/data-service";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      getFeaturedProducts(),
      getBestsellers(),
      getNewArrivals()
    ]).then(([featuredItems, bestItems, arrivalItems]) => {
      if (!mounted) return;
      setFeatured(featuredItems);
      setBestsellers(bestItems);
      setNewArrivals(arrivalItems);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* 🚀 ÁREA RESERVADA PARA SUA ANIMAÇÃO 3D */}
      <div 
        id="canvas-3d-container" 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      >
        {/* Adicione o seu Canvas 3D (ex: Three.js / React Three Fiber / Canvas / Spline) aqui dentro */}
        
        {/* Glow ambient de apoio (opcional - cria iluminação de fundo suave) */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* 🔮 CONTEÚDO PRINCIPAL (Z-INDEX SUPERIOR) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 space-y-16 md:space-y-24 pb-16">
          <Hero />
          
          <div className="border-y border-white/10 bg-black/40 backdrop-blur-md py-4">
            <Marquee />
          </div>

          <section className="px-4 md:px-8 max-w-7xl mx-auto w-full">
            <Categories />
          </section>

          <section className="px-4 md:px-8 max-w-7xl mx-auto w-full space-y-24">
            <ProductRow
              id="featured"
              eyebrow="Em destaque"
              title="Selecionados pela nossa curadoria"
              subtitle="Os produtos mais desejados da estação, escolhidos a dedo."
              products={featured}
            />

            <div className="rounded-3xl border border-white/10 bg-neutral-950/60 backdrop-blur-lg overflow-hidden shadow-2xl">
              <Promo />
            </div>

            <ProductRow
              eyebrow="Mais vendidos"
              title="Os favoritos da comunidade"
              subtitle="O que sai das prateleiras e vira ritual em casa."
              products={bestsellers}
            />

            <ProductRow
              eyebrow="Lançamentos"
              title="Acabou de chegar"
              subtitle="Novidades quentinhas para você experimentar primeiro."
              products={newArrivals}
            />
          </section>

          <section className="border-t border-white/10 bg-neutral-950/80 backdrop-blur-md py-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-20">
              <Benefits />
              <Testimonials />
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="p-8 md:p-12 rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900/80 to-black backdrop-blur-xl shadow-2xl">
              <Newsletter />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}