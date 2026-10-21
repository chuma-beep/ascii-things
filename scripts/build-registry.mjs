import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(root, "registry/registry.json");
const outDir = resolve(root, "site/public/r");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));

mkdirSync(outDir, { recursive: true });

for (const item of registry.items) {
  const built = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    files: item.files.map((file) => ({
      ...file,
      content: readFileSync(resolve(root, file.path), "utf8"),
    })),
  };
  writeFileSync(resolve(outDir, `${item.name}.json`), `${JSON.stringify(built, null, 2)}\n`);
}

writeFileSync(resolve(outDir, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote ${registry.items.length} registry items to site/public/r`);
