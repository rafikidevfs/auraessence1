import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { ProductCard } from "@/components/site/ProductCard";
import { listCategories, listProducts, deleteProduct, type Category, type Product } from "@/lib/data-service";
import { cn } from "@/lib/utils";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  sort: z.enum(["relev", "price-asc", "price-desc", "rating"]).optional(),
});

export const Route = createFileRoute("/produtos")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Todos os produtos — AuraEssence" },
      { name: "description", content: "Explore a coleção completa: skincare, perfumaria, maquiagem, cabelos e mais." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, cat, sort = "relev" } = Route.useSearch();
  const [priceMax, setPriceMax] = useState<number>(500);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([listCategories(), listProducts()]).then(([cats, items]) => {
      if (!mounted) return;
      setCategories(cats);
      setProducts(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Handler que chama o deleteProduct do data-service (persiste no cache + storage + supabase)
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Erro ao apagar produto:", error);
    }
  };

  const filtered = useMemo(() => {
    let list = products.slice();
    if (cat) list = list.filter((p) => p.categorySlug === cat);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s),
      );
    }
    list = list.filter((p) => p.price <= priceMax);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, cat, sort, priceMax, products]);

  return (
    <PageShell>
      <div className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary">Loja</div>
            <h1 className="mt-2 font-display text-4xl md:text-5xl tracking-tight">
              {cat ? categories.find((c) => c.slug === cat)?.name : "Todos os produtos"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {filtered.length} produto{filtered.length === 1 ? "" : "s"}
              {q ? ` para "${q}"` : ""}
            </p>
          </div>
          <Link
            to="/produtos"
            search={{}}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Limpar filtros
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-[240px_1fr] gap-10">
          <aside className="space-y-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">Categorias</div>
              <div className="flex flex-col gap-1">
                <Link
                  to="/produtos"
                  search={{ q, sort, cat: undefined }}
                  className={cn(
                    "text-sm py-1.5 text-muted-foreground hover:text-foreground",
                    !cat && "text-foreground font-medium",
                  )}
                >
                  Todas
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/produtos"
                    search={{ q, sort, cat: c.slug }}
                    className={cn(
                      "text-sm py-1.5 text-muted-foreground hover:text-foreground",
                      cat === c.slug && "text-foreground font-medium",
                    )}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">
                Preço máximo
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)]"
              />
              <div className="mt-2 text-sm text-muted-foreground">Até R$ {priceMax}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-primary mb-3">Ordenar</div>
              <div className="flex flex-col gap-1">
                {([
                  ["relev", "Relevância"],
                  ["price-asc", "Menor preço"],
                  ["price-desc", "Maior preço"],
                  ["rating", "Melhor avaliados"],
                ] as const).map(([v, l]) => (
                  <Link
                    key={v}
                    to="/produtos"
                    search={{ q, cat, sort: v }}
                    className={cn(
                      "text-sm py-1.5 text-muted-foreground hover:text-foreground",
                      sort === v && "text-foreground font-medium",
                    )}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-border bg-surface p-16 text-center">
                <div className="font-display text-2xl">Nada encontrado</div>
                <p className="mt-2 text-muted-foreground">Tente ajustar os filtros.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onDelete={() => handleDeleteProduct(p.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}