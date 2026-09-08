"use client";

import { useRouter } from "next/navigation";

export default function PrivacyPolicyScreen() {
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
            Privacy Policy
          </h1>

          <p className="mt-4 max-w-[620px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
            This Privacy Policy explains how Apna Shyampur collects, uses and
            protects information when you use our platform and services.
          </p>

          <p className="mt-2 text-[10px] font-semibold text-black/35">
            Last updated: September 2026
          </p>

        </div>


        {/* CONTENT */}

        <div className="mt-9 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.04)]">


          {/* 1. ABOUT */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              1. About Apna Shyampur
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur is a local marketplace platform designed to
              connect customers with participating local shops and businesses
              in and around the Shyampur area.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              The platform helps customers discover local products, shops,
              offers and services and enables orders to be coordinated with
              the relevant local business.
            </p>

          </section>


          {/* 2. INFORMATION WE COLLECT */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              2. Information We Collect
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We collect information that is reasonably necessary to create
              your account, provide our services and process your orders.
            </p>


            <h3 className="mt-5 text-[13px] font-black">
              Google Sign-In
            </h3>

            <p className="mt-2 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur uses Google Sign-In to allow users to securely
              sign in to their account. Information made available through
              Google authentication may include basic account information
              such as your name, email address and profile information.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Google Sign-In is used for authentication. Apna Shyampur does
              not require access to your Gmail messages, contacts, Google
              Drive files or other unrelated Google account information just
              to provide sign-in.
            </p>


            <h3 className="mt-5 text-[13px] font-black">
              Apna Shyampur Profile
            </h3>

            <p className="mt-2 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              To place an order, you may need to complete your Apna Shyampur
              profile. This may include:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-[12px] leading-[1.7] text-black/55 sm:text-[13px]">
              <li>Name</li>
              <li>Phone number</li>
              <li>Delivery address or location</li>
              <li>Other information required to provide the service</li>
            </ul>

          </section>


          {/* 3. WHY WE NEED PROFILE */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              3. Why We Need Your Profile Information
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Your name, phone number and delivery location are collected
              because they are necessary for providing the ordering and
              delivery service.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Your location helps us determine the appropriate delivery area
              and connect your order with local shops that can serve your
              location.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Your phone number may be used to contact you when necessary
              regarding your order, delivery or other service-related
              communication.
            </p>

          </section>


          {/* 4. ORDERS & DELIVERY */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              4. Orders & Delivery
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur connects customers with participating local
              shops. When you place an order, the order is associated with
              the shop from which you requested the products.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              For delivery, our delivery personnel may collect the ordered
              items from the relevant shop and deliver them to the location
              provided by the customer.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Information necessary to fulfill an order may therefore be
              shared with the relevant shop and delivery personnel involved
              in that order.
            </p>

          </section>


          {/* 5. PRODUCT CATEGORIES */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              5. Shops & Product Categories
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Depending on participating businesses and platform
              availability, Apna Shyampur may support local categories such
              as:
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              {[
                "Grocery",
                "Vegetables",
                "Meat",
                "Medicine",
                "Food",
                "Bakery",
                "Dairy",
                "Electronics",
                "Other Local Shops",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-black/[0.04] px-3 py-1.5 text-[10px] font-bold text-black/60"
                >
                  {item}
                </span>
              ))}

            </div>

            <p className="mt-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              The categories and participating shops available on the
              platform may change over time.
            </p>

          </section>


          {/* 6. ORDER INFORMATION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              6. Order Information
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              When you place an order, we may collect and store information
              necessary to process and manage that order, including:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-[12px] leading-[1.7] text-black/55 sm:text-[13px]">
              <li>The shop from which you ordered</li>
              <li>Products or items ordered</li>
              <li>Order amount and related order details</li>
              <li>Delivery information</li>
              <li>Order status and history</li>
              <li>Information required for order communication</li>
            </ul>

            <p className="mt-4 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              This information helps us provide order history, coordinate
              deliveries, resolve order-related issues and operate the
              platform.
            </p>

          </section>


          {/* 7. LOCATION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              7. Location Information
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you provide or allow access to your location, Apna Shyampur
              may use that information to support delivery and location-based
              marketplace features.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Location information helps us determine the relevant delivery
              area and connect your order with suitable local shops.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You can control location permissions through your browser or
              device settings where applicable.
            </p>

          </section>


          {/* 8. HOW WE USE INFORMATION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              8. How We Use Your Information
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We may use the information we collect for purposes such as:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-[12px] leading-[1.7] text-black/55 sm:text-[13px]">
              <li>Creating and managing your account</li>
              <li>Authenticating your account through Google Sign-In</li>
              <li>Maintaining your Apna Shyampur profile</li>
              <li>Processing and managing orders</li>
              <li>Connecting orders with the relevant local shop</li>
              <li>Arranging and coordinating deliveries</li>
              <li>Contacting you about orders and deliveries</li>
              <li>Providing order history</li>
              <li>Managing reviews and favorites</li>
              <li>Improving the platform and user experience</li>
              <li>Preventing misuse, fraud and unauthorized activity</li>
              <li>Maintaining platform security and reliability</li>
            </ul>

          </section>


          {/* 9. SHARING */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              9. Information Shared With Shops & Delivery Personnel
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              To fulfill an order, Apna Shyampur may share information that
              is reasonably necessary with the shop associated with that
              order.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Information necessary for delivery, such as your name, phone
              number and delivery address or location, may also be available
              to the delivery personnel responsible for your order.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We aim to limit shared information to what is reasonably
              necessary for the relevant order or service.
            </p>

          </section>


          {/* 10. GOOGLE */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              10. Google Sign-In & Account Security
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Google Sign-In is used to authenticate your Apna Shyampur
              account. Your Google password is handled by Google and is not
              provided to Apna Shyampur.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur does not use Google Sign-In as permission to
              access unrelated Google services or information.
            </p>

          </section>


          {/* 11. REVIEWS & FAVORITES */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              11. Reviews, Favorites & User Content
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you use features such as reviews, ratings, favorites or
              other user-generated features, the information you provide may
              be stored and associated with your account.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Content that you intentionally submit for public display may be
              visible to other users of the platform.
            </p>

          </section>


          {/* 12. SECURITY */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              12. Data Security
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We take reasonable measures to protect information associated
              with your Apna Shyampur account against unauthorized access,
              misuse, alteration or disclosure.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              However, no internet-based service can guarantee absolute
              security. You should also protect access to your Google account,
              device and other credentials used to access the platform.
            </p>

          </section>


          {/* 13. RETENTION */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              13. Data Retention
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We may retain information for as long as reasonably necessary
              to provide our services, maintain account and order records,
              resolve disputes, prevent misuse and comply with applicable
              legal requirements.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              When information is no longer reasonably required, it may be
              deleted, anonymized or otherwise handled in accordance with
              applicable requirements.
            </p>

          </section>


          {/* 14. USER RIGHTS */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              14. Your Choices & Rights
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              You may review or update certain profile information through
              your Apna Shyampur account where those controls are available.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Where applicable, you may also request correction or deletion
              of your personal information, subject to legal, security and
              operational requirements.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Browser and device permissions, including location permissions,
              can generally be managed through your browser or device
              settings.
            </p>

          </section>


          {/* 15. CHILDREN */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              15. Children's Privacy
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur is intended for users who are legally able to use
              the service. We do not knowingly collect personal information
              from children in violation of applicable law.
            </p>

          </section>

          {/* 16. FRAUD, MISUSE & ORDER SUPPORT */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              16. Fraud, Misuse & Order Support
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Apna Shyampur takes fraudulent activity and misuse of the
              platform seriously. Any attempt to make a fraudulent payment,
              submit false or manipulated payment proof, obtain products or
              services through deception, or otherwise misuse the platform may
              result in appropriate action.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Where fraudulent or unlawful activity is identified, Apna
              Shyampur reserves the right to suspend or restrict the relevant
              account, cancel affected orders, retain relevant records and
              take further action as permitted under applicable law, including
              reporting the matter to the appropriate authorities where
              necessary.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you experience a delivery issue, such as an order being
              delayed, incomplete, damaged or not delivered, please contact
              Apna Shyampur through our official support channel. We will
              review the issue and work with the relevant shop or delivery
              personnel to help resolve the matter as reasonably possible.
            </p>

          </section>


          {/* 17. CHANGES */}

          <section className="border-b border-black/[0.06] px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              17. Changes to This Privacy Policy
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              We may update this Privacy Policy from time to time as Apna
              Shyampur introduces new features, changes its services or as
              applicable requirements change.
            </p>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              Updated versions will be published on this page with a revised
              "Last updated" date.
            </p>

          </section>


          {/* 17. CONTACT */}

          <section className="px-5 py-7 sm:px-8 sm:py-9">

            <h2 className="text-[16px] font-black tracking-[-0.02em]">
              17. Contact
            </h2>

            <p className="mt-3 text-[12px] leading-[1.75] text-black/55 sm:text-[13px]">
              If you have questions, concerns or requests regarding this
              Privacy Policy or how Apna Shyampur handles information, you can
              contact us through our official Instagram account.
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
            understood this Privacy Policy and understand how information may
            be collected, used and shared to provide the platform and its
            services, subject to applicable law.
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