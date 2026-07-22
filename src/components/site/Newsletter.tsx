import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="container-page py-20">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-surface p-10 md:p-16 text-center">
        <div className="absolute inset-0 gradient-radial-primary opacity-50 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs uppercase tracking-widest text-primary">
            <Mail className="h-3.5 w-3.5" /> Newsletter
          </div>
          <h2 className="mt-6 font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-2xl mx-auto">
            Ganhe <span className="text-gradient">15% off</span> na sua primeira compra
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Cadastre-se e receba em primeira mão novidades, lançamentos e ofertas exclusivas.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Cupom enviado!", { description: `Cheque ${email} em instantes.` });
              setEmail("");
            }}
            className="mt-8 mx-auto max-w-lg flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 rounded-full border border-border bg-background px-6 h-14 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button className="rounded-full gradient-primary px-8 h-14 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Quero meu cupom
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
