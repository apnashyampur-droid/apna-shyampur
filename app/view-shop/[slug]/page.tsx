"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  is_active: boolean;
};

type Review = {
  id: string;
  shop_id: string;
  user_id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ShopOffer = {
  id: string;
  type: "discount" | "combo" | "offer";
  title: string;
  description: string | null;
  discount_percent: number | null;
  offer_price: number | null;
  original_price: number | null;
  product_ids: string[] | null;
  offer_kind: "flat" | "buy_get" | "free_item" | null;
  offer_value: number | null;
  minimum_order_value: number | null;
  buy_quantity: number | null;
  get_quantity: number | null;
  valid_from: string;
  valid_until: string;
  is_enabled: boolean;
};

function distanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function formatPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  return phone;
}

function isShopOpen(
  openingTime: string | null,
  closingTime: string | null
) {
  if (!openingTime || !closingTime) {
    return false;
  }

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 + now.getMinutes();

  const [openHour, openMinute] = openingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [closeHour, closeMinute] = closingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const openingMinutes =
    openHour * 60 + openMinute;

  const closingMinutes =
    closeHour * 60 + closeMinute;

  if (openingMinutes < closingMinutes) {
    return (
      currentMinutes >= openingMinutes &&
      currentMinutes < closingMinutes
    );
  }

  if (openingMinutes > closingMinutes) {
    return (
      currentMinutes >= openingMinutes ||
      currentMinutes < closingMinutes
    );
  }

  return false;
}

function formatReviewDate(date: string) {
  const reviewDate = new Date(date);

  return reviewDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRating({
  rating,
  size = 18,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= rating;

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className="leading-none transition active:scale-90"
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={active ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={
                  active
                    ? "text-[#f5a623]"
                    : "text-black/20"
                }
              >
                <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
              </svg>
            </button>
          );
        }

        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              active
                ? "text-[#f5a623]"
                : "text-black/15"
            }
          >
            <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
          </svg>
        );
      })}
    </div>
  );
}

