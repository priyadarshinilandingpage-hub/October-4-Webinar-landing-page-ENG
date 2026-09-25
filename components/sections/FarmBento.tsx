import { FARM, type MediaSlot } from "../content";
import { Media } from "../Media";
import { Odometer } from "../motion";
import { SectionHead, SpecimenTag } from "../ui";
import { Fx } from "./Fx";
import { idx } from "./fxStyle";

type Frame = { key: string; media: MediaSlot; caption: string };

/**
 * 3 · "This is my farm" as a photographer's contact sheet: six frames on film strips (sprocket holes),
 * the key frame circled in grease pencil, captions in a hand-written serif.
 * Frames butt together, so every row reads as one strip (2 per strip on phones, 3 from md up).
 * Desktop: the stat tag and the margin note fill the column beside the heading.
 */
export function FarmBento() {
  const t = FARM.tiles;
  const frames: Frame[] = [
    { key: "setup", ...t.setup },
    { key: "bloom", ...t.bloom },
    { key: "harvest", ...t.harvest },
    { key: "jar", ...t.jar },
    { key: "corms", ...t.corms },
    { key: "expo", ...t.expo },
  ];

  return (
    <section id="farm" aria-labelledby="farm-title" className="fj-sec feather tint-blush py-12 md:py-16">
      {/* One grid: phones stack head, stat, sheet, note. Desktop: the stat and the note fill the column
          beside the heading (rows 1-2), the sheet runs full width below. */}
      <div className="wrap grid grid-cols-1 gap-y-6 md:gap-y-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-4">
        <SectionHead className="lg:col-span-7 lg:row-span-2 lg:row-start-1 lg:self-center" id="farm-title" kicker={FARM.kicker} title={FARM.title} lead={FARM.lead} />

        {/* Stat as a specimen tag, hung off the header (digits roll in). */}
        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-end lg:justify-self-start">
          <SpecimenTag
            value={<Odometer value={FARM.stat.value} />}
            caption={FARM.stat.label}
            className="max-w-[17rem] rotate-[-2deg] py-3 pr-4 [&_.tag-c]:text-[0.62rem] [&_.tag-v]:text-[2.5rem] [&_.tag-v]:text-saffron-deep"
          />
        </div>

        <Fx className="fj-sheet lg:col-span-12 lg:row-start-3 lg:mt-5">
          <ul className="fj-frames" aria-label="Photos and clips from the farm">
            {frames.map((f, i) => (
              <li key={f.key} className="fj-frame">
                <figure className="m-0">
                  <div className="fj-film">
                    <Media
                      slot={f.media}
                      sizes="(min-width:1024px) 380px, (min-width:768px) 33vw, 50vw"
                      className="aspect-square w-full md:aspect-[4/3]"
                    />
                    {i === 0 && <PencilLoop />}
                  </div>
                  <figcaption className="fj-hand">{f.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Fx>

        {/* Margin note: under the sheet on phones/tablets, beside the heading (under the stat) on desktop. */}
        <Fx className="relative z-[3] flex justify-end md:mr-6 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:mr-0 lg:self-start lg:justify-self-end">
          <div className="fj-settle relative max-w-sm rotate-[1.2deg] bg-cream px-5 pt-5 pb-4 shadow-soft" style={idx(1)}>
            <span aria-hidden="true" className="fj-tape fj-tape--rose" />
            <p className="fj-mono text-violet-deep">{FARM.note.title}</p>
            <p className="fj-hand mt-1.5 text-[1.3rem] leading-snug text-ink">{FARM.note.body}</p>
          </div>
        </Fx>
      </div>
    </section>
  );
}

/** Hand-drawn grease-pencil loop (overshoots its start, like a real one). */
function PencilLoop() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" preserveAspectRatio="none" className="fj-pencil fj-draw" style={idx(0, { ["--d" as string]: "350ms", ["--dur" as string]: "0.9s" })}>
      <path
        pathLength={1}
        d="M150 14 C 92 2, 20 16, 9 72 C 0 128, 32 190, 104 192 C 170 194, 196 150, 193 96 C 190 44, 150 10, 88 12 C 70 13, 56 17, 44 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
