import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { listProducts, type Product } from "@/lib/data-service";
import { fetchWishlistFromSupabase, isSupabaseConfigured, removeWishlistFromSupabase, saveWishlistToSupabase, supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export type CartItem = { productId: string; qty: number };

type StoreCtx = {
  cart: CartItem[];
  wishlist: string[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  cartWithProducts: Array<CartItem & { product: Product }>;
};

const Ctx = createContext<StoreCtx | null>(null);

const CART_KEY = "obra:cart";
const WISH_KEY = "obra:wishlist";

const readLS = <T,>(k: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readLS<CartItem[]>(CART_KEY, []));
    setWishlist(readLS<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      try {
        const remoteWishlist = await fetchWishlistFromSupabase(user.id);
        if (remoteWishlist.length) {
          setWishlist((prev) => Array.from(new Set([...prev, ...remoteWishlist])));
        }
      } catch {
        // keep local state if remote sync fails
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    void listProducts().then((items) => {
      if (mounted) setProducts(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = useCallback((productId: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { productId, qty }];
    });
    const p = products.find((x) => x.id === productId);
    toast.success("Adicionado ao carrinho", { description: p?.name });
  }, [products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId];
      if (user?.id && isSupabaseConfigured && supabase) {
        void (async () => {
          try {
            if (next.includes(productId)) {
              await saveWishlistToSupabase(user.id, productId);
              toast.success("Adicionado aos favoritos");
            } else {
              await removeWishlistFromSupabase(user.id, productId);
              toast("Removido dos favoritos");
            }
          } catch {
            toast.error("Não foi possível sincronizar favoritos");
          }
        })();
      }
      return next;
    });
  }, [user?.id]);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const cartWithProducts = useMemo(
    () =>
      cart
        .map((c) => {
          const product = products.find((p) => p.id === c.productId);
          return product ? { ...c, product } : null;
        })
        .filter((x): x is CartItem & { product: Product } => x !== null),
    [cart, products],
  );

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cartWithProducts.reduce((s, i) => s + i.product.price * i.qty, 0),
    [cartWithProducts],
  );

  const value: StoreCtx = {
    cart,
    wishlist,
    cartCount,
    cartSubtotal,
    addToCart,
    removeFromCart,
    setQty,
    clearCart,
    toggleWishlist,
    isWishlisted,
    cartWithProducts,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}
