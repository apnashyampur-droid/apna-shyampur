"use client";

import { useRouter } from "next/navigation";

export default function TermsAndConditionsScreen() {
  const router = useRouter();

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

          <div className="text-[9px] font-bold tracking-[0.16em] text-[#159447]">
            APNA SHYAMPUR
          </div>

          <h1 className="mt-3 text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[46px]">
            Terms & Conditions
          </h1>

          <p className="mt-4 max-w-[620px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
            Please read these terms carefully before using Apna Shyampur.
          </p>

          <p className="mt-2 text-[10px] font-semibold text-black/35">
            Last updated: September 2026
          </p>

        </div>


        {/* CONTENT */}

        <div className="mt-9 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.04)]">


          {/* 1. ABOUT APNA SHYAMPUR */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              1. About Apna Shyampur
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur is a local marketplace platform that helps users
              discover local shops, products, offers and services available
              through participating businesses.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur provides the platform and technology that connects
              customers with local businesses. Individual shops are responsible
              for the products, prices, availability and information they
              provide on the platform.
            </p>

          </section>


          {/* 2. USING APNA SHYAMPUR */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              2. Using Apna Shyampur
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              By accessing or using Apna Shyampur, you agree to follow these
              Terms & Conditions and all applicable laws and regulations.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You agree to use the platform honestly and responsibly and not
              misuse, disrupt, damage or attempt to gain unauthorized access to
              any part of the service.
            </p>

          </section>


          {/* 3. ACCOUNTS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              3. Accounts
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Some features of Apna Shyampur may require you to sign in to an
              account. You are responsible for providing accurate information
              and for keeping access to your account secure.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You must not use another person's account or provide false
              information to impersonate another person or business.
            </p>

          </section>


          {/* 4. SHOPS & PRODUCTS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              4. Shops & Product Information
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Shops listed on Apna Shyampur are independently responsible for
              the information they provide, including product names,
              descriptions, prices, availability, offers and other shop
              details.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Product availability, prices and offers may change without prior
              notice. Apna Shyampur does not guarantee that every product or
              offer shown on the platform will always be available.
            </p>

          </section>


          {/* 5. ORDERS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              5. Orders & Purchases
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              When you place an order through Apna Shyampur, the order is
              subject to the availability and acceptance of the selected shop.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Shops may accept, modify or decline orders depending on product
              availability, operating conditions or other legitimate reasons.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Any applicable delivery charges, minimum order requirements,
              payment conditions or shop-specific policies may be displayed
              during the ordering process.
            </p>

          </section>


          {/* 6. PAYMENTS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              6. Payments
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Where online payment is available, payments may be processed
              through third-party payment providers. Their respective terms
              and policies may also apply to payment transactions.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur does not store your complete payment card or banking
              credentials unless specifically stated in the applicable payment
              flow.
            </p>

          </section>


          {/* 7. SHOPKEEPERS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              7. Shopkeepers
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Shopkeepers using Apna Shyampur are responsible for providing
              accurate business and product information and for complying with
              applicable laws and regulations.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Shopkeepers must not upload misleading, unlawful, fraudulent or
              unauthorized content or use the platform for activities that
              violate applicable law.
            </p>

          </section>


          {/* 8. OFFERS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              8. Offers, Discounts & Combos
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Offers, discounts and product combos are created by participating
              shops. The shop providing the offer is responsible for its terms,
              pricing, validity and availability.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              An offer may expire, become unavailable or be withdrawn by the
              shop at any time, subject to any applicable commitments or laws.
            </p>

          </section>


          {/* 9. REVIEWS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              9. User Reviews & Content
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you submit reviews, ratings, images or other content, you
              agree that the content should be truthful, relevant and lawful.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You must not submit content that is abusive, threatening,
              defamatory, fraudulent, discriminatory, misleading or otherwise
              unlawful.
            </p>

          </section>


          {/* 10. PROHIBITED USE */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              10. Prohibited Use
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You must not use Apna Shyampur to commit fraud, misrepresent your
              identity, interfere with the service, attempt unauthorized
              access, distribute malicious software or engage in any activity
              that may harm other users or the platform.
            </p>

          </section>


          {/* 11. SERVICE AVAILABILITY */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              11. Availability of the Service
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We aim to keep Apna Shyampur available and reliable, but the
              service may occasionally be unavailable due to maintenance,
              technical issues, network problems or circumstances beyond our
              reasonable control.
            </p>

          </section>


          {/* 12. LIMITATION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              12. Limitation of Responsibility
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur acts as a marketplace platform connecting users
              with local shops. To the extent permitted by applicable law, we
              are not responsible for the independent actions, products,
              services, representations or conduct of individual shops.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Nothing in these Terms is intended to exclude or limit any
              responsibility that cannot legally be excluded or limited.
            </p>

          </section>


          {/* 13. ACCOUNT SUSPENSION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              13. Account Suspension or Termination
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We may restrict, suspend or terminate access to an account or
              parts of the platform where reasonably necessary, including in
              cases of misuse, fraud, violation of these Terms or applicable
              law.
            </p>

          </section>


          {/* 14. CHANGES */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              14. Changes to These Terms
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We may update these Terms & Conditions from time to time to
              reflect changes to Apna Shyampur, our services or applicable
              requirements.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Updated terms will be published on this page with a revised
              "Last updated" date. Your continued use of the platform after an
              update means you accept the revised terms, to the extent
              permitted by applicable law.
            </p>

          </section>


          {/* 15. CONTACT */}

          <section className="px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              15. Contact
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you have any questions about these Terms & Conditions or
              Apna Shyampur, you can contact us through our official Instagram
              account.
            </p>

            <a
              href="https://instagram.com/apnashyampur.c0m"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[12px] font-bold text-[#159447] transition hover:underline"
            >
              @apnashyampur.c0m
            </a>

          </section>

        </div>


        {/* BOTTOM NOTE */}

        <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-white/70 px-5 py-5 sm:px-6">

          <p className="text-[10px] leading-[1.7] text-black/40 sm:text-[11px]">
            By using Apna Shyampur, you acknowledge that you have read and
            understood these Terms & Conditions and agree to be bound by them,
            subject to applicable law.
          </p>

        </div>

      </section>


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