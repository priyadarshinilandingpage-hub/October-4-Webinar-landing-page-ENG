// next/image loader for the static build. scripts/make-images.mjs writes public/_img/<width>/<path>.webp for every
// image in public/media at the widths listed in next.config.ts, so this only builds the URL.
// Widths an image doesn't reach are written at the image's own size (never upscaled).
export const IMAGE_WIDTHS = [128, 256, 384, 640, 828, 1080, 1600] as const;

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith("/media/")) return src; // anything else is served as-is
  const w = IMAGE_WIDTHS.find((x) => x >= width) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  return `/_img/${w}${src}.webp`;
}
