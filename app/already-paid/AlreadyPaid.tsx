"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/components/icons";
import { WA_KEY } from "@/lib/already-paid";

const HTTPS_LINK = /^https:\/\/[^\s"'<>]+$/;

/**
 * Returning buyer: only the WhatsApp group button. The link comes from the order form (the server sends it only
 * when the email or number matched a paid order), never from the page itself, so this public URL alone reveals
 * nothing.
 */
export function AlreadyPaid() {
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(WA_KEY);
      if (v && HTTPS_LINK.test(v)) setLink(v);
    } catch {}
  }, []);

  return (
    <main className="min-h-screen bg-[#0f0620] bg-[radial-gradient(120%_70%_at_50%_0%,#2e1065_0%,#0f0620_65%)] text-white">
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#c4b5fd]">Seat already booked</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">You have already paid for this webinar.</h1>
        <p className="mt-5 text-lg text-[#ddd6fe]">Please join the WhatsApp group. We will share all updates in the group.</p>
        {link && (
          <a
            href={link}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7c3aed] px-6 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Chat className="size-5" />
            Join the WhatsApp group
          </a>
        )}
      </div>
    </main>
  );
}
