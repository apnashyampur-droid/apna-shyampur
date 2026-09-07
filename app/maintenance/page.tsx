export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f5] px-5 text-[#111]">

      <div className="w-full max-w-[560px] text-center">

        {/* BRAND */}

        <div className="flex items-center justify-center gap-2">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111] text-[11px] font-black tracking-[-0.03em] text-white">
            AS
          </div>

          <div className="flex items-baseline gap-[3px] text-[18px] font-black tracking-[-0.055em]">
            <span>APNA</span>

            <span className="text-[#159447]">
              SHYAMPUR
            </span>
          </div>

        </div>


        {/* MAINTENANCE CARD */}

        <section className="mt-10 rounded-[30px] border border-black/[0.04] bg-white px-6 py-11 shadow-[0_18px_60px_rgba(0,0,0,0.07)] sm:px-12">

          {/* ICON */}

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf8f1] text-[#159447]">

            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.9-5.9l-3.1 3.1-2-2 3.1-3.1Z" />
              <path d="m14 14 6 6" />
            </svg>

          </div>


          {/* HEADING */}

          <h1 className="mt-7 text-[25px] font-extrabold leading-[1.15] tracking-[-0.045em] sm:text-[30px]">
            Maintenance break
          </h1>


          {/* DESCRIPTION */}

          <p className="mx-auto mt-4 max-w-[410px] text-[13px] font-medium leading-6 text-black/60">
            We’re taking a short break for some improvements.
            We’ll be back soon.
          </p>


          {/* TAGLINE */}

          <p className="mt-5 text-[12px] font-bold tracking-[-0.01em] text-black/75">
            Tab tak chaai bnao, hum biscuit lekar aaye ☕🍪
          </p>

        </section>


        {/* FOOTER */}

        <div className="mt-7 text-[10px] font-semibold text-black/45">
          © 2026{" "}

          <span className="text-black/65">
            PNT
          </span>

          <span className="text-[#159447]">
            VERSE
          </span>
        </div>

      </div>

    </main>
  );
}
