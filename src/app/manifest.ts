import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AsthmaTrack",
    short_name: "AsthmaTrack",
    description:
      "Aplicativo para registro e acompanhamento de dados relacionados à asma.",
    lang: "pt-BR",
    dir: "ltr",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#f5f7fa",
    theme_color: "#0f2044",
    orientation: "portrait-primary",
    categories: ["health", "medical", "productivity"],
  };
}
