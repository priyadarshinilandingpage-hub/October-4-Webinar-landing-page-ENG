import Image from "next/image";
import { ABOUT, EVENT, HERO_MEDIA, MEDIA } from "../content";
import { Play } from "../icons";
import { Media } from "../Media";
import { VideoSpotlight } from "../VideoSpotlight";
import { Reveal } from "../motion";
import { Kicker, SpecimenTag } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

const TAG_TILT = ["-2deg", "1.5deg", "-1deg", "2.2deg", "-1.6deg", "0.8deg"];

/**
 * 11 · Meet your host as a founder's field file: a lanyard ID card (portrait, name, role, the farm),
 * her credentials hung as specimen tags, the pull quote in her own words, the 60-second intro as a
 * taped print, and a link to follow the build on Instagram.
 */
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="fj-sec feather tint-lilac py-12 md:py-16">
      <div className="wrap grid grid-cols-1 gap-9 lg:grid-cols-12 lg:gap-10">
        {/* ID card on its lanyard (swings in once). */}
        <Fx className="lg:col-span-5">
          <Kicker>{ABOUT.kicker}</Kicker>
          <div className="fj-id-hang fj-swing mx-auto mt-4 max-w-[360px] lg:mx-0 lg:max-w-[380px]">
            <span aria-hidden="true" className="fj-strap" />
            <div className="fj-id">
              <div className="relative">
                <Media slot={MEDIA.aboutPortrait} sizes="(min-width:1024px) 330px, 80vw" className="aspect-[4/5] w-full rounded-[4px]" />
                {/* Taped speaking photo: only once the real photo exists (never an empty frame). */}
                {MEDIA.ediitnSpeaking.src && (
                  <div className="absolute right-1 -bottom-6 w-[46%] rotate-[4deg] bg-paper p-1.5 shadow-lift sm:-right-6">
                    <span aria-hidden="true" className="fj-tape fj-tape--violet !top-[-10px] !w-14" />
                    <Media slot={MEDIA.ediitnSpeaking} sizes="160px" className="aspect-[4/3] w-full" />
                  </div>
                )}
              </div>
              <h2 id="about-title" className={`${MEDIA.ediitnSpeaking.src ? "mt-9" : "mt-5"} font-serif text-[2rem] leading-[1.02] tracking-[-0.01em] text-ink`}>
                {ABOUT.name}
              </h2>
              <p className="fj-mono mt-1.5 text-violet-deep">{ABOUT.role}</p>
              <dl className="fj-id-rows mt-4">
                {ABOUT.idRows.map((r) => (
                  <div key={r.label}>
                    <dt className="fj-mono self-center text-ink-2">{r.label}</dt>
                    <dd className="m-0 text-right font-semibold text-ink">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Fx>

        <div className="lg:col-span-7 lg:pt-6">
          <Reveal>
            <figure>
              <blockquote>
                <p className="font-serif text-[clamp(1.75rem,3.8vw,3rem)] leading-[1.1] tracking-[-0.01em] text-ink italic">
                  <span aria-hidden="true" className="text-saffron-deep">&ldquo;</span>
                  {ABOUT.quote}
                  <span aria-hidden="true" className="text-saffron-deep">&rdquo;</span>
                </p>
              </blockquote>
              <figcaption className="fj-mono mt-4 flex items-center gap-2.5 text-ink-2">
                <span aria-hidden="true" className="inline-block h-px w-7 bg-saffron" />
                {ABOUT.quoteBy}
              </figcaption>
            </figure>
            <div className="mt-5 max-w-2xl space-y-3 text-[1.02rem] leading-relaxed text-ink-2">
              {ABOUT.bio.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>

          {/* Credentials as specimen tags. */}
          <Fx as="ul" className="mt-6 flex flex-wrap gap-x-3 gap-y-3">
            {ABOUT.credentials.map((c, i) => (
              <li key={c.value} className="fj-settle" style={idx(i, { rotate: TAG_TILT[i % TAG_TILT.length] })}>
                <SpecimenTag value={c.value} caption={c.label} className="[&_.tag-v]:text-[1.15rem] sm:[&_.tag-v]:text-[1.25rem]" />
              </li>
            ))}
          </Fx>

          {/* 60-second intro as a taped print + Instagram. */}
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="relative w-[50%] max-w-[210px] shrink-0 rotate-[-2deg] bg-paper p-2 pb-3 shadow-lift sm:w-52">
              <span aria-hidden="true" className="fj-tape" />
              <VideoSpotlight
                src={MEDIA.intro.src ?? MEDIA.intro.expected}
                poster={MEDIA.intro.poster}
                label={MEDIA.intro.alt}
                name={ABOUT.name}
                role={ABOUT.role}
                facts={["Building an indoor saffron farm in Tamil Nadu", "5+ years in agribusiness", "Alumna of EDII Ahmedabad & TNAU", "40.1K following the build on Instagram"]}
                ctaLabel={`Reserve my seat · ${EVENT.price}`}
                ctaHref="#join"
                className="aspect-[9/16]"
              />
              <p className="fj-mono mt-2 flex items-center gap-1.5 text-saffron-deep">
                <Play className="size-3" />
                {ABOUT.introBadge}
              </p>
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-[1.8rem] leading-tight text-ink italic">{ABOUT.introTitle}</h3>
              <p className="mt-2 max-w-md text-[1rem] leading-relaxed text-ink-2">
                {ABOUT.introBody}
                <strong className="font-semibold text-saffron-deep">{EVENT.price}</strong>.
              </p>
            </div>
          </div>

          <InstagramCard />
        </div>
      </div>
    </section>
  );
}

/**
 * Her Instagram profile as a small card (real numbers, copied from the public profile; see ABOUT.instagram).
 * A card rather than a screenshot: it stays sharp on every screen and is easy to keep current.
 */
function InstagramCard() {
  const ig = ABOUT.instagram;
  return (
    <a
      href={ig.url}
      target="_blank"
      rel="noopener noreferrer"
      className="fj-settle mt-8 block max-w-md rounded-[6px] bg-paper p-4 text-ink shadow-lift ring-1 ring-ink/10 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5"
    >
      <div className="flex items-center gap-3">
        {HERO_MEDIA.avatar.src && (
          <Image src={HERO_MEDIA.avatar.src} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover" />
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold break-all">
            {ig.handle}
            {ig.verified && (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-label="Verified" className="shrink-0 text-[#0095F6]">
                <path d="M12 1.5l2.6 2.2 3.4-.4 1 3.3 3 1.7-1.3 3.2 1.3 3.2-3 1.7-1 3.3-3.4-.4L12 22.5l-2.6-2.2-3.4.4-1-3.3-3-1.7 1.3-3.2L2 9.3l3-1.7 1-3.3 3.4.4z" fill="currentColor" />
                <path d="M7.5 12.2l3 3 6-6.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </p>
          <p className="text-sm text-ink-2">
            <strong className="fj-num text-[1.05rem] text-ink">{ig.followers}</strong> {ig.followersLabel}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[0.95rem] font-semibold">{ig.name}</p>
      <ul className="mt-1 text-sm leading-snug text-ink-2">
        {ig.bio.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Instagram highlights">
        {ig.highlights.map((h) => (
          <li key={h} className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs text-ink-2">
            {h}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-saffron-deep">{ig.label} →</span>
        <span className="fj-mono text-ink-2">{ig.asOf}</span>
      </p>
    </a>
  );
}
