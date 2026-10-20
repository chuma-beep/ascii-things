import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    sharks: "src/sharks.ts",
    robots: "src/robots/index.ts",
    jellyfish: "src/jellyfish/index.ts",
    dog: "src/dog/index.ts",
    starlings: "src/starlings/index.ts",
    fireflies: "src/fireflies/index.ts",
    ants: "src/ants/index.ts",
    koi: "src/koi/index.ts",
    city: "src/city/index.ts",
    servers: "src/servers/index.ts",
    react: "src/react.tsx",
    ui: "src/ui.tsx",
    element: "src/element.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  splitting: true,
  target: "es2020",
  external: ["react", "react-dom", "react/jsx-runtime"],
});
