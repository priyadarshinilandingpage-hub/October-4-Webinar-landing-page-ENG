import type { Metadata, Viewport } from "next";
import { Ui3Page } from "@/components/ui3/Ui3Page";
import "./ui3/ui3.css";

// `/`: pre-built as a plain file. public/boot.js picks the ad-matched headline before the first paint.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0d0718",
};

export default function Home() {
  return <Ui3Page />;
}
