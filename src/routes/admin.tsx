import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Package,
  ShoppingCart,
  Users,
  Tag,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { listCategories, listProducts, money, saveCatalogSnapshot, type Category, type Product } from "@/lib/data-service";
import { filterOrdersByDate, getDateKey, type AdminOrder } from "@/lib/order-utils";
import { cn } from "@/lib/utils";
import { deleteOrderInSupabase, fetchOrdersFromSupabase, fetchProfilesFromSupabase, isSupabaseConfigured, supabase, updateOrderInSupabase, updateProfileRole } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AuraEssence" }] }),
  component: AdminPage,
});

type Tab = "dashboard" | "products" | "categories" | "orders" | "customers";

type Order = AdminOrder;

function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(state));
  }, [key, state, ready]);
  return [state, setState] as const;
}

function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; email: string; full_name: string | null; role: "admin" | "customer"; created_at: string }>>([]);

  const toggleProfileRole = async (profileId: string, currentRole: "admin" | "customer") => {
    const nextRole = currentRole === "admin" ? "customer" : "admin";
    try {
      await updateProfileRole(profileId, nextRole);
      setProfiles((current) => current.map((profile) => (profile.id === profileId ? { ...profile, role: nextRole } : profile)));
      toast.success("Role atualizada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o role.");
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate({ to: "/" });
      return;
    }

    let mounted = true;
    void Promise.all([listCategories(), listProducts()]).then(([cats, prods]) => {
      if (!mounted) return;
      setCategories(cats);
      setProducts(prods);
    });

    void (async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const [remoteOrders, remoteProfiles] = await Promise.all([
            fetchOrdersFromSupabase(),
            fetchProfilesFromSupabase(),
          ]);

          if (remoteOrders.length) {
            setOrders(remoteOrders.map((order) => ({
              id: order.id,
              createdAt: order.created_at,
              total: order.total,
              status: order.status,
              paymentMethod: order.payment_method ?? "Cartão de crédito",
              customerName: order.customer_name ?? undefined,
              customerEmail: order.customer_email ?? undefined,
              customerPhone: order.customer_phone ?? undefined,
              address: order.address ?? undefined,
              city: order.city ?? undefined,
              cep: order.cep ?? undefined,
              shipping: order.shipping ?? 0,
              paymentStatus: order.status === "processing" ? "Pendente" : "Recebido",
              items: (order.items ?? []).map((item: { productId?: string; name?: string; qty?: number; price?: number }) => ({
                productId: item.productId ?? "",
                name: item.name ?? "",
                qty: item.qty ?? 0,
                price: item.price ?? 0,
              })),
            })));
          }

          if (remoteProfiles.length) {
            setProfiles(remoteProfiles.map((profile) => ({
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              created_at: profile.created_at,
            })));
          }

          if (remoteOrders.length) return;
        }
      } catch {
        // fallback to local storage below
      }

      try {
        setOrders(JSON.parse(localStorage.getItem("obra:orders") || "[]"));
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [isAdmin, navigate, tab]);

  useEffect(() => {
    if (!products.length && !categories.length) return;
    void saveCatalogSnapshot({ categories, products });
  }, [categories, products]);

  const nav = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "products" as const, label: "Produtos", icon: Package },
    { id: "categories" as const, label: "Categorias", icon: Tag },
    { id: "orders" as const, label: "Pedidos", icon: ShoppingCart },
    { id: "customers" as const, label: "Clientes", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-border bg-surface p-6 lg:h-screen lg:sticky lg:top-0">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground font-black">
            ō
          </span>
          <div>
            <div className="font-display text-xl leading-none">
              <span className="text-gradient">AuraEssence</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Admin</div>
          </div>
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 h-11 text-sm transition-colors",
                tab === n.id
                  ? "gradient-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-background",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-10 rounded-2xl border border-border p-4 text-xs text-muted-foreground">
          Dados persistidos localmente. Ao ativar o backend, este painel pode ser conectado ao banco real.
        </div>
        <Link to="/" className="mt-6 block text-xs text-muted-foreground hover:text-primary">
          ← Voltar para a loja
        </Link>
      </aside>

      <main className="p-6 md:p-10">
        {tab === "dashboard" && <Dashboard products={products} orders={orders} categories={categories} />}
        {tab === "products" && <ProductsAdmin products={products} setProducts={setProducts} categories={categories} />}
        {tab === "categories" && <CategoriesAdmin categories={categories} setCategories={setCategories} />}
        {tab === "orders" && <OrdersAdmin orders={orders} setOrders={setOrders} />}
        {tab === "customers" && <CustomersAdmin profiles={profiles} onToggleRole={toggleProfileRole} />}
      </main>
    </div>
  );
}

