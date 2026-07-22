import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Lock, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { PageShell } from "@/components/site/PageShell";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { money, decrementStock } from "@/lib/data-service";
import { buildPixPayload } from "@/lib/order-utils";
import { saveOrderToSupabase } from "@/lib/supabase";
import { toast } from "sonner";

function getOrderStorageKey(userId?: string | null) {
  return `auraessence:orders:${userId ?? "guest"}`;
}

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — AuraEssence" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cartWithProducts, cartSubtotal, clearCart } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [pixPayload, setPixPayload] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [copied, setCopied] = useState(false);

  const shipping = cartSubtotal > 199 || cartSubtotal === 0 ? 0 : 19.9;
  const total = cartSubtotal + shipping;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast.success("Código Copia e Cola copiado!", {
        description: "Agora abra o app do seu banco e escolha 'Pagar via Pix Copia e Cola'."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    const paymentMethod = String(formData.get("pay") ?? "PIX");

    const payload = {
      userId: user?.id ?? null,
      customerName: String(formData.get("name") ?? ""),
      customerEmail: String(formData.get("email") ?? ""),
      customerPhone: String(formData.get("phone") ?? ""),
      address: `${formData.get("addr")} - Nº ${formData.get("num")}`,
      city: String(formData.get("city") ?? ""),
      cep: String(formData.get("cep") ?? ""),
      paymentMethod: paymentMethod,
      total,
      shipping,
      status: "processing",
      items: cartWithProducts.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        qty: c.qty,
        price: c.product.price,
      })),
    };

    try {
      const orderCreated = await saveOrderToSupabase(payload);
      const realId = orderCreated.id;

      // --- DECREMENTA O ESTOQUE DOS PRODUTOS COMPRADOS ---
      const orderItemsToDecrement = cartWithProducts.map((c) => ({
        productId: c.product.id,
        quantity: c.qty,
      }));
      await decrementStock(orderItemsToDecrement);

      if (paymentMethod === "PIX") {
        // Encurta para o padrão do Banco Central do Brasil (Máximo de 25 caracteres, apenas alfanumérico)
        const shortPixId = realId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25).toUpperCase();

        const nextPayload = buildPixPayload({
          orderId: shortPixId,
          amount: total,
          customerName: payload.customerName || "Cliente AuraEssence"
        });

        // Gera o QR Code garantindo contraste máximo
        const qrCode = await QRCode.toDataURL(nextPayload, {
          width: 250,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        });
        
        setPixPayload(nextPayload);
        setPixQrCode(qrCode);
      }

      const storageKey = getOrderStorageKey(user?.id);
      const prev = JSON.parse(localStorage.getItem(storageKey) || "[]");
      prev.unshift({
        id: realId,
        createdAt: new Date().toISOString(),
        total,
        status: "processing",
        items: payload.items,
      });
      localStorage.setItem(storageKey, JSON.stringify(prev));

      setOrderId(realId);
      setPlaced(true);
      clearCart();
      toast.success("Pedido confirmado!", { description: `Número do pedido registrado com sucesso.` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível confirmar o pedido.");
    }
  };

  if (placed) {
    return (
      <PageShell>
        <div className="container-page py-24 max-w-xl mx-auto text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-primary text-primary-foreground">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl">Pedido confirmado</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            Copie o código abaixo ou escaneie o QR Code para pagar. <br />
            ID do pedido para referência:{" "}
            <span className="font-semibold text-foreground break-all">{orderId}</span>
          </p>
          {pixPayload && pixQrCode ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-left">
              <h2 className="font-display text-xl text-center">Pagamento por PIX</h2>
              <p className="mt-2 text-sm text-muted-foreground text-center">Escaneie para pagar ou utilize o Copia e Cola.</p>
              <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-background/80 p-4">
                <div className="bg-white p-4 rounded-2xl border border-border flex items-center justify-center">
                  <img src={pixQrCode} alt="QR Code PIX" className="h-48 w-48 object-contain" />
                </div>
                <div className="flex w-full gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={pixPayload}
                    className="w-full p-2 border border-border rounded-xl text-xs bg-background select-all focus:outline-none cursor-pointer"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition min-w-[90px] justify-center"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ <strong>Aviso:</strong> Confirmaremos seu pedido manualmente assim que o pagamento for verificado na conta de destino.
              </div>
            </div>
          ) : null}
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/conta" className="rounded-full border border-border h-12 px-6 grid place-items-center text-sm">
              Ver meus pedidos
            </Link>
            <Link to="/produtos" className="rounded-full gradient-primary text-primary-foreground h-12 px-6 grid place-items-center text-sm font-semibold">
              Continuar comprando
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (cartWithProducts.length === 0) {
    return (
      <PageShell>
        <div className="container-page py-24 text-center">
          <h1 className="font-display text-3xl">Seu carrinho está vazio</h1>
          <button
            onClick={() => navigate({ to: "/produtos" })}
            className="mt-6 rounded-full gradient-primary text-primary-foreground h-12 px-6 text-sm font-semibold"
          >
            Explorar produtos
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-page py-12">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Checkout</h1>
        <form onSubmit={submit} className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-8">
            <FormBlock title="Contato">
              <Input name="email" label="E-mail" type="email" required />
              <Input name="phone" label="Telefone" required />
            </FormBlock>

            <FormBlock title="Entrega">
              <Input name="name" label="Nome completo" required />
              <div className="grid sm:grid-cols-[1fr_120px] gap-3">
                <Input name="addr" label="Endereço" required />
                <Input name="num" label="Número" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input name="city" label="Cidade" required />
                <Input name="cep" label="CEP" required />
              </div>
            </FormBlock>

            <FormBlock title="Pagamento">
              <div className="grid gap-2">
                <label className="flex items-center gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:border-primary/60">
                  <input
                    type="radio"
                    name="pay"
                    value="PIX"
                    defaultChecked
                    className="accent-[color:var(--primary)]"
                  />
                  <span className="text-sm font-medium">PIX</span>
                </label>
              </div>
            </FormBlock>
          </div>

          <aside className="rounded-3xl border border-border bg-surface p-6 h-fit sticky top-28">
            <h2 className="font-display text-2xl">Resumo</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {cartWithProducts.map(({ product, qty }) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground truncate">
                    {product.name} × {qty}
                  </span>
                  <span>{money(product.price * qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{money(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frete</span>
                <span>{shipping === 0 ? "Grátis" : money(shipping)}</span>
              </div>
              <div className="flex justify-between font-display text-xl pt-2">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full gradient-primary h-12 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              <Lock className="h-4 w-4" /> Pagar {money(total)}
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Sua conexão é segura e encriptada de ponta a ponta.
            </p>
          </aside>
        </form>
      </div>
    </PageShell>
  );
}

function FormBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-5 grid gap-3">{children}</div>
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-2xl border border-border bg-background px-4 h-12 text-sm focus:outline-none focus:border-primary transition-colors"
      />
    </label>
  );
}