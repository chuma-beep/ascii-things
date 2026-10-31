import { fileURLToPath } from "node:url";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  // Cloudflare Pages serves the static build from site/dist.
  // Swap `site` if the docs move to a custom domain.
  site: "https://ascii-things-docs.pages.dev",
  output: "static",
  vite: {
    resolve: {
      alias: {
        "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      },
    },
  },
  integrations: [
    starlight({
      title: "ascii-things",
      disable404Route: true,
      description:
        "Living ASCII scenes for the web: sharks, robots, jellyfish, and a robot dog. Zero runtime dependencies, one canvas.",
      favicon: "/favicon.svg",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/chuma-beep/ascii-things",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/chuma-beep/ascii-things/edit/main/site/",
      },
      customCss: ["./src/styles/docs.css"],
      components: {
        Header: "./src/components/DocsHeader.astro",
        Sidebar: "./src/components/DocsSidebar.astro",
      },
      head: [
        { tag: "meta", attrs: { name: "theme-color", content: "#070809" } },
        {
          tag: "script",
          attrs: { src: "/favicon-motion.js", type: "module" },
        },
        {
          tag: "link",
          attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: "anonymous",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap",
          },
        },
      ],
      sidebar: [
        {
          label: "Library",
          items: [
            { label: "All items", link: "library/" },
            { label: "Showcase", link: "showcase/" },
            { label: "Design ideas", link: "design-ideas/" },
            { label: "Compositions", link: "design-ideas/#compositions" },
            { label: "Scenes", link: "library/?type=scene" },
            { label: "WebGL", link: "library/?type=webgl" },
            { label: "Kanji", link: "library/?type=kanji" },
            { label: "Components", link: "library/?type=component" },
            { label: "Tools", link: "library/?type=tool" },
          ],
        },
        {
          label: "Start here",
          items: [
            { label: "Introduction", link: "guide/" },
            { label: "Installation", link: "guide/installation/" },
            { label: "Quickstart", link: "guide/quickstart/" },
            { label: "React", link: "guide/react/" },
            { label: "Custom elements", link: "guide/custom-elements/" },
            { label: "UI components", link: "guide/ui-components/" },
            { label: "Image to ASCII", link: "guide/image/" },
            { label: "Dither field", link: "guide/dither/" },
            { label: "WebGL surface", link: "guide/webgl-surface/" },
          ],
        },
        {
          label: "Components",
          items: [
            { label: "All components", link: "components/" },
            { label: "ASCII box footer", link: "components/ascii-box-footer/" },
            { label: "Koi card", link: "components/koi-card/" },
            { label: "Dither card", link: "components/dither-card/" },
            { label: "Surface card", link: "components/surface-card/" },
            { label: "Scene console", link: "components/scene-console/" },
            { label: "Scene toolbar", link: "components/scene-toolbar/" },
          ],
        },
        {
          label: "WebGL",
          items: [
            { label: "WebGL Lab", link: "webgl/" },
            { label: "More WebGL", link: "webgl/more/" },
            { label: "3D Objects", link: "webgl/3d/" },
            { label: "Kanji Lab", link: "kanji/" },
          ],
        },
        {
          label: "Scenes",
          items: [
            { label: "All scenes", link: "scenes/" },
            { label: "Lagoon", link: "scenes/lagoon/" },
            { label: "Shark tank", link: "scenes/sharks/" },
            { label: "Robot floor", link: "scenes/robots/" },
            { label: "Jellyfish bloom", link: "scenes/jellyfish/" },
            { label: "Robot dog", link: "scenes/dog/" },
            { label: "Starlings", link: "scenes/starlings/" },
            { label: "Fireflies", link: "scenes/fireflies/" },
            { label: "Ants", link: "scenes/ants/" },
            { label: "Koi", link: "scenes/koi/" },
            { label: "City", link: "scenes/city/" },
            { label: "Servers", link: "scenes/servers/" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Design systems", link: "guide/design-systems/" },
            { label: "Theming and palettes", link: "guide/theming/" },
            { label: "Performance", link: "guide/performance/" },
            { label: "Accessibility", link: "guide/accessibility/" },
            { label: "SSR and hydration", link: "guide/ssr/" },
            { label: "Troubleshooting", link: "guide/troubleshooting/" },
            { label: "Deployment", link: "guide/deployment/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "API reference", link: "api/" },
            { label: "Image studio", link: "image/" },
            { label: "ASCII symbols", link: "symbols/" },
            { label: "Playground", link: "playground/" },
            { label: "Examples", link: "examples/" },
            { label: "Changelog", link: "changelog/" },
          ],
        },
      ],
    }),
    react(),
  ],
});
