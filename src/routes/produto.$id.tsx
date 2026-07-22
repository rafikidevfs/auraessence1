import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ProductCard } from "@/components/site/ProductCard";
import { getProductById, listProducts, money, type Product } from "@/lib/data-service";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ params }) => {
    const product = await getProductById(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.product.name} — AuraEssence` },
            { name: "description", content: loaderData.product.description },
          ],
        }
      : { meta: [{ title: "Produto não encontrado" }] },
  component: ProductPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl">Produto não encontrado</h1>
        <Link to="/produtos" className="mt-6 inline-block text-primary underline">
          Ver todos os produtos
        </Link>
      </div>
    </PageShell>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const fav = isWishlisted(product.id);

  useEffect(() => {
    let mounted = true;
    void listProducts().then((items) => {
      if (mounted) setProducts(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const related = products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 4);

  return (
    <PageShell>
      <div className="container-page py-10">
        <nav className="text-xs text-muted-foreground flex gap-2">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <Link to="/produtos" className="hover:text-foreground">Produtos</Link>
          <span>/</span>
          <Link to="/categoria/$slug" params={{ slug: product.categorySlug }} className="hover:text-foreground">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid lg:grid-cols-2 gap-12">
          <div className="relative rounded-[2rem] overflow-hidden border border-border bg-surface aspect-square">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {product.badge && (
              <span className="absolute top-5 left-5 rounded-full gradient-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                {product.badge}
              </span>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary">{product.category}</div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl leading-tight tracking-tight">{product.name}</h1>

            <div className="mt-4 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">({product.reviews} avaliações)</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">SKU {product.sku}</span>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <div className="font-display text-4xl">{money(product.price)}</div>
              {product.oldPrice && (
                <div className="text-muted-foreground line-through">{money(product.oldPrice)}</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              em até 10x de {money(product.price / 10)} sem juros
            </div>

            <p className="mt-8 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-12 w-12 place-items-center hover:text-primary"
                  aria-label="Diminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="grid h-12 w-12 place-items-center hover:text-primary"
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => addToCart(product.id, qty)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full gradient-primary h-12 px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                <ShoppingBag className="h-4 w-4" />
                Adicionar ao carrinho
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Favoritar"
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full border border-border hover:text-primary hover:border-primary/60 transition-colors",
                  fav && "text-primary border-primary/60",
                )}
              >
                <Heart className={cn("h-4 w-4", fav && "fill-primary")} />
              </button>
            </div>

            <button
              onClick={() => {
                addToCart(product.id, qty);
                navigate({ to: "/checkout" });
              }}
              className="mt-3 w-full rounded-full border border-primary/40 h-12 text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Comprar agora
            </button>

            <div className="mt-10 grid sm:grid-cols-3 gap-3 text-sm">
              {[
                [Truck, "Entrega em 48h"],
                [ShieldCheck, "Compra 100% segura"],
                [RefreshCw, "Trocas em 30 dias"],
              ].map(([Icon, l], i) => {
                const I = Icon as typeof Truck;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-border p-4">
                    <I className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{l as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-3xl">Você também vai gostar</h2>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
