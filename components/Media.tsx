import Image from "next/image";
import type { MediaSlot } from "./content";
import { CrocusSketch, ImageIcon, VideoIcon } from "./icons";
import { LazyVideo } from "./LazyVideo";

type Props = {
  slot: MediaSlot;
  /** Box classes: size/aspect/rounding. The media always fills this box. */
  className?: string;
  sizes?: string;
  /** Above-the-fold: preload the image / load the video straight away. */
  eager?: boolean;
  /** Video with sound + native controls. */
  controls?: boolean;
  /** Placeholder style: "full" = blank specimen plate (crocus drawing + filename), "quiet" = only the plate texture. */
  placeholder?: "full" | "quiet";
  /** CSS object-position for the crop, e.g. "50% 25%" to keep a face in frame. */
  position?: string;
};

/**
 * One slot for every photo/video on the page.
 * - src missing → a blank "specimen plate" (graph-paper texture + crocus line drawing + the expected filename),
 *   so layouts look intentional before the real files arrive (never a broken image).
 * - optional slots render nothing until the file is ready.
 * - images go through next/image (local /public only); videos are same-origin, muted, lazy.
 */
export function Media({ slot, className = "", sizes = "100vw", eager = false, controls = false, placeholder = "full", position }: Props) {
  if (!slot.src) {
    if (slot.optional) return null;
    return <MediaPlaceholder slot={slot} className={className} quiet={placeholder === "quiet"} />;
  }

  if (slot.kind === "image") {
    return (
      <div className={`media-fill relative overflow-hidden ${className}`}>
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes={sizes}
          preload={eager}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="object-cover"
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    );
  }

  // AI loops come in two renders (light + dark background). CSS shows the one matching the theme; the hidden
  // one never intersects the viewport, so LazyVideo neither downloads nor plays it.
  if (slot.srcDark) {
    return (
      <div className={`media-fill relative overflow-hidden ${className}`}>
        <div className="only-light absolute inset-0">
          <LazyVideo src={slot.src} poster={slot.poster} label={slot.alt} eager={eager} controls={controls} />
        </div>
        <div className="only-dark absolute inset-0">
          <LazyVideo src={slot.srcDark} poster={slot.posterDark ?? slot.poster} label={slot.alt} eager={eager} controls={controls} />
        </div>
      </div>
    );
  }

  return (
    <div className={`media-fill relative overflow-hidden ${className}`}>
      <LazyVideo src={slot.src} poster={slot.poster} label={slot.alt} eager={eager} controls={controls} />
    </div>
  );
}

export function MediaPlaceholder({ slot, className = "", quiet = false }: { slot: MediaSlot; className?: string; quiet?: boolean }) {
  const file = slot.expected.split("/").pop();
  const Icon = slot.kind === "video" ? VideoIcon : ImageIcon;
  return (
    <div role="img" aria-label={slot.alt || "Media coming soon"} className={`media-ph relative overflow-hidden ${className}`}>
      {!quiet && (
        <>
          <div aria-hidden="true" className="absolute inset-0 grid place-items-center p-4">
            <CrocusSketch className="h-[44%] max-h-48 min-h-10 w-auto text-ink-2/40" />
          </div>
          {/* The expected filename is a hint for whoever adds the file: never shown on the live site. */}
          {process.env.NODE_ENV !== "production" && (
            <span
              aria-hidden="true"
              className="absolute right-2.5 bottom-2 left-2.5 flex items-center gap-1.5 font-mono text-[0.6rem] tracking-[0.1em] text-ink-2 uppercase"
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">Plate · {file}</span>
            </span>
          )}
        </>
      )}
    </div>
  );
}
