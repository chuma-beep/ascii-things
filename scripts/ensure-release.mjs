#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REGISTRY = "https://registry.npmjs.org";
const MAX_ATTEMPTS = 20;
const RETRY_DELAY_MS = 15_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args, options = {}) {
  const result = execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return typeof result === "string" ? result.trim() : "";
}

function registryUrl(name, version) {
  return `${REGISTRY}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
}

async function waitForVersion(name, version) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response;
    try {
      response = await fetch(registryUrl(name, version), {
        headers: { accept: "application/json" },
      });
    } catch (error) {
      console.log(`Registry request failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${error.message}`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    if (response.ok) {
      console.log(`${name}@${version} is available in the registry.`);
      return;
    }
    if (response.status !== 404) {
      throw new Error(`Registry returned ${response.status} for ${name}@${version}`);
    }

    console.log(`Waiting for ${name}@${version} (attempt ${attempt}/${MAX_ATTEMPTS})…`);
    await sleep(RETRY_DELAY_MS);
  }

  throw new Error(
    `${name}@${version} did not appear in the registry within ${MAX_ATTEMPTS} attempts`,
  );
}

function remoteTagExists(tag) {
  return run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`]).length > 0;
}

function ensureTag(name, version, tag) {
  if (remoteTagExists(tag)) {
    console.log(`Tag ${tag} already exists.`);
    return;
  }

  console.log(`Pushing tag ${tag}.`);
  run("git", ["config", "user.name", "github-actions[bot]"]);
  run("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  run("git", ["tag", "-f", "-a", tag, "-m", `${name} ${version}`]);
  run("git", ["push", "origin", tag]);
}

function releaseExists(tag) {
  try {
    run("gh", ["release", "view", tag, "--json", "tagName"]);
    return true;
  } catch {
    return false;
  }
}

function changelogNotes(version) {
  let markdown;
  try {
    markdown = readFileSync("CHANGELOG.md", "utf8");
  } catch {
    return "";
  }

  const heading = `## ${version}`;
  const start = markdown.indexOf(heading);
  if (start === -1) return "";

  const rest = markdown.slice(start + heading.length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function ensureRelease(name, version, tag) {
  if (releaseExists(tag)) {
    console.log(`GitHub release ${tag} already exists.`);
    return;
  }

  const notes = changelogNotes(version);
  const args = ["release", "create", tag, "--title", `${name} ${version}`];
  if (notes) {
    const directory = mkdtempSync(join(tmpdir(), "ascii-things-release-"));
    const notesFile = join(directory, "notes.md");
    writeFileSync(notesFile, `${notes}\n`);
    args.push("--notes-file", notesFile);
  } else {
    args.push("--generate-notes");
  }

  console.log(`Creating GitHub release ${tag}.`);
  run("gh", args, { stdio: "inherit" });
}

function packageFromHeadTag() {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync("package.json", "utf8"));
  } catch {
    return null;
  }
  if (!manifest.name || !manifest.version) return null;

  const tag = `v${manifest.version}`;
  const tagsAtHead = run("git", ["tag", "--points-at", "HEAD"]).split("\n");
  if (!tagsAtHead.includes(tag)) return null;
  return { name: manifest.name, version: manifest.version };
}

let packages = [];
const raw = process.env.PUBLISHED_PACKAGES;
if (raw) {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) packages = parsed;
}

if (packages.length === 0) {
  const fallback = packageFromHeadTag();
  if (!fallback) {
    console.log("No published packages reported and no release tag at HEAD; nothing to backfill.");
    process.exit(0);
  }
  console.log(`Falling back to ${fallback.name}@${fallback.version} from the tag at HEAD.`);
  packages = [fallback];
}

for (const entry of packages) {
  const { name, version } = entry ?? {};
  if (!name || !version) {
    throw new Error(`Invalid published package entry: ${JSON.stringify(entry)}`);
  }

  await waitForVersion(name, version);
  const tag = `v${version}`;
  ensureTag(name, version, tag);
  ensureRelease(name, version, tag);
}
