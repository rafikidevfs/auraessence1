import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Youtube, Facebook } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const cols = [
  {
    title: "Loja",
    links: [
      { label: "Novidades", to: "/produtos" as const },
      { label: "Mais vendidos", to: "/produtos" as const },
      { label: "Promoções", to: "/produtos" as const },
      { label: "Presentes", to: "/categoria/$slug" as const, params: { slug: "presentes" } },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { label: "Minha conta", to: "/conta" as const },
      { label: "Carrinho", to: "/carrinho" as const },
      { label: "Favoritos", to: "/favoritos" as const },
      { label: "Login", to: "/login" as const },
    ],
  },
  {
    title: "Institucional",
    links: [
      { label: "Sobre nós", to: "/produtos" as const },
      { label: "Sustentabilidade", to: "/produtos" as const },
      { label: "Contato", to: "/produtos" as const },
    ],
  },
];

export function Footer() {
  const { isAdmin } = useAuth();

  const institutionalLinks = isAdmin
    ? [{ label: "Admin", to: "/admin" as const }, ...cols[2].links]
    : cols[2].links;

  const columns = [cols[0], cols[1], { ...cols[2], links: institutionalLinks }];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page py-20 grid gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground font-black">
              ō
            </span>
            <span className="font-display text-2xl">
              <span className="text-gradient">AuraEssence</span>
            </span>
          </Link>
          <p className="mt-5 text-sm text-muted-foreground max-w-sm">
            Beleza autoral, formulada com propósito. Uma marca brasileira que celebra o cuidado
            como gesto diário.
          </p>
          <div className="mt-6 flex gap-2">
            {[Instagram, Twitter, Youtube, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {columns.map((c) => (
            <div key={c.title}>
              <div className="text-xs uppercase tracking-widest text-primary">{c.title}</div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"params" in l ? (
                      <Link to={l.to} params={l.params} className="hover:text-foreground transition-colors">
                        {l.label}
                      </Link>
                    ) : (
                      <Link to={l.to} className="hover:text-foreground transition-colors">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} AuraEssence Beauty. Todos os direitos reservados.</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
