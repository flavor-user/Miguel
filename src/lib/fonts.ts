import { IBM_Plex_Sans } from "next/font/google";

/** Sans recta, estilo catálogo de galería / brutalista suizo. */
export const gallerySans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gallery",
  display: "swap",
});
