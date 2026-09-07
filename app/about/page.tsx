"use client";

import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      {/* Header */}
      <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[11px] font-black tracking-[-0.04em] text-white">
              AS
            </div>

            <div className="leading-none">
              <div className="text-[13px] font-black tracking-[-0.03em]">
                APNA <span className="text-[#159447]">SHYAMPUR</span>
              </div>

              <div className="mt-1 text-[7px] font-bold tracking-[0.18em] text-black/35">
                LOCALS • TRUSTED • FAST
              </div>
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto w-full max-w-[900px] px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        {/* Intro */}
        <section>
          <p className="text-[10px] font-black tracking-[0.2em] text-[#159447]">
            APNA SHYAMPUR
          </p>

          <h1 className="mt-3 text-[38px] font-black leading-[1.05] tracking-[-0.045em] sm:text-[52px]">
            Built for our
            <br />
            <span className="text-[#159447]">local community.</span>
          </h1>

          <p className="mt-5 max-w-[680px] text-[13px] leading-[1.8] text-black/55 sm:text-[14px]">
            Apna Shyampur is a local marketplace built with one simple belief:
            when local businesses grow, the whole area grows with them.
          </p>

          <p className="mt-4 text-[10px] font-semibold text-black/35">
            My Story • September 2026
          </p>
        </section>

        {/* Content */}
        <div className="mt-9 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.04)]">
          {/* Our Story */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              My Story
            </h2>

            <div className="mt-3 space-y-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              <p>
                My name is{" "}
                <strong className="font-bold text-black/75">
                  Gautam Pant
                </strong>
                ,and I am a resident of Shyampur. I come from a middle-class
                family, and I have always wanted to do something meaningful for
                the people and businesses around me.
              </p>

              <p>
                Living here, I noticed something close to home. Many of our
                local shops work hard every day, but still struggle to get
                enough customers and grow their business. Some eventually have
                no choice but to shut their shops down.
              </p>

              <p>
                I felt that our local businesses deserved a better opportunity
                to reach the people living around them.
              </p>
            </div>
          </section>

          {/* Why I Built It */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              Why I Built Apna Shyampur
            </h2>

            <div className="mt-3 space-y-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              <p>
                Today, many people use large delivery platforms to order
                everyday products. These platforms are convenient, but the
                products can sometimes cost more, and the people delivering
                those orders are often not from the local community.
              </p>

              <p>
                I wanted to create something different — something where people
                could discover and order from the shops they already know and
                trust, while keeping local businesses at the center of the
                experience.
              </p>

              <p>
                That idea became{" "}
                <strong className="font-bold text-black/75">
                  Apna Shyampur
                </strong>
                .
              </p>
            </div>
          </section>

          {/* What We Do */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              What Apna Shyampur Does
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur brings local shops and local customers together
              through one platform. From groceries and vegetables to meat,
              medicines, food, bakery, dairy, electronics and other local
              businesses, the goal is to make it easier for people to find and
              order from shops around them.
            </p>

            <p className="mt-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              The platform is designed to help local shopkeepers get more
              visibility and give customers a convenient way to continue
              supporting the businesses they know.
            </p>
          </section>

          {/* How It Works */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              How It Works
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[18px] border border-black/[0.06] bg-[#f8f9f7] p-5">
                <div className="text-[11px] font-black text-[#159447]">
                  01
                </div>

                <h3 className="mt-3 text-[13px] font-black">
                  Find a local shop
                </h3>

                <p className="mt-2 text-[11px] leading-[1.7] text-black/50">
                  Discover shops and products available around your area.
                </p>
              </div>

              <div className="rounded-[18px] border border-black/[0.06] bg-[#f8f9f7] p-5">
                <div className="text-[11px] font-black text-[#159447]">
                  02
                </div>

                <h3 className="mt-3 text-[13px] font-black">
                  Order from them
                </h3>

                <p className="mt-2 text-[11px] leading-[1.7] text-black/50">
                  Choose what you need from a shop you know and trust.
                </p>
              </div>

              <div className="rounded-[18px] border border-black/[0.06] bg-[#f8f9f7] p-5">
                <div className="text-[11px] font-black text-[#159447]">
                  03
                </div>

                <h3 className="mt-3 text-[13px] font-black">
                  We deliver locally
                </h3>

                <p className="mt-2 text-[11px] leading-[1.7] text-black/50">
                  Our delivery partner collects the order from the shop and
                  brings it to you.
                </p>
              </div>
            </div>
          </section>

          {/* What We Believe */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              What We Believe
            </h2>

            <div className="mt-3 space-y-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              <p>
                We believe that convenience should not mean leaving local
                businesses behind.
              </p>

              <p>
                A nearby shop should have the opportunity to reach nearby
                customers. A customer should be able to buy from a shop they
                already trust. And the money spent in a local area should have
                a better chance of staying within that local economy.
              </p>
            </div>
          </section>

          {/* Our Vision */}
          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              Our Vision
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              My vision is simple: I want Apna Shyampur to reach as many local
              shops in the area as possible, so that we can grow together with
              the people who have been serving our community for years.
            </p>

            <div className="mt-6 rounded-[20px] bg-[#f5f6f4] px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-[19px] font-black leading-[1.25] tracking-[-0.03em] sm:text-[24px]">
                “Local businesses will grow,
                <br />
                <span className="text-[#159447]">
                  and the area will grow with them.”
                </span>
              </p>
            </div>
          </section>

          {/* Founder Note */}
          <section className="px-5 py-7 sm:px-8 sm:py-9">
            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              A Note From the Founder
            </h2>

            <div className="mt-3 space-y-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              <p>
                I don't know whether I will succeed or not.
              </p>

              <p>
                But I know I will be happy knowing that I gave it my everything
                and truly tried.
              </p>

              <p className="font-semibold text-black/70">
                Because sometimes, success is not about how far you go — it is
                about having the courage to take the first step, the strength
                to keep walking, and the wisdom to learn from every fall.
              </p>

              <p>
                I believe that when you succeed and grow, it is never just you
                who grows. The people you love, the people who believe in you,
                and the people around you grow with you.
              </p>

              <p>
                And if you fail, that failure does not have to be the end. It
                becomes a lesson. A lesson that teaches you, changes you, and
                helps you take the next step with a little more wisdom.
              </p>

              <p>
                I don't know where this journey will take Apna Shyampur.
              </p>

              <p>
                Maybe it will become what I imagine it becoming. Maybe it
                won't.
              </p>

              <p>
                But I know one thing —{" "}
                <strong className="font-bold text-black/75">
                  I want to give it my best.
                </strong>
              </p>

              <p>
                And if one day Apna Shyampur helps local businesses grow,
                creates opportunities for people from our own community, and
                makes a small difference in the place I call home, then I will
                know that this journey was worth taking.
              </p>

             <div className="mt-6 rounded-[20px] bg-[#f5f6f4] px-5 py-6 sm:px-7 sm:py-7">
  <p className="text-[19px] font-black leading-[1.25] tracking-[-0.03em] sm:text-[23px]">
    “We live for ourselves,
    <br className="hidden sm:block" />
    <span className="text-[#159447]">
      so why not live for our own people too.”
    </span>
  </p>

  <p className="mt-3 text-[10px] font-bold tracking-[0.05em] text-black/45 sm:text-[11px]">
    Order from your padosi ki dukaan...❤️
  </p>
</div>

              <p className="pt-3 font-bold text-black/75">
                — Gautam Pant
                <br />
                <span className="text-[11px] font-semibold text-black/40">
                  Founder, Apna Shyampur
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Note */}
        <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-white/70 px-5 py-5 text-center">
          <p className="text-[10px] leading-[1.7] text-black/40 sm:text-[11px]">
            Apna Shyampur is built locally, for the people and businesses of
            our local community.
          </p>
        </div>
      </div>

    {/* FOOTER */}

<footer className="border-t border-black/[0.07] bg-white">

  <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">

    <div>

      <div className="flex items-baseline gap-[5px] text-[16px] font-black tracking-[-0.05em]">
        <span>APNA</span>

        <span className="text-[#159447]">
          SHYAMPUR
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-[7px] font-bold tracking-[0.14em] text-black/45">
        <span>LOCALS</span>
        <span className="text-[#159447]">•</span>
        <span>TRUSTED</span>
        <span className="text-[#159447]">•</span>
        <span>FAST</span>
      </div>

    </div>

    <div className="text-[11px] font-semibold">

      <span className="text-black/50">
        © 2026
      </span>{" "}

      <span className="text-black/75">
        PNT
      </span>

      <span className="text-[#159447]">
        VERSE
      </span>

    </div>

  </div>

</footer>
    </main>
  );
}
