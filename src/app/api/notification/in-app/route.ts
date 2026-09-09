import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getJwtSecretKey } from "@/lib/jwt";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("parent_session")?.value || req.cookies.get("admin_session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(sessionCookie, secret);
    const userId = payload.sub as string;

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("in_app_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, notifications: data });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("parent_session")?.value || req.cookies.get("admin_session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(sessionCookie, secret);
    const userId = payload.sub as string;

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
