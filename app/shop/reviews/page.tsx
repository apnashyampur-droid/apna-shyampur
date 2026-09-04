"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
};

type ReviewerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ReviewWithUser = Review & {
  user: ReviewerProfile | null;
};

type ShopData = {
  id: string;
  name: string;
};

export default function ShopReviewsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [shop, setShop] = useState<ShopData | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          router.replace("/");
          return;
        }

     const { data: shopData, error: shopError } = await supabase
  .from("shops")
  .select("id, name")
  .eq("user_id", user.id)
  .eq("is_active", true)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!mounted) return;

if (shopError) {
  console.error("Shop lookup error:", shopError);

  setErrorMessage(
    shopError.message ||
      "We couldn't load your shop right now."
  );

  return;
}

if (!shopData) {
  setErrorMessage(
    "Your shop could not be found."
  );

  return;
}

const currentShop: ShopData = {
  id: shopData.id,
  name: shopData.name || "Your Shop",
};

setShop(currentShop);
    
        const { data: reviewData, error: reviewError } = await supabase
          .from("shop_reviews")
          .select(
            `
              id,
shop_id,
user_id,
rating,
review,
created_at
            `
          )
          .eq("shop_id", currentShop.id)
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (reviewError) {
          console.error("Reviews fetch error:", reviewError);
          setErrorMessage(
            reviewError.message ||
              "We couldn't load your shop reviews."
          );
          return;
        }

        const rawReviews = (reviewData || []) as Review[];

        /*
         * Fetch reviewer profiles in one request instead of making
         * one database request per review.
         */
        const userIds = Array.from(
          new Set(
            rawReviews
              .map((review) => review.user_id)
              .filter(Boolean)
          )
        );

        let profiles: ReviewerProfile[] = [];

        if (userIds.length > 0) {
          const { data: profileData, error: profileError } =
            await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", userIds);

          if (profileError) {
            console.warn(
              "Reviewer profiles could not be loaded:",
              profileError
            );
          } else {
            profiles = (profileData || []) as ReviewerProfile[];
          }
        }

        const profileMap = new Map(
          profiles.map((profile) => [profile.id, profile])
        );

        const finalReviews: ReviewWithUser[] = rawReviews.map(
          (review) => ({
            ...review,
            user: profileMap.get(review.user_id) || null,
          })
        );

        if (!mounted) return;

        setReviews(finalReviews);
      } catch (error) {
        console.error("Shop reviews error:", error);

        if (!mounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't load your reviews right now."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        totalReviews
      : 0;

  const starCounts = {
    5: reviews.filter((review) => review.rating === 5).length,
    4: reviews.filter((review) => review.rating === 4).length,
    3: reviews.filter((review) => review.rating === 3).length,
    2: reviews.filter((review) => review.rating === 2).length,
    1: reviews.filter((review) => review.rating === 1).length,
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} backTo="/shop" />

        <section className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <ReviewsSkeleton />
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} backTo="/shop" />

        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[700px] items-center justify-center px-5 py-10">
          <div className="w-full rounded-[28px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.05)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff4e5] text-[#c87900]">
              <WarningIcon />
            </div>

            <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]">
              Something went wrong
            </h1>

            <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-5 text-black/45">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-7 rounded-[14px] bg-[#111] px-6 py-3 text-[11px] font-black text-white transition hover:bg-black/80"
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      <ShopHeader router={router} backTo="/shop" />

      <section className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        {/* PAGE TITLE */}

        <div className="mb-7">
          <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]">
            CUSTOMER FEEDBACK
          </div>

          <h1 className="mt-2 text-[32px] font-black leading-none tracking-[-0.05em] sm:text-[40px]">
            Shop Reviews
          </h1>

          <p className="mt-3 text-[12px] text-black/45 sm:text-[13px]">
            See what customers are saying about {shop?.name || "your shop"}.
          </p>
        </div>

        {/* RATING OVERVIEW */}

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          {/* OVERALL RATING */}

          <div className="rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-[0_14px_45px_rgba(0,0,0,.03)] sm:p-7">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
              Overall Rating
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div>
                <div className="text-[48px] font-black leading-none tracking-[-0.06em]">
                  {averageRating.toFixed(1)}
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <StarRating
                    rating={averageRating}
                    size={18}
                  />
                </div>
              </div>

              <div className="h-14 w-px bg-black/[0.07]" />

              <div>
                <div className="text-[20px] font-black">
                  {totalReviews}
                </div>

                <div className="mt-1 text-[9px] font-bold text-black/40">
                  {totalReviews === 1 ? "customer review" : "customer reviews"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[15px] bg-[#f7f8f7] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#eef5ef] text-[#159447]">
                  <StarIcon size={14} />
                </div>

                <div>
                  <div className="text-[9px] font-black">
                    Customer satisfaction
                  </div>

                  <div className="mt-0.5 text-[8px] text-black/40">
                    Your rating is based on customer feedback.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAR BREAKDOWN */}

          <div className="rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-[0_14px_45px_rgba(0,0,0,.03)] sm:p-7">
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-black/35">
              Rating Breakdown
            </div>

            <div className="mt-5 space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  starCounts[star as keyof typeof starCounts];

                const percentage =
                  totalReviews > 0
                    ? (count / totalReviews) * 100
                    : 0;

                return (
                  <div
                    key={star}
                    className="flex items-center gap-3"
                  >
                    <div className="flex w-[42px] shrink-0 items-center gap-1.5">
                      <span className="text-[10px] font-black">
                        {star}
                      </span>

                      <StarIcon size={11} />
                    </div>

                    <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full bg-[#159447] transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <div className="w-7 text-right text-[9px] font-bold text-black/35">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* REVIEWS */}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-[19px] font-black tracking-[-0.035em]">
                Customer Reviews
              </h2>

              <p className="mt-1 text-[10px] text-black/40">
                Recent feedback from customers who reviewed your shop.
              </p>
            </div>

            {totalReviews > 0 && (
              <div className="shrink-0 rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-[8px] font-black text-black/45">
                {totalReviews} {totalReviews === 1 ? "REVIEW" : "REVIEWS"}
              </div>
            )}
          </div>

         {reviews.length === 0 ? (
  <EmptyReviews />
) : (
  <div className="mt-5 overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_12px_40px_rgba(0,0,0,.025)]">
   <div className="max-h-none overflow-visible p-4 sm:p-5 lg:max-h-[520px] lg:overflow-y-auto lg:overscroll-contain">
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
          />
        ))}
      </div>
    </div>
  </div>
)}
        </section>

        {/* FOOTER */}

        {/* FOOTER */}

