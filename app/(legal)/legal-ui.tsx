import type { ReactNode } from "react";
import { BUSINESS, POLICIES_UPDATED } from "@/lib/business";

// Small building blocks for the policy pages. Plain server components, light theme.

/** Renders a business detail; unfilled [PLACEHOLDERS] are highlighted so nobody misses them. */
export function Biz({ k }: { k: keyof typeof BUSINESS }) {
  const v = BUSINESS[k];
  return v.startsWith("[") ? <mark className="rounded bg-amber-100 px-1 text-[#1E1530]">{v}</mark> : <>{v}</>;
}

export function Todo({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-amber-100 px-1 text-[#1E1530]">{children}</mark>;
}

export function PolicyHeader({ title, intro, updated = true }: { title: string; intro?: ReactNode; updated?: boolean }) {
  return (
    <header>
      <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
      {updated && <p className="mt-3 text-sm text-[#5B5270]">Last updated: {POLICIES_UPDATED}</p>}
      {intro && <div className="mt-6 text-[#3D3452] leading-relaxed">{intro}</div>}
    </header>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-[#3D3452] [&_a]:underline [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
