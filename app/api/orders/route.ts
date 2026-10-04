import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function sendConfirmationEmail(
  to: string,
  name: string,
  items: { name: string; price: number; qty: number }[],
  total: number
) {
  const lines = items
    .map((i) => `- ${i.name} x ${i.qty}: ₦${(i.price * i.qty).toLocaleString()}`)
    .join("\n");

  const text = `Hi ${name},\n\nThank you for your order!\n\n${lines}\n\nTotal: ₦${total.toLocaleString()}\n\nWe will deliver it soon.\n\nMy Shop`;

  const domain = process.env.MAILGUN_DOMAIN!;
  const auth = Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64");

  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      from: `My Shop <postmaster@${domain}>`,
      to,
      subject: "Your order is confirmed",
      text,
    }),
  });

  if (!res.ok) {
    console.error("Mailgun error:", res.status, await res.text());
  }
}

export async function POST(request: Request) {
  const { customer, items, total } = await request.json();

  // 1. Save the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customer.name,
      customer_email: customer.email,
      address: customer.address,
      total,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error(orderError);
    return NextResponse.json({ error: "Could not save order" }, { status: 500 });
  }

  // 2. Save the items in the order
  const rows = items.map(
    (item: { name: string; price: number; qty: number }) => ({
      order_id: order.id,
      product_name: item.name,
      price: item.price,
      qty: item.qty,
    })
  );

  const { error: itemsError } = await supabase.from("order_items").insert(rows);

  if (itemsError) {
    console.error(itemsError);
    return NextResponse.json({ error: "Could not save items" }, { status: 500 });
  }

  // 3. Send the confirmation email (the order is already saved, so an email problem won't fail it)
  try {
    await sendConfirmationEmail(customer.email, customer.name, items, total);
  } catch (err) {
    console.error("Email failed:", err);
  }

  return NextResponse.json({ success: true, orderId: order.id });
}