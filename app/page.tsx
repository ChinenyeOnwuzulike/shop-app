"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthButton from "./AuthButton";
import { supabase } from "../lib/supabase";
import { loadCart, saveCart, type CartItem } from "../lib/cart";

type Product = { id: number; name: string; price: number; emoji: string };

const products: Product[] = [
  { id: 1, name: "Classic T-Shirt", price: 8500, emoji: "👕" },
  { id: 2, name: "Sneakers", price: 25000, emoji: "👟" },
  { id: 3, name: "Backpack", price: 15000, emoji: "🎒" },
  { id: 4, name: "Wrist Watch", price: 32000, emoji: "⌚" },
  { id: 5, name: "Sunglasses", price: 9500, emoji: "🕶️" },
  { id: 6, name: "Cap", price: 4500, emoji: "🧢" },
];

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load the cart, and load it again when someone signs in or out
  useEffect(() => {
    loadCart().then(setCart);
    const { data } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => loadCart().then(setCart), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Live updates: when the cart changes somewhere else (like the phone app), reload it
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("cart-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        () => {
          clearTimeout(timer);
          timer = setTimeout(() => loadCart().then(setCart), 400);
        }
      )
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  function updateCart(newCart: CartItem[]) {
    setCart(newCart);
    saveCart(newCart);
  }

  function addToCart(product: Product) {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      updateCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      updateCart([...cart, { ...product, qty: 1 }]);
    }
  }

  function removeOne(id: number) {
    updateCart(
      cart
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  }

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Shop</h1>
        <div className="flex items-center gap-4">
          <AuthButton />
          <span className="text-sm text-gray-500">Cart ({count})</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-6xl mb-3">{p.emoji}</div>
              <h3 className="font-medium">{p.name}</h3>
              <p className="text-gray-600 mb-3">₦{p.price.toLocaleString()}</p>
              <button
                onClick={() => addToCart(p)}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <div className="bg-white rounded-lg shadow p-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b py-2"
              >
                <span>
                  {item.emoji} {item.name} × {item.qty}
                </span>
                <span className="flex items-center gap-3">
                  ₦{(item.price * item.qty).toLocaleString()}
                  <button
                    onClick={() => removeOne(item.id)}
                    className="text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-4">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-green-600 text-white mt-4 py-2 rounded hover:bg-green-700"
            >
              Go to checkout
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}