"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ShopDiscount = {
  id: string;
  title: string | null;
  description: string | null;
  discount_percent: number | null;
};

type ShopOffer = {
  id: string;
  title: string;
  description: string | null;
  offer_kind: "flat" | "buy_get" | "free_item" | null;
  offer_value: number | null;
  buy_quantity: number | null;
  get_quantity: number | null;
};

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
    activeDiscount: ShopDiscount | null;
  activeOffer: ShopOffer | null;
};

type Product = {
  id: string;
  shop_id: string;
  product_name: string;
  category: string;
  price: number;
  sale_price: number | null;
  description: string | null;
  available: boolean;
  image_url: string | null;
  created_at: string;
};

type Combo = {
  id: string;
  title: string;
  description: string | null;
  offer_price: number | null;
  original_price: number | null;
  product_ids: string[] | null;
  valid_from: string;
  valid_until: string;
  is_enabled: boolean;
};

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function ViewShopPage() {
  const router = useRouter();
  const params = useParams();

  const supabase = useMemo(() => createClient(), []);

  const slug = useMemo(() => {
    const value = params?.slug;

    if (Array.isArray(value)) {
      return value[0] ?? "";
    }

    return typeof value === "string" ? value : "";
  }, [params]);

const [shop, setShop] = useState<Shop | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [combos, setCombos] = useState<Combo[]>([]);

const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState("");

const [search, setSearch] = useState("");

const [discountRange, setDiscountRange] = useState<
  "1-25" | "25-50" | "50-75" | "75-100" | null
>(null);

const [showCombos, setShowCombos] = useState(false);

const [cart, setCart] = useState<Record<string, number>>({});

  /* ------------------------------------------------------------------------ */
  /* LOAD SHOP + PRODUCTS                                                     */
  /* ------------------------------------------------------------------------ */

  const loadShop = useCallback(
    async (showRefreshing = false) => {
      if (!slug) return;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /* ------------------------------------------------------------------ */
        /* SHOP                                                                */
        /* ------------------------------------------------------------------ */

        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select(
            `
              id,
              name,
              slug,
              description,
              category,
              image_url,
              address,
              opening_time,
              closing_time
            `
          )
          .eq("slug", slug)
          .maybeSingle();

        if (shopError) {
          console.error("Shop fetch error:", shopError);

          setError("We couldn't load this shop right now.");
          return;
        }

        if (!shopData) {
          setError("This shop could not be found.");
          return;
        }

        const currentShop = shopData as Omit<Shop, "activeDiscount">;

const now = new Date();

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(now);

const {
  data: discountData,
  error: discountError,
} = await supabase
  .from("shop_offers")
  .select(`
    id,
    shop_id,
    title,
    description,
    discount_percent
  `)
  .eq("shop_id", currentShop.id)
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
    "SHOP DISCOUNT FETCH ERROR:",
    discountError
  );
}

const activeDiscount: ShopDiscount | null =
  discountData && discountData.length > 0
    ? {
        id: discountData[0].id,
        title: discountData[0].title,
        description: discountData[0].description,
        discount_percent:
          discountData[0].discount_percent,
      }
    : null;

/* ------------------------------------------------------------------ */
/* ACTIVE OFFER                                                       */
/* ------------------------------------------------------------------ */

const {
  data: offerData,
  error: offerError,
} = await supabase
  .from("shop_offers")
  .select(`
    id,
    title,
    description,
    offer_kind,
    offer_value,
    buy_quantity,
    get_quantity
  `)
  .eq("shop_id", currentShop.id)
  .eq("type", "offer")
  .eq("is_enabled", true)
  .lte("valid_from", today)
  .gte("valid_until", today)
  .order("created_at", {
    ascending: false,
  });

if (offerError) {
  console.error(
    "SHOP OFFER FETCH ERROR:",
    offerError
  );
}

const activeOffer: ShopOffer | null =
  offerData && offerData.length > 0
    ? {
        id: offerData[0].id,
        title: offerData[0].title,
        description: offerData[0].description,
        offer_kind: offerData[0].offer_kind,
        offer_value: offerData[0].offer_value,
        buy_quantity: offerData[0].buy_quantity,
        get_quantity: offerData[0].get_quantity,
      }
    : null;

const shopWithDiscount: Shop = {
  ...currentShop,
  activeDiscount,
  activeOffer,
};

setShop(shopWithDiscount);

        /* ------------------------------------------------------------------ */
        /* PRODUCTS                                                            */
        /* ------------------------------------------------------------------ */

        const {
          data: productData,
          error: productsError,
        } = await supabase
          .from("products")
          .select(
            `
              id,
              shop_id,
              product_name,
              category,
              price,
              sale_price,
              description,
              available,
              image_url,
              created_at
            `
          )
          .eq("shop_id", currentShop.id)
          .eq("available", true)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Products fetch error:", productsError);

          setError(
            "We couldn't load this shop's products right now."
          );

          return;
        }

        setProducts((productData ?? []) as Product[]);

