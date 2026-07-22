import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — AuraEssence" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (tab === "signup") {
        await signUp(email, password, name);
        toast.success("Conta criada!", {
          description: "Sua conta foi criada e já está pronta para uso.",
        });
      } else {
        await signIn(email, password, name);
        toast.success("Bem-vindo de volta!", {
          description: "Sessão iniciada com sucesso.",
        });
      }
      navigate({ to: "/conta" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
    }
  };

  return (
    <PageShell>
      <div className="container-page py-16 max-w-md mx-auto">
        <div className="rounded-[2rem] border border-border bg-surface p-8">
          <div className="flex rounded-full border border-border p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-full h-10 text-sm font-medium transition-colors ${
                  tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          <h1 className="mt-8 font-display text-3xl">
            {tab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "login"
              ? "Acesse seus pedidos e favoritos."
              : "Cadastre-se e ganhe 15% off na primeira compra."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {tab === "signup" && (
              <Field
                label="Nome completo"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Field
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Senha"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="mt-2 w-full rounded-full gradient-primary h-12 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              {tab === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="mt-6 text-xs text-center text-muted-foreground">
            Ao continuar você concorda com nossos{" "}
            <Link to="/produtos" className="text-primary hover:underline">Termos</Link>.
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
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
