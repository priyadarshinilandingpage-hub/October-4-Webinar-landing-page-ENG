import { permanentRedirect } from "next/navigation";

// The bold typography is now the only design, served at `/`. Old /bold links keep working.
export default function BoldRedirect() {
  permanentRedirect("/");
}
