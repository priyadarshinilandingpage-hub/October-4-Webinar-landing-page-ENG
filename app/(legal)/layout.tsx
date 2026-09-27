import type { ReactNode } from "react";
import { BUSINESS } from "@/lib/business";

const LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/refund", label: "Refund & Cancellation" },
] as const;

// Wrapper for the policy pages. Renders inside the root layout; sets its own light background.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#1E1530]">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        <a href="/" className="text-sm font-medium text-[#5B5270] underline-offset-4 hover:underline">
          ← Back to the webinar
        </a>
        <div className="mt-8">{children}</div>
      </main>
      <footer className="border-t border-[#1E1530]/10">
        <nav className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2 px-4 py-8 text-sm text-[#5B5270]">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="underline-offset-4 hover:underline">
              {l.label}
            </a>
          ))}
          <span className="w-full pt-2 text-xs">© 2026 {BUSINESS.brand}</span>
        </nav>
      </footer>
    </div>
  );
}
