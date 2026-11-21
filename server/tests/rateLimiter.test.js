import { describe, it, expect, beforeEach } from "vitest";
import { rateLimiter, rateLimits, resetRateLimits, cleanExpiredEntries } from "../src/middleware/rateLimiter.js";
import { createMockRes } from "./testHelpers.js";

describe("rateLimiter middleware", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests under the rate limit", () => {
    const req = { ip: "192.168.1.1" };
    const res = createMockRes();
    let nextCalled = false;
    rateLimiter(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  it("blocks requests that exceed maximum allowed threshold", () => {
    const req = { ip: "10.0.0.99" };
    const res = createMockRes();
    for (let i = 0; i < 60; i += 1) {
      rateLimiter(req, res, () => {});
    }
    rateLimiter(req, res, () => {});

    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBe("60");
    expect(res.body.error).toBe("Too Many Requests");
  });

  it("cleans expired IP entries when time window elapses", () => {
    const past = Date.now() - 70000;
    rateLimits.set("expired-ip", { count: 5, startTime: past });
    cleanExpiredEntries(Date.now());

    expect(rateLimits.has("expired-ip")).toBe(false);
  });
});
