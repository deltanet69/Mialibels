import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase";
import { getJwtSecretKey } from "@/lib/jwt";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("parent_session")?.value || req.cookies.get("admin_session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(sessionCookie, secret);
    const userId = payload.sub as string;
    const role = req.cookies.has("admin_session") ? "admin" : "parent";

    const { subscription } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Upsert subscription (if endpoint exists, update it)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        role: role,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Subscription saved." });
  } catch (error: any) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "Endpoint required" }, { status: 400 });

    const supabase = getAdminSupabase();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Subscription deleted." });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
