import Image from "next/image";
import { ReviewLightbox } from "@/components/ReviewLightbox";
import { SeatsLeft } from "@/components/Seats";
import { ByAd } from "@/components/ui";
import { OFFER } from "@/lib/offer";
import {
  ABOUT,
  ACTION_PHOTOS,
  BONUSES,
  EVENT,
  FAQ,
  FIT,
  FOOTER,
  HERO,
  JOIN,
  MEDIA,
  MODULES,
  PROBLEM,
  REVIEWS,
  TOTAL_VALUE,
  VALUE,
  VALUE_LABEL,
  WHO,
} from "@/components/content";
import { Countdown, RegisterButton, RegisterModal, StickyBar, TrackArrows, VideoTap } from "./Ui3Client";

/**
 * The landing page (Oct 2026 design, after the Social Eagle masterclass pages): alternating dark and light bands,
 * one big violet button style, no form section. Every "Reserve my seat" button opens the registration pop-up
 * (Ui3Client.tsx RegisterModal) with the real checkout form → Razorpay → /thank-you with the WhatsApp group button.
 * Prices come from lib/offer.ts only (change `priceInr` there and every price on the page follows).
 * Styles: app/ui3/ui3.css (all classes "u-" prefixed under .u-root).
 */
const u = (s: string) => s.split(" ").map((c) => `u-${c}`).join(" ");
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const PRICE = EVENT.price;

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h13m-5-6 6 6-6 6" />
  </svg>
);
const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function Cta({ id }: { id?: string }) {
  return (
    <RegisterButton id={id} className={u("cta")}>
      Reserve My Seat @ {PRICE} <ArrowIcon />
    </RegisterButton>
  );
}

function PriceLine() {
  return (
    <p className={u("price-line")}>
      Total value <s>{VALUE_LABEL}</s> · You pay <b>{PRICE}</b> today
    </p>
  );
}

const ICONS: Record<(typeof WHO)[number]["icon"], ReactSvg> = {
  home: <path d="M4 20V10l8-6 8 6v10h-5v-6H9v6z" />,
  work: (
    <>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M9 7V5h6v2M3.5 12h17" />
    </>
  ),
  study: <path d="M3 9l9-4 9 4-9 4zM7 11v5c3 2 7 2 10 0v-5" />,
  shop: <path d="M4 20h16M7 20V12M12 20V7M17 20v-5" />,
};
type ReactSvg = React.ReactElement;

const FACT_ICONS = {
  date: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  time: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  lang: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" />
    </>
  ),
  where: (
    <>
      <rect x="3.5" y="4.5" width="17" height="12" rx="1.5" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
};

