import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const DELETED_CATEGORIES_KEY = "auraessence:deleted_categories";

const getDeletedCategorySlugs = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DELETED_CATEGORIES_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "customer";
  created_at: string;
};

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  category_slug: string;
  price: number;
  old_price: number | null;
  rating: number;
  reviews: number;
  image: string;
  badge: string | null;
  description: string;
  sku: string;
  stock: number;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  image: string;
  count: number;
  created_at: string;
};

export async function ensureSupabaseProfile(sessionUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  if (!supabase || !sessionUser) return null;

  const metadataName = (sessionUser.user_metadata?.full_name as string | undefined) || (sessionUser.user_metadata?.name as string | undefined) || "Usuário";
  const email = sessionUser.email ?? "";

  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role").eq("id", sessionUser.id).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;

  if (!data) {
    const role = email.toLowerCase() === "admin@auraessence.com" ? "admin" : "customer";
    const { data: inserted, error: insertError } = await supabase.from("profiles").insert({
      id: sessionUser.id,
      email,
      full_name: metadataName,
      role,
    }).select("id, email, full_name, role").maybeSingle();
    if (insertError) throw insertError;
    return inserted;
  }

  if (data.full_name !== metadataName) {
    const { error: updateError } = await supabase.from("profiles").update({ full_name: metadataName }).eq("id", sessionUser.id);
    if (updateError) throw updateError;
  }

  return data;
}

export async function fetchProfilesFromSupabase() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role, created_at");
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function updateProfileRole(profileId: string, role: "admin" | "customer") {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw error;
  return true;
}

export type OrderRow = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  address: string | null;
  city: string | null;
  cep: string | null;
  payment_method: string | null;
  total: number;
  shipping: number;
  status: string;
  items: Record<string, unknown>[];
  created_at: string;
};

export type WishlistRow = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export async function fetchCatalogFromSupabase() {
  if (!supabase) return null;

  const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("products").select("*").order("created_at", { ascending: true }),
  ]);

  if (categoriesError) throw categoriesError;
  if (productsError) throw productsError;

  const deletedSlugs = getDeletedCategorySlugs();

  // Remove permanentemente e deleta de fato no banco se ainda existir lá
  const rawCategories = (categories ?? []) as CategoryRow[];
  const validCategories: CategoryRow[] = [];

  for (const cat of rawCategories) {
    if (deletedSlugs.has(cat.slug)) {
      // Deleta de forma silenciosa e definitiva na tabela remota se reaparecer
      supabase.from("categories").delete().eq("slug", cat.slug).then();
    } else {
      validCategories.push(cat);
    }
  }

  return {
    categories: validCategories,
    products: (products ?? []) as ProductRow[],
  };
}

export async function saveOrderToSupabase(order: {
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  cep: string;
  paymentMethod: string;
  total: number;
  shipping: number;
  status: string;
  items: Array<{ productId: string; name: string; qty: number; price: number }>;
}) {
  if (!supabase) return null;

  const { data, error } = await supabase.from("orders").insert({
    user_id: order.userId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    address: order.address,
    city: order.city,
    cep: order.cep,
    payment_method: order.paymentMethod,
    total: order.total,
    shipping: order.shipping,
    status: order.status,
    items: order.items,
  }).select().single();

  if (error) throw error;
  return data as OrderRow;
}

export async function fetchOrdersFromSupabase(userId?: string | null) {
  if (!supabase) return [];

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function updateOrderInSupabase(orderId: string, updates: Partial<OrderRow>) {
  if (!supabase) return null;

  const { data, error } = await supabase.from("orders").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", orderId).select().single();
  if (error) throw error;
  return data as OrderRow;
}

export async function deleteOrderInSupabase(orderId: string) {
  if (!supabase) return null;

  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw error;
  return true;
}

export async function saveWishlistToSupabase(userId: string, productId: string) {
  if (!supabase) return null;
  const { error } = await supabase.from("wishlists").upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" });
  if (error) throw error;
  return true;
}

export async function removeWishlistFromSupabase(userId: string, productId: string) {
  if (!supabase) return null;
  const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw error;
  return true;
}

export async function fetchWishlistFromSupabase(userId?: string | null) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase.from("wishlists").select("product_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row: WishlistRow) => row.product_id);
}
