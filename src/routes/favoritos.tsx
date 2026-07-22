import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { ProductCard } from "@/components/site/ProductCard";
import { listProducts, type Product } from "@/lib/data-service";
import { useStore } from "@/context/StoreContext";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — AuraEssence" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    void listProducts().then((items) => {
      if (mounted) setProducts(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const items = products.filter((p) => wishlist.includes(p.id));
  return (
    <PageShell>
      <div className="container-page py-12">
        <h1 className="font-display text-4xl md:text-5xl">Favoritos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {items.length} produto{items.length === 1 ? "" : "s"} salvo{items.length === 1 ? "" : "s"}
        </p>

        {items.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-border bg-surface p-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-6 font-display text-2xl">Nada salvo por aqui ainda</h2>
            <p className="mt-2 text-muted-foreground">Toque no coração dos produtos que você amar.</p>
            <Link
              to="/produtos"
              className="mt-6 inline-flex rounded-full gradient-primary text-primary-foreground h-12 px-6 items-center text-sm font-semibold"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
