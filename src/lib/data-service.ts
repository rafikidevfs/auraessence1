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
import { fetchCatalogFromSupabase, isSupabaseConfigured, supabase } from "@/lib/supabase";

export const heroImage = heroImg;

const LOCAL_CATEGORY_IMAGES: Record<string, string> = {
  skincare: catSkincare,
  perfumaria: catPerfume,
  maquiagem: catMakeup,
  cabelos: catHair,
  corpo: catBody,
  presentes: catGifts,
};

export type Category = { slug: string; name: string; image: string; count: number };
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

export type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
};

export type OrderItemInput = {
  productId: string;
  quantity: number;
};

const CATALOG_STORAGE_KEY = "auraessence:catalog";
const DELETED_CATEGORIES_KEY = "auraessence:deleted_categories";
const imgs = [prod1, prod2, prod3, prod4];

const buildProduct = (
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

const defaultSnapshot: CatalogSnapshot = {
  categories: [
    { slug: "skincare", name: "Skincare", image: catSkincare, count: 128 },
    { slug: "perfumaria", name: "Perfumaria", image: catPerfume, count: 74 },
    { slug: "maquiagem", name: "Maquiagem", image: catMakeup, count: 96 },
    { slug: "cabelos", name: "Cabelos", image: catHair, count: 62 },
    { slug: "corpo", name: "Corpo & Banho", image: catBody, count: 88 },
    { slug: "presentes", name: "Presentes", image: catGifts, count: 34 },
  ],
  products: [
    buildProduct(1, "Sérum Renovador Amber", "Skincare", "skincare", 189.9, 249.9, "-24%"),
    buildProduct(2, "Óleo Corporal Ébano", "Corpo & Banho", "corpo", 129.0, 159.0),
    buildProduct(3, "Eau de Parfum Noir", "Perfumaria", "perfumaria", 349.0, 429.0, "Novo"),
    buildProduct(4, "Creme Facial Luminous", "Skincare", "skincare", 219.9),
    buildProduct(5, "Batom Matte Velvet", "Maquiagem", "maquiagem", 89.9, 109.9, "-18%"),
    buildProduct(6, "Máscara Capilar Gold", "Cabelos", "cabelos", 149.0),
    buildProduct(7, "Perfume Amber Rouge", "Perfumaria", "perfumaria", 289.0, 359.0),
    buildProduct(8, "Loção Hidratante Silk", "Corpo & Banho", "corpo", 99.9),
    buildProduct(9, "Kit Presente Aurora", "Presentes", "presentes", 259.0, 329.0, "Kit"),
    buildProduct(10, "Base Fluida Second Skin", "Maquiagem", "maquiagem", 139.9),
    buildProduct(11, "Shampoo Reparador Gold", "Cabelos", "cabelos", 89.0),
    buildProduct(12, "Esfoliante Corporal Sand", "Corpo & Banho", "corpo", 79.0),
  ],
};

let cachedSnapshot: CatalogSnapshot | null = null;

export const getDeletedCategories = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const filterDeletedCategories = (categories: Category[]): Category[] => {
  const deletedSlugs = new Set(getDeletedCategories());
  return categories.filter((c) => !deletedSlugs.has(c.slug));
};

const cloneSnapshot = (snapshot: CatalogSnapshot): CatalogSnapshot => ({
  categories: snapshot.categories.map((c) => ({ ...c })),
  products: snapshot.products.map((p) => ({ ...p })),
});

const normalizeSnapshot = (snapshot: CatalogSnapshot): CatalogSnapshot => ({
  categories: filterDeletedCategories(snapshot.categories.map((c) => ({ ...c }))),
  products: snapshot.products.map((p) => ({ ...p })),
});

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  if (cachedSnapshot) {
    cachedSnapshot = normalizeSnapshot(cachedSnapshot);
    return cloneSnapshot(cachedSnapshot);
  }

  if (typeof window === "undefined") {
    cachedSnapshot = normalizeSnapshot(defaultSnapshot);
    return cloneSnapshot(cachedSnapshot);
  }

  // Tenta carregar do localStorage primeiro para respeitar exclusões locais instantâneas
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CatalogSnapshot>;
      const snapshot = normalizeSnapshot({
        categories: parsed.categories ?? defaultSnapshot.categories,
        products: parsed.products ?? defaultSnapshot.products,
      });
      cachedSnapshot = snapshot;
      return cloneSnapshot(snapshot);
    }
  } catch {
    // Fallback se falhar
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const supabaseData = await fetchCatalogFromSupabase();
      if (supabaseData) {
        const snapshot = normalizeSnapshot({
          categories: supabaseData.categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            image: c.image || LOCAL_CATEGORY_IMAGES[c.slug] || defaultSnapshot.categories.find(dc => dc.slug === c.slug)?.image || "",
            count: c.count,
          })),
          products: supabaseData.products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            categorySlug: p.category_slug,
            price: p.price,
            oldPrice: p.old_price ?? undefined,
            rating: p.rating,
            reviews: p.reviews,
            image: p.image || imgs[0],
            badge: p.badge ?? undefined,
            description: p.description,
            sku: p.sku,
            stock: p.stock,
          })),
        });
        cachedSnapshot = snapshot;
        window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(snapshot));
        return cloneSnapshot(snapshot);
      }
    } catch {
      // Fallback
    }
  }

  cachedSnapshot = normalizeSnapshot(defaultSnapshot);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cachedSnapshot));
  }
  return cloneSnapshot(cachedSnapshot);
}