<div className="pb-8 pt-8 text-center">
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
      </section>
    </main>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({
  review,
}: {
  review: ReviewWithUser;
}) {
  const reviewerName =
    review.user?.full_name?.trim() || "Customer";

  const initial = reviewerName
    .charAt(0)
    .toUpperCase();

  const date = formatReviewDate(review.created_at);

  return (
    <article className="rounded-[21px] border border-black/[0.07] bg-white p-5 shadow-[0_10px_32px_rgba(0,0,0,.025)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* AVATAR */}

          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#eef5ef]">
            {review.user?.avatar_url ? (
              <img
                src={review.user.avatar_url}
                alt={reviewerName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[12px] font-black text-[#159447]">
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[11px] font-black">
              {reviewerName}
            </div>

            <div className="mt-1 text-[8.5px] text-black/35">
              {date}
            </div>
          </div>
        </div>

        {/* RATING */}

        <div className="shrink-0 rounded-full bg-[#fff8e8] px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            <StarIcon
              size={11}
              filled
            />

            <span className="text-[9px] font-black text-[#b97900]">
              {review.rating}.0
            </span>
          </div>
        </div>
      </div>

     {review.review?.trim() ? (
  <p className="mt-5 text-[11px] leading-6 text-black/60">
    {review.review}
  </p>
) : (
        <p className="mt-5 text-[10px] italic text-black/30">
          Customer left a rating without a written review.
        </p>
      )}
    </article>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyReviews() {
  return (
    <div className="mt-5 rounded-[24px] border border-black/[0.07] bg-white px-6 py-14 text-center shadow-[0_12px_40px_rgba(0,0,0,.025)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#eef5ef] text-[#159447]">
        <StarIcon size={24} />
      </div>

      <h3 className="mt-5 text-[17px] font-black tracking-[-0.03em]">
        No reviews yet
      </h3>

      <p className="mx-auto mt-2 max-w-[390px] text-[10px] leading-5 text-black/40">
        Your customer reviews will appear here once customers start
        rating and reviewing your shop.
      </p>
    </div>
  );
}

/* =========================================================
   LOADING SKELETON
========================================================= */

function ReviewsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-32 rounded-full bg-black/[0.07]" />

      <div className="mt-3 h-10 w-56 rounded-xl bg-black/[0.07]" />

      <div className="mt-3 h-4 w-80 rounded-full bg-black/[0.05]" />

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="h-[245px] rounded-[24px] bg-white" />
        <div className="h-[245px] rounded-[24px] bg-white" />
      </div>

      <div className="mt-8">
        <div className="h-5 w-40 rounded-lg bg-black/[0.07]" />
        <div className="mt-2 h-3 w-72 rounded-full bg-black/[0.05]" />
      </div>

      <div className="mt-5 space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[145px] rounded-[21px] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   HEADER — SAME AS SHOP DASHBOARD
========================================================= */

function ShopHeader({
  router,
  backTo = "/",
}: {
  router: ReturnType<typeof useRouter>;
  backTo?: string;
}) {
  return (
    <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
            AS
          </div>

          <div className="leading-none">
            <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
              <span>APNA</span>
              <span className="text-[#159447]">SHYAMPUR</span>
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

        <button
          type="button"
          onClick={() => router.push(backTo)}
          className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
        >
          Back
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   STAR RATING
========================================================= */

function StarRating({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          size={size}
          filled={rating >= star}
        />
      ))}
    </div>
  );
}

/* =========================================================
   STAR ICON
========================================================= */

function StarIcon({
  size = 18,
  filled = false,
}: {
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

/* =========================================================
   WARNING ICON
========================================================= */

function WarningIcon() {
  return (
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
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatReviewDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}