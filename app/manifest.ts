import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bibs",
    short_name: "Bibs",
    description: "Suivi des biberons de bébé",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf8f4",
    theme_color: "#fde2e6",
    lang: "fr",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