function Dashboard({ products, orders, categories }: { products: Product[]; orders: Order[]; categories: Category[] }) {
  const [selectedDate, setSelectedDate] = useState("");
  const filteredOrders = useMemo(() => filterOrdersByDate(orders, selectedDate), [orders, selectedDate]);
  const revenue = filteredOrders.reduce((s, o) => s + o.total, 0);
  const stats = [
    { label: "Receita", value: money(revenue), icon: DollarSign },
    { label: "Pedidos", value: filteredOrders.length.toString(), icon: ShoppingCart },
    { label: "Produtos", value: products.length.toString(), icon: Package },
    { label: "Categorias", value: categories.length.toString(), icon: Tag },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Visão geral da sua loja.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span>Filtrar por data</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-full border border-border bg-background px-4 h-11 text-sm focus:outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-border bg-card p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 font-display text-3xl">{s.value}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              +12% vs. semana anterior
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Últimos pedidos</h2>
          {filteredOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum pedido encontrado para a data selecionada.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {filteredOrders.slice(0, 5).map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{o.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="font-display">{money(o.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Top produtos</h2>
          <ul className="mt-4 divide-y divide-border">
            {products.slice(0, 5).map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3 text-sm">
                <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category}</div>
                </div>
                <div className="font-display">{money(p.price)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProductsAdmin({
  products,
  setProducts,
  categories,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q],
  );

  const openNew = () => {
    setEditing({
      id: `p-${Date.now()}`,
      name: "",
      category: categories[0]?.name || "",
      categorySlug: categories[0]?.slug || "",
      price: 0,
      rating: 5,
      reviews: 0,
      image: products[0]?.image || "",
      description: "",
      sku: `OBR-${Math.floor(Math.random() * 9999)}`,
      stock: 10,
    });
    setOpen(true);
  };

  const save = async (p: Product) => {
    const nextProducts = products.some((x) => x.id === p.id)
      ? products.map((x) => (x.id === p.id ? p : x))
      : [p, ...products];
    setProducts(nextProducts);
    try {
      await saveCatalogSnapshot({ categories, products: nextProducts });
      toast.success("Produto salvo");
    } catch {
      toast.error("Não foi possível salvar o produto");
    }
    setOpen(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const nextProducts = products.filter((x) => x.id !== id);
    setProducts(nextProducts);
    try {
      await saveCatalogSnapshot({ categories, products: nextProducts });
      toast.success("Produto removido");
    } catch {
      toast.error("Não foi possível remover o produto");
    }
  };
  const deleteProduct = async (id: string) => {
  if (!confirm("Excluir produto permanentemente?")) return;

  const nextProducts = products.filter((p) => p.id !== id);
  setProducts(nextProducts);

  try {
    // Atualiza o snapshot/banco mantendo as categorias atuais e salvando a nova lista de produtos
    await saveCatalogSnapshot({ categories, products: nextProducts });
    toast.success("Produto excluído com sucesso!");
  } catch (error) {
    // Em caso de erro na API/Supabase, reverte a interface
    setProducts(products);
    toast.error(error instanceof Error ? error.message : "Erro ao excluir o produto");
  }
};
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Produtos</h1>
          <p className="mt-2 text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground h-11 px-5 text-sm font-semibold shadow-[var(--shadow-glow)]"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-surface px-4 h-11 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produtos..."
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted-foreground text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left p-4">Produto</th>
              <th className="text-left p-4 hidden md:table-cell">Categoria</th>
              <th className="text-left p-4 hidden md:table-cell">SKU</th>
              <th className="text-left p-4">Preço</th>
              <th className="text-left p-4 hidden sm:table-cell">Estoque</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-surface/60">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="font-medium truncate max-w-[16rem]">{p.name}</div>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{p.category}</td>
                <td className="p-4 hidden md:table-cell text-muted-foreground">{p.sku}</td>
                <td className="p-4 font-display">{money(p.price)}</td>
                <td className="p-4 hidden sm:table-cell">{p.stock}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full border border-border hover:text-primary hover:border-primary/60"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-border hover:text-destructive hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && editing && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [form, setForm] = useState(product);
  const update = <K extends keyof Product>(k: K, v: Product[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 max-h-[90vh] overflow-auto"
      >
        <h2 className="font-display text-2xl">
          {product.name ? "Editar produto" : "Novo produto"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="mt-6 grid gap-4"
        >
          <AdminField label="Nome" value={form.name} onChange={(v) => update("name", v)} required />
          <AdminField
            label="Descrição"
            value={form.description}
            onChange={(v) => update("description", v)}
            textarea
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Categoria</label>
              <select
                value={form.categorySlug}
                onChange={(e) => {
                  const c = categories.find((x) => x.slug === e.target.value);
                  if (c) {
                    update("categorySlug", c.slug);
                    update("category", c.name);
                  }
                }}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 h-12 text-sm focus:outline-none focus:border-primary"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <AdminField label="SKU" value={form.sku} onChange={(v) => update("sku", v)} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <AdminField
              label="Preço"
              type="number"
              value={String(form.price)}
              onChange={(v) => update("price", Number(v))}
            />
            <AdminField
              label="Preço antigo"
              type="number"
              value={String(form.oldPrice ?? "")}
              onChange={(v) => update("oldPrice", v ? Number(v) : undefined)}
            />
            <AdminField
              label="Estoque"
              type="number"
              value={String(form.stock)}
              onChange={(v) => update("stock", Number(v))}
            />
          </div>
          <AdminField label="Badge (opcional)" value={form.badge ?? ""} onChange={(v) => update("badge", v || undefined)} />
          <AdminField label="URL da imagem" value={form.image} onChange={(v) => update("image", v)} />

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border h-11 px-5 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-full gradient-primary text-primary-foreground h-11 px-6 text-sm font-semibold"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  type = "text",
  textarea,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 h-12 text-sm focus:outline-none focus:border-primary"
        />
      )}
    </label>
  );
}

function CategoriesAdmin({
  categories,
  setCategories,
}: {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}) {
  const [name, setName] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const nextCategories = [
      ...categories,
      { slug, name, image: categories[0]?.image || "", count: 0 },
    ];
    setCategories(nextCategories);
    setName("");
    try {
      await saveCatalogSnapshot({ categories: nextCategories, products });
      toast.success("Categoria adicionada");
    } catch {
      toast.error("Não foi possível salvar a categoria");
    }
  };
  const remove = async (slug: string) => {
  if (!confirm("Excluir categoria?")) return;
  const nextCategories = categories.filter((c) => c.slug !== slug);
  setCategories(nextCategories);
  try {
    await saveCatalogSnapshot({ categories: nextCategories, products: [] });
    toast.success("Categoria removida");
  } catch {
    toast.error("Não foi possível remover a categoria");
  }
};

return (
  <div>
    <h1 className="font-display text-4xl">Categorias</h1>
    <p className="mt-2 text-sm text-muted-foreground">Organize os produtos da sua loja.</p>

    <form onSubmit={add} className="mt-6 flex gap-3 max-w-lg">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da nova categoria"
        className="flex-1 rounded-full border border-border bg-surface px-5 h-11 text-sm focus:outline-none focus:border-primary"
      />
      <button className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground h-11 px-5 text-sm font-semibold">
        <Plus className="h-4 w-4" /> Adicionar
      </button>
    </form>

    <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((c) => (
        <div key={c.slug} className="rounded-3xl border border-border bg-card overflow-hidden hover-lift">
          <div className="aspect-[4/3] bg-surface overflow-hidden">
            <img src={c.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="font-display text-xl">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <button
              onClick={() => remove(c.slug)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
}

function OrdersAdmin({ orders, setOrders }: { orders: Order[]; setOrders: React.Dispatch<React.SetStateAction<Order[]>> }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [draft, setDraft] = useState<Order | null>(null);
  const filteredOrders = useMemo(() => filterOrdersByDate(orders, selectedDate), [orders, selectedDate]);

  const saveOrder = async () => {
    if (!draft) return;
    try {
      // Enviando as atualizações para o Supabase (incluindo o status de pagamento mapeado)
      await updateOrderInSupabase(draft.id, {
        status: draft.status,
        customer_name: draft.customerName ?? null,
        customer_email: draft.customerEmail ?? null,
        customer_phone: draft.customerPhone ?? null,
        address: draft.address ?? null,
        city: draft.city ?? null,
        cep: draft.cep ?? null,
        payment_method: draft.paymentMethod ?? null,
        payment_status: draft.paymentStatus === "Recebido" ? "paid" : "pending", // Alinhando com a estrutura do seu banco
        total: draft.total,
        shipping: draft.shipping ?? 0,
      });

      const nextOrders = orders.map((order) => (order.id === draft.id ? { ...order, ...draft } : order));
      setOrders(nextOrders);
      
      try {
        localStorage.setItem("obra:orders", JSON.stringify(nextOrders));
      } catch {}
      
      toast.success("Pedido atualizado");
      setEditingOrder(null);
      setDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o pedido");
    }
  };

  const removeOrder = async () => {
    if (!draft || !confirm("Excluir este pedido permanentemente?")) return;
    try {
      await deleteOrderInSupabase(draft.id);
      const nextOrders = orders.filter((order) => order.id !== draft.id);
      setOrders(nextOrders);
      try {
        localStorage.setItem("obra:orders", JSON.stringify(nextOrders));
      } catch {}
      toast.success("Pedido excluído");
      setEditingOrder(null);
      setDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o pedido");
    }
  };

  // Função auxiliar de estilo para deixar os badges mais visuais
  const getStatusBadgeClass = (status: string) => {
    const base = "rounded-full text-xs px-3 py-1 uppercase tracking-widest font-semibold border ";
    switch (status) {
      case "delivered":
        return base + "border-green-500/30 bg-green-500/10 text-green-500";
      case "cancelled":
        return base + "border-red-500/30 bg-red-500/10 text-red-500";
      case "shipped":
        return base + "border-blue-500/30 bg-blue-500/10 text-blue-500";
      default: // processing
        return base + "border-yellow-500/30 bg-yellow-500/10 text-yellow-500";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">{filteredOrders.length} pedido(s) registrado(s) para a data selecionada</p>
        </div>
        <label className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span>Filtrar por data</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-full border border-border bg-background px-4 h-11 text-sm focus:outline-none focus:border-primary"
          />
        </label>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-surface p-12 text-center text-muted-foreground">
          Nenhum pedido encontrado para essa data.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-muted-foreground text-xs uppercase tracking-widest">
              <tr>
                <th className="text-left p-4">Pedido</th>
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Cliente</th>
                <th className="text-left p-4">Itens</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Pagamento</th>
                <th className="text-left p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-medium">{o.id}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-4 text-muted-foreground">{o.customerName ?? "Cliente"}</td>
                  <td className="p-4 text-muted-foreground">{o.items.length}</td>
                  <td className="p-4 font-display">{money(o.total)}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      o.paymentStatus === "Recebido" ? "text-green-500 bg-green-500/10" : "text-amber-500 bg-amber-500/10"
                    }`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={getStatusBadgeClass(o.status)}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setEditingOrder(o);
                        setDraft(o);
                      }}
                      className="rounded-full border border-border px-3 py-2 text-xs transition hover:border-primary hover:text-primary"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingOrder && draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4" onClick={() => setEditingOrder(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl rounded-3xl border border-border bg-card p-6 max-h-[90vh] overflow-auto">
            <h2 className="font-display text-2xl">Editar pedido {editingOrder.id}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Status do Pedido</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, status: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </label>
              
              {/* Novo seletor de status do pagamento para gerenciar depósitos pendentes/Pix */}
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Status do Pagamento</span>
                <select
                  value={draft.paymentStatus}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, paymentStatus: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Recebido">Recebido</option>
                </select>
              </label>

              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Forma de pagamento</span>
                <input
                  value={draft.paymentMethod ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, paymentMethod: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Nome do cliente</span>
                <input
                  value={draft.customerName ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, customerName: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">E-mail</span>
                <input
                  value={draft.customerEmail ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, customerEmail: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Telefone</span>
                <input
                  value={draft.customerPhone ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, customerPhone: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">CEP</span>
                <input
                  value={draft.cep ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, cep: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground md:col-span-2">
                <span className="mb-2 block">Endereço</span>
                <input
                  value={draft.address ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, address: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Cidade</span>
                <input
                  value={draft.city ?? ""}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, city: e.target.value } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
              <label className="text-sm text-muted-foreground">
                <span className="mb-2 block">Valor pago</span>
                <input
                  type="number"
                  value={draft.total}
                  onChange={(e) => setDraft((prev) => prev ? { ...prev, total: Number(e.target.value) } : prev)}
                  className="w-full rounded-2xl border border-border bg-background px-4 h-11 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <div className="text-sm font-semibold">Itens do pedido</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {draft.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex items-center justify-between gap-3">
                    <span>{item.name} × {item.qty}</span>
                    <span>{money(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={removeOrder} className="rounded-full border border-destructive/40 text-destructive h-11 px-5 text-sm">Excluir</button>
              <button type="button" onClick={() => setEditingOrder(null)} className="rounded-full border border-border h-11 px-5 text-sm">Cancelar</button>
              <button type="button" onClick={saveOrder} className="rounded-full gradient-primary text-primary-foreground h-11 px-6 text-sm font-semibold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersAdmin({
  profiles,
  onToggleRole,
}: {
  profiles: Array<{ id: string; email: string; full_name: string | null; role: "admin" | "customer"; created_at: string }>;
  onToggleRole: (profileId: string, currentRole: "admin" | "customer") => Promise<void>;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl">Clientes</h1>
      <p className="mt-2 text-sm text-muted-foreground">{profiles.length} cliente(s)</p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted-foreground text-xs uppercase tracking-widest">
            <tr>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">E-mail</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Criado</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="p-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground text-sm font-semibold">
                    {profile.full_name?.[0] ?? profile.email[0]}
                  </div>
                  <div className="font-medium">{profile.full_name ?? "Sem nome"}</div>
                </td>
                <td className="p-4 text-muted-foreground">{profile.email}</td>
                <td className="p-4 uppercase tracking-widest text-xs font-semibold">
                  {profile.role}
                </td>
                <td className="p-4 text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onToggleRole(profile.id, profile.role)}
                    className="rounded-full border border-border px-3 py-2 text-xs transition hover:border-primary hover:text-primary"
                  >
                    Tornar {profile.role === "admin" ? "cliente" : "admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}