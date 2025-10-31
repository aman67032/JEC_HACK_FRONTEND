import axios from "axios";
import type { NextRequest } from "next/server";

function corsHeaders(origin?: string) {
  const allowed = (process.env.API_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowOrigin = origin && (allowed.length === 0 || allowed.includes(origin)) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  } as Record<string, string>;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const origin = req.headers.get("origin") || undefined;
  const headers = corsHeaders(origin);
  try {
    const params = await ctx.params;
    const segments = params.path || [];
    // Build RxNav REST path and preserve query params
    const rxPath = segments.join("/");
    const url = new URL(`https://rxnav.nlm.nih.gov/REST/${rxPath}.json`);
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((value, key) => url.searchParams.set(key, value));

    const resp = await axios.get(url.toString(), { timeout: 10000 });
    return new Response(JSON.stringify(resp.data), { status: 200, headers: { "Content-Type": "application/json", ...headers } });
  } catch (e: any) {
    const message = e?.response?.data || e?.message || "Proxy error";
    const status = e?.response?.status || 500;
    return new Response(typeof message === "string" ? message : JSON.stringify(message), { status, headers: { "Content-Type": "application/json", ...headers } });
  }
}


