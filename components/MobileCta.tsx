"use client";

import { useEffect, useState } from "react";
import { NAV } from "./content";
import { ThreadArrow } from "./icons";
import { PriceTag } from "./ui";

/**
 * Mobile-only sticky bottom bar: a paper ledger strip with the stamped price and the one CTA.
 * Appears once the hero has scrolled away; hides while the #join checkout is on screen.
 */
export function MobileCta() {
  const [pastHero, setPastHero] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const join = document.getElementById("join");
    const observers: IntersectionObserver[] = [];
    if (hero) {
      const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0));
      io.observe(hero);
      observers.push(io);
    }
    if (join) {
      const io = new IntersectionObserver(([e]) => setJoinVisible(e.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
      io.observe(join);
      observers.push(io);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const show = pastHero && !joinVisible;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-[transform,opacity] duration-300 ease-soft md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[115%] opacity-0"
      }`}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="mcta-bar flex items-center justify-between gap-3 px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex min-w-0 items-center gap-3">
          <PriceTag size="sm" className="shrink-0" />
          <p className="lbl min-w-0 truncate text-[0.62rem] text-ink-2 max-[459px]:hidden">{NAV.mobileSub}</p>
        </div>
        <a href="#join" className="btn btn-saffron btn-sm shrink-0">
          <span>{NAV.mobileCta}</span>
          <ThreadArrow className="thread-arrow" />
        </a>
      </div>
    </div>
  );
}