export function Ui3Page() {
  const shots = REVIEWS.filter((r) => r.src);
  const facts: [keyof typeof FACT_ICONS, string, string][] = [
    ["date", "Date", `${EVENT.shortDate} ${EVENT.year}`],
    ["time", "Time", EVENT.timeLabel],
    ["lang", "Language", EVENT.language],
    ["where", "Platform", "Online class"],
  ];
  const accent = (segs: { t: string; em?: boolean }[]) =>
    segs.map((s) =>
      s.em ? (
        <span key={s.t} className={u("acc")}>
          {s.t}
        </span>
      ) : (
        s.t
      ),
    );

  return (
    <div className="u-root">
      <div className={u("topbar")}>
        <div className={u("wrap")}>
          <span>
            <span className={u("dot")} aria-hidden="true" />
            LIVE Webinar<span className={u("hide-xs")}> · {`${EVENT.shortDate} ${EVENT.year}`.toUpperCase()}</span>
            <span className={u("show-xs")}> · {EVENT.dayMonth.toUpperCase()}</span>
          </span>
          <RegisterButton className={u("toplink")}>Register Now →</RegisterButton>
        </div>
      </div>

      <main>
        {/* 1 · Hero (dark) */}
        <section className={u("sec-dark hero center")} id="top">
          <div className={u("wrap narrow")}>
            <div className={u("brand")}>
              <div className={u("brand-mark")}>
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <g fill="#a78bfa">
                    <ellipse cx="16" cy="9" rx="4.2" ry="8" />
                    <ellipse cx="9" cy="15" rx="4" ry="7.6" transform="rotate(-38 9 15)" />
                    <ellipse cx="23" cy="15" rx="4" ry="7.6" transform="rotate(38 23 15)" />
                  </g>
                  <path d="M16 15v15M13 23l3 2 3-2" stroke="#f08a9a" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                <span>
                  Saffron &amp;
                  <br />
                  Business
                </span>
              </div>
              <span className={u("brand-sep")} aria-hidden="true" />
              <span className={u("brand-ta")} lang="ta">
                தமிழ்
              </span>
            </div>

            <p className={u("pill")}>
              <span className={u("dot")} aria-hidden="true" />
              Live webinar · {EVENT.dayMonthLong} {EVENT.year}
            </p>
            <p className={u("eyebrow")}>Start small. Grow step by step.</p>

            <h1>
              <ByAd a={accent(HERO.a.titleEn)} b={<>To start a business as a woman, you don&apos;t need <span className="u-acc">big investment or big space</span>.</>} />
            </h1>
            <p className={u("plan-line")}>
              The same plan for your business, in a <span className={u("acc")}>{OFFER.durationLabel.replace(" hours", " hour")} live webinar</span>.
            </p>
            <p className={u("sub")}>
              I&apos;ll show you live <b>how to arrange capital for your business</b>, <b>how to get loans and subsidies</b>, and how to grow step by
              step,{" "}
              <em>
                <ByAd a={HERO.a.evenIf} b={HERO.b.evenIf} />
              </em>
            </p>

            <div className={u("video")}>
              <VideoTap
                src={MEDIA.intro.src!}
                label={MEDIA.intro.alt}
                poster={<Image src={MEDIA.intro.poster!} alt={MEDIA.intro.alt} width={1080} height={1920} sizes="380px" preload loading="eager" fetchPriority="high" />}
              />
            </div>

            <div className={u("facts")}>
              {facts.map(([icon, label, value]) => (
                <div key={label} className={u("fact")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    {FACT_ICONS[icon]}
                  </svg>
                  <div>
                    <small>{label}</small>
                    <b>{value}</b>
                  </div>
                </div>
              ))}
            </div>

            <Cta id="hero-cta" />
            <PriceLine />
            <SeatsLeft />

            <div className={u("timer")}>
              <p>Webinar starts in</p>
              <Countdown />
            </div>
          </div>
        </section>

        {/* 2 · Numbers (light) */}
        <section className={u("sec sec-light center")}>
          <div className={u("wrap")}>
            <p className={u("kick")}>By the numbers</p>
            <div className={u("stats")}>
              <div>
                <b>{ABOUT.instagram.followers.toUpperCase()}</b>
                <span>Instagram followers</span>
              </div>
              <div>
                <b>5+</b>
                <span>Years in agribusiness</span>
              </div>
              <div>
                <b>58+</b>
                <span>Days building her farm live</span>
              </div>
              <div>
                <b>{MODULES.items.length}</b>
                <span>Practical modules</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Reviews (white) */}
        {shots.length > 0 && (
          <section className={u("sec sec-white center")} id="reviews">
            <div className={u("wrap narrow")}>
              <p className={u("kick")}>Real results from real people</p>
              <h2 className={u("h2")}>Don&apos;t just take our word for it.</h2>
              <p className={u("lead")}>Real WhatsApp messages from people who joined her last webinar. Tap one to read it.</p>
            </div>
            <div className={u("carousel")}>
              <div className={u("track")} id="track">
                {shots.map((r, i) => (
                  <button key={r.expected} type="button" data-review-index={i} aria-label={`Open review ${i + 1}`}>
                    <Image src={r.src!} alt={r.alt} width={r.width ?? 1080} height={r.height ?? 1920} sizes="300px" />
                  </button>
                ))}
              </div>
              <TrackArrows />
            </div>
            <div className={u("wrap narrow")}>
              <Cta />
            </div>
            <ReviewLightbox items={shots.map((r) => ({ src: r.src!, alt: r.alt, width: r.width ?? 1080, height: r.height ?? 1920 }))} />
          </section>
        )}

        {/* 4 · Who should attend (light) */}
        <section className={u("sec sec-light center")}>
          <div className={u("wrap")}>
            <p className={u("kick")}>Is this for you?</p>
            <h2 className={u("h2")}>Who should attend?</h2>
            <div className={u("cards")}>
              {WHO.map((w, i) => (
                <div key={w.title} className={u(i === 1 ? "card hl" : "card")}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                    {ICONS[w.icon]}
                  </svg>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              ))}
            </div>
            <div className={u("notfor")}>
              <h3>{FIT.noTitle}</h3>
              <ul>
                {FIT.no.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5 · What you'll learn (white), one action photo per module */}
        <section className={u("sec sec-white center")}>
          <div className={u("wrap")}>
            <p className={u("kick")}>What you&apos;ll learn · {EVENT.dayMonth}</p>
            <h2 className={u("h2")}>{MODULES.title}</h2>
            <p className={u("lead")}>{MODULES.lead}</p>
            <ul className={u("checks")}>
              {MODULES.items.map((m, i) => (
                <li key={m.n} className={u("check has-img")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size WebP in /public, see ACTION_PHOTOS */}
                  <img src={ACTION_PHOTOS.modules[i]!.src} alt={ACTION_PHOTOS.modules[i]!.alt} width={720} height={720} loading="lazy" decoding="async" />
                  <div className={u("row")}>
                    <i>
                      <Tick />
                    </i>
                    <div>
                      <small>{m.tag}</small>
                      <b>{m.title}</b>
                      <span>{m.body}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Cta />
          </div>
        </section>

        {/* 6 · The problem (dark) */}
        <section className={u("sec sec-dark center")}>
          <div className={u("wrap")}>
            <p className={u("kick")}>{PROBLEM.kicker}</p>
            <h2 className={u("h2")}>
              The problem is not money. It is the <span className={u("acc")}>missing plan</span>.
            </h2>
            <p className={u("lead")}>{PROBLEM.lead}</p>
            <div className={u("banner")}>
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size WebP in /public, see ACTION_PHOTOS */}
              <img src={ACTION_PHOTOS.problem.src} alt={ACTION_PHOTOS.problem.alt} width={1200} height={671} loading="lazy" decoding="async" />
            </div>
            <div className={u("vs")}>
              <div className={u("bad")}>
                <h3>{PROBLEM.beforeTitle}</h3>
                <ul>
                  {PROBLEM.before.map((t) => (
                    <li key={t}>
                      <Cross />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={u("good")}>
                <h3>{PROBLEM.afterTitle}</h3>
                <ul>
                  {PROBLEM.after.map((t) => (
                    <li key={t}>
                      <Tick />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7 · Host (light) */}
        <section className={u("sec sec-light center")}>
          <div className={u("wrap")}>
            <p className={u("kick")}>Meet your host</p>
            <h2 className={u("h2")}>This is not theory. This is my farm.</h2>
            <div className={u("host")}>
              <figure className={u("host-photo")}>
                <Image src={MEDIA.heroPortrait.src!} alt={MEDIA.heroPortrait.alt} width={1071} height={1339} sizes="(min-width: 860px) 460px, 100vw" />
                <figcaption>
                  <b>{ABOUT.name}</b>
                  <span>Startup strategist · building an indoor saffron farm in Tamil Nadu</span>
                </figcaption>
              </figure>
              <div>
                <p className={u("quote")}>“{ABOUT.quoteEn}”</p>
                {ABOUT.bio.map((p) => (
                  <p key={p} className={u("bio")}>
                    {p}
                  </p>
                ))}
                <ul className={u("creds")}>
                  {ABOUT.credentials.slice(0, 4).map((c) => (
                    <li key={c.label + c.value}>
                      <small>{c.label}</small>
                      <b>{c.value}</b>
                    </li>
                  ))}
                </ul>
                <a className={u("ig")} href={ABOUT.instagram.url} target="_blank" rel="noopener noreferrer">
                  <Image src="/media/instagram/profile-480.jpg" alt="" width={60} height={60} sizes="60px" />
                  <span>
                    <b>{ABOUT.instagram.handle.replace(/^@/, "")}</b>
                    <span>
                      {ABOUT.instagram.posts} posts · {ABOUT.instagram.followers} followers · open on Instagram →
                    </span>
                  </span>
                </a>
              </div>
            </div>
            <div className={u("farm")}>
              {[
                [MEDIA.farmSetup.poster!, "Inside her insulated grow room", "The indoor grow room", 720, 900],
                [MEDIA.farmCorms.src!, MEDIA.farmCorms.alt, "Checking the corms", 1280, 1600],
                [MEDIA.farmJar.src!, MEDIA.farmJar.alt, "Packing the dried saffron", 1349, 1600],
                [MEDIA.expoStall.src!, MEDIA.expoStall.alt, "United Agritech 2026, Madurai", 1280, 1600],
              ].map(([src, alt, cap, w, h]) => (
                <figure key={cap as string}>
                  <Image src={src as string} alt={alt as string} width={w as number} height={h as number} sizes="(min-width: 860px) 260px, 50vw" />
                  <figcaption>{cap}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 8 · Value (dark) */}
        <section className={u("sec sec-dark center")}>
          <div className={u("wrap narrow")}>
            <p className={u("kick")}>{VALUE.kicker}</p>
            <h2 className={u("h2")}>{VALUE.titleEn}</h2>
            <p className={u("lead")}>
              {OFFER.durationLabel} live with Priyadharsini, in {EVENT.language}, {EVENT.shortDate} at {EVENT.timeLabel}.
            </p>
            <div className={u("receipt")}>
              <ul>
                {MODULES.items.map((m, i) => (
                  <li key={m.n}>
                    <span>
                      Module {i + 1}: {m.tag}
                    </span>
                    <b>{rupees(VALUE.moduleValue)}</b>
                  </li>
                ))}
                {BONUSES.map((b) => (
                  <li key={b.label}>
                    <span>
                      <em>Bonus</em>
                      {b.label}
                    </span>
                    <b>{rupees(b.value)}</b>
                  </li>
                ))}
              </ul>
              <p className={u("total")}>
                <span>{VALUE.totalValueLabel}</span>
                <s>{rupees(TOTAL_VALUE)}</s>
              </p>
              <p className={u("pay")}>
                <span>{VALUE.totalLabel}</span>
                <b>{PRICE}</b>
              </p>
            </div>
            <Cta />
          </div>
        </section>

        {/* 9 · FAQ (light) */}
        <section className={u("sec sec-light center")}>
          <div className={u("wrap narrow")}>
            <p className={u("kick")}>FAQ</p>
            <h2 className={u("h2")}>{FAQ.title}</h2>
            <div className={u("faq")}>
              {FAQ.items.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10 · Final call (dark) */}
        <section className={u("sec sec-dark center")}>
          <div className={u("wrap narrow")}>
            <p className={u("kick")}>Last step</p>
            <h2 className={u("h2")}>
              Live on <span className={u("acc")}>{EVENT.dateLabel.replace(/ \d{4}$/, "")}</span> at <span className={u("acc")}>{EVENT.timeLabel}</span>.
            </h2>
            <p className={u("lead")}>{OFFER.durationLabel} live. Six practical modules. The recording is included.</p>
            <div className={u("timer final")}>
              <p>Webinar starts in</p>
              <Countdown />
            </div>
            <Cta />
            <PriceLine />
          </div>
        </section>
      </main>

      <footer className={u("footer")}>
        <div className={u("wrap")}>
          <nav aria-label="Policies">
            {FOOTER.links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <p>{FOOTER.disclaimer}</p>
          <p>{FOOTER.copyright}</p>
        </div>
      </footer>

      <StickyBar>
        <div className={u("wrap")}>
          <p>
            <s>{VALUE_LABEL}</s> <b>{PRICE}</b>
            <small>
              {EVENT.shortDate} · {EVENT.timeLabel}
            </small>
          </p>
          <RegisterButton className={u("bar-btn")}>Reserve My Seat →</RegisterButton>
        </div>
      </StickyBar>

      <RegisterModal
        head={
          <div className={u("mhead")}>
            <div>
              <p className={u("kick")}>{JOIN.kicker}</p>
              <h2 id="register-title">
                {OFFER.durationLabel} live webinar
              </h2>
              <span>
                {EVENT.shortDate} · {EVENT.timeLabel} · {EVENT.language}
              </span>
            </div>
            <div className={u("p")}>
              <s>{VALUE_LABEL}</s>
              <strong>{PRICE}</strong>
            </div>
          </div>
        }
        steps={
          <ol className={u("steps")}>
            {JOIN.steps.map((s, i) => (
              <li key={s}>
                <i>{i + 1}</i>
                {s}
              </li>
            ))}
          </ol>
        }
      />
    </div>
  );
}