/* ------------------------------------------------------------------ */
/* COMBOS                                                              */
/* ------------------------------------------------------------------ */

const {
  data: comboData,
  error: combosError,
} = await supabase
  .from("shop_offers")
  .select(
    `
      id,
      title,
      description,
      offer_price,
      original_price,
      product_ids,
      valid_from,
      valid_until,
      is_enabled
    `
  )
  .eq("shop_id", currentShop.id)
  .eq("type", "combo")
  .eq("is_enabled", true)
  .order("created_at", { ascending: false });

if (combosError) {
  console.error("Combos fetch error:", combosError);
} else {
  setCombos((comboData ?? []) as Combo[]);
}
      } catch (err) {
        console.error("View shop error:", err);

        setError(
          "Something went wrong while loading this shop."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug, supabase]
  );

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const filteredProducts = useMemo(() => {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const productName =
      product.product_name?.toLowerCase() ?? "";

    const productCategory =
      product.category?.toLowerCase() ?? "";

    const description =
      product.description?.toLowerCase() ?? "";

    const price = Number(product.price);
    const salePrice =
      product.sale_price !== null
        ? Number(product.sale_price)
        : null;

    const hasDiscount =
      salePrice !== null &&
      price > 0 &&
      salePrice < price;

    const discountPercent = hasDiscount
      ? Math.round(
          ((price - salePrice) / price) * 100
        )
      : 0;

    const matchesSearch =
      !normalizedSearch ||
      productName.includes(normalizedSearch) ||
      productCategory.includes(normalizedSearch) ||
      description.includes(normalizedSearch);

    let matchesDiscount = true;

    if (discountRange !== null) {
      if (!hasDiscount) {
        matchesDiscount = false;
      } else {
        switch (discountRange) {
          case "1-25":
            matchesDiscount =
              discountPercent >= 1 &&
              discountPercent <= 25;
            break;

          case "25-50":
            matchesDiscount =
              discountPercent > 25 &&
              discountPercent <= 50;
            break;

          case "50-75":
            matchesDiscount =
              discountPercent > 50 &&
              discountPercent <= 75;
            break;

          case "75-100":
            matchesDiscount =
              discountPercent > 75 &&
              discountPercent <= 100;
            break;
        }
      }
    }

    return matchesSearch && matchesDiscount;
  });
}, [products, search, discountRange]);

const todayIST = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(new Date());

const activeCombos = useMemo(() => {
  return combos.filter((combo) => {
    return (
      combo.valid_from <= todayIST &&
      combo.valid_until >= todayIST
    );
  });
}, [combos, todayIST]);

