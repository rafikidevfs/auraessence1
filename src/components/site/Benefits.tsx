import { Truck, ShieldCheck, Headphones, CreditCard } from "lucide-react";

const items = [
  { icon: Truck, title: "Entrega expressa", desc: "Pronta entrega pra toda Fortaleza." },
  { icon: ShieldCheck, title: "Compra segura", desc: "Pagamento criptografado e protegido." },
  { icon: CreditCard, title: "Até 12x sem juros", desc: "Parcele suas compras sem taxa extra." },
  { icon: Headphones, title: "Atendimento 7/7", desc: "Nosso time responde todos os dias." },
];

export function Benefits() {
  return (
    <section className="container-page py-20">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div
            key={it.title}
            className="group rounded-3xl border border-border bg-surface p-6 hover-lift"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background text-primary group-hover:gradient-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-medium">{it.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
