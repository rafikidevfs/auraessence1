import heroImg from "@/assets/hero-product.jpg";
import catSkincare from "@/assets/cat-skincare.jpg";
import catPerfume from "@/assets/cat-perfume.jpg";
import catMakeup from "@/assets/cat-makeup.jpg";
import catHair from "@/assets/cat-hair.jpg";
import catBody from "@/assets/cat-body.jpg";
import catGifts from "@/assets/cat-gifts.jpg";
import prod1 from "@/assets/prod-1.jpg";
import prod2 from "@/assets/prod-2.jpg";
import prod3 from "@/assets/prod-3.jpg";
import prod4 from "@/assets/prod-4.jpg";

export const heroImage = heroImg;

export type Category = { slug: string; name: string; image: string; count: number };
export const categories: Category[] = [
  { slug: "skincare", name: "Skincare", image: catSkincare, count: 128 },
  { slug: "perfumaria", name: "Perfumaria", image: catPerfume, count: 74 },
  { slug: "maquiagem", name: "Maquiagem", image: catMakeup, count: 96 },
  { slug: "cabelos", name: "Cabelos", image: catHair, count: 62 },
  { slug: "corpo", name: "Corpo & Banho", image: catBody, count: 88 },
  { slug: "presentes", name: "Presentes", image: catGifts, count: 34 },
];

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

export type Product = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description: string;
  sku: string;
  stock: number;
};

const imgs = [prod1, prod2, prod3, prod4];

const seed = (
  i: number,
  name: string,
  category: string,
  categorySlug: string,
  price: number,
  oldPrice?: number,
  badge?: string,
): Product => ({
  id: `p-${i}`,
  name,
  category,
  categorySlug,
  price,
  oldPrice,
  rating: 4 + ((i * 13) % 10) / 10,
  reviews: 40 + ((i * 37) % 400),
  image: imgs[i % imgs.length],
  badge,
  description:
    "Formulado com ativos de alta performance e ingredientes selecionados. Textura sensorial, absorção rápida e resultado visível desde as primeiras aplicações.",
  sku: `OBR-${1000 + i}`,
  stock: 20 + ((i * 7) % 80),
});

export const products: Product[] = [
  seed(1, "Sérum Renovador Amber", "Skincare", "skincare", 189.9, 249.9, "-24%"),
  seed(2, "Óleo Corporal Ébano", "Corpo & Banho", "corpo", 129.0, 159.0),
  seed(3, "Eau de Parfum Noir", "Perfumaria", "perfumaria", 349.0, 429.0, "Novo"),
  seed(4, "Creme Facial Luminous", "Skincare", "skincare", 219.9),
  seed(5, "Batom Matte Velvet", "Maquiagem", "maquiagem", 89.9, 109.9, "-18%"),
  seed(6, "Máscara Capilar Gold", "Cabelos", "cabelos", 149.0),
  seed(7, "Perfume Amber Rouge", "Perfumaria", "perfumaria", 289.0, 359.0),
  seed(8, "Loção Hidratante Silk", "Corpo & Banho", "corpo", 99.9),
  seed(9, "Kit Presente Aurora", "Presentes", "presentes", 259.0, 329.0, "Kit"),
  seed(10, "Base Fluida Second Skin", "Maquiagem", "maquiagem", 139.9),
  seed(11, "Shampoo Reparador Gold", "Cabelos", "cabelos", 89.0),
  seed(12, "Esfoliante Corporal Sand", "Corpo & Banho", "corpo", 79.0),
];

export const featured: Product[] = products.slice(0, 8);
export const bestsellers: Product[] = products.slice().reverse().slice(0, 8);
export const newArrivals: Product[] = [...products.slice(4), ...products.slice(0, 4)].slice(0, 8);

export const productById = (id: string) => products.find((p) => p.id === id);

export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
