import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star, Trash2 } from "lucide-react";
import { money, type Product } from "@/lib/data-service";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export function ProductCard({ 
  product, 
  onDelete 
}: { 
  product: Product; 
  onDelete?: () => void; 
}) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const fav = isWishlisted(product.id);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card hover-lift flex flex-col h-full">
      {/* Container de imagem */}
      <Link
        to="/produto/$id"
        params={{ id: product.id }}
        className="relative block aspect-square w-full overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground z-10">
            {product.badge}
          </span>
        )}
      </Link>

      {/* BOTÃO DE APAGAR (Com e.preventDefault/e.stopPropagation para não abrir o link) */}
      {onDelete && (
        <button
          type="button"
          aria-label="Apagar Produto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          /* Ajustado a posição (left-3 se não tiver badge, ou ao lado do badge) */
          className={cn(
            "absolute top-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur border border-border text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors z-20",
            product.badge ? "left-20" : "left-3"
          )}
          title="Excluir produto"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Botão de Favoritar */}
      <button
        type="button"
        aria-label="Favoritar"
        onClick={() => toggleWishlist(product.id)}
        className={cn(
          "absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur border border-border hover:text-primary hover:border-primary/60 transition-colors z-10",
          fav && "text-primary border-primary/60"
        )}
      >
        <Heart className={cn("h-4 w-4", fav && "fill-primary")} />
      </button>

      {/* Botão de Adicionar ao Carrinho */}
      <button
        type="button"
        onClick={() => addToCart(product.id)}
        className="absolute inset-x-3 top-[calc(100%-11rem)] flex items-center justify-center gap-2 rounded-full gradient-primary text-primary-foreground h-11 text-sm font-semibold translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 shadow-[var(--shadow-glow)] z-10"
      >
        <ShoppingBag className="h-4 w-4" />
        Adicionar
      </button>

      {/* Informações do Produto */}
      <Link to="/produto/$id" params={{ id: product.id }} className="block p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {product.category}
          </div>
          <h3 className="mt-1 font-medium leading-snug line-clamp-2 min-h-[2.75rem]">
            {product.name}
          </h3>
        </div>

        <div>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="text-foreground font-medium">{product.rating.toFixed(1)}</span>
            <span>({product.reviews})</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-xl">{money(product.price)}</span>
            {product.oldPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {money(product.oldPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}