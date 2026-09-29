// Priyadharsini's Meta Pixel (dataset) ID. Not a secret: it is visible in every page that carries the Pixel.
// Built in (30 Sep 2026, Shyam) so both the Tamil and the English site track without extra setup; a server can
// still point to another Pixel with NEXT_PUBLIC_META_PIXEL_ID (browser) and META_PIXEL_ID (server, for the CAPI).
export const DEFAULT_META_PIXEL_ID = "4638751303076020";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || DEFAULT_META_PIXEL_ID;
