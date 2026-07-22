import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/data-service";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./Categories";
import { ArrowRight } from "lucide-react";

export function ProductRow({
  id,
  eyebrow,
  title,
  subtitle,
  products,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
}) {
  return (
    <section id={id} className="container-page py-24">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={
          <Link
            to="/produtos"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
