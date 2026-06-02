import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "../app/api/agencies/[agencyId]/agent/runs/[runId]/stream/route.js";

function makeRequest(cookie = "voyage_session=abc") {
  return {
    headers: new Headers({ cookie }),
    signal: new AbortController().signal,
  };
}

const params = Promise.resolve({ agencyId: "a1", runId: "r1" });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("agent run SSE proxy route", () => {
  it("pipes the upstream body through with event-stream headers", async () => {
    const upstreamBody = new ReadableStream({ start(c) { c.close(); } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: upstreamBody,
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toContain("no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
  });

  it("forwards the session cookie and targets the correct upstream run", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: new ReadableStream({ start(c) { c.close(); } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await GET(makeRequest("voyage_session=xyz"), { params });

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/agencies\/a1\/agent\/runs\/r1\/stream$/);
    expect(opts.headers.cookie).toBe("voyage_session=xyz");
    expect(opts.cache).toBe("no-store");
  });

  it("passes through a non-OK upstream status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      body: null,
      text: async () => "unauthorized",
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(401);
  });

  it("returns 502 when the upstream fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(makeRequest(), { params });

    expect(res.status).toBe(502);
  });
});
