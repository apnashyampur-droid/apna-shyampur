"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SettingScreen() {
  const router = useRouter();
  const supabase = createClient();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
  setLoggingOut(true);

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error);
    setLoggingOut(false);
    return;
  }

  setShowLogoutConfirm(false);

  router.replace("/");
  router.refresh();
};

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      {/* HEADER */}

      <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
       <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          {/* BRAND */}

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
              AS
            </div>

            <div className="leading-none">

              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                <span className="text-[#111]">
                  APNA
                </span>

                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/55 sm:mt-1.5 sm:text-[9px]">
                <span>LOCALS</span>
                <span className="text-[#159447]">•</span>
                <span>TRUSTED</span>
                <span className="text-[#159447]">•</span>
                <span>FAST</span>
              </div>

            </div>

          </div>

          {/* BACK */}

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

      <section className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8 sm:py-14">

        {/* TITLE */}

        <div>

  <h1 className="text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
    Settings
  </h1>

  <p className="mt-3 max-w-[500px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
    Manage your account, preferences and information.
  </p>

</div>

        {/* SETTINGS LIST */}

        <div className="mt-8 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.04)]">

       {/* ACCOUNT */}

<div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">

  <div className="text-[9px] font-bold tracking-[0.16em] text-black/35">
    ACCOUNT
  </div>

</div>

{/* ORDER HISTORY */}

<button
  type="button"
  onClick={() => router.push("/orders")}
  className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
>

  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef5ef] text-[#159447]">

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12l2 4H4l2-4Z" />
      <path d="M4 7h16v13H4z" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>

  </div>

  <div className="min-w-0 flex-1">

    <div className="text-[13px] font-black">
      Order History
    </div>

    <div className="mt-1 text-[10px] leading-4 text-black/40">
      View your previous orders and purchase details.
    </div>

  </div>

  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-black/50"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>

</button>


<button
  type="button"
  onClick={() => router.push("/favorites")}
  className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
>

  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fff1f2] text-[#e5485d]">

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z" />
    </svg>

  </div>

  <div className="min-w-0 flex-1">

    <div className="text-[13px] font-black">
      Favorite Shops
    </div>

    <div className="mt-1 text-[10px] leading-4 text-black/40">
      Quickly access the shops you love to order from.
    </div>

  </div>

  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-black/50"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>

</button>

{/* MY SHOP */}

<button
  type="button"
  onClick={() => router.push("/shop")}
  className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
>

  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef5ef] text-[#159447]">

    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 5 4h14l2 6.5" />
      <path d="M4 10.5v8.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" />
      <path d="M3 10.5c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2" />
      <path d="M8 20v-4h8v4" />
    </svg>

  </div>

  <div className="min-w-0 flex-1">

    <div className="text-[13px] font-black">
      My Shop
    </div>

    <div className="mt-1 text-[10px] leading-4 text-black/40">
      Manage your shop, products, orders and offers.
    </div>

  </div>

  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-black/50"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>

</button>

          {/* PRIVACY */}

          <button
            type="button"
            className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
          >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f3f4f2] text-black/65">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3 19 6v5c0 4.7-2.8 8.3-7 10-4.2-1.7-7-5.3-7-10V6l7-3Z" />
                <path d="m9.5 12 1.7 1.7 3.5-3.5" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[13px] font-black">
                Account & Security
              </div>

              <div className="mt-1 text-[10px] leading-4 text-black/40">
                Manage your privacy and account security.
              </div>

            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-black/25"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>

          </button>


          {/* ABOUT */}

          <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">

            <div className="text-[9px] font-bold tracking-[0.16em] text-black/35">
              INFORMATION
            </div>

          </div>


          {/* PRIVACY POLICY */}

          <button
            type="button"
            className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
          >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f3f4f2] text-black/65">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3h9l3 3v15H6z" />
                <path d="M15 3v4h4" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
                <path d="M9 8h2" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[13px] font-black">
                Privacy Policy
              </div>

              <div className="mt-1 text-[10px] leading-4 text-black/40">
                Learn how we collect and use your information.
              </div>

            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-black/25"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>

          </button>


          {/* TERMS */}

          <button
            type="button"
            className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
          >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f3f4f2] text-black/65">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4h12" />
                <path d="M6 8h12" />
                <path d="M6 12h8" />
                <path d="M6 16h12" />
                <path d="M6 20h8" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[13px] font-black">
                Terms & Conditions
              </div>

              <div className="mt-1 text-[10px] leading-4 text-black/40">
                Read the rules and conditions for using Apna Shyampur.
              </div>

            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-black/25"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>

          </button>

          {/* ABOUT US */}

          <button
            type="button"
            className="group flex w-full items-center gap-4 border-b border-black/[0.06] px-5 py-5 text-left transition hover:bg-black/[0.015] sm:px-6"
          >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef5ef] text-[#159447]">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v6" />
                <path d="M12 7.5h.01" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[13px] font-black">
                About Apna Shyampur
              </div>

              <div className="mt-1 text-[10px] leading-4 text-black/40">
                Learn more about our local marketplace.
              </div>

            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-black/25 transition group-hover:translate-x-0.5 group-hover:text-black/50"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>

          </button>


          {/* LOG OUT */}

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="group flex w-full items-center gap-4 px-5 py-5 text-left transition hover:bg-red-50 sm:px-6"
          >

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-red-50 text-red-500">

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 17l5-5-5-5" />
                <path d="M15 12H3" />
                <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[13px] font-black text-red-500">
                Log out
              </div>

              <div className="mt-1 text-[10px] leading-4 text-black/40">
                Sign out of your Apna Shyampur account.
              </div>

            </div>

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-red-300 transition group-hover:translate-x-0.5 group-hover:text-red-500"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>

          </button>

        </div>

        {/* APP INFO */}

        <div className="mt-8 text-center">

          <div className="text-[9px] font-semibold text-black/30">
            Apna Shyampur
          </div>

          <div className="mt-1 text-[9px] font-semibold text-black/25">
            © 2026{" "}
            <span className="text-black/45">
              PNT
            </span>
            <span className="text-[#159447]">
              VERSE
            </span>
          </div>

        </div>

      </section>

            {/* LOGOUT CONFIRMATION */}

      {/* LOGOUT CONFIRMATION */}

{showLogoutConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[6px]">

    <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_30px_100px_rgba(0,0,0,.20)]">

      {/* TOP */}

      <div className="px-6 pb-5 pt-7 sm:px-7 sm:pt-8">

        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-red-50 text-red-500">

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
          </svg>

        </div>

        <h2 className="mt-5 text-[20px] font-black tracking-[-0.04em] text-[#111]">
          Log out of Apna Shyampur?
        </h2>

        <p className="mt-2.5 max-w-[320px] text-[12px] leading-[1.6] text-black/45">
          You’ll need to sign in again to access your account and continue using Apna Shyampur.
        </p>

      </div>


      {/* ACTIONS */}

      <div className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-4 sm:px-7">

        <div className="flex gap-2.5">

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            disabled={loggingOut}
            className="flex-1 rounded-[13px] border border-black/[0.08] bg-white px-4 py-3 text-[11px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-black/[0.02] hover:text-black disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 rounded-[13px] bg-[#111] px-4 py-3 text-[11px] font-bold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>

        </div>

      </div>

    </div>

  </div>
)}

    </main>
  );
}