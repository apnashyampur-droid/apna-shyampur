"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ShopDiscount = {
  id: string;
  title: string | null;
  description: string | null;
  discount_percent: number | null;
};

type ShopOffer = {
  id: string;
  title: string | null;
  description: string | null;
  offer_kind: "flat" | "buy_get" | "free_item" | null;
  offer_value: number | null;
  minimum_order_value: number | null;
  buy_quantity: number | null;
  get_quantity: number | null;
};

type Shop = {
  id: string;
  name: string;
  slug: string;
  owner_name: string | null;
  address: string | null;
  category: string;
  image_url: string | null;
  rating: number | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  created_at: string;
  activeDiscount: ShopDiscount | null;
  activeOffer: ShopOffer | null;
};

const categoryMap: Record<string, string[]> = {
  Vegetables: ["vegetables"],
  Food: ["food"],
  Meat: ["meat"],
  Electronics: ["electronics"],
  Medical: ["medical"],
  Bakery: ["bakery"],
  Grocery: ["grocery", "daily needs"],
  Dairy: ["dairy", "milk"],
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

function isShopOpen(
  openingTime: string | null,
  closingTime: string | null
) {
  if (!openingTime || !closingTime) {
    return false;
  }

  // Always use India Standard Time (IST)
  const now = new Date();

  const indiaTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const [currentHour, currentMinute] = indiaTime
    .split(":")
    .map(Number);

  const currentMinutes =
    currentHour * 60 + currentMinute;

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

  function AllShopsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedCategory = searchParams.get("category");
const urlSearchQuery = searchParams.get("search") || "";

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  useEffect(() => {
  setSearchQuery(urlSearchQuery);
}, [urlSearchQuery]);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
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

  useEffect(() => {
    const fetchShops = async () => {
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
              address,
              image_url,
              rating,
              opening_time,
              closing_time,
              latitude,
              longitude,
              is_open,
              is_active,
              created_at
            `
          )
          .eq("is_active", true)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          console.error("SHOPS FETCH ERROR:", error);

          setErrorMessage(
            "We couldn't load the shops right now. Please try again."
          );

          return;
        }

        const shopsData = (data || []) as Omit<
  Shop,
  "activeDiscount" | "activeOffer"
>[];

if (shopsData.length === 0) {
  setShops([]);
  return;
}

const shopIds = shopsData.map((shop) => shop.id);

const now = new Date();

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const { data: discountData, error: discountError } = await supabase
  .from("shop_offers")
  .select(`
    id,
    shop_id,
    title,
    description,
    discount_percent,
    created_at
  `)
  .in("shop_id", shopIds)
  .eq("type", "discount")
  .eq("is_enabled", true)
  .lte("valid_from", today)
  .gte("valid_until", today)
  .not("discount_percent", "is", null)
  .order("created_at", {
    ascending: false,
  });

if (discountError) {
  console.error(
    "SHOP DISCOUNTS FETCH ERROR:",
    discountError
  );
}

const discountMap = new Map<string, ShopDiscount>();

(discountData || []).forEach((discount) => {
  if (!discountMap.has(discount.shop_id)) {
    discountMap.set(discount.shop_id, {
      id: discount.id,
      title: discount.title,
      description: discount.description,
      discount_percent: discount.discount_percent,
    });
  }
});

const { data: offerData, error: offerError } = await supabase
  .from("shop_offers")
  .select(`
    id,
    shop_id,
    title,
    description,
    offer_kind,
    offer_value,
    minimum_order_value,
    buy_quantity,
    get_quantity,
    created_at
  `)
  .in("shop_id", shopIds)
  .eq("type", "offer")
  .eq("is_enabled", true)
  .lte("valid_from", today)
  .gte("valid_until", today)
  .order("created_at", {
    ascending: false,
  });

if (offerError) {
  console.error(
    "SHOP OFFERS FETCH ERROR:",
    offerError
  );
}

const offerMap = new Map<string, ShopOffer>();

(offerData || []).forEach((offer) => {
  if (!offerMap.has(offer.shop_id)) {
    offerMap.set(offer.shop_id, {
      id: offer.id,
      title: offer.title,
      description: offer.description,
      offer_kind: offer.offer_kind,
      offer_value: offer.offer_value,
      minimum_order_value: offer.minimum_order_value,
      buy_quantity: offer.buy_quantity,
      get_quantity: offer.get_quantity,
    });
  }
});

const shopsWithDiscounts = shopsData.map((shop) => ({
  ...shop,
  activeDiscount:
    discountMap.get(shop.id) ?? null,
  activeOffer:
    offerMap.get(shop.id) ?? null,
}));

setShops(shopsWithDiscounts);

      } catch (error) {
        console.error("UNEXPECTED SHOPS ERROR:", error);

        setErrorMessage(
          "Something went wrong while loading shops."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  const filteredShops = shops.filter((shop) => {
  const matchesCategory = selectedCategory
    ? (() => {
        const keywords = categoryMap[selectedCategory] || [];

        if (keywords.length === 0) {
          return (
            shop.category.toLowerCase() ===
            selectedCategory.toLowerCase()
          );
        }

        return keywords.some((keyword) =>
          shop.category.toLowerCase().includes(keyword)
        );
      })()
    : true;

  const query = searchQuery.trim().toLowerCase();

  const matchesSearch = query
    ? shop.name.toLowerCase().includes(query) ||
      shop.category.toLowerCase().includes(query) ||
      (shop.owner_name ?? "").toLowerCase().includes(query) ||
      (shop.address ?? "").toLowerCase().includes(query)
    : true;

  return matchesCategory && matchesSearch;
});

const searchSuggestions = searchQuery.trim()
  ? shops
      .filter((shop) => {
        const query = searchQuery.trim().toLowerCase();

        return (
          shop.name?.toLowerCase().includes(query) ||
          shop.category?.toLowerCase().includes(query) ||
          shop.address?.toLowerCase().includes(query)
        );
      })
      .slice(0, 6)
  : [];

  const pageTitle = selectedCategory
  ? `${selectedCategory} Shops`
  : "Shyampur Shops";

const pageDescription = selectedCategory
  ? `Browse ${selectedCategory.toLowerCase()} shops available on Apna Shyampur.`
  : "Discover local shops available on Apna Shyampur.";

  const handleViewStore = (shop: Shop) => {
  if (!shop.slug) {
    return;
  }

  router.push(`/view-shop/${shop.slug}`);
};

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      {/* HEADER */}

    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
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
      onClick={() => router.back()}
      className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
    >
      Back
    </button>
  </div>
</header>

      <section className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
  {/* SEARCH */}

 <div className="mb-7">
  <div className="relative w-full max-w-[620px]">
    <svg
      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-black/35"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>

    <input
      type="search"
      value={searchQuery}
      onChange={(event) => {
        setSearchQuery(event.target.value);
        setShowSearchSuggestions(true);
      }}
      onFocus={() => {
        if (searchQuery.trim()) {
          setShowSearchSuggestions(true);
        }
      }}
      onBlur={() => {
        setTimeout(() => {
          setShowSearchSuggestions(false);
        }, 150);
      }}
      placeholder="Search local shops..."
      aria-label="Search local shops"
      autoComplete="off"
      className="h-[48px] w-full rounded-[15px] border border-black/[0.08] bg-white pl-11 pr-11 text-[12px] font-semibold text-black outline-none shadow-[0_8px_25px_rgba(0,0,0,.025)] transition placeholder:text-black/30 focus:border-[#159447]/30 focus:ring-2 focus:ring-[#159447]/10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
    />

    {searchQuery && (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setSearchQuery("");
          setShowSearchSuggestions(false);
        }}
        className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black transition hover:bg-black/[0.05]"
        aria-label="Clear search"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#111111"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      </button>
    )}

    {showSearchSuggestions &&
      searchQuery.trim() &&
      searchSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[60] overflow-hidden rounded-[16px] border border-black/[0.07] bg-white shadow-[0_18px_50px_rgba(0,0,0,.10)]">
          {searchSuggestions.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();

                setSearchQuery(shop.name);
                setShowSearchSuggestions(false);

                router.push(
                  `/all-shops?search=${encodeURIComponent(shop.name)}`
                );
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f5f6f4]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">
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
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold text-black">
                  {shop.name}
                </div>

                <div className="mt-0.5 truncate text-[10px] text-black/40">
                  {shop.category}
                  {shop.address ? ` • ${shop.address}` : ""}
                </div>
              </div>

              <svg
                width="14"
                height="14"
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
          ))}
        </div>
      )}
  </div>
</div>

  {/* TITLE */}

  <div className="mb-8">

    <h2 className="text-[32px] font-black leading-none tracking-[-0.05em] sm:text-[38px]">
      {pageTitle}
    </h2>

    <p className="mt-3 text-[12px] text-black/45 sm:text-[13px]">
      {pageDescription}
    </p>
  </div>

        {/* LOADING */}

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white"
              >
                <div className="h-[230px] animate-pulse bg-black/[0.05]" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-black/[0.06]" />

                  <div className="h-3 w-1/2 animate-pulse rounded bg-black/[0.05]" />

                  <div className="mt-5 h-px bg-black/[0.05]" />

                  <div className="flex justify-between">
                    <div className="h-3 w-16 animate-pulse rounded bg-black/[0.05]" />

                    <div className="h-3 w-20 animate-pulse rounded bg-black/[0.05]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}

        {!isLoading && errorMessage && (
          <div className="rounded-[22px] border border-red-200 bg-red-50 p-6 text-center">
            <div className="text-[14px] font-black text-red-700">
              Unable to load shops
            </div>

            <p className="mt-2 text-[11px] text-red-600/70">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-[#111] px-5 py-2.5 text-[10px] font-black text-white transition hover:bg-[#222]"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {!isLoading &&
          !errorMessage &&
          filteredShops.length === 0 && (
            <div className="rounded-[24px] border border-black/[0.07] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5 12 3l9 7.5" />
                  <path d="M5 9.5V21h14V9.5" />
                  <path d="M9 21v-6h6v6" />
                </svg>
              </div>

              <h3 className="mt-5 text-[18px] font-black">
               {searchQuery.trim()
  ? `No shops found for "${searchQuery.trim()}"`
  : selectedCategory
    ? `No ${selectedCategory.toLowerCase()} shops yet`
    : "No shops available right now"}
              </h3>

              <p className="mx-auto mt-2 max-w-[420px] text-[11px] leading-5 text-black/40">
               {searchQuery.trim()
  ? "Try searching with a different shop name or category."
  : selectedCategory
    ? `There are no active ${selectedCategory.toLowerCase()} shops listed on Apna Shyampur yet.`
    : "Local shops will appear here once they are approved and activated."}
              </p>

              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => router.push("/all-shops")}
                  className="mt-5 rounded-full bg-[#111] px-5 py-2.5 text-[10px] font-black text-white transition hover:bg-[#222]"
                >
                  View all shops
                </button>
              )}
            </div>
          )}

        {/* REAL SHOPS */}

        {!isLoading &&
          !errorMessage &&
          filteredShops.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {filteredShops.map((shop) => {
  const shopIsOpen = isShopOpen(
    shop.opening_time,
    shop.closing_time
  );

  let distance: string | null = null;

  if (
    userLocation &&
    shop.latitude !== null &&
    shop.longitude !== null
  ) {
    const distanceKm = distanceInKm(
      userLocation.latitude,
      userLocation.longitude,
      shop.latitude,
      shop.longitude
    );

    distance = formatDistance(distanceKm);
  }

  return (
                  <article
                    key={shop.id}
                    className="group overflow-hidden rounded-[24px] border border-black/[0.07] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,.08)]"
                  >
                    {/* IMAGE */}

                    <div className="relative h-[230px] overflow-hidden bg-[#eef0ed]">
                      {shop.image_url ? (
                        <img
                          src={shop.image_url}
                          alt={shop.name}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-black/20">
                          <svg
                            width="42"
                            height="42"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
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

                      {/* OPEN / CLOSED */}

<div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold backdrop-blur">
  <span
    className={
      shopIsOpen
        ? "text-[#159447]"
        : "text-red-500"
    }
  >
    ●
  </span>{" "}
  {shopIsOpen ? "OPEN NOW" : "CLOSED"}
</div>

```tsx
{/* SHOP PROMOTIONS */}

<div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-1.5 sm:right-5">

  {/* ACTIVE DISCOUNT */}

  {shop.activeDiscount &&
    shop.activeDiscount.discount_percent !== null && (
      <div className="max-w-[170px] sm:max-w-[190px]">
        <div className="rounded-[14px] border border-white/20 bg-black/45 px-2.5 py-2 text-white shadow-[0_8px_25px_rgba(0,0,0,.20)] backdrop-blur-xl sm:px-3 sm:py-2.5">

          <div className="flex items-center gap-1.5">

            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35Z" />
                <circle cx="7.5" cy="7.5" r="1" />
              </svg>
            </div>

            <span className="text-[7px] font-black uppercase tracking-[0.12em] text-white/70">
              Special offer
            </span>

          </div>

          <div className="mt-1 text-[19px] font-black leading-none tracking-[-0.05em] sm:text-[21px]">
            {shop.activeDiscount.discount_percent}% OFF
          </div>

          {shop.activeDiscount.title && (
            <div className="mt-1 line-clamp-1 text-[9px] font-black leading-3.5 text-white sm:text-[10px]">
              {shop.activeDiscount.title}
            </div>
          )}

        </div>
      </div>
    )}

  {/* ACTIVE OFFER */}

  {shop.activeOffer && (
    <div className="max-w-[130px] sm:max-w-[140px]">
      <div className="rounded-[10px] border border-white/20 bg-white/92 px-2 py-1.5 text-black shadow-[0_8px_25px_rgba(0,0,0,.14)] backdrop-blur-xl">

        <div className="flex items-center gap-1.5">

          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white">
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0 0 0 0Z" />
              <circle cx="7.5" cy="7.5" r="1" />
            </svg>
          </div>

          <span className="text-[6.5px] font-black uppercase tracking-[0.1em] text-[#159447]">
            Special Deal
          </span>

        </div>

        {shop.activeOffer.offer_kind === "flat" &&
          shop.activeOffer.offer_value !== null && (
            <div className="mt-0.5 text-[12px] font-black leading-none tracking-[-0.03em]">
              ₹{shop.activeOffer.offer_value} OFF
            </div>
          )}

        {shop.activeOffer.offer_kind === "buy_get" &&
          shop.activeOffer.buy_quantity !== null &&
          shop.activeOffer.get_quantity !== null && (
            <div className="mt-0.5 text-[10px] font-black leading-3">
              BUY {shop.activeOffer.buy_quantity}
              {" "}GET {shop.activeOffer.get_quantity}
            </div>
          )}

        {shop.activeOffer.offer_kind === "free_item" && (
          <div className="mt-0.5 text-[10px] font-black leading-3">
            FREE ITEM
          </div>
        )}

        {shop.activeOffer.title && (
          <div className="mt-0.5 line-clamp-1 text-[7.5px] font-bold leading-3 text-black/55">
            {shop.activeOffer.title}
          </div>
        )}

      </div>
    </div>
  )}

</div>
                      {/* RATING */}

                      {shop.rating !== null && (
                        <div className="absolute bottom-4 right-4 rounded-full bg-black/80 px-3 py-1.5 text-[10px] font-bold text-white">
                          ★ {Number(shop.rating).toFixed(1)}
                        </div>
                      )}
                    </div>
             
 {/* DETAILS */}

<div className="p-5">
  {/* SHOP NAME */}
  <h3 className="text-[17px] font-black leading-tight tracking-[-0.02em]">
    {shop.name}
  </h3>

  {/* OWNER */}
  {shop.owner_name && (
    <p className="mt-1.5 text-[11px] font-semibold text-black/45">
      {shop.owner_name}
    </p>
  )}

  {/* ADDRESS */}
  {shop.address && (
    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-4 text-black/40">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-[1px] shrink-0"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <span className="line-clamp-2">
        {shop.address}
      </span>
    </div>
  )}

  {/* CATEGORY */}
  <div className="mt-2.5">
    <span className="inline-flex rounded-full bg-[#eef7ef] px-2.5 py-1 text-[9px] font-bold text-[#159447]">
      {shop.category}
    </span>
  </div>

   {/* FOOTER */}
    {/* FOOTER */}
  <div className="mt-5 flex items-center justify-between border-t border-black/[0.07] pt-3.5">
    <div className="min-w-0">
      {distance ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-black/40">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>

          {distance} away
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-black/30">
          Distance unavailable
        </span>
      )}
    </div>

    <button
      type="button"
      onClick={() => handleViewStore(shop)}
      className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#159447] px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-[#117d3c]"
    >
      View shop

      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform group-hover/btn:translate-x-0.5"
      >
        <path d="M5 12h13" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </button>
  </div>
           </div>
                  </article>
                );
              })}
            </div>
          )}
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

export default function AllShops() {

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f6f4]">
          <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10">
            <div className="h-12 w-full max-w-[620px] animate-pulse rounded-[15px] bg-black/[0.06]" />

            <div className="mt-8 h-10 w-64 animate-pulse rounded bg-black/[0.06]" />

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[360px] animate-pulse rounded-[24px] bg-white"
                />
              ))}
            </div>
          </div>
        </main>
      }
    >
      <AllShopsContent />
    </Suspense>
  );
}