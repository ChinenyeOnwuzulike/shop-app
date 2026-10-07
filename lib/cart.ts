import { supabase } from "./supabase";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  emoji: string;
  qty: number;
};

export async function loadCart(): Promise<CartItem[]> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (user) {
    const { data } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    return (data ?? []).map((r) => ({
      id: r.product_id,
      name: r.product_name,
      price: r.price,
      emoji: r.emoji ?? "",
      qty: r.qty,
    }));
  }

  const saved = localStorage.getItem("cart");
  return saved ? JSON.parse(saved) : [];
}

export async function saveCart(cart: CartItem[]) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    localStorage.setItem("cart", JSON.stringify(cart));
    return;
  }

  await supabase.from("cart_items").delete().eq("user_id", user.id);

  if (cart.length > 0) {
    await supabase.from("cart_items").insert(
      cart.map((i) => ({
        user_id: user.id,
        product_id: i.id,
        product_name: i.name,
        price: i.price,
        emoji: i.emoji,
        qty: i.qty,
      }))
    );
  }
}

export async function clearCart() {
  localStorage.removeItem("cart");
  await saveCart([]);
}