export async function saveCatalogSnapshot(snapshot: CatalogSnapshot): Promise<CatalogSnapshot> {
  const normalized = normalizeSnapshot(snapshot);
  cachedSnapshot = normalized;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(normalized));
  }

  return cloneSnapshot(normalized);
}

export async function deleteCategory(slug: string): Promise<void> {
  // 1. Grava no registro local de excluídos imediatamente
  if (typeof window !== "undefined") {
    const existingDeleted = getDeletedCategories();
    if (!existingDeleted.includes(slug)) {
      const updatedDeleted = [...existingDeleted, slug];
      window.localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(updatedDeleted));
    }
  }

  // 2. Apaga no Supabase se configurado
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("categories").delete().eq("slug", slug);
    } catch (err) {
      console.error("Erro ao deletar categoria do Supabase:", err);
    }
  }

  // 3. Atualiza o snapshot em memória removendo a categoria na hora
  const currentSnapshot = await loadCatalogSnapshot();
  const updatedSnapshot = normalizeSnapshot({
    ...currentSnapshot,
    categories: currentSnapshot.categories.filter((c) => c.slug !== slug),
  });

  cachedSnapshot = updatedSnapshot;

  // 4. Salva o estado limpo no localStorage
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updatedSnapshot));
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) console.error("Erro no Supabase ao apagar:", error);
    } catch (err) {
      console.error("Erro ao deletar do Supabase:", err);
    }
  }

  if (cachedSnapshot) {
    cachedSnapshot.products = cachedSnapshot.products.filter((p) => p.id !== id);
  } else {
    const snapshot = await loadCatalogSnapshot();
    cachedSnapshot = {
      ...snapshot,
      products: snapshot.products.filter((p) => p.id !== id),
    };
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cachedSnapshot));
  }
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  const finalStock = Math.max(0, newStock);

  if (cachedSnapshot) {
    const p = cachedSnapshot.products.find((prod) => prod.id === id);
    if (p) p.stock = finalStock;
  } else {
    const snapshot = await loadCatalogSnapshot();
    const p = snapshot.products.find((prod) => prod.id === id);
    if (p) p.stock = finalStock;
    cachedSnapshot = snapshot;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(cachedSnapshot));
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("products").update({ stock: finalStock }).eq("id", id);
    } catch (err) {
      console.error("Erro ao atualizar estoque no Supabase:", err);
    }
  }
}

export async function decrementStock(items: OrderItemInput[]): Promise<void> {
  if (!items || items.length === 0) return;

  const snapshot = await loadCatalogSnapshot();

  for (const item of items) {
    const product = snapshot.products.find((p) => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from("products").update({ stock: product.stock }).eq("id", product.id);
        } catch (err) {
          console.error(`Erro ao baixar estoque do produto ${product.id} no Supabase:`, err);
        }
      }
    }
  }

  cachedSnapshot = snapshot;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(snapshot));
  }
}

export async function listCategories(): Promise<Category[]> {
  const snapshot = await loadCatalogSnapshot();
  return snapshot.categories;
}

export async function listProducts(): Promise<Product[]> {
  const snapshot = await loadCatalogSnapshot();
  return snapshot.products;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await listCategories();
  return categories.find((c) => c.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await listProducts();
  return products.find((p) => p.id === id);
}

export async function listProductsByCategory(slug: string): Promise<Product[]> {
  const products = await listProducts();
  return products.filter((p) => p.categorySlug === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await listProducts();
  return products.slice(0, 8);
}

export async function getBestsellers(): Promise<Product[]> {
  const products = await listProducts();
  return products.slice().reverse().slice(0, 8);
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await listProducts();
  return [...products.slice(4), ...products.slice(0, 4)].slice(0, 8);
}

export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
