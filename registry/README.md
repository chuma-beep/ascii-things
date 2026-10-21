# Registry sources

The files here are the source for the shadcn registry served at
`https://ascii-things-docs.pages.dev/r/`.

`registry.json` is the manifest. Each item lists one or more source files and the target path
the shadcn CLI should write to. The source path is relative to the repository root.

```sh
npm run registry
```

This writes one JSON file per item to `site/public/r/`, with the source inlined, then formats
the output. The site's `predev` and `prebuild` scripts run the same command, so the published
registry cannot drift from the source files.

To add a component:

1. Add the source file under `registry/` (or point at an existing example file).
2. Add an item to `registry.json` with `name`, `type`, `title`, `description`, and `files`.
3. Run `npm run registry`.
4. Add a page under `site/src/content/docs/components/` and a sidebar entry in
   `site/astro.config.mjs`.

Keep card sources on `@/components/ui/...` imports and use `registryDependencies` for the
shadcn primitives they use. Keep framework-free utilities on a `registry:lib` item and a
`lib/...` target.
