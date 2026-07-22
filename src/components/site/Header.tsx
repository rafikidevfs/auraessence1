import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { listCategories, type Category } from "@/lib/data-service";
import logoImage from "@/assets/logocrispng.png";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();
  const { cartCount, wishlist } = useStore();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    let mounted = true;
    void listCategories().then((items) => {
      if (mounted) setCategories(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/produtos", search: { q: q || undefined } as { q?: string } });
    setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-background/75 border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="container-page flex h-20 items-center gap-6 -ml-10">
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Logo da AuraEssence" className="h-49 w49 mt-11 rounded-full object-cover" />
            <span className="font-logo text-4xl sm:text5x1 font-normal loading-none -ml-9 tracking-tight">
              <span className="text-gradient left-100 font-bold">AuraEssence</span>
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
          <Link to="/produtos" className="relative py-2 transition-colors hover:text-foreground">
            Novidades
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="relative py-2 transition-colors hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 min-w-0">
          <form
            onSubmit={submitSearch}
            className="hidden md:flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 h-11 min-w-64 focus-within:border-primary/60 transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="O que você procura?"
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </form>

          <Link
            to="/favoritos"
            aria-label="Favoritos"
            className="relative hidden sm:grid h-11 w-11 place-items-center rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors"
          >
            <Heart className="h-4 w-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            to="/conta"
            aria-label="Conta"
            className="hidden sm:grid h-11 w-11 place-items-center rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors"
          >
            <User className="h-4 w-4" />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="relative grid h-11 w-11 place-items-center rounded-full gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-background text-[10px] font-bold text-primary border border-primary/40">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 lg:hidden place-items-center rounded-full border border-border"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <nav className="container-page flex flex-col py-4 gap-1">
            <Link to="/produtos" onClick={() => setOpen(false)} className="py-3 text-sm text-muted-foreground hover:text-foreground">
              Todos os produtos
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
