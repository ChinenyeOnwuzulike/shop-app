"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CartItem = {
  id: number;
  name: string;
  price: number;
  emoji: string;
  qty: number;
};

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", address: "" });

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: form, items: cart, total }),
    });

    if (!res.ok) {
      alert("Something went wrong. Please try again.");
      return;
    }

    localStorage.removeItem("cart");
    setCart([]);
    setPlaced(true);
  }

  if (placed) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold">Order placed!</h1>
        <p className="text-gray-600">Thank you, {form.name}.</p>
        <Link href="/" className="bg-black text-white px-4 py-2 rounded">
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link href="/" className="text-sm text-gray-500 underline">
          ← Back to shop
        </Link>
      </header>

      <div className="max-w-3xl mx-auto p-6 grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Order summary</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between border-b py-2">
                  <span>
                    {item.emoji} {item.name} × {item.qty}
                  </span>
                  <span>₦{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-4">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Your details</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              name="name"
              placeholder="Full name"
              required
              value={form.name}
              onChange={handleChange}
              className="border rounded px-3 py-2"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={handleChange}
              className="border rounded px-3 py-2"
            />
            <input
              name="address"
              placeholder="Delivery address"
              required
              value={form.address}
              onChange={handleChange}
              className="border rounded px-3 py-2"
            />
            <button
              type="submit"
              disabled={cart.length === 0}
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Place order
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}