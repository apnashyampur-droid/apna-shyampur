import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  console.log("AUTH CALLBACK HIT");
  console.log("CODE EXISTS:", !!code);

  if (!code) {
    console.error("NO AUTH CODE FOUND");
    return NextResponse.redirect(`${origin}/signin?error=no_code`);
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  console.log("SESSION DATA:", !!data.session);
  console.log("AUTH ERROR:", error);

  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/`);
}