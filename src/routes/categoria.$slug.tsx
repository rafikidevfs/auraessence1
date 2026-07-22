import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategoryBySlug, listProductsByCategory, type Product } from "@/lib/data-service";

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ params }) => {
    const [category, items] = await Promise.all([getCategoryBySlug(params.slug), listProductsByCategory(params.slug)]);
    if (!category) throw notFound();
    return { category, items };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.category.name} — AuraEssence` },
            { name: "description", content: `Descubra nossa coleção de ${loaderData.category.name.toLowerCase()}.` },
          ],
        }
      : { meta: [{ title: "Categoria" }] },
  component: CategoryPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-4xl">Categoria não encontrada</h1>
        <Link to="/produtos" className="mt-6 inline-block text-primary underline">
          Ver todos os produtos
        </Link>
      </div>
    </PageShell>
  ),
});

function CategoryPage() {
  const { category, items } = Route.useLoaderData() as { category: Awaited<ReturnType<typeof getCategoryBySlug>>; items: Product[] };
  if (!category) return null;
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="container-page relative py-16">
          <div className="text-xs uppercase tracking-[0.3em] text-primary">Categoria</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl tracking-tight">{category.name}</h1>
          <p className="mt-3 text-muted-foreground">{items.length} produtos disponíveis</p>
        </div>
      </section>
      <div className="container-page py-16">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-16 text-center">
            <p className="text-muted-foreground">Nenhum produto nessa categoria ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
