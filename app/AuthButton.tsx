"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">
          Hi, {user.user_metadata?.full_name ?? user.email}
        </span>
        <button onClick={signOut} className="underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="bg-white border px-3 py-1 rounded text-sm hover:bg-gray-100"
    >
      Sign in with Google
    </button>
  );
}