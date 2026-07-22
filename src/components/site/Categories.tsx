import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { listCategories, type Category } from "@/lib/data-service";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    void listCategories().then((items) => {
      if (mounted) setCategories(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="categories" className="container-page py-24">
      <SectionHeader eyebrow="Coleções" title="Compre por categoria" subtitle="Uma curadoria pensada para cada gesto da sua rotina." />

      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((c, i) => (
          <Link
            key={c.slug}
            to="/categoria/$slug"
            params={{ slug: c.slug }}
            className={`group relative overflow-hidden rounded-3xl border border-border bg-surface hover-lift ${
              i === 0 ? "col-span-2 lg:col-span-2 row-span-2" : ""
            }`}
          >
            <div className={`${i === 0 ? "aspect-square lg:aspect-auto lg:h-full" : "aspect-[4/5]"} `}>
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-primary">
                  {c.count} produtos
                </div>
                <h3 className="font-display text-2xl mt-1">{c.name}</h3>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-background/80 border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.25em] text-primary">{eyebrow}</div>
        )}
        <h2 className="mt-3 font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
