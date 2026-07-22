import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { useAuth } from "@/context/AuthContext";
import { fetchOrdersFromSupabase, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { money } from "@/lib/data-service";

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  items: { productId: string; name: string; qty: number; price: number }[];
};

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Minha conta — AuraEssence" }] }),
  component: AccountPage,
});

function getOrderStorageKey(userId?: string | null) {
  return `auraessence:orders:${userId ?? "guest"}`;
}

function AccountPage() {
  const { user, isAdmin, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const storageKey = getOrderStorageKey(user?.id);
    let mounted = true;

    const loadOrders = async () => {
      if (user && isSupabaseConfigured && supabase) {
        try {
          const remoteOrders = await fetchOrdersFromSupabase(user.id);
          if (mounted) {
            setOrders(
              remoteOrders.map((o) => ({
                id: o.id,
                createdAt: o.created_at,
                total: o.total,
                status: o.status,
                items: (o.items ?? []) as { productId: string; name: string; qty: number; price: number }[],
              })),
            );
            return;
          }
        } catch {
          // fallback to local orders if Supabase is unavailable
        }
      }

      try {
        if (mounted) {
          setOrders(JSON.parse(localStorage.getItem(storageKey) || "[]"));
        }
      } catch {
        if (mounted) setOrders([]);
      }
    };

    void loadOrders();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <PageShell>
      <div className="container-page py-12 grid lg:grid-cols-[240px_1fr] gap-10">
        <aside>
          <div className="rounded-3xl border border-border bg-surface p-6">
            <div className="grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground font-display text-xl">
              {user?.name?.[0] ?? "V"}
            </div>
            <div className="mt-4 font-medium">{user?.name ?? "Visitante"}</div>
            <div className="text-xs text-muted-foreground">{user ? `${user.email} · ${isAdmin ? "Admin" : "Cliente"}` : "Não autenticado"}</div>
            {user ? (
              <button
                onClick={() => signOut()}
                className="mt-4 flex w-full items-center justify-center rounded-full border border-border h-10 text-xs font-semibold"
              >
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                className="mt-4 flex items-center justify-center rounded-full gradient-primary h-10 text-xs font-semibold text-primary-foreground"
              >
                Entrar
              </Link>
            )}
          </div>
          <nav className="mt-4 flex flex-col text-sm">
            {["Pedidos", "Endereços", "Dados pessoais", "Preferências"].map((l) => (
              <a key={l} href="#" className="py-3 px-2 text-muted-foreground hover:text-foreground">
                {l}
              </a>
            ))}
          </nav>
        </aside>

        <div>
          <h1 className="font-display text-4xl">Meus pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Histórico das suas compras.</p>
          {orders.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-border bg-surface p-12 text-center">
              <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              <Link to="/produtos" className="mt-4 inline-block text-primary underline">
                Explorar produtos
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-4">
              {orders.map((o) => (
                <li key={o.id} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-xl">Pedido {o.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("pt-BR")} • {o.items.length} item(s)
                      </div>
                    </div>
                    <span className="rounded-full border border-primary/40 text-primary text-xs px-3 py-1 uppercase tracking-widest">
                      {o.status}
                    </span>
                    <div className="font-display text-xl">{money(o.total)}</div>
                  </div>
                  <ul className="mt-4 text-sm text-muted-foreground space-y-1">
                    {o.items.map((it) => (
                      <li key={it.productId}>
                        {it.qty}× {it.name} — {money(it.price * it.qty)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
