"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 500);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao início da página" title="Voltar ao topo" className="fixed bottom-[5.75rem] right-6 z-50 grid size-11 place-items-center rounded-full border border-white/30 bg-petroleo text-white shadow-xl transition hover:-translate-y-1 hover:bg-rose"><ArrowUp size={19}/></button>;
}
