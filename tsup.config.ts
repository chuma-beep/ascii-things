import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    sharks: "src/sharks.ts",
    robots: "src/robots/index.ts",
    jellyfish: "src/jellyfish/index.ts",
    dog: "src/dog/index.ts",
    react: "src/react.tsx",
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
