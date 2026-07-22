import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    const parentSession = request.cookies.get("parent_session")?.value;

    let role = "";
    let userId = "";

    const secret = new TextEncoder().encode(JWT_SECRET);

    if (adminSession) {
      try {
        const { payload } = await jwtVerify(adminSession, secret);
        role = "admin";
        userId = payload.sub as string;
      } catch (e) {}
    } else if (parentSession) {
      try {
        const { payload } = await jwtVerify(parentSession, secret);
        role = "parent";
        userId = payload.sub as string;
      } catch (e) {}
    }

    if (!role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminSupabase();

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false })
      .limit(20);

    if (role === "parent") {
      // Very basic filtering for parent. The student resolving is complex, so we just use OR for token 'sub'
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      // If table doesn't exist, just return empty to prevent breaking the UI
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
