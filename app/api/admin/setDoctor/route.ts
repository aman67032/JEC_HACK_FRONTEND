import type { NextRequest } from "next/server";
import { getAuthAdmin } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) return new Response("ADMIN_API_SECRET not configured", { status: 500 });
  const header = req.headers.get("x-admin-secret");
  if (header !== secret) return new Response("Unauthorized", { status: 401 });

  try {
    const { userId, makeDoctor } = await req.json();
    if (!userId) return new Response("userId required", { status: 400 });
    const auth = getAuthAdmin();
    await auth.setCustomUserClaims(userId, { role: makeDoctor === false ? undefined : "doctor" });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}


