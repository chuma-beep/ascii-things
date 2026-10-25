import { describe, expect, it } from "vitest";
import {
  isAllowedContentType,
  isBlockedHost,
  isPrivateAddress,
} from "../../functions/api/image-proxy";

describe("image proxy guards", () => {
  it("rejects private IPv4 ranges", () => {
    for (const address of [
      "0.0.0.0",
      "10.12.0.4",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.10.4",
      "172.31.255.255",
      "192.168.1.10",
      "100.64.0.1",
      "224.0.0.1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("accepts public IPv4 addresses", () => {
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
    expect(isPrivateAddress("1.1.1.1")).toBe(false);
  });

  it("rejects private IPv6 addresses", () => {
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("fe80::1")).toBe(true);
    expect(isPrivateAddress("fd12:3456::1")).toBe(true);
    expect(isPrivateAddress("2001:db8::1")).toBe(true);
  });

  it("rejects local and metadata hostnames", () => {
    for (const host of [
      "localhost",
      "dev.localhost",
      "printer.local",
      "service.internal",
      "metadata.google.internal",
      "instance-data",
      "[::1]",
    ]) {
      expect(isBlockedHost(host), host).toBe(true);
    }
    expect(isBlockedHost("images.example.com")).toBe(false);
  });

  it("allows raster image content types only", () => {
    expect(isAllowedContentType("image/jpeg; charset=binary")).toBe(true);
    expect(isAllowedContentType("image/png")).toBe(true);
    expect(isAllowedContentType("image/webp")).toBe(true);
    expect(isAllowedContentType("image/avif")).toBe(true);
    expect(isAllowedContentType("image/svg+xml")).toBe(false);
    expect(isAllowedContentType("text/html")).toBe(false);
    expect(isAllowedContentType(null)).toBe(false);
  });
});