const filteredCombos = useMemo(() => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return activeCombos;
  }

  return activeCombos.filter((combo) => {
    const title =
      combo.title?.toLowerCase() ?? "";

    const description =
      combo.description?.toLowerCase() ?? "";

    return (
      title.includes(normalizedSearch) ||
      description.includes(normalizedSearch)
    );
  });
}, [activeCombos, search]);

  /* ------------------------------------------------------------------------ */
  /* SHOP OPEN/CLOSE                                                          */
  /* ------------------------------------------------------------------------ */

  const shopOpen = useMemo(() => {
    if (!shop?.opening_time || !shop?.closing_time) {
      return null;
    }

    return isShopOpen(
      shop.opening_time,
      shop.closing_time
    );
  }, [shop]);

  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <ShopPageSkeleton />;
  }

  /* ------------------------------------------------------------------------ */
  /* ERROR                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error || !shop) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader />

        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[700px] items-center justify-center px-5 py-10">
          <div className="w-full rounded-[28px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.05)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff4e5] text-[#c87900]">
              <WarningIcon />
            </div>

            <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]">
              Shop unavailable
            </h1>

            <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-5 text-black/45">
              {error ||
                "This shop is currently unavailable."}
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => loadShop()}
                className="rounded-[14px] bg-[#159447] px-6 py-3 text-[10px] font-black text-white transition hover:bg-[#117d3c]"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-[14px] border border-black/[0.08] bg-white px-6 py-3 text-[10px] font-black text-black/55 transition hover:border-black/[0.14] hover:text-black"
              >
                Go Back
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* MAIN                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      <ShopHeader />

      {/* ==================================================================== */}
      {/* SHOP HERO                                                             */}
      {/* ==================================================================== */}

      <section className="mx-auto w-full max-w-[1400px] px-5 pt-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(0,0,0,.045)]">

          {/* HERO VISUAL */}

          <div className="relative h-[250px] overflow-hidden sm:h-[310px] lg:h-[350px]">

            {shop.image_url ? (
              <img
                src={shop.image_url}
                alt={shop.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#e9eee9] via-[#f3f5f3] to-[#e5ebe6]">
                <StoreIcon large />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/5" />

<div className="absolute right-2.5 top-2.5 z-20 flex w-[145px] flex-col items-end gap-1 sm:right-7 sm:top-7 sm:w-auto sm:gap-1.5">

  {shop.activeDiscount &&
    shop.activeDiscount.discount_percent !== null && (
      <div className="w-full sm:w-auto sm:max-w-[280px]">
  <div className="rounded-[12px] border border-white/20 bg-black/45 px-2 py-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,.22)] backdrop-blur-xl sm:rounded-[18px] sm:px-4 sm:py-3.5">
          <div className="flex items-center gap-1.5">

           <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white sm:h-7 sm:w-7">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z" />
                <circle cx="7.5" cy="7.5" r="1" />
              </svg>
            </div>

            <span className="text-[7px] font-black uppercase tracking-[0.12em] text-white/70">
              Special offer
            </span>

          </div>

          <div className="mt-1 text-[18px] font-black leading-none tracking-[-0.05em] sm:mt-2 sm:text-[26px]">
            {shop.activeDiscount.discount_percent}% OFF
          </div>

          {shop.activeDiscount.title && (
            <div className="mt-1 text-[9px] font-black leading-3.5 tracking-[-0.01em] text-white sm:mt-1.5 sm:text-[13px] sm:leading-4">
              {shop.activeDiscount.title}
            </div>
          )}

          {shop.activeDiscount.description && (
            <div className="mt-0.5 max-w-[165px] text-[8px] font-medium leading-3 text-white/65 sm:mt-1 sm:max-w-[240px] sm:text-[10px] sm:leading-4">
              {shop.activeDiscount.description}
            </div>
          )}

        </div>
      </div>
    )}

  {shop.activeOffer && (
    <div className="w-[155px] sm:w-[175px]">
      <div className="rounded-[13px] border border-white/20 bg-white/92 px-2.5 py-2 text-black shadow-[0_8px_25px_rgba(0,0,0,.14)] backdrop-blur-xl sm:px-3 sm:py-2.5">

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
              <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35a2 2 0 0 0 0-2.83Z" />
              <circle cx="7.5" cy="7.5" r="1" />
            </svg>
          </div>

          <span className="text-[7.5px] font-black uppercase tracking-[0.11em] text-[#159447]">
            Special Deal
          </span>

        </div>

        {shop.activeOffer.offer_kind === "flat" &&
          shop.activeOffer.offer_value !== null && (
            <div className="mt-1 text-[14px] font-black leading-none tracking-[-0.03em] sm:text-[15px]">
              ₹{shop.activeOffer.offer_value} OFF
            </div>
          )}

        {shop.activeOffer.offer_kind === "buy_get" &&
          shop.activeOffer.buy_quantity !== null &&
          shop.activeOffer.get_quantity !== null && (
            <div className="mt-1 text-[11px] font-black leading-3.5 sm:text-[12px]">
              BUY {shop.activeOffer.buy_quantity} GET{" "}
              {shop.activeOffer.get_quantity}
            </div>
          )}

        {shop.activeOffer.offer_kind === "free_item" && (
          <div className="mt-1 text-[11px] font-black leading-3.5 sm:text-[12px]">
            FREE ITEM
          </div>
        )}

       {shop.activeOffer.title && (
  <div className="mt-1 text-[8.5px] font-black leading-3.5 text-black sm:text-[9px]">
    {shop.activeOffer.title}
  </div>
)}

{shop.activeOffer.description && (
  <div className="mt-0.5 max-w-[135px] text-[8px] font-medium leading-3 text-black/55 sm:mt-1 sm:max-w-[150px] sm:text-[9px] sm:leading-3.5">
    {shop.activeOffer.description}
  </div>
)}

      </div>
    </div>
  )}

</div>

            {/* SHOP INFORMATION */}

            <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
           
<div className="flex items-center gap-2.5">

  {shop.category && (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
      {shop.category}
    </span>
  )}

  {shopOpen !== null && (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[8px] font-bold tracking-[0.08em] backdrop-blur-md ${
        shopOpen
          ? "border-[#b7efc9]/25 bg-[#159447]/80 text-white"
          : "border-white/20 bg-black/30 text-white/80"
      }`}
    >
     <span
  className={`h-1.5 w-1.5 rounded-full ${
    shopOpen
      ? "bg-[#b7efc9] shadow-[0_0_7px_rgba(183,239,201,.75)]"
      : "bg-[#ef4444] shadow-[0_0_7px_rgba(239,68,68,.75)]"
  }`}
/>

      {shopOpen ? "OPEN NOW" : "CLOSED"}
    </span>
  )}

</div>


              <h1 className="mt-3 text-[30px] font-black leading-none tracking-[-0.05em] text-white sm:text-[42px]">
                {shop.name}
              </h1>

              {shop.address && (
                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-medium text-white/75 sm:text-[10px]">
                  <LocationIcon />

                  <span className="line-clamp-1">
                    {shop.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SHOP SUMMARY */}

          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="max-w-[720px] text-[11px] leading-5 text-black/45 sm:text-[12px]">
                {shop.description ||
                  "Discover products available at this local shop."}
              </p>
            </div>

           <div className="flex items-center gap-2 text-[9px] font-black leading-none text-black/45">
  <span className="flex shrink-0 items-center justify-center">
    <ProductsIcon />
  </span>

  <span className="leading-none">
    {products.length}{" "}
    {products.length === 1
      ? "product"
      : "products"}
  </span>
</div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* PRODUCTS SECTION                                                      */}
      {/* ==================================================================== */}

      <section className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]">
              SHOP CATALOGUE
            </div>

            <h2 className="mt-2 text-[28px] font-black leading-none tracking-[-0.05em] sm:text-[34px]">
              Products
            </h2>

            <p className="mt-2 text-[10px] leading-5 text-black/40 sm:text-[11px]">
              Browse products currently available at{" "}
              {shop.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadShop(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[12px] border border-black/[0.08] bg-white px-4 text-[9px] font-black text-black/50 transition hover:border-black/[0.14] hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshIcon
              className={
                refreshing
                  ? "animate-spin"
                  : undefined
              }
            />

            {refreshing
              ? "Refreshing"
              : "Refresh"}
          </button>
        </div>

{/* SEARCH + FILTER */}

{(products.length > 0 || activeCombos.length > 0) && (
  <section className="mt-6 rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,.03)] sm:p-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

      {/* SEARCH */}

      <div className="relative min-w-0 flex-1">
        <SearchIcon />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={
            showCombos
              ? "Search combos..."
              : "Search products..."
          }
          className="h-[42px] w-full rounded-[12px] border border-black/[0.08] bg-[#fafafa] py-2.5 pl-10 pr-4 text-[10px] font-medium text-black outline-none transition placeholder:text-black/25 focus:border-[#159447]/45 focus:bg-white"
        />
      </div>

      {/* COMBOS BUTTON */}

      <button
        type="button"
        onClick={() => {
          setShowCombos((current) => !current);
          setSearch("");
          setDiscountRange(null);
        }}
        className={`inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-[12px] border px-4 text-[9px] font-black transition ${
          showCombos
            ? "border-[#159447]/30 bg-[#eef8f1] text-[#159447]"
            : "border-black/[0.08] bg-white text-black/60 hover:border-[#159447]/30 hover:text-[#159447]"
        }`}
      >
        <ComboIcon />

        {showCombos ? "Products" : "Combos"}

        {!showCombos && activeCombos.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#159447] px-1 text-[7px] text-white">
            {activeCombos.length}
          </span>
        )}
      </button>

      {/* DISCOUNT FILTER */}

      {!showCombos && (
        <div className="relative shrink-0">
          <div
            className={`pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 ${
              discountRange !== null
                ? "text-[#159447]"
                : "text-black/45"
            }`}
          >
            <DiscountIcon />
          </div>

          <select
            value={discountRange ?? ""}
            onChange={(event) => {
              const value = event.target.value;

              setDiscountRange(
                value === ""
                  ? null
                  : (value as
                      | "1-25"
                      | "25-50"
                      | "50-75"
                      | "75-100")
              );
            }}
            className={`h-[42px] w-full appearance-none rounded-[12px] border pl-10 pr-10 text-[9px] font-black outline-none transition lg:w-[180px] ${
              discountRange !== null
                ? "border-[#159447]/45 bg-white text-[#159447] shadow-[0_0_0_3px_rgba(21,148,71,.06)]"
                : "border-black/[0.08] bg-white text-black/60 hover:border-[#159447]/35"
            }`}
          >
            <option value="">Discounts Off</option>
            <option value="1-25">1–25% OFF</option>
            <option value="25-50">25–50% OFF</option>
            <option value="50-75">50–75% OFF</option>
            <option value="75-100">75–100% OFF</option>
          </select>

          <ChevronDownIcon
            className={
              discountRange !== null
                ? "text-[#159447]/70"
                : undefined
            }
          />
        </div>
      )}

    </div>
  </section>
)}

        {/* RESULT COUNT */}

{(showCombos
  ? activeCombos.length > 0
  : products.length > 0) && (
  <div className="mt-6 flex items-center justify-between gap-4">
    <div>
      <span className="text-[10px] font-black text-black/65">
        {showCombos
          ? filteredCombos.length
          : filteredProducts.length}
      </span>{" "}
      <span className="text-[10px] font-medium text-black/35">
        {showCombos
          ? filteredCombos.length === 1
            ? "combo"
            : "combos"
          : filteredProducts.length === 1
          ? "product"
          : "products"}
      </span>
    </div>

    {(search || discountRange !== null) && (
      <button
        type="button"
        onClick={() => {
          setSearch("");
          setDiscountRange(null);
        }}
        className="text-[9px] font-black text-[#159447] transition hover:text-[#117d3c]"
      >
        Clear filters
      </button>
    )}
  </div>
)}

{/* PRODUCTS / COMBOS */}

{showCombos ? (
  activeCombos.length === 0 ? (
    <EmptyShopCombos />
  ) : filteredCombos.length === 0 ? (
    <NoComboResults
      onClear={() => setSearch("")}
    />
  ) : (
    <div className="mt-4 space-y-4">
      {filteredCombos.map((combo) => {
        const comboProducts = (combo.product_ids ?? [])
          .map((productId) =>
            products.find(
              (product) => product.id === productId
            )
          )
          .filter(
            (product): product is Product =>
              Boolean(product)
          );

        return (
          <ComboCard
            key={combo.id}
            combo={combo}
            products={comboProducts}
          />
        );
      })}
    </div>
  )
) : products.length === 0 ? (
  <EmptyShopProducts
    shopName={shop.name}
  />
) : filteredProducts.length === 0 ? (
  <NoProductResults
    onClear={() => {
      setSearch("");
      setDiscountRange(null);
    }}
  />
) : (
  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
    {filteredProducts.map((product) => (
      <ProductCard
        key={product.id}
        product={product}
        quantity={cart[product.id] ?? 0}
        onAdd={() =>
          setCart((current) => ({
            ...current,
            [product.id]:
              (current[product.id] ?? 0) + 1,
          }))
        }
        onIncrease={() =>
          setCart((current) => ({
            ...current,
            [product.id]:
              (current[product.id] ?? 0) + 1,
          }))
        }
        onDecrease={() =>
          setCart((current) => {
            const currentQuantity =
              current[product.id] ?? 0;

            if (currentQuantity <= 1) {
              const next = { ...current };
              delete next[product.id];
              return next;
            }

            return {
              ...current,
              [product.id]:
                currentQuantity - 1,
            };
          })
        }
      />
    ))}
  </div>
)}

               <div className="h-10" />
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

/* ========================================================================== */
/* COMBO CARD                                                                 */
/* ========================================================================== */

function ComboCard({
  combo,
  products,
}: {
  combo: Combo;
  products: Product[];
}) {
  const hasOriginalPrice =
    combo.original_price !== null &&
    combo.offer_price !== null &&
    Number(combo.original_price) >
      Number(combo.offer_price);

  const discount = hasOriginalPrice
    ? Math.round(
        ((Number(combo.original_price) -
          Number(combo.offer_price)) /
          Number(combo.original_price)) *
          100
      )
    : 0;

  return (
    <article className="overflow-hidden rounded-[22px] border border-black/[0.07] bg-white shadow-[0_12px_40px_rgba(0,0,0,.035)]">
      <div className="flex flex-col sm:flex-row">

        {/* COMBO PRODUCTS */}

        <div className="flex shrink-0 gap-2 overflow-x-auto bg-[#f7f8f7] p-3 sm:w-[330px] sm:gap-2.5 sm:p-4">
          {products.length > 0 ? (
            products.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[14px] bg-white sm:h-[105px] sm:w-[105px]"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-black/15">
                    <ImagePlaceholderIcon />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex h-[82px] w-full items-center justify-center text-black/20 sm:h-[105px]">
              <ComboIcon large />
            </div>
          )}
        </div>

        {/* COMBO INFORMATION */}

        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-6">

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef8f1] px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#159447]">
              <ComboIcon />
              Combo
            </span>

            {discount > 0 && (
              <span className="rounded-full bg-[#159447] px-2.5 py-1.5 text-[7px] font-black text-white">
                {discount}% OFF
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate text-[18px] font-black tracking-[-0.04em] sm:text-[21px]">
            {combo.title}
          </h3>

          {combo.description && (
            <p className="mt-1.5 line-clamp-2 max-w-[650px] text-[9px] leading-5 text-black/40 sm:text-[10px]">
              {combo.description}
            </p>
          )}

          {products.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {products.map((product) => (
                <span
                  key={product.id}
                  className="rounded-full border border-black/[0.07] bg-[#fafafa] px-2.5 py-1 text-[7px] font-bold text-black/50"
                >
                  {product.product_name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-end gap-2">
            {combo.offer_price !== null && (
              <span className="text-[18px] font-black tracking-[-0.04em]">
                ₹{formatPrice(Number(combo.offer_price))}
              </span>
            )}

            {hasOriginalPrice && (
              <span className="pb-[1px] text-[9px] font-semibold text-black/30 line-through">
                ₹{formatPrice(Number(combo.original_price))}
              </span>
            )}
          </div>

        </div>
      </div>
    </article>
  );
}

/* ========================================================================== */
/* PRODUCT CARD                                                               */
/* ========================================================================== */

function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
}: {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  const hasSale =
    product.sale_price !== null &&
    Number(product.sale_price) <
      Number(product.price);

  const discount = hasSale
    ? Math.round(
        ((Number(product.price) -
          Number(product.sale_price)) /
          Number(product.price)) *
          100
      )
    : 0;

  return (
    <article className="group overflow-hidden rounded-[20px] border border-black/[0.07] bg-white shadow-[0_12px_40px_rgba(0,0,0,.035)] transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_55px_rgba(0,0,0,.07)] sm:rounded-[24px]">

      <div className="relative aspect-square overflow-hidden bg-[#f0f1f0]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-black/15">
            <ImagePlaceholderIcon />
          </div>
        )}

        {product.category && (
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3">
            <span className="rounded-full border border-white/30 bg-white/90 px-2.5 py-1.5 text-[7px] font-black text-black/55 shadow-sm backdrop-blur-md sm:text-[8px]">
              {product.category}
            </span>
          </div>
        )}

        {hasSale && (
          <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3">
            <span className="rounded-full bg-[#159447] px-2.5 py-1.5 text-[7px] font-black text-white shadow-sm sm:text-[8px]">
              {discount}% OFF
            </span>
          </div>
        )}
      </div>

      <div className="p-3.5 sm:p-5">
        <h3 className="truncate text-[13px] font-black tracking-[-0.03em] sm:text-[16px]">
          {product.product_name}
        </h3>

        <p className="mt-1.5 line-clamp-2 min-h-[28px] text-[8px] leading-4 text-black/40 sm:min-h-[32px] sm:text-[9px]">
          {product.description ||
            "Fresh and available from this shop."}
        </p>

        <div className="mt-3.5 flex items-end gap-2 sm:mt-4">
          {hasSale ? (
            <>
              <span className="text-[15px] font-black tracking-[-0.03em] sm:text-[18px]">
                ₹
                {formatPrice(
                  Number(product.sale_price)
                )}
              </span>

              <span className="pb-[1px] text-[8px] font-semibold text-black/30 line-through sm:text-[10px]">
                ₹
                {formatPrice(
                  Number(product.price)
                )}
              </span>
            </>
          ) : (
            <span className="text-[15px] font-black tracking-[-0.03em] sm:text-[18px]">
              ₹
              {formatPrice(
                Number(product.price)
              )}
            </span>
          )}
        </div>

        {/* ADD TO CART / QUANTITY */}

        <div className="mt-4">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#159447] text-[9px] font-black text-white shadow-[0_8px_20px_rgba(21,148,71,.16)] transition hover:bg-[#117d3c] active:scale-[0.98]"
            >
              <CartIcon />
              Add to cart
            </button>
          ) : (
            <div className="flex h-[40px] w-full items-center justify-between rounded-[12px] border border-[#159447]/20 bg-[#eef8f1] px-1.5">
              <button
                type="button"
                onClick={onDecrease}
                aria-label={`Decrease ${product.product_name} quantity`}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] bg-white text-[#159447] shadow-sm transition hover:bg-[#159447] hover:text-white active:scale-95"
              >
                <MinusIcon />
              </button>

              <div className="flex items-center gap-1">
                <span className="text-[12px] font-black text-[#159447]">
                  {quantity}
                </span>

                <span className="text-[8px] font-bold text-[#159447]/55">
                  added
                </span>
              </div>

              <button
                type="button"
                onClick={onIncrease}
                aria-label={`Increase ${product.product_name} quantity`}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] bg-[#159447] text-white shadow-sm transition hover:bg-[#117d3c] active:scale-95"
              >
                <PlusIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ========================================================================== */
/* EMPTY PRODUCTS                                                             */
/* ========================================================================== */

function EmptyShopProducts({
  shopName,
}: {
  shopName: string;
}) {
  return (
    <section className="mt-6 rounded-[26px] border border-black/[0.07] bg-white px-6 py-16 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:px-10 sm:py-20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#eef5ef] text-[#159447]">
        <ProductsIcon large />
      </div>

      <h2 className="mt-6 text-[21px] font-black tracking-[-0.04em]">
        No products available
      </h2>

      <p className="mx-auto mt-2 max-w-[430px] text-[10px] leading-5 text-black/40">
       {shopName} hasn’t added any products yet. Please check back soon to see what’s available.
      </p>
    </section>
  );
}

/* ========================================================================== */
/* EMPTY COMBOS                                                               */
/* ========================================================================== */

function EmptyShopCombos() {
  return (
    <section className="mt-6 rounded-[26px] border border-black/[0.07] bg-white px-6 py-16 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:px-10 sm:py-20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#eef5ef] text-[#159447]">
        <ComboIcon large />
      </div>

      <h2 className="mt-6 text-[21px] font-black tracking-[-0.04em]">
        No combos available
      </h2>

      <p className="mx-auto mt-2 max-w-[430px] text-[10px] leading-5 text-black/40">
        This shop hasn't added any active combos yet.
        Please check back soon.
      </p>
    </section>
  );
}

/* ========================================================================== */
/* NO COMBO RESULTS                                                           */
/* ========================================================================== */

function NoComboResults({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <section className="mt-6 rounded-[26px] border border-black/[0.07] bg-white px-6 py-16 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:py-20">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/[0.035] text-black/35">
        <SearchIcon large />
      </div>

      <h2 className="mt-5 text-[19px] font-black tracking-[-0.04em]">
        No matching combos
      </h2>

      <p className="mx-auto mt-2 max-w-[380px] text-[10px] leading-5 text-black/40">
        We couldn't find any combos matching your search.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-[12px] border border-black/[0.08] bg-white px-5 py-2.5 text-[9px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black"
      >
        Clear Search
      </button>
    </section>
  );
}

/* ========================================================================== */
/* NO SEARCH RESULTS                                                          */
/* ========================================================================== */

function NoProductResults({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <section className="mt-6 rounded-[26px] border border-black/[0.07] bg-white px-6 py-16 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:py-20">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/[0.035] text-black/35">
        <SearchIcon large />
      </div>

      <h2 className="mt-5 text-[19px] font-black tracking-[-0.04em]">
        No matching products
      </h2>

      <p className="mx-auto mt-2 max-w-[380px] text-[10px] leading-5 text-black/40">
        We couldn't find any products matching
        your search or selected category.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-[12px] border border-black/[0.08] bg-white px-5 py-2.5 text-[9px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black"
      >
        Clear Filters
      </button>
    </section>
  );
}

/* ========================================================================== */
/* HEADER                                                                     */
/* ========================================================================== */

function ShopHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
            AS
          </div>

          <div className="leading-none">
            <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
              <span>APNA</span>
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
  );
}

function DiscountIcon() {
  return (
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
      <path d="M20 12 12 20l-8-8V4h8l8 8Z" />
      <circle cx="8" cy="8" r="1.2" />
    </svg>
  );
}

/* ========================================================================== */
/* SKELETON                                                                   */
/* ========================================================================== */

function ShopPageSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-[#f5f6f4]">
      <ShopHeader />

      <section className="mx-auto w-full max-w-[1400px] px-5 pt-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[28px] bg-white">
          <div className="h-[250px] bg-black/[0.06] sm:h-[310px] lg:h-[350px]" />

          <div className="space-y-3 p-6">
            <div className="h-3 w-24 rounded-full bg-black/[0.06]" />
            <div className="h-5 w-64 rounded-full bg-black/[0.07]" />
            <div className="h-3 w-full max-w-[600px] rounded-full bg-black/[0.05]" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="h-4 w-32 rounded-full bg-black/[0.06]" />

        <div className="mt-3 h-9 w-40 rounded-xl bg-black/[0.07]" />

        <div className="mt-6 h-20 rounded-[22px] bg-white" />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
            (item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[22px] bg-white"
              >
                <div className="aspect-square bg-black/[0.05]" />

                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 rounded-full bg-black/[0.06]" />
                  <div className="h-3 w-1/2 rounded-full bg-black/[0.05]" />
                  <div className="h-5 w-20 rounded-full bg-black/[0.07]" />
                </div>
              </div>
            )
          )}
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

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function formatPrice(value: number) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function isShopOpen(
  openingTime: string,
  closingTime: string
) {
  const now = new Date();

  const currentTime =
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

  const [
    currentHour,
    currentMinute,
  ] = currentTime.split(":").map(Number);

  const currentMinutes =
    currentHour * 60 + currentMinute;

  const [
    openingHour,
    openingMinute,
  ] = openingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [
    closingHour,
    closingMinute,
  ] = closingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const openingMinutes =
    openingHour * 60 + openingMinute;

  const closingMinutes =
    closingHour * 60 + closingMinute;

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

/* ========================================================================== */
/* ICONS                                                                      */
/* ========================================================================== */

function ArrowLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
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
  );
}

function StoreIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 46 : 20;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10v10h16V10" />
      <path d="M3 10 5 4h14l2 6" />
      <path d="M3 10c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3" />
      <path d="M9 20v-4h6v4" />
    </svg>
  );
}

function ProductsIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 25 : 18;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

function ComboIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 24 : 13;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3h8l3 5-7 13L5 8l3-5Z" />
      <path d="M5 8h14" />
      <path d="M8 3l4 5 4-5" />
      <path d="m9 13 3 3 3-3" />
    </svg>
  );
}

function SearchIcon({
  large = false,
}: {
  large?: boolean;
}) {
  const size = large ? 22 : 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        large
          ? ""
          : "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30"
      }
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ChevronDownIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
        className || "text-black/35"
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function RefreshIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.9-4" />
      <path d="M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.9 4" />
      <path d="M20 20v-5h-5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      width="32"
      height="32"
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
  );
}

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