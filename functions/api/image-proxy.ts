/**
 * A deliberately narrow image proxy for the /image/ studio.
 *
 * Local uploads never reach this function. It exists only so a remote image URL
 * can be fetched without asking the browser to defeat CORS, and it refuses
 * private networks, non-image responses, redirects to private networks, and
 * oversized bodies. No application-level URL logging.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 12_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

type RateEntry = { count: number; reset: number };

const rate = new Map<string, RateEntry>();

function json(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function cleanHost(hostname: string) {
  return hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
}

export function isPrivateAddress(address: string): boolean {
  const host = cleanHost(address);
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet < 0 || octet > 255)) return true;
    const [a, b] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return isPrivateAddress(mapped[1]);

  if (host.includes(":")) {
    if (
      host === "::1" ||
      host === "::" ||
      host.startsWith("fe80:") ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("ff") ||
      host.startsWith("2001:db8:") ||
      host === "::ffff:7f00:1"
    ) {
      return true;
    }
  }

  return false;
}

export function isBlockedHost(hostname: string): boolean {
  const host = cleanHost(hostname);
  if (!host) return true;
  if (isPrivateAddress(host)) return true;
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata" ||
    host === "metadata.google.internal" ||
    host === "instance-data" ||
    host === "169.254.169.254"
  );
}

export function isAllowedContentType(value: string | null): boolean {
  if (!value) return false;
  return ALLOWED_TYPES.has(value.split(";")[0].trim().toLowerCase());
}

function allowsPort(url: URL) {
  return url.port === "";
}

async function dnsAnswers(hostname: string, type: "A" | "AAAA", signal: AbortSignal) {
  const endpoint = new URL("https://cloudflare-dns.com/dns-query");
  endpoint.searchParams.set("name", hostname);
  endpoint.searchParams.set("type", type);
  const response = await fetch(endpoint, {
    headers: { accept: "application/dns-json" },
    signal,
  });
  if (!response.ok) throw new Error("The image host could not be verified.");
  const payload = (await response.json()) as {
    Answer?: Array<{ type?: number; data?: string }>;
  };
  return (payload.Answer ?? [])
    .map((answer) => answer.data)
    .filter((value): value is string => Boolean(value));
}

async function assertPublicHost(url: URL, signal: AbortSignal) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS image URLs are allowed.");
  }
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed.");
  if (!allowsPort(url)) throw new Error("Only the standard HTTP and HTTPS ports are allowed.");
  const host = cleanHost(url.hostname);
  if (isBlockedHost(host)) throw new Error("Private and local network hosts are not allowed.");
  if (isPrivateAddress(host)) return;

  const [ipv4, ipv6] = await Promise.all([
    dnsAnswers(host, "A", signal),
    dnsAnswers(host, "AAAA", signal),
  ]);
  const addresses = [...ipv4, ...ipv6];
  if (addresses.length === 0) throw new Error("The image host could not be resolved.");
  if (addresses.some((address) => isPrivateAddress(address))) {
    throw new Error("Private and local network hosts are not allowed.");
  }
}

function allowRequest(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  const now = Date.now();
  const entry = rate.get(ip);
  if (!entry || entry.reset <= now) {
    rate.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

async function readCapped(response: Response): Promise<Uint8Array | null> {
  const length = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BYTES) return null;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > MAX_BYTES ? null : new Uint8Array(buffer);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

export const onRequestGet = async ({ request }: { request: Request }): Promise<Response> => {
  if (!allowRequest(request)) return json(429, "Too many image requests. Try again shortly.");

  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return json(400, "Add a ?url= image address.");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return json(400, "That image URL is not valid.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      await assertPublicHost(target, controller.signal);
      response = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
          "user-agent": "ascii-things-image-proxy/1.0",
        },
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location) return json(502, "The image host returned an empty redirect.");
      if (hop === MAX_REDIRECTS) return json(502, "The image URL redirected too many times.");
      target = new URL(location, target);
    }

    if (!response) return json(502, "The image host did not respond.");
    if (!response.ok) return json(502, `The image host returned HTTP ${response.status}.`);
    if (!isAllowedContentType(response.headers.get("content-type"))) {
      return json(415, "That URL is not a supported raster image.");
    }

    const bytes = await readCapped(response);
    if (!bytes) return json(413, "That image is larger than 10 MB.");

    return new Response(bytes as BodyInit, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/octet-stream",
        "content-length": String(bytes.byteLength),
        "cache-control": "public, max-age=300, s-maxage=3600",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return json(504, "The image host took too long to respond.");
    }
    return json(422, error instanceof Error ? error.message : "That image could not be fetched.");
  } finally {
    clearTimeout(timer);
  }
};
