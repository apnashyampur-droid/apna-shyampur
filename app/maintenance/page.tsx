"use client";

import { useEffect, useRef, useState } from "react";

const SLIDES = Array.from(
  { length: 16 },
  (_, index) => `/${String(index + 1).padStart(2, "0")}.jpg`,
);

const SLIDE_DURATION = 6000;

export default function MaintenancePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /*
   * SLIDESHOW
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(interval);
  }, []);

  /*
   * PRELOAD IMAGES
   */
  useEffect(() => {
    SLIDES.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  /*
   * MUSIC
   *
   * Music starts ONLY when the user presses the sound button.
   * No autoplay attempt is made.
   */
  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      /*
       * First click:
       * Start the music directly from the user interaction.
       */
      if (!audioStarted) {
        audio.volume = 0.42;
        audio.muted = false;

        await audio.play();

        setAudioStarted(true);
        setIsMuted(false);

        return;
      }

      /*
       * After music has started:
       * Toggle mute / unmute normally.
       */
      if (audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      } else {
        audio.muted = true;
        setIsMuted(true);
      }
    } catch {
      setIsMuted(true);
    }
  };

  const currentNumber = String(activeSlide + 1).padStart(2, "0");
  const totalNumber = String(SLIDES.length).padStart(2, "0");

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111]">
      {/* =========================================================
          HERO IMAGE AREA
      ========================================================== */}

      <div className="absolute inset-0">
        {SLIDES.map((src, index) => {
          const active = index === activeSlide;

          return (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
                active ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[7000ms] ease-linear ${
                  active ? "scale-[1.05]" : "scale-100"
                }`}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* =========================================================
          LIGHT IMAGE OVERLAY
      ========================================================== */}

      <div className="absolute inset-0 bg-white/10" />

      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/35" />

      <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/5 to-transparent" />

      {/* =========================================================
          TOP HEADER
      ========================================================== */}

      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 sm:py-7 lg:px-12">
          {/* BRAND */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111] text-[11px] font-black tracking-[-0.04em] text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:h-11 sm:w-11">
              AS
            </div>

            <div className="leading-none">
              <div className="flex items-baseline gap-[3px] text-[17px] font-black tracking-[-0.055em] sm:text-[19px]">
                <span>APNA</span>

                <span className="text-[#159447]">SHYAMPUR</span>
              </div>

              <div className="mt-1 text-[7px] font-bold tracking-[0.22em] text-black/40 sm:text-[8px]">
                LOCALS • TRUSTED • FAST
              </div>
            </div>
          </div>

          {/* =====================================================
              SOUND BUTTON
          ====================================================== */}

          <button
            type="button"
            onClick={toggleMusic}
            aria-label={isMuted ? "Play music" : "Mute music"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-black/75 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 hover:border-black/20 hover:bg-white hover:text-black active:scale-95 sm:h-11 sm:w-11"
          >
            {isMuted ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H2v6h6l5 4V5Z" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN CONTENT
      ========================================================== */}

      <section className="relative z-10 flex min-h-screen items-end">
        <div className="mx-auto w-full max-w-[1500px] px-5 pb-24 sm:px-8 sm:pb-28 lg:px-12 lg:pb-32">
          <div className="max-w-[760px]">
            {/* STATUS */}

            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#159447]/50" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#159447]" />
              </span>

              <span className="text-[9px] font-bold uppercase tracking-[0.23em] text-black/50 sm:text-[10px]">
                Scheduled maintenance
              </span>
            </div>

            {/* HEADING */}

            <h1 className="max-w-[760px] text-[48px] font-black leading-[0.9] tracking-[-0.065em] text-[#111] sm:text-[68px] md:text-[82px] lg:text-[94px]">
              We&apos;ll be
              <br />

              <span className="text-[#159447]">back soon.</span>
            </h1>

            {/* DESCRIPTION */}

            <p className="mt-6 max-w-[570px] text-[13px] font-medium leading-[1.8] text-black/55 sm:mt-7 sm:text-[15px] sm:leading-[1.75]">
              Apna Shyampur is taking a little break while we work
              behind the scenes to make your local shopping experience
              faster, smoother and better.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          BOTTOM CONTROLS
      ========================================================== */}

      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="mx-auto flex w-full max-w-[1500px] items-end justify-between gap-6 px-5 pb-5 sm:px-8 sm:pb-7 lg:px-12">
          {/* SLIDE NUMBER */}

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black tracking-[0.08em] text-black">
              {currentNumber}
            </span>

            <div className="h-px w-10 bg-black/20 sm:w-14" />

            <span className="text-[10px] font-semibold tracking-[0.08em] text-black/40">
              {totalNumber}
            </span>
          </div>

          {/* DOTS */}

          <div className="hidden max-w-[420px] flex-1 items-center justify-end gap-1.5 sm:flex">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                onClick={() => setActiveSlide(index)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === activeSlide
                    ? "w-7 bg-[#159447]"
                    : "w-1.5 bg-black/20 hover:bg-black/40"
                }`}
              />
            ))}
          </div>

          {/* FOOTER */}

          <div className="text-right">
            <div className="text-[9px] font-bold tracking-[-0.02em] text-black/40">
  PNTVERSE
</div>

            <div className="mt-1 text-[9px] font-semibold text-black/40">
                © 2026
            </div>
          </div>
        </div>

        {/* PROGRESS */}

        <div className="h-[2px] w-full bg-black/[0.06]">
          <div
            key={activeSlide}
            className="h-full origin-left bg-[#159447]"
            style={{
              animation: `maintenanceProgress ${SLIDE_DURATION}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* =========================================================
          BACKGROUND MUSIC
      ========================================================== */}

      <audio
        ref={audioRef}
        src="/PahdiTheme.mp3"
        loop
        preload="auto"
        playsInline
      />

      {/* =========================================================
          ANIMATION
      ========================================================== */}

      <style jsx>{`
        @keyframes maintenanceProgress {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
