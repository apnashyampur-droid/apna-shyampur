"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
      setLoading(false);
      setError("Unable to continue with Google. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      {/* HEADER */}

      <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
              AS
            </div>

            <div className="leading-none text-left">

              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:gap-[5px] sm:text-[18px]">
                <span className="text-[#111]">APNA</span>
                <span className="text-[#159447]">SHYAMPUR</span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/55 sm:mt-1.5 sm:gap-2 sm:text-[9px] sm:tracking-[0.14em]">
                <span>LOCALS</span>
                <span className="text-[#159447]">•</span>
                <span>TRUSTED</span>
                <span className="text-[#159447]">•</span>
                <span>FAST</span>
              </div>

            </div>
          </button>

       <button
  type="button"
  onClick={() => router.back()}
  className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
>
  Back
</button>

        </div>
      </header>


      {/* MAIN */}

      <section className="flex min-h-[calc(100vh-70px)] items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-[430px]">

          {/* CARD */}

          <div className="rounded-[30px] border border-black/[0.07] bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,.07)] sm:p-9">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111] text-[10px] font-black tracking-tight text-white">
                AS
              </div>

              <div className="leading-none">

                <div className="flex items-baseline gap-[3px] text-[14px] font-black tracking-[-0.05em]">
                  <span className="text-[#111]">APNA</span>
                  <span className="text-[#159447]">SHYAMPUR</span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[6.5px] font-bold tracking-[0.12em] text-black/40">
                  <span>LOCALS</span>
                  <span className="text-[#159447]">•</span>
                  <span>TRUSTED</span>
                  <span className="text-[#159447]">•</span>
                  <span>FAST</span>
                </div>

              </div>

            </div>


            {/* GOOGLE SIGN IN */}

            <div className="mt-9">

              <h1 className="text-[30px] font-black leading-[1] tracking-[-0.05em] sm:text-[34px]">
                Welcome back
              </h1>

              <p className="mt-3 max-w-[340px] text-[12px] leading-5 text-black/45">
                Sign in to discover local shops and order from your neighbourhood.
              </p>


              {/* GOOGLE BUTTON */}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-8 flex h-[54px] w-full items-center justify-center gap-3 rounded-[15px] border border-black/[0.09] bg-white text-[12px] font-bold text-black transition hover:border-black/[0.16] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <span className="flex items-center gap-2">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/15 border-t-black" />

                    Connecting...

                  </span>
                ) : (
                  <>
                    {/* GOOGLE ICON */}

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
                      />

                      <path
                        fill="#34A853"
                        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.71-5.46-4.01H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
                      />

                      <path
                        fill="#FBBC05"
                        d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.62H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.38l3.24-2.53Z"
                      />

                      <path
                        fill="#EA4335"
                        d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.37l3.24 2.53 3.24 2.53C7.31 7.85 9.46 6.14 12 6.14Z"
                      />
                    </svg>

                    Continue with Google
                  </>
                )}

              </button>


              {/* ERROR */}

              {error && (
                <p className="mt-3 text-center text-[10px] font-semibold text-red-500">
                  {error}
                </p>
              )}


              {/* INFO */}

              <p className="mt-5 text-center text-[9px] font-medium leading-4 text-black/35">
                Continue securely with your Google account.
              </p>

            </div>

          </div>


          {/* FOOTER */}

          <div className="mt-6 text-center">

            <p className="text-[9px] font-semibold text-black/30">
              © 2026{" "}
              <span className="text-black/55">PNT</span>
              <span className="text-[#159447]">VERSE</span>
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

