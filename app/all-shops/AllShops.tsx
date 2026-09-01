"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  // Normal same-day timing
  // Example: 08:00 → 23:00
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

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

        setShops(data || []);
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
      shop.category.toLowerCase().includes(query)
    : true;

  return matchesCategory && matchesSearch;
});

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
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/35"
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
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search shops..."
        className="h-[48px] w-full rounded-[15px] border border-black/[0.08] bg-white pl-11 pr-11 text-[12px] font-semibold text-black outline-none shadow-[0_8px_25px_rgba(0,0,0,.025)] transition placeholder:text-black/30 focus:border-[#159447]/30 focus:ring-2 focus:ring-[#159447]/10"
      />

      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black/35 transition hover:bg-black/[0.05] hover:text-black"
          aria-label="Clear search"
        >
          ×
        </button>
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

                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold backdrop-blur">
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