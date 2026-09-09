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
        <section className="mt-10 overflow-hidden rounded-[30px] border border-black/[0.05] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.08)]">

          {/* TOP STATUS AREA */}
          <div className="px-6 pb-9 pt-10 sm:px-12 sm:pt-11">

            <div className="mx-auto flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#f0f8f3] text-[#159447]">
              <svg
                width="27"
                height="27"
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

            {/* STATUS */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="h-[6px] w-[6px] rounded-full bg-[#159447]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">
                Scheduled maintenance
              </span>
            </div>

            {/* HEADING */}
            <h1 className="mt-4 text-[27px] font-extrabold leading-[1.1] tracking-[-0.05em] sm:text-[32px]">
              We’ll be back soon
            </h1>

            {/* DESCRIPTION */}
            <p className="mx-auto mt-4 max-w-[410px] text-[13px] font-medium leading-[1.8] text-black/55">
              Apna Shyampur is temporarily unavailable while we make
              improvements to the platform.
            </p>

          </div>

          {/* DIVIDER */}
          <div className="mx-6 border-t border-black/[0.06] sm:mx-12" />

          {/* BOTTOM MESSAGE */}
          <div className="px-6 pb-9 pt-7 sm:px-12 sm:pb-10">

            <p className="text-[12px] font-semibold leading-5 text-black/65">
              We’re working behind the scenes to make things better.
            </p>

            <div className="mt-5 inline-flex items-center rounded-full bg-[#f7f7f6] px-4 py-2.5">
              <span className="text-[12px] font-bold tracking-[-0.01em] text-black/75">
                Tab tak chaai bnao, hum biscuit lekar aaye ☕🍪
              </span>
            </div>

          </div>
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