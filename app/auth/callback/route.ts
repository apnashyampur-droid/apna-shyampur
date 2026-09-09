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

  const user = data.user;

  if (!user) {
    console.error("NO USER FOUND AFTER SESSION EXCHANGE");
    return NextResponse.redirect(
      `${origin}/signin?error=no_user`
    );
  }

  /*
   * Create the user's profile only if it doesn't already exist.
   *
   * Important:
   * Existing profiles are NOT overwritten here.
   */
  const { data: existingProfile, error: profileCheckError } =
    await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

  if (profileCheckError) {
    console.error(
      "PROFILE CHECK ERROR:",
      profileCheckError
    );
  } else if (!existingProfile) {
    const metadata = user.user_metadata ?? {};

    const { error: profileInsertError } =
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        full_name:
          metadata.full_name ??
          metadata.name ??
          "",
        avatar_url:
          metadata.avatar_url ??
          metadata.picture ??
          null,
      });

    if (profileInsertError) {
      console.error(
        "PROFILE CREATE ERROR:",
        profileInsertError
      );
    } else {
      console.log(
        "PROFILE CREATED FOR USER:",
        user.id
      );
    }
  } else {
    console.log(
      "PROFILE ALREADY EXISTS:",
      user.id
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
