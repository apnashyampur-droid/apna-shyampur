"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  address: string | null;
  image_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  rating: number | null;
};

type FavouriteShop = Shop & {
  favouriteId: string;
};

export default function FavoritesPage() {
  const router = useRouter();

  const [shops, setShops] = useState<FavouriteShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavouriteShops = async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      /* GET CURRENT USER */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("GET USER ERROR:", userError);
        setShops([]);
        return;
      }

      /* NOT LOGGED IN */

      if (!user) {
        router.replace("/sign-in?redirect=/favorites");
        return;
      }

      /* GET USER FAVOURITES */

      const {
        data: favourites,
        error: favouritesError,
      } = await supabase
        .from("user_favourite_shops")
        .select("id, shop_id")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (favouritesError) {
        console.error(
          "FETCH FAVOURITES ERROR:",
          favouritesError
        );

        setShops([]);
        return;
      }

      /* NO FAVOURITES */

      if (!favourites || favourites.length === 0) {
        setShops([]);
        return;
      }

      /* GET SHOP IDS */

      const shopIds = favourites.map(
        (favourite) => favourite.shop_id
      );

      /* GET SHOPS */

      const {
        data: shopData,
        error: shopsError,
      } = await supabase
        .from("shops")
        .select(`
          id,
          name,
          slug,
          description,
          category,
          address,
          image_url,
          opening_time,
          closing_time,
          rating
        `)
        .in("id", shopIds)
        .eq("is_active", true);

      if (shopsError) {
        console.error(
          "FETCH FAVOURITE SHOPS ERROR:",
          shopsError
        );

        setShops([]);
        return;
      }

      if (!shopData) {
        setShops([]);
        return;
      }

      /* KEEP FAVOURITE ORDER */

      const favouriteShops: FavouriteShop[] = favourites
        .map((favourite) => {
          const shop = shopData.find(
            (item) => item.id === favourite.shop_id
          );

          if (!shop) return null;

          return {
            ...shop,
            favouriteId: favourite.id,
          };
        })
        .filter(
          (shop): shop is FavouriteShop => shop !== null
        );

      setShops(favouriteShops);
    } catch (error) {
      console.error(
        "FAVOURITE SHOPS ERROR:",
        error
      );

      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavouriteShops();
  }, []);

  /* REMOVE FAVOURITE */

  const handleRemoveFavourite = async (
    favouriteId: string,
    shopId: string
  ) => {
    if (removingId) return;

    setRemovingId(shopId);

    try {
      const supabase = createClient();

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/sign-in?redirect=/favorites");
        return;
      }

      const {
        error,
      } = await supabase
        .from("user_favourite_shops")
        .delete()
        .eq("id", favouriteId)
        .eq("user_id", user.id)
        .eq("shop_id", shopId);

      if (error) {
        console.error(
          "REMOVE FAVOURITE ERROR:",
          error
        );
        return;
      }

      setShops((current) =>
        current.filter(
          (shop) => shop.id !== shopId
        )
      );
    } catch (error) {
      console.error(
        "REMOVE FAVOURITE ERROR:",
        error
      );
    } finally {
      setRemovingId(null);
    }
  };

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

      <section className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">

        {/* TITLE */}

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#fff1f2] text-[#e5485d]">

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>

            </div>

            <div>

              <h1 className="text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
                Favorite Shops
              </h1>

            </div>

          </div>

          <p className="mt-4 max-w-[550px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
            Your favourite local shops, all in one place.
          </p>

        </div>


        {/* CONTENT */}

        {loading ? (

          /* LOADING */

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white"
              >

                <div className="h-[190px] animate-pulse bg-black/[0.05]" />

                <div className="space-y-3 p-5">

                  <div className="h-4 w-3/5 animate-pulse rounded-full bg-black/[0.06]" />

                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-black/[0.05]" />

                  <div className="h-3 w-2/5 animate-pulse rounded-full bg-black/[0.05]" />

                </div>

              </div>
            ))}

          </div>

        ) : shops.length === 0 ? (

          /* EMPTY STATE */

          <div className="mt-9 rounded-[28px] border border-black/[0.07] bg-white px-6 py-16 text-center shadow-[0_15px_50px_rgba(0,0,0,.04)] sm:px-10 sm:py-20">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff1f2] text-[#e5485d]">

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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>

            </div>

            <h2 className="mt-6 text-[20px] font-black tracking-[-0.04em]">
              No favorite shops yet
            </h2>

            <p className="mx-auto mt-2 max-w-[400px] text-[12px] leading-5 text-black/45">
              Save the local shops you love and find them here whenever you want to order again.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-7 rounded-full bg-[#111] px-5 py-3 text-[10px] font-black tracking-[0.03em] text-white transition hover:bg-black/80"
            >
              EXPLORE SHOPS
            </button>

          </div>

        ) : (

          /* SHOP GRID */

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {shops.map((shop) => (

              <article
                key={shop.id}
                className="group relative overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(0,0,0,.07)]"
              >

                {/* SHOP IMAGE */}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/view-shop/${encodeURIComponent(shop.slug)}`
                    )
                  }
                  className="relative block h-[190px] w-full overflow-hidden bg-[#e9ece8] text-left"
                >

                  {shop.image_url ? (

                    <img
                      src={shop.image_url}
                      alt={shop.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />

                  ) : (

                    <div className="flex h-full w-full items-center justify-center bg-[#eef1ed]">

                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[#159447]">

                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 10.5 5 4h14l2 6.5" />
                          <path d="M4 10.5v8.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" />
                          <path d="M3 10.5c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2" />
                        </svg>

                      </div>

                    </div>

                  )}

                  {/* IMAGE GRADIENT */}

                  <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/45 to-transparent" />

                  {/* CATEGORY */}

                  {shop.category && (

                    <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-white/90 px-3 py-1.5 text-[8px] font-black tracking-[0.04em] text-black backdrop-blur-md">
                      {shop.category}
                    </div>

                  )}

                </button>


                {/* FAVOURITE REMOVE */}

                <button
                  type="button"
                  onClick={() =>
                    handleRemoveFavourite(
                      shop.favouriteId,
                      shop.id
                    )
                  }
                  disabled={removingId === shop.id}
                  aria-label="Remove from favourites"
                  className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/90 text-[#e5485d] shadow-[0_5px_20px_rgba(0,0,0,.14)] backdrop-blur-md transition hover:bg-white active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {removingId === shop.id ? (

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5485d]/25 border-t-[#e5485d]" />

                  ) : (

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
                    </svg>

                  )}

                </button>


                {/* SHOP DETAILS */}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/view-shop/${encodeURIComponent(shop.slug)}`
                    )
                  }
                  className="block w-full px-5 pb-5 pt-4 text-left"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                     <h2 className="line-clamp-2 text-[14px] font-black leading-[1.3] tracking-[-0.025em]">
  {shop.name}
</h2>

                      {shop.address && (

                        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-4 text-black/40">

                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mt-[1px] shrink-0"
                          >
                            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                            <circle
                              cx="12"
                              cy="10"
                              r="2.5"
                            />
                          </svg>

                          <span className="line-clamp-2">
                            {shop.address}
                          </span>

                        </div>

                      )}

                    </div>

                    {/* RATING */}

                    {shop.rating !== null && (

                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#f5f6f4] px-2 py-1 text-[9px] font-black">

                        <span className="text-[#159447]">
                          ★
                        </span>

                        <span>
                          {Number(shop.rating).toFixed(1)}
                        </span>

                      </div>

                    )}

                  </div>


                  {/* OPENING HOURS */}

                  {(shop.opening_time ||
                    shop.closing_time) && (

                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-black/35">

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
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />
                        <path d="M12 7v5l3 2" />
                      </svg>

                      {shop.opening_time &&
                      shop.closing_time
                        ? `${shop.opening_time} – ${shop.closing_time}`
                        : "Shop hours available"}

                    </div>

                  )}

                </button>

              </article>

            ))}

          </div>

        )}

      </section>


      {/* FOOTER */}

      <footer className="border-t border-black/[0.07] bg-white">

        <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-baseline gap-[5px] text-[16px] font-black tracking-[-0.05em]">
              <span>
                APNA
              </span>

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