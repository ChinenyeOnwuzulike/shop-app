"use client";

import { useEffect, useState } from "react";

export default function MobileAuth() {
  const [link, setLink] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to") ?? "";
    const allowed = to.startsWith("exp://") || to.startsWith("shopmobile://");
    if (!allowed) return;
    const target = to + window.location.hash;
    setLink(target);
    window.location.href = target;
  }, []);

  return (
    <main style={{ padding: 24, textAlign: "center" }}>
      <h1>Opening the app...</h1>
      {link && <a href={link}>Tap here if the app did not open</a>}
    </main>
  );
}