export default function ViewShopPage() {
  const router = useRouter();
  const params = useParams();

  const slug = Array.isArray(params.slug)
    ? params.slug[0]
    : params.slug;

  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  /* AUTH */

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentUserProfile, setCurrentUserProfile] = useState<{
  full_name: string | null;
  avatar_url: string | null;
} | null>(null);

  /* REVIEWS */

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [isSubmittingReview, setIsSubmittingReview] =
    useState(false);

  const [editingReviewId, setEditingReviewId] =
    useState<string | null>(null);

  const [deletingReviewId, setDeletingReviewId] =
    useState<string | null>(null);

  const [reviewMessage, setReviewMessage] =
    useState("");

      /* OFFERS */

  const [shopOffers, setShopOffers] =
    useState<ShopOffer[]>([]);

  const [offersLoading, setOffersLoading] =
    useState(false);

  /* USER LOCATION */

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.log("LOCATION ERROR:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  /* AUTH STATE */

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
  setAuthLoading(true);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  setUserId(user?.id ?? null);

  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setCurrentUserProfile(
      profile
        ? {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }
        : null
    );
  } else {
    setCurrentUserProfile(null);
  }

  setAuthLoading(false);
};

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* FETCH SHOP */

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setErrorMessage(
        "This shop could not be found."
      );
      return;
    }

    const fetchShop = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("shops")
          .select(
            `
              id,
              name,
              slug,
              description,
              category,
              owner_name,
              phone,
              address,
              image_url,
              opening_time,
              closing_time,
              latitude,
              longitude,
              rating,
              is_active
            `
          )
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("SHOP FETCH ERROR:", error);

          setErrorMessage(
            "We couldn't load this shop right now. Please try again."
          );

          return;
        }

        if (!data) {
          setErrorMessage(
            "This shop doesn't exist or is no longer available."
          );

          return;
        }

        setShop(data as Shop);
      } catch (error) {
        console.error("UNEXPECTED SHOP ERROR:", error);

        setErrorMessage(
          "Something went wrong while loading this shop."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [slug]);

  /* FETCH REVIEWS */

  /* FETCH REVIEWS */

useEffect(() => {
  if (!shop?.id) {
    return;
  }

  const fetchReviews = async () => {
    setReviewsLoading(true);
    setReviewsError("");

    try {
      const supabase = createClient();

      const {
        data: reviewData,
        error: reviewError,
      } = await supabase
        .from("shop_reviews")
        .select(
          `
            id,
            shop_id,
            user_id,
            rating,
            review,
            created_at,
            updated_at
          `
        )
        .eq("shop_id", shop.id)
        .order("created_at", {
          ascending: false,
        });

      if (reviewError) {
        console.error(
          "REVIEWS FETCH ERROR:",
          reviewError
        );

        setReviewsError(
          "Reviews couldn't be loaded right now."
        );

        return;
      }

      const rawReviews = reviewData ?? [];

      if (rawReviews.length === 0) {
        setReviews([]);
        return;
      }

      /* FETCH REVIEW AUTHORS */

      const userIds = [
        ...new Set(
          rawReviews.map(
            (review) => review.user_id
          )
        ),
      ];

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            avatar_url
          `
        )
        .in("id", userIds);

      if (profileError) {
        console.error(
          "REVIEW PROFILES FETCH ERROR:",
          profileError
        );
      }

      const profilesMap = new Map<
        string,
        {
          full_name: string | null;
          avatar_url: string | null;
        }
      >();

      (profileData ?? []).forEach((profile) => {
        profilesMap.set(profile.id, {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        });
      });

      const reviewsWithProfiles: Review[] =
        rawReviews.map((review) => ({
          ...review,
          profile:
            profilesMap.get(review.user_id) ?? null,
        }));

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error(
        "UNEXPECTED REVIEWS ERROR:",
        error
      );

      setReviewsError(
        "Reviews couldn't be loaded right now."
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  fetchReviews();
}, [shop?.id]);

   /* FETCH SHOP OFFERS */

  useEffect(() => {
    if (!shop?.id) {
      return;
    }

    const fetchShopOffers = async () => {
      setOffersLoading(true);

      try {
        const supabase = createClient();

        const now = new Date();

        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now);

        const { data, error } = await supabase
          .from("shop_offers")
          .select(
            `
              id,
              type,
              title,
              description,
              discount_percent,
              offer_price,
              original_price,
              product_ids,
              offer_kind,
              offer_value,
              minimum_order_value,
              buy_quantity,
              get_quantity,
              valid_from,
              valid_until,
              is_enabled
            `
          )
          .eq("shop_id", shop.id)
          .eq("is_enabled", true)
          .in("type", ["discount", "offer"])
          .lte("valid_from", today)
          .gte("valid_until", today)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error(
            "SHOP OFFERS FETCH ERROR:",
            error
          );

          setShopOffers([]);
          return;
        }

        setShopOffers(
          (data ?? []) as ShopOffer[]
        );
      } catch (error) {
        console.error(
          "UNEXPECTED SHOP OFFERS ERROR:",
          error
        );

        setShopOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchShopOffers();
  }, [shop?.id]);

  /* HELPERS */

const myReview = userId
  ? reviews.find(
      (review) => review.user_id === userId
    ) ?? null
  : null;

    const activeDiscount =
    shopOffers.find(
      (offer) =>
        offer.type === "discount" &&
        offer.discount_percent !== null
    ) ?? null;

  const activeOffer =
    shopOffers.find(
      (offer) => offer.type === "offer"
    ) ?? null;

  const canPostReview =
  !!userId && !myReview;

  const shopIsOpen = shop
    ? isShopOpen(
        shop.opening_time,
        shop.closing_time
      )
    : false;

  const distance =
    shop &&
    userLocation &&
    shop.latitude !== null &&
    shop.longitude !== null
      ? formatDistance(
          distanceInKm(
            userLocation.latitude,
            userLocation.longitude,
            shop.latitude,
            shop.longitude
          )
        )
      : null;

  /* REVIEW SUBMIT */

const handleSubmitReview = async () => {
  if (!shop || !userId) {
    return;
  }

  if (!editingReviewId && myReview) {
    setReviewMessage(
      "You have already reviewed this shop. You can edit your existing review."
    );
    return;
  }

  const trimmedReview = reviewText.trim();

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewMessage(
        "Please select a rating between 1 and 5 stars."
      );
      return;
    }

    if (trimmedReview.length < 3) {
      setReviewMessage(
        "Your review must be at least 3 characters."
      );
      return;
    }

    if (trimmedReview.length > 500) {
      setReviewMessage(
        "Your review cannot exceed 500 characters."
      );
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage("");

    try {
      const supabase = createClient();

      if (editingReviewId) {
        const { data, error } = await supabase
          .from("shop_reviews")
          .update({
            rating: reviewRating,
            review: trimmedReview,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingReviewId)
          .eq("user_id", userId)
          .select(
            `
              id,
              shop_id,
              user_id,
              rating,
              review,
              created_at,
              updated_at
            `
          )
          .single();

        if (error) {
          console.error(
            "REVIEW UPDATE ERROR:",
            error
          );

          setReviewMessage(
            "We couldn't update your review. Please try again."
          );

          return;
        }

        setReviews((current) =>
          current.map((item) =>
            item.id === editingReviewId
              ? (data as Review)
              : item
          )
        );

        setEditingReviewId(null);
        setReviewText("");
        setReviewRating(5);
        setReviewMessage(
          "Your review has been updated."
        );
      } else {
        const { data, error } = await supabase
          .from("shop_reviews")
          .insert({
            shop_id: shop.id,
            user_id: userId,
            rating: reviewRating,
            review: trimmedReview,
          })
          .select(
            `
              id,
              shop_id,
              user_id,
              rating,
              review,
              created_at,
              updated_at
            `
          )
          .single();

        if (error) {
          console.error(
            "REVIEW INSERT ERROR:",
            error
          );

          if (error.code === "23505") {
            setReviewMessage(
              "You have already reviewed this shop."
            );
          } else {
            setReviewMessage(
              "We couldn't submit your review. Please try again."
            );
          }

          return;
        }

 setReviews((current) => [
  {
    ...(data as Review),
    profile: currentUserProfile,
  },
  ...current,
]);

        setReviewText("");
        setReviewRating(5);
        setReviewMessage(
          "Thanks! Your review has been posted."
        );
      }
    } catch (error) {
      console.error(
        "UNEXPECTED REVIEW ERROR:",
        error
      );

      setReviewMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  /* EDIT REVIEW */

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewText(review.review);
    setReviewMessage("");

   setTimeout(() => {
  document
    .getElementById("shop-review")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
}, 0);
};

  /* CANCEL EDIT */

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewText("");
    setReviewMessage("");
  };

  /* DELETE REVIEW */

  const handleDeleteReview = async (
    reviewId: string
  ) => {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete your review? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingReviewId(reviewId);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("shop_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", userId);

      if (error) {
        console.error(
          "REVIEW DELETE ERROR:",
          error
        );

        setReviewMessage(
          "We couldn't delete your review. Please try again."
        );

        return;
      }

      setReviews((current) =>
        current.filter(
          (review) => review.id !== reviewId
        )
      );

      if (editingReviewId === reviewId) {
        handleCancelEdit();
      }

      setReviewMessage(
        "Your review has been deleted."
      );
    } catch (error) {
      console.error(
        "UNEXPECTED DELETE ERROR:",
        error
      );

      setReviewMessage(
        "Something went wrong while deleting the review."
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleCall = () => {
    if (!shop?.phone) {
      return;
    }

    window.location.href = `tel:${shop.phone}`;
  };

  const handleDirections = () => {
    if (
      shop?.latitude === null ||
      shop?.longitude === null ||
      !shop
    ) {
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${shop.latitude},${shop.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
              AS
            </div>

            <div className="leading-none text-left">
              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:gap-[5px] sm:text-[18px]">
                <span className="text-[#111]">
                  APNA
                </span>

                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/55 sm:mt-1.5 sm:gap-2 sm:text-[9px] sm:tracking-[0.14em]">
                <span>LOCALS</span>
                <span className="text-[#159447]">
                  •
                </span>
                <span>TRUSTED</span>
                <span className="text-[#159447]">
                  •
                </span>
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

      {/* LOADING */}

      {isLoading && (
        <section className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="overflow-hidden rounded-[30px] border border-black/[0.12] bg-white shadow-[0_20px_70px_rgba(0,0,0,.04)]">

            <div className="h-[280px] animate-pulse bg-black/[0.05] sm:h-[420px]" />

            <div className="space-y-5 p-6 sm:p-9">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-black/[0.06]" />

              <div className="h-4 w-1/3 animate-pulse rounded bg-black/[0.05]" />

              <div className="h-20 w-full animate-pulse rounded-xl bg-black/[0.04]" />

              <div className="flex gap-3">
                <div className="h-11 w-32 animate-pulse rounded-full bg-black/[0.05]" />

                <div className="h-11 w-32 animate-pulse rounded-full bg-black/[0.05]" />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ERROR / NOT FOUND */}

      {!isLoading && !shop && (
        <section className="mx-auto flex min-h-[calc(100vh-70px)] max-w-[700px] items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full rounded-[30px] border border-black/[0.10] bg-white px-6 py-14 text-center shadow-[0_20px_70px_rgba(0,0,0,.04)]">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">
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
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>

            <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]">
              Shop not available
            </h1>

            <p className="mx-auto mt-3 max-w-[420px] text-[12px] leading-5 text-black/45">
              {errorMessage ||
                "This shop could not be found or is no longer available."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/all-shops")}
              className="mt-7 rounded-full bg-[#111] px-6 py-3 text-[11px] font-black text-white transition hover:bg-[#222]"
            >
              Browse all shops
            </button>

          </div>

        </section>
      )}

      {/* SHOP */}

      {!isLoading && shop && (
        <section className="mx-auto max-w-[1200px] px-5 py-7 sm:px-8 sm:py-10">

          {/* HERO */}

          <div className="overflow-hidden rounded-[30px] border border-black/[0.10] bg-white shadow-[0_20px_70px_rgba(0,0,0,.045)]">

            <div className="relative h-[280px] overflow-hidden bg-[#e9ece8] sm:h-[420px] lg:h-[480px]">

              {shop.image_url ? (
                <img
                  src={shop.image_url}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-black/15">
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <circle
                      cx="8.5"
                      cy="9"
                      r="1.5"
                    />
                    <path d="m21 15-5-5L5 20" />
                  </svg>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-[1] h-[72%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-3.5 py-2 text-[9px] font-black tracking-[0.03em] shadow-[0_4px_18px_rgba(0,0,0,.15)] backdrop-blur-md sm:left-7 sm:top-7">

  <span
    className={
      shopIsOpen
        ? "text-[#159447]"
        : "text-red-500"
    }
  >
    ●
  </span>

  {shopIsOpen
    ? "OPEN NOW"
    : "CLOSED"}

</div>

                            {/* HERO OFFERS */}

             <div className="absolute right-2.5 top-2.5 z-20 flex w-[145px] flex-col items-end gap-1 sm:right-7 sm:top-7 sm:w-auto sm:gap-1.5">

                {/* ACTIVE DISCOUNT */}

                {activeDiscount &&
                  activeDiscount.discount_percent !== null && (
                   
                    <div className="w-full sm:w-auto sm:max-w-[280px]">

  <div className="rounded-[12px] border border-white/20 bg-black/45 px-2 py-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,.22)] backdrop-blur-xl sm:rounded-[18px] sm:px-4 sm:py-3.5">

                        <div className="flex items-center gap-2">

                       <div className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white sm:h-7 sm:w-7">

                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83l-3.35-3.35Z" />

                              <circle
                                cx="7.5"
                                cy="7.5"
                                r="1"
                              />

                            </svg>

                          </div>

                          <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/70">
                            Special offer
                          </span>

                        </div>

                       <div className="mt-0.5 text-[15px] font-black leading-none tracking-[-0.05em] sm:mt-2 sm:text-[26px]">
                          {activeDiscount.discount_percent}% OFF
                        </div>

                        {activeDiscount.title && (
                         <div className="mt-0.5 line-clamp-1 text-[8px] font-black leading-3 tracking-[-0.01em] text-white sm:mt-1.5 sm:text-[13px] sm:leading-4">
                            {activeDiscount.title}
                          </div>
                        )}

                        {activeDiscount.description && (
                          <div className="mt-0.5 max-w-[125px] line-clamp-1 text-[7px] font-medium leading-2.5 text-white/65 sm:mt-1 sm:max-w-[240px] sm:text-[10px] sm:leading-4">
                            {activeDiscount.description}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                {/* ACTIVE OFFER */}

                {activeOffer && (
               
               <div className="w-[125px] sm:w-[175px]">

  <div className="rounded-[11px] border border-white/20 bg-white/92 px-2 py-1.5 text-black shadow-[0_8px_25px_rgba(0,0,0,.14)] backdrop-blur-xl sm:px-3 sm:py-2.5">
                      <div className="flex items-center gap-2">

                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white">

                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83l-3.35-3.35a2 2 0 0 0 0-2.83Z" />

                            <circle
                              cx="7.5"
                              cy="7.5"
                              r="1"
                            />

                          </svg>

                        </div>

                        <span className="text-[7.5px] font-black uppercase tracking-[0.11em] text-[#159447]">
                          Special Deal
                        </span>

                      </div>

                      {activeOffer.offer_kind === "flat" &&
                        activeOffer.offer_value !== null && (
                          <div className="mt-1 text-[14px] font-black leading-none tracking-[-0.03em] sm:text-[15px]">
                            ₹{activeOffer.offer_value} OFF
                          </div>
                        )}

                      {activeOffer.offer_kind === "buy_get" &&
                        activeOffer.buy_quantity !== null &&
                        activeOffer.get_quantity !== null && (
                          <div className="mt-1 text-[11px] font-black leading-3.5 sm:text-[12px]">
                            BUY {activeOffer.buy_quantity} GET{" "}
                            {activeOffer.get_quantity}
                          </div>
                        )}

                      {activeOffer.offer_kind === "free_item" && (
                        <div className="mt-1 text-[11px] font-black leading-3.5 sm:text-[12px]">
                          FREE ITEM
                        </div>
                      )}

                   {activeOffer.title && (
  <div className="mt-0.5 line-clamp-1 text-[7.5px] font-black leading-3 text-black sm:mt-1 sm:text-[9px] sm:leading-3.5">
    {activeOffer.title}
  </div>
)}

{activeOffer.description && (
  <div className="mt-0.5 max-w-[108px] line-clamp-1 text-[7px] font-medium leading-2.5 text-black/55 sm:mt-1 sm:max-w-[150px] sm:text-[9px] sm:leading-3.5">
    {activeOffer.description}
  </div>
)}

                    </div>

                  </div>
                )}

              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-7 text-white sm:px-8 sm:pb-9">

                <div className="mb-3.5 inline-flex items-center rounded-full border border-[#5fd38a]/35 bg-black/45 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.11em] text-white shadow-[0_4px_18px_rgba(0,0,0,.25)] backdrop-blur-md sm:mb-4 sm:px-3.5 sm:py-1.5 sm:text-[10px]">

  <span>
    {shop.category}
  </span>

</div>

   <h1 className="mt-3 text-[30px] font-black leading-none tracking-[-0.05em] text-white sm:text-[42px]">
  {shop.name}
</h1>

                {shop.address && (
                  <div className="mt-3 flex max-w-[760px] items-center gap-2.5 text-white/80 sm:mt-3.5">

                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-red-400 backdrop-blur-sm">

                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle
                          cx="12"
                          cy="10"
                          r="2.5"
                        />
                      </svg>

                    </div>

                    <span className="truncate text-[11px] font-medium leading-5 tracking-[0.01em] sm:text-[13px]">
                      {shop.address}
                    </span>

                  </div>
                )}

              </div>

            </div>

            {/* CONTENT */}

            <div className="p-5 sm:p-8 lg:p-10">

              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

                {/* LEFT */}

                <div>

                  {/* OWNER */}

                  {shop.owner_name && (
                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">

                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle
                            cx="12"
                            cy="8"
                            r="3"
                          />

                          <path d="M5 21a7 7 0 0 1 14 0" />
                        </svg>

                      </div>

                      <div>

                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/40">
                          Store owner
                        </div>

                        <div className="mt-0.5 text-[13px] font-black">
                          {shop.owner_name}
                        </div>

                      </div>

                    </div>
                  )}

                  {/* DESCRIPTION */}

                  {shop.description && (
                    <div className="mt-8">

                      <h2 className="text-[18px] font-black tracking-[-0.03em]">
                        About this shop
                      </h2>

                      <p className="mt-3 max-w-[700px] text-[13px] leading-6 text-black/50">
                        {shop.description}
                      </p>

                    </div>
                  )}

                  {/* INFO */}

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">

                    {distance && (
                      <div className="rounded-[20px] border border-black/[0.06] bg-[#fafbf9] p-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#159447] shadow-sm">

                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2v20" />
                              <path d="m17 5-5-3-5 3" />
                              <path d="m17 19-5 3-5-3" />
                            </svg>

                          </div>

                          <div>

                            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                              Distance
                            </div>

                            <div className="mt-1 text-[13px] font-black">
                              {distance} away
                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                    {shop.phone && (
                      <div
                        className={
                          distance
                            ? "rounded-[20px] border border-black/[0.06] bg-[#fafbf9] p-4"
                            : "rounded-[20px] border border-black/[0.06] bg-[#fafbf9] p-4 sm:col-span-2"
                        }
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#159447] shadow-sm">

                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 0 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                            </svg>

                          </div>

                          <div>

                            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/30">
                              Phone
                            </div>

                            <div className="mt-1 text-[13px] font-black">
                              {formatPhone(shop.phone)}
                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </div>

                {/* RIGHT ACTION CARD */}

                <aside className="lg:pt-0">

                  <div className="rounded-[24px] border border-black/[0.28] bg-[#fafbf9] p-5 sm:p-6">

                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-black/60">
  Shop actions
</div>

                    <div className="mt-5 space-y-2.5">

                      {shop.phone && (
                        <button
                          type="button"
                          onClick={handleCall}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#159447] text-[11px] font-black text-white transition hover:bg-[#117d3c] active:scale-[0.98]"
                        >

                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 0 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                          </svg>

                          Call shop

                        </button>
                      )}

                      {shop.latitude !== null &&
                        shop.longitude !== null && (
                          <button
                            type="button"
                            onClick={handleDirections}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white text-[11px] font-black text-black transition hover:border-black/[0.14] hover:bg-black/[0.02] active:scale-[0.98]"
                          >

                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 2 3 5l4 7-4 7 9 3 9-3-4-7 4-7-9-3Z" />
                              <path d="m12 2 1 10-1 10" />
                              <path d="m3 5 9 7 9-7" />
                              <path d="m7 12h10" />
                            </svg>

                            Get directions

                          </button>
                        )}

                    </div>

                    <div className="mt-5 border-t border-black/[0.06] pt-5">

                      <div className="flex items-center justify-between">

                        <span className="text-[10px] font-semibold text-black/60">
                          Status
                        </span>

                        <span
                          className={
                            shopIsOpen
                              ? "text-[10px] font-black text-[#159447]"
                              : "text-[10px] font-black text-red-500"
                          }
                        >
                          {shopIsOpen
                            ? "Open now"
                            : "Closed"}
                        </span>

                      </div>

                      <div className="mt-3 flex items-center justify-between">

                        <span className="text-[10px] font-semibold text-black/60">
                          Category
                        </span>

                        <span className="rounded-full bg-[#eef7ef] px-2.5 py-1 text-[9px] font-black text-[#159447]">
                          {shop.category}
                        </span>

                      </div>

                      {shop.rating !== null && (
                        <div className="mt-3 flex items-center justify-between">

                          <span className="text-[10px] font-semibold text-black/60">
                            Rating
                          </span>

                          <span className="flex items-center gap-1 text-[10px] font-black">
                            <span className="text-[#f5a623]">
                              ★
                            </span>

                            {Number(shop.rating).toFixed(1)}
                          </span>

                        </div>
                      )}

                    </div>

                  </div>

                </aside>

              </div>

            </div>

              </div>

      {/* PRODUCTS */}

      <section className="mt-5 rounded-[30px] border border-black/[0.10] bg-white p-5 shadow-[0_20px_70px_rgba(0,0,0,.035)] sm:p-8 lg:p-10">

      <div className="flex items-center justify-between gap-5">

  <div>
    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#159447]">
      Shop products
    </div>

    <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] sm:text-[28px]">
      Products
    </h2>

    <p className="mt-2 text-[11px] leading-5 text-black/40">
      Explore this shop’s product selection.
    </p>
  </div>

  <button
    type="button"
    onClick={() =>
      router.push(
        `/shop-products/${encodeURIComponent(shop.slug)}`
      )
    }
    className="group flex shrink-0 items-center gap-1.5 rounded-full bg-[#111] px-4 py-2.5 text-[10px] font-black text-white transition hover:bg-[#222] active:scale-[0.98] sm:px-5 sm:py-3 sm:text-[11px]"
  >
    View products

    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </button>

</div>

      </section>

      {/* REVIEWS */}

      <section className="mt-5 rounded-[30px] border border-black/[0.10] bg-white p-5 shadow-[0_20px_70px_rgba(0,0,0,.035)] sm:p-8 lg:p-10">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#159447]">
                  Community feedback
                </div>

                <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] sm:text-[28px]">
                  Reviews
                </h2>

                <p className="mt-2 text-[11px] leading-5 text-black/40">
                  See what people in the community think about this shop.
                </p>

              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-3 rounded-[18px] border border-black/[0.06] bg-[#fafbf9] px-4 py-3">

                  <div className="text-[24px] font-black tracking-[-0.04em]">
                    {(
                      reviews.reduce(
                        (sum, review) =>
                          sum + review.rating,
                        0
                      ) / reviews.length
                    ).toFixed(1)}
                  </div>

                  <div>

                    <StarRating
                      rating={Math.round(
                        reviews.reduce(
                          (sum, review) =>
                            sum + review.rating,
                          0
                        ) / reviews.length
                      )}
                      size={14}
                    />

                    <div className="mt-1 text-[9px] font-semibold text-black/40">
                      {reviews.length}{" "}
                      {reviews.length === 1
                        ? "review"
                        : "reviews"}
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* REVIEW FORM */}

            {!authLoading && userId && (
              <div className="mt-8 rounded-[24px] border border-black/[0.10] bg-[#fafbf9] p-5 sm:p-6">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <h3 className="text-[14px] font-black tracking-[-0.02em]">
                      {editingReviewId
  ? "Edit your review"
  : myReview
  ? "Your feedback"
  : "Share your experience"}
                    </h3>

                    <p className="mt-1 text-[10px] text-black/40">
                     {editingReviewId
  ? "Update your rating or review message."
  : myReview
  ? "You can edit or delete your existing feedback below."
  : "Tell others what you think about this shop."}
                    </p>

                  </div>

                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black text-black/45 transition hover:bg-white hover:text-black"
                    >
                      Cancel
                    </button>
                  )}

                </div>

                <div className="mt-5">

                  <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/45">
                    Rate this shop
                  </div>

                  <div className="mt-2 flex items-center gap-3">

                    <StarRating
                      rating={reviewRating}
                      size={25}
                      interactive
                      onChange={setReviewRating}
                    />

                    <span className="text-[11px] font-black text-black/45">
                      {reviewRating}/5
                    </span>

                  </div>

                </div>

                <div className="mt-5">

                  <div className="flex items-center justify-between">

                    <label
                      htmlFor="shop-review"
                      className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/45"
                    >
                      Write a review
                    </label>

                    <span
                      className={
                        reviewText.length > 500
                          ? "text-[9px] font-bold text-red-500"
                          : "text-[9px] font-semibold text-black/25"
                      }
                    >
                      {reviewText.length}/500
                    </span>

                  </div>

                  <textarea
                    id="shop-review"
                    value={reviewText}
                    onChange={(event) =>
                      setReviewText(
                        event.target.value
                      )
                    }
                    maxLength={500}
                    rows={4}
                    placeholder="How was your experience with this shop?"
                    className="mt-2 w-full resize-none rounded-[18px] border border-black/[0.10] bg-white px-4 py-3.5 text-[12px] leading-5 outline-none transition placeholder:text-black/25 focus:border-[#159447]/40 focus:ring-4 focus:ring-[#159447]/[0.07]"
                  />

                </div>

                {reviewMessage && (
                  <div
                    className={
                      reviewMessage.includes(
                        "Thanks"
                      ) ||
                      reviewMessage.includes(
                        "updated"
                      ) ||
                      reviewMessage.includes(
                        "deleted"
                      )
                        ? "mt-3 rounded-[14px] bg-[#eef7ef] px-3.5 py-2.5 text-[10px] font-semibold text-[#159447]"
                        : "mt-3 rounded-[14px] bg-red-50 px-3.5 py-2.5 text-[10px] font-semibold text-red-600"
                    }
                  >
                    {reviewMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={
                    isSubmittingReview ||
                    reviewText.trim().length < 3 ||
                    reviewText.length > 500
                  }
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-[#159447] text-[10px] font-black text-white transition hover:bg-[#117d3c] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-7"
                >
                  {isSubmittingReview
                    ? "Saving..."
                    : editingReviewId
                    ? "Update review"
                    : "Post review"}
                </button>

              </div>
            )}

            {/* SIGN IN */}

            {!authLoading && !userId && (
              <div className="mt-8 rounded-[24px] border border-black/[0.10] bg-[#fafbf9] p-6 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                  </svg>

                </div>

                <h3 className="mt-3 text-[13px] font-black">
                  Want to leave a review?
                </h3>

                <p className="mx-auto mt-1.5 max-w-[360px] text-[10px] leading-5 text-black/40">
                  Sign in to rate this shop and share your experience.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/sign-in?redirect=/view-shop/${encodeURIComponent(
                        shop.slug
                      )}`
                    )
                  }
                  className="mt-4 rounded-full bg-[#111] px-5 py-2.5 text-[10px] font-black text-white transition hover:bg-[#222]"
                >
                  Sign in to review
                </button>

              </div>
            )}

            {/* REVIEWS LIST */}

            <div className="mt-8">

              {reviewsLoading && (
                <div className="space-y-3">

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-[22px] border border-black/[0.06] bg-[#fafbf9] p-5"
                    >
                      <div className="h-3 w-28 rounded bg-black/[0.06]" />

                      <div className="mt-3 h-3 w-20 rounded bg-black/[0.05]" />

                      <div className="mt-4 h-12 w-full rounded bg-black/[0.04]" />
                    </div>
                  ))}

                </div>
              )}

              {!reviewsLoading &&
                reviewsError && (
                  <div className="rounded-[20px] border border-red-100 bg-red-50 px-5 py-4 text-[10px] font-semibold text-red-600">
                    {reviewsError}
                  </div>
                )}

              {!reviewsLoading &&
                !reviewsError &&
                reviews.length === 0 && (
                  <div className="rounded-[24px] border border-dashed border-black/[0.10] bg-[#fafbf9] px-6 py-10 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#159447] shadow-sm">

                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                      </svg>

                    </div>

                    <h3 className="mt-4 text-[13px] font-black">
                      No reviews yet
                    </h3>

                    <p className="mx-auto mt-1.5 max-w-[340px] text-[10px] leading-5 text-black/40">
                      Be the first person to share your experience with this shop.
                    </p>

                  </div>
                )}

              {!reviewsLoading &&
  !reviewsError &&
  reviews.length > 0 && (
    <div className="max-h-[520px] space-y-3 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] pr-0 sm:pr-2">

      {reviews.map((review) => {
                      const isMine =
                        review.user_id === userId;

                      const isDeleting =
                        deletingReviewId ===
                        review.id;

                      return (
                        <article
                          key={review.id}
                          className="rounded-[22px] border border-black/[0.06] bg-[#fafbf9] p-5 sm:p-6"
                        >

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex min-w-0 items-center gap-3">

  {review.profile?.avatar_url ? (
    <img
      src={review.profile.avatar_url}
      alt={
        review.profile.full_name ||
        "Customer"
      }
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#159447] shadow-sm">
      {isMine
        ? "You"
        : (
            review.profile?.full_name?.[0] ||
            "C"
          ).toUpperCase()}
    </div>
  )}

  <div className="min-w-0">

    <div className="truncate text-[11px] font-black">
      {isMine
        ? "You"
        : review.profile?.full_name ||
          "Customer"}
    </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2">

                                  <StarRating
                                    rating={
                                      review.rating
                                    }
                                    size={13}
                                  />

                                  <span className="text-[9px] font-semibold text-black/25">
                                    {formatReviewDate(
                                      review.created_at
                                    )}
                                  </span>

                                  {review.updated_at !==
                                    review.created_at && (
                                    <span className="text-[9px] font-semibold text-black/25">
                                      • edited
                                    </span>
                                  )}

                                </div>

                              </div>

                            </div>

                            {isMine && (
                              <div className="flex shrink-0 items-center gap-1">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditReview(
                                      review
                                    )
                                  }
                                  disabled={
                                    isDeleting
                                  }
                                  className="rounded-full px-2.5 py-1.5 text-[9px] font-black text-black/40 transition hover:bg-white hover:text-black disabled:opacity-30"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteReview(
                                      review.id
                                    )
                                  }
                                  disabled={
                                    isDeleting
                                  }
                                  className="rounded-full px-2.5 py-1.5 text-[9px] font-black text-red-500/65 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                                >
                                  {isDeleting
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>

                              </div>
                            )}

                          </div>

                          <p className="mt-4 text-[12px] leading-6 text-black/55">
                            {review.review}
                          </p>

                        </article>
                      );
                    })}

                  </div>
                )}

            </div>

          </section>

          {/* BOTTOM */}

          <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-[22px] border border-black/[0.06] bg-white px-5 py-4 sm:flex-row sm:px-6">

            <p className="text-center text-[10px] font-semibold text-black/50 sm:text-left">
              Supporting local businesses keeps our community strong.
            </p>

            <button
              type="button"
              onClick={() => router.push("/all-shops")}
              className="shrink-0 rounded-full px-4 py-2 text-[10px] font-black text-[#159447] transition hover:bg-[#eef7ef]"
            >
              Explore more shops →
            </button>

          </div>

{/* FOOTER */}

<footer className="mt-5 border-t border-black/[0.07] bg-white">
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

        </section>
      )}

    </main>
  );
}
