import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { useStore } from "@/context/StoreContext";
import { money } from "@/lib/data-service";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — AuraEssence" }] }),
  component: CartPage,
});

function CartPage() {
  const { cartWithProducts, cartSubtotal, setQty, removeFromCart } = useStore();
  const shipping = cartSubtotal > 199 || cartSubtotal === 0 ? 0 : 19.9;
  const total = cartSubtotal + shipping;

  return (
    <PageShell>
      <div className="container-page py-12">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Seu carrinho</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {cartWithProducts.length} item{cartWithProducts.length === 1 ? "" : "s"}
        </p>

        {cartWithProducts.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-border bg-surface p-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-2xl">Seu carrinho está vazio</h2>
            <p className="mt-2 text-muted-foreground">Que tal explorar nossos favoritos?</p>
            <Link
              to="/produtos"
              className="mt-6 inline-flex items-center gap-2 rounded-full gradient-primary px-6 h-12 text-sm font-semibold text-primary-foreground"
            >
              Explorar produtos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
            <ul className="space-y-4">
              {cartWithProducts.map(({ product, qty }) => (
                <li
                  key={product.id}
                  className="flex gap-4 rounded-3xl border border-border bg-card p-4"
                >
                  <Link
                    to="/produto/$id"
                    params={{ id: product.id }}
                    className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface"
                  >
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {product.category}
                    </div>
                    <Link
                      to="/produto/$id"
                      params={{ id: product.id }}
                      className="mt-1 block font-medium hover:text-primary line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          onClick={() => setQty(product.id, qty - 1)}
                          className="grid h-9 w-9 place-items-center hover:text-primary"
                          aria-label="Diminuir"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{qty}</span>
                        <button
                          onClick={() => setQty(product.id, qty + 1)}
                          className="grid h-9 w-9 place-items-center hover:text-primary"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="font-display text-lg">{money(product.price * qty)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="self-start grid h-9 w-9 place-items-center rounded-full border border-border hover:border-destructive hover:text-destructive transition-colors"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <aside className="rounded-3xl border border-border bg-surface p-6 h-fit sticky top-28">
              <h2 className="font-display text-2xl">Resumo</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{money(cartSubtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd>{shipping === 0 ? "Grátis" : money(shipping)}</dd>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-display text-xl">
                  <dt>Total</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              <Link
                to="/checkout"
                className="mt-6 flex items-center justify-center gap-2 rounded-full gradient-primary h-12 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                Finalizar compra <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/produtos"
                className="mt-3 flex items-center justify-center rounded-full border border-border h-12 text-sm font-medium hover:border-primary/60 hover:text-primary transition-colors"
              >
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </div>
    </PageShell>
  );
}
