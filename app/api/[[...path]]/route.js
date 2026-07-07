import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  adminConfigured,
  adminUnauthorized,
  createAdminToken,
  isAdminRequest,
  verifyAdminCredentials,
} from "@/lib/adminAuth";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseAdmin, supabaseAdminConfigured } from "@/lib/supabaseAdmin";

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function pathSegments(params) {
  const p = params?.path;
  if (!p) return [];
  return Array.isArray(p) ? p : [p];
}

function mapMemory(m) {
  return {
    id: m.id,
    text: m.text,
    type: m.type || "secret",
    author: m.author,
    archived: Boolean(m.archived),
    created_at: m.created_at,
    createdAt: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
  };
}

async function requireAdmin() {
  if (!(await isAdminRequest())) return null;
  return true;
}

export async function GET(request, { params }) {
  const p = await params;
  const segs = pathSegments(p);

  if (segs[0] === "health" || segs.length === 0) {
    return json({
      ok: true,
      supabase: supabaseConfigured(),
      admin: adminConfigured(),
    });
  }

  if (segs[0] === "admin") {
    if (segs[1] === "session") {
      const ok = await isAdminRequest();
      return json({ authenticated: ok, admin: adminConfigured() });
    }

    if (segs[1] === "memories") {
      if (!(await requireAdmin())) return json(adminUnauthorized(), 401);
      if (!supabaseAdminConfigured()) {
        return json({ error: "Supabase admin not configured" }, 503);
      }
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ memories: (data ?? []).map(mapMemory) });
    }

    return json({ error: "Not found" }, 404);
  }

  if (segs[0] === "memories") {
    if (!supabaseConfigured()) {
      return json({ memories: [], supabase: false });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: true });
    if (error) {
      const fallback = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: true });
      if (fallback.error) return json({ error: fallback.error.message }, 500);
      const active = (fallback.data ?? []).filter((m) => !m.archived);
      return json({ memories: active, supabase: true });
    }
    return json({ memories: data ?? [], supabase: true });
  }

  return json({ error: "Not found" }, 404);
}

export async function POST(request, { params }) {
  const p = await params;
  const segs = pathSegments(p);

  if (segs[0] === "admin" && segs[1] === "login") {
    if (!adminConfigured()) {
      return json({ error: "Admin login not configured" }, 503);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const email = body?.email;
    const password = body?.password;
    if (!verifyAdminCredentials(email, password)) {
      return json({ error: "Invalid email or password" }, 401);
    }
    const token = createAdminToken();
    const res = json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ADMIN_MAX_AGE,
      path: "/",
    });
    return res;
  }

  if (segs[0] === "admin" && segs[1] === "logout") {
    const res = json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  }

  if (segs[0] === "memories") {
    if (!supabaseConfigured()) {
      return json({ error: "Supabase not configured" }, 503);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const text = (body?.text || "").toString().trim();
    const type = (body?.type || "secret").toString().trim();
    const author = body?.author ? String(body.author).trim().slice(0, 80) : null;

    if (!text) return json({ error: "text is required" }, 400);
    if (text.length > 2000) return json({ error: "text too long" }, 400);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("memories")
      .insert([{ text, type, author }])
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ memory: data }, 201);
  }

  return json({ error: "Not found" }, 404);
}

export async function PATCH(request, { params }) {
  const p = await params;
  const segs = pathSegments(p);

  if (segs[0] === "admin" && segs[1] === "memories" && segs[2]) {
    if (!(await requireAdmin())) return json(adminUnauthorized(), 401);
    if (!supabaseAdminConfigured()) {
      return json({ error: "Supabase admin not configured" }, 503);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (typeof body?.archived !== "boolean") {
      return json({ error: "archived boolean required" }, 400);
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("memories")
      .update({ archived: body.archived })
      .eq("id", segs[2])
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ memory: mapMemory(data) });
  }

  return json({ error: "Not found" }, 404);
}

export async function DELETE(request, { params }) {
  const p = await params;
  const segs = pathSegments(p);

  if (segs[0] === "admin" && segs[1] === "memories" && segs[2]) {
    if (!(await requireAdmin())) return json(adminUnauthorized(), 401);
    if (!supabaseAdminConfigured()) {
      return json({ error: "Supabase admin not configured" }, 503);
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("memories").delete().eq("id", segs[2]);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (segs[0] === "memories" && segs[1]) {
    return json({ error: "Forbidden" }, 403);
  }

  return json({ error: "Not found" }, 404);
}
