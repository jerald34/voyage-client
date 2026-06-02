// Streaming proxy for the agent run SSE endpoint.
//
// The blanket `/api/:path*` rewrite in next.config.mjs buffers proxied response
// bodies. That is fine for normal request/response JSON, but it BREAKS Server-Sent
// Events: an agent stream stays open indefinitely, so the buffer never flushes and
// the browser's EventSource receives nothing — the chat appears stuck "thinking"
// even though the run already finished server-side (a refresh then loads the
// persisted messages via REST). A Route Handler lets us forward the upstream body
// through as a live ReadableStream so events reach the client as they are written.
//
// Filesystem routes take precedence over `afterFiles` rewrites, so this handler
// owns ONLY the stream path; every other `/api/*` request still uses the rewrite.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

export async function GET(request, { params }) {
  const { agencyId, runId } = await params;
  const target = `${API_PROXY_TARGET}/agencies/${agencyId}/agent/runs/${runId}/stream`;

  let upstream;
  try {
    upstream = await fetch(target, {
      headers: {
        // Forward the session cookie so the backend can authenticate the run.
        cookie: request.headers.get("cookie") ?? "",
        accept: "text/event-stream",
      },
      cache: "no-store",
      // Abort the upstream fetch when the browser disconnects, so the backend's
      // SSE controller runs its cleanup (unsubscribe + tool registry clear).
      signal: request.signal,
    });
  } catch (err) {
    return new Response(`Upstream stream unavailable: ${err?.message ?? "error"}`, {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    // Pass through the upstream status (e.g. 401/404) so the client can react.
    const body = await upstream.text().catch(() => "");
    return new Response(body, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // `no-transform` stops any intermediary from chunk-buffering/compressing;
      // `X-Accel-Buffering: no` disables buffering on nginx-style proxies in prod.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
