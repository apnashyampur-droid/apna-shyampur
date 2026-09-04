"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OfferType = "discount" | "combo" | "offer";

type OfferStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "disabled";

type Offer = {
  id: string;
  type: OfferType;
  title: string;
  description: string;
  discountPercent?: number;
  offerPrice?: number;
  originalPrice?: number;
  productIds?: string[];
  validFrom: string;
  validUntil: string;
  status: OfferStatus;
  usage: number;
  isEnabled: boolean;
};

type Shop = {
  id: string;
  user_id: string;
};

type OfferRow = {
  id: string;
  shop_id: string;
  user_id: string;
  type: OfferType;
  title: string;
  description: string | null;
  discount_percent: number | null;
  offer_price: number | null;
  original_price: number | null;
  product_ids: string[] | null;
  valid_from: string;
  valid_until: string;
  is_enabled: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  shop_id: string;
  product_name: string;
  price: number;
  image_url: string | null;
  available: boolean;
};

const supabase = createClient();

function getTodayIST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function addMonthsToDate(
  dateString: string,
  months: number
) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCMonth(
    date.getUTCMonth() + months
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function addDaysToDate(
  dateString: string,
  days: number
) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function getOfferStatus(
  validFrom: string,
  validUntil: string,
  isEnabled: boolean
): OfferStatus {
  if (!isEnabled) {
    return "disabled";
  }

  const today = getTodayIST();

  if (validFrom > today) {
    return "scheduled";
  }

  if (validUntil < today) {
    return "expired";
  }

  return "active";
}

function mapOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description:
      row.description ||
      "Special offer for customers.",
    discountPercent:
      row.discount_percent ?? undefined,
    offerPrice:
      row.offer_price ?? undefined,
    originalPrice:
      row.original_price ?? undefined,
    productIds:
      row.product_ids ?? [],
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: getOfferStatus(
      row.valid_from,
      row.valid_until,
      row.is_enabled
    ),
    usage: row.usage_count,
    isEnabled: row.is_enabled,
  };
}

export default function DiscountsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "all" | OfferType
  >("all");

  const [offers, setOffers] = useState<Offer[]>([]);

  const [shop, setShop] = useState<Shop | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [editingOfferId, setEditingOfferId] =
    useState<string | null>(null);

  const [selectedType, setSelectedType] =
    useState<OfferType>("discount");

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [discountPercent, setDiscountPercent] =
    useState("");

  const [offerPrice, setOfferPrice] = useState("");

  const [originalPrice, setOriginalPrice] =
    useState("");

    const [products, setProducts] =
  useState<Product[]>([]);

const [productSearch, setProductSearch] =
  useState("");

const [selectedProductIds, setSelectedProductIds] =
  useState<string[]>([]);

  const [validFrom, setValidFrom] = useState("");

  const [validUntil, setValidUntil] =
    useState("");

  /* ---------------------------------------------------------------------- */
  /* LOAD SHOP + OFFERS                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/signin");
          return;
        }

        const {
          data: shopData,
          error: shopError,
        } = await supabase
          .from("shops")
          .select("id, user_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (shopError) {
          throw shopError;
        }

        if (!shopData) {
          setShop(null);
          setOffers([]);
          setError(
            "Your shop could not be found."
          );
          return;
        }

        const currentShop =
          shopData as Shop;

        const {
          data: offerRows,
          error: offersError,
        } = await supabase
          .from("shop_offers")
          .select("*")
          .eq(
            "shop_id",
            currentShop.id
          )
          .order("created_at", {
            ascending: false,
          });

        if (offersError) {
          throw offersError;
        }

        if (!mounted) return;

        setShop(currentShop);

      const {
  data: productRows,
  error: productsError,
} = await supabase
  .from("products")
  .select(
    "id, shop_id, product_name, price, image_url, available"
  )
  .eq("shop_id", currentShop.id)
  .eq("available", true)
  .order("product_name", {
    ascending: true,
  });

if (productsError) {
  throw productsError;
}

if (!mounted) return;

setProducts(
  (productRows || []) as Product[]
);

        setOffers(
          ((offerRows || []) as OfferRow[]).map(
            mapOffer
          )
        );
      } catch (err) {
        console.error(
          "Failed to load promotions:",
          err
        );

        if (!mounted) return;

        setError(
          "Something went wrong while loading your offers."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* ---------------------------------------------------------------------- */
  /* KEEP DATE STATUS FRESH                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOffers((current) =>
        current.map((offer) => ({
          ...offer,
          status: getOfferStatus(
            offer.validFrom,
            offer.validUntil,
            offer.isEnabled
          ),
        }))
      );
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* FILTER                                                                  */
  /* ---------------------------------------------------------------------- */

  const filteredOffers = useMemo(() => {
    if (activeTab === "all") {
      return offers;
    }

    return offers.filter(
      (offer) =>
        offer.type === activeTab
    );
  }, [offers, activeTab]);

const filteredProducts = useMemo(() => {
  const query = productSearch
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (!query) {
    return products;
  }

  return products.filter((product) => {
    const productName = String(product.product_name ?? "")
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    return productName.includes(query);
  });
}, [products, productSearch]);

  /* ---------------------------------------------------------------------- */
  /* OVERVIEW                                                                */
  /* ---------------------------------------------------------------------- */

  const activeCount = offers.filter(
    (offer) => offer.status === "active"
  ).length;

  const scheduledCount = offers.filter(
    (offer) => offer.status === "scheduled"
  ).length;

  const totalRedemptions =
    offers.reduce(
      (sum, offer) =>
        sum + offer.usage,
      0
    );

  /* ---------------------------------------------------------------------- */
  /* FORM RESET                                                              */
  /* ---------------------------------------------------------------------- */

  function resetForm() {
    setEditingOfferId(null);

    setSelectedType("discount");

    setTitle("");

    setDescription("");

    setDiscountPercent("");

    setOfferPrice("");

    setOriginalPrice("");

    setSelectedProductIds([]);

    setProductSearch("");

    setValidFrom("");

    setValidUntil("");

    setError("");
  }

  function toggleProductSelection(
  productId: string
) {
  setSelectedProductIds((current) => {
    if (current.includes(productId)) {
      return current.filter(
        (id) => id !== productId
      );
    }

    return [...current, productId];
  });
}

  function closeCreate() {
    setShowCreate(false);

    resetForm();
  }

  /* ---------------------------------------------------------------------- */
  /* EDIT                                                                    */
  /* ---------------------------------------------------------------------- */

  function startEditOffer(
    offer: Offer
  ) {
    setEditingOfferId(offer.id);

    setSelectedType(offer.type);

    setTitle(offer.title);

    setDescription(
      offer.description || ""
    );

    setDiscountPercent(
      offer.discountPercent
        ? String(offer.discountPercent)
        : ""
    );

    setOfferPrice(
      offer.offerPrice
        ? String(offer.offerPrice)
        : ""
    );

    setOriginalPrice(
      offer.originalPrice
        ? String(offer.originalPrice)
        : ""
    );

    setValidFrom(offer.validFrom);

    setValidUntil(offer.validUntil);

    setError("");

    setShowCreate(true);
  }

  /* ---------------------------------------------------------------------- */
  /* CREATE / UPDATE                                                         */
  /* ---------------------------------------------------------------------- */

  async function saveOffer(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (saving) return;

    setError("");

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    if (!shop) {
      setError(
        "Your shop could not be found."
      );
      return;
    }

    if (!cleanTitle) {
  setError(
    "Please enter an offer title."
  );
  return;
}

/* ------------------------------------------------------------------ */
/* OFFER LIMITS                                                       */
/* ------------------------------------------------------------------ */

const currentActiveOrScheduledOffers =
  offers.filter((offer) => {
    if (offer.id === editingOfferId) {
      return false;
    }

    if (offer.status === "expired") {
      return false;
    }

    if (offer.status === "disabled") {
      return false;
    }

    return (
      offer.status === "active" ||
      offer.status === "scheduled"
    );
  });

if (selectedType === "discount") {
  const existingDiscount =
    currentActiveOrScheduledOffers.some(
      (offer) =>
        offer.type === "discount"
    );

  if (existingDiscount) {
    setError(
      "You can have only one discount at a time. Delete or wait for the current discount to expire before creating a new one."
    );
    return;
  }
}

if (selectedType === "offer") {
  const existingOffers =
    currentActiveOrScheduledOffers.filter(
      (offer) =>
        offer.type === "offer"
    ).length;

  if (existingOffers >= 3) {
    setError(
      "You can have a maximum of 3 active or scheduled offers at a time."
    );
    return;
  }
}

if (!validFrom || !validUntil) {
  
      setError(
        "Please select the offer validity dates."
      );
      return;
    }

   const today = getTodayIST();

if (validFrom < today) {
  setError(
    "Valid from date cannot be in the past."
  );
  return;
}

if (validUntil <= validFrom) {
  setError(
    "Valid until must be at least 1 day after the start date."
  );
  return;
}

const maxValidUntil =
  addMonthsToDate(
    validFrom,
    6
  );

if (validUntil > maxValidUntil) {
  setError(
    "Offer validity cannot exceed 6 months."
  );
  return;
}

    let percentage:
      | number
      | null = null;

    let finalPrice:
      | number
      | null = null;

    let oldPrice:
      | number
      | null = null;

    if (
      selectedType ===
      "discount"
    ) {
      percentage =
        Number(discountPercent);

      if (
        !percentage ||
        percentage <= 0 ||
        percentage > 100
      ) {
        setError(
          "Discount must be between 1% and 100%."
        );
        return;
      }
    }

    if (selectedType === "combo") {
      if (selectedProductIds.length < 2) {
        setError(
          "Please select at least 2 products for a combo."
        );
        return;
      }

      finalPrice = Number(offerPrice);

      oldPrice = originalPrice
        ? Number(originalPrice)
        : null;

      if (!finalPrice || finalPrice <= 0) {
        setError(
          "Please enter a valid combo price."
        );
        return;
      }

      if (
        oldPrice !== null &&
        (!oldPrice || oldPrice <= 0)
      ) {
        setError(
          "Please enter a valid original price."
        );
        return;
      }

      if (
        oldPrice !== null &&
        oldPrice < finalPrice
      ) {
        setError(
          "Original value cannot be lower than combo price."
        );
        return;
      }
    }

    setSaving(true);

    try {
    const payload = {
  shop_id: shop.id,
  user_id: shop.user_id,
  type: selectedType,
  product_ids:
    selectedType === "combo"
      ? selectedProductIds
      : [],
  title: cleanTitle,
  description:
    cleanDescription ||
    (
      selectedType ===
      "discount"
        ? `Get ${percentage}% off on your order.`
        : selectedType ===
            "combo"
          ? "Special combo offer"
          : "Special offer for customers."
          ),
        discount_percent:
          selectedType ===
          "discount"
            ? percentage
            : null,
        offer_price:
          selectedType ===
          "combo"
            ? finalPrice
            : null,
        original_price:
          selectedType ===
          "combo"
            ? oldPrice
            : null,
        valid_from:
          validFrom,
        valid_until:
          validUntil,
      };

      if (editingOfferId) {
        const {
          data,
          error: updateError,
        } = await supabase
          .from("shop_offers")
          .update(payload)
          .eq(
            "id",
            editingOfferId
          )
          .eq(
            "shop_id",
            shop.id
          )
          .select("*")
          .single();

        if (updateError) {
          throw updateError;
        }

        setOffers((current) =>
          current.map(
            (offer) =>
              offer.id ===
              editingOfferId
                ? mapOffer(
                    data as OfferRow
                  )
                : offer
          )
        );
      } else {
        const {
          data,
          error: insertError,
        } = await supabase
          .from("shop_offers")
          .insert({
            ...payload,
            is_enabled: true,
            usage_count: 0,
          })
          .select("*")
          .single();

        if (insertError) {
          throw insertError;
        }

        setOffers((current) => [
          mapOffer(
            data as OfferRow
          ),
          ...current,
        ]);
      }

      closeCreate();
    } catch (err) {
      console.error(
        "Failed to save offer:",
        err
      );

      setError(
        "Could not save the offer. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* DELETE                                                                  */
  /* ---------------------------------------------------------------------- */

  async function deleteOffer(
    id: string
  ) {
    if (!shop) return;

    const confirmed =
      window.confirm(
        "Delete this offer permanently?"
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("shop_offers")
        .delete()
        .eq("id", id)
        .eq(
          "shop_id",
          shop.id
        );

      if (deleteError) {
        throw deleteError;
      }

      setOffers((current) =>
        current.filter(
          (offer) =>
            offer.id !== id
        )
      );
    } catch (err) {
      console.error(
        "Failed to delete offer:",
        err
      );

      setError(
        "Could not delete the offer."
      );
    }
  }

  /* ---------------------------------------------------------------------- */
  /* ENABLE / DISABLE                                                        */
  /* ---------------------------------------------------------------------- */

  async function toggleOffer(
    offer: Offer
  ) {
    if (!shop) return;

    const newEnabled =
      !offer.isEnabled;

    setError("");

    try {
      const {
        data,
        error: updateError,
      } = await supabase
        .from("shop_offers")
        .update({
          is_enabled:
            newEnabled,
        })
        .eq(
          "id",
          offer.id
        )
        .eq(
          "shop_id",
          shop.id
        )
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      setOffers((current) =>
        current.map(
          (item) =>
            item.id ===
            offer.id
              ? mapOffer(
                  data as OfferRow
                )
              : item
        )
      );
    } catch (err) {
      console.error(
        "Failed to toggle offer:",
        err
      );

      setError(
        "Could not update the offer status."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                              */}
      {/* ------------------------------------------------------------------ */}

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          <div className="flex items-center gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
              AS
            </div>

            <div className="leading-none">

              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                <span>
                  APNA
                </span>

                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/55 sm:mt-1.5 sm:text-[9px]">
                <span>
                  LOCALS
                </span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>
                  TRUSTED
                </span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>
                  FAST
                </span>
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
          >
            Back
          </button>

        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* PAGE CONTENT                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8">

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#159447]">
               SHOP MANAGEMENT
            </p>

            <h1 className="mt-1 text-[27px] font-bold tracking-[-0.035em] sm:text-[32px]">
              Discounts, Combos & Offers
            </h1>

            <p className="mt-1 max-w-[560px] text-[12px] leading-5 text-black/45">
              Give your customers a reason to choose your
              shop with special discounts, combos and offers.
            </p>

          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            className="flex h-11 w-fit items-center gap-2 rounded-full bg-[#159447] px-5 text-[12px] font-bold text-white shadow-[0_7px_20px_rgba(21,148,71,0.18)] transition hover:bg-[#117d3b] active:scale-[0.98]"
          >
            <PlusIcon />
            Create Offer
          </button>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-[15px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* OVERVIEW                                                          */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">

          <OverviewCard
            icon={<TagIcon />}
            label="Active offers"
            value={activeCount}
          />

          <OverviewCard
            icon={<CalendarIcon />}
            label="Scheduled"
            value={scheduledCount}
          />

          <OverviewCard
            icon={<CustomersIcon />}
            label="Total redemptions"
            value={totalRedemptions}
            className="col-span-2 sm:col-span-1"
          />

        </section>

        {/* ---------------------------------------------------------------- */}
        {/* OFFER TYPES                                                       */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-7">

          <div>

            <h2 className="text-[17px] font-bold">
              Your offers
            </h2>

            <p className="mt-0.5 text-[11px] text-black/40">
              Manage what customers see on your shop.
            </p>

          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">

            <FilterButton
              active={
                activeTab === "all"
              }
              onClick={() =>
                setActiveTab("all")
              }
            >
              All
            </FilterButton>

            <FilterButton
              active={
                activeTab ===
                "discount"
              }
              onClick={() =>
                setActiveTab(
                  "discount"
                )
              }
            >
              Discounts
            </FilterButton>

            <FilterButton
              active={
                activeTab === "combo"
              }
              onClick={() =>
                setActiveTab(
                  "combo"
                )
              }
            >
              Combos
            </FilterButton>

            <FilterButton
              active={
                activeTab === "offer"
              }
              onClick={() =>
                setActiveTab(
                  "offer"
                )
              }
            >
              Offers
            </FilterButton>

          </div>

        </section>

        {/* ---------------------------------------------------------------- */}
        {/* OFFER LIST                                                        */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-4">

          {loading ? (

            <div className="grid gap-4 lg:grid-cols-2">

              {[1, 2].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[260px] animate-pulse rounded-[22px] border border-black/[0.06] bg-white"
                  />
                )
              )}

            </div>

          ) : filteredOffers.length === 0 ? (

            <EmptyState
              onCreate={() => {
                resetForm();
                setShowCreate(true);
              }}
            />

          ) : (

            <div className="grid gap-4 lg:grid-cols-2">

              {filteredOffers.map(
                (offer) => (

<OfferCard
  key={offer.id}
  offer={offer}
  products={products}
  onDelete={() =>
    deleteOffer(
      offer.id
    )
  }
  onToggle={() =>
    toggleOffer(
      offer
    )
  }
  onEdit={() =>
    startEditOffer(
      offer
    )
  }
/>

                )
              )}

            </div>

          )}

        </section>

        {/* ---------------------------------------------------------------- */}
        {/* GUIDE                                                             */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-7 rounded-[22px] border border-black/[0.06] bg-white p-5 sm:p-6">

          <div className="flex gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#159447]/10 text-[#159447]">
              <LightbulbIcon />
            </div>

            <div>

              <h3 className="text-[14px] font-bold">
                Make your offer attractive
              </h3>

              <p className="mt-1 text-[12px] leading-5 text-black/45">
                Festival discounts work great for attracting
                new customers. Combos are useful when you want
                to sell multiple products together at a special
                price.
              </p>

            </div>

          </div>

        </section>

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

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CREATE / EDIT MODAL                                                 */}
      {/* ------------------------------------------------------------------ */}

      {showCreate && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">

          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-[560px] sm:rounded-[26px]">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white px-5 py-4 sm:px-6">

              <div>

                <h2 className="text-[18px] font-bold">
                  {editingOfferId
                    ? "Edit Offer"
                    : "Create Offer"}
                </h2>

                <p className="mt-0.5 text-[11px] text-black/40">
                  {editingOfferId
                    ? "Update the details of your offer."
                    : "Create a special offer for your shop."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeCreate}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-black/60 transition hover:bg-black/[0.08]"
                aria-label="Close"
              >
                <CloseIcon />
              </button>

            </div>

            <form
              onSubmit={saveOffer}
              className="space-y-5 p-5 sm:p-6"
            >

              {/* TYPE */}

              <div>

                <label className="mb-2 block text-[12px] font-bold text-black/65">
                  What do you want to create?
                </label>

                <div className="grid grid-cols-3 gap-2">

                  <OfferTypeButton
                    active={
                      selectedType ===
                      "discount"
                    }
                    icon={<PercentIcon />}
                    title="Discount"
                    description="25% / 30% OFF"
                    onClick={() =>
                      setSelectedType(
                        "discount"
                      )
                    }
                  />

                  <OfferTypeButton
                    active={
                      selectedType ===
                      "combo"
                    }
                    icon={<ComboIcon />}
                    title="Combo"
                    description="Multiple products"
                    onClick={() =>
                      setSelectedType(
                        "combo"
                      )
                    }
                  />

                  <OfferTypeButton
                    active={
                      selectedType ===
                      "offer"
                    }
                    icon={<GiftIcon />}
                    title="Offer"
                    description="Special deal"
                    onClick={() =>
                      setSelectedType(
                        "offer"
                      )
                    }
                  />

                </div>

              </div>

              {/* TITLE */}

              <FormField label="Offer title">

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  maxLength={26}
                  required
                  placeholder={
                    selectedType ===
                    "discount"
                      ? "Festival Special"
                      : selectedType ===
                          "combo"
                        ? "e.g. Special Combo"
                        : "Special Customer Offer"
                  }
                  className={inputClass}
                />

              </FormField>

              {/* DESCRIPTION */}

              <FormField label="Description">

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  maxLength={80}
                  rows={3}
                 placeholder={
  selectedType ===
  "combo"
    ? "Create a combo with 2–4 products at a special price"
    : "Tell customers what makes this offer special..."
}
                  className="w-full resize-none rounded-[14px] border border-black/[0.09] bg-white px-4 py-3 text-[13px] font-medium outline-none transition placeholder:text-black/25 focus:border-[#159447]/50 focus:ring-4 focus:ring-[#159447]/[0.08]"
                />

              </FormField>

              {/* DISCOUNT */}

              {selectedType ===
                "discount" && (

                <FormField label="Discount percentage">

                  <div className="relative">

                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={
                        discountPercent
                      }
                      onChange={(e) =>
                        setDiscountPercent(
                          e.target.value
                        )
                      }
                      required
                      placeholder="25"
                      className={`${inputClass} pr-12`}
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-black/35">
                      %
                    </span>

                  </div>

                </FormField>

              )}

              {/* COMBO */}

{/* COMBO */}

{selectedType === "combo" && (

  <div className="space-y-4">

    {/* PRODUCTS */}

    <div>

      <div className="mb-2 flex items-center justify-between">

        <label className="block text-[12px] font-bold text-black/65">
          Select products
        </label>

        <span className="text-[10px] font-bold text-[#159447]">
          {selectedProductIds.length} selected
        </span>

      </div>

      {/* SEARCH */}

      <div className="relative">

        <SearchIcon />

        <input
          type="text"
          value={productSearch}
          onChange={(e) =>
            setProductSearch(
              e.target.value
            )
          }
          placeholder="Search available products..."
          className={`${inputClass} pl-11 pr-10`}
        />

        {productSearch && (
          <button
            type="button"
            onClick={() =>
              setProductSearch("")
            }
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black/35 transition hover:bg-black/[0.05] hover:text-black"
            aria-label="Clear search"
          >
            <CloseIcon />
          </button>
        )}

      </div>

      {/* PRODUCT LIST */}

      <div className="mt-3 max-h-[250px] overflow-y-auto rounded-[16px] border border-black/[0.08] bg-[#f9faf9]">

     {filteredProducts.length === 0 ? (

  <div className="px-4 py-9 text-center">

   <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.05] text-black/35">
  <svg
    width="17"
    height="17"
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
</div>

    <p className="mt-3 text-[12px] font-bold text-black/65">
      {productSearch
        ? "Product not found"
        : "No available products"}
    </p>

    <p className="mx-auto mt-1 max-w-[280px] text-[10px] leading-4 text-black/40">
      {productSearch
        ? `We couldn't find a live product matching "${productSearch.trim()}".`
        : "Add and activate products in your Products section before creating a combo."}
    </p>

    {productSearch && (
      <button
        type="button"
        onClick={() => setProductSearch("")}
        className="mt-3 text-[10px] font-bold text-[#159447] transition hover:text-[#117d3b]"
      >
        Clear search
      </button>
    )}

  </div>

) : (

          <div className="divide-y divide-black/[0.06]">

            {filteredProducts.map(
              (product) => {

                const selected =
                  selectedProductIds.includes(
                    product.id
                  );

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() =>
                      toggleProductSelection(
                        product.id
                      )
                    }
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${
                      selected
                        ? "bg-[#159447]/[0.07]"
                        : "bg-white hover:bg-black/[0.02]"
                    }`}
                  >

                    {/* IMAGE */}

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[11px] bg-black/[0.05]">

                      {product.image_url ? (

                        <img
                          src={
                            product.image_url
                          }
                          alt={product.product_name}
                             
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-black/25">
                          IMG
                        </div>

                      )}

                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[12px] font-bold text-black/75">
                         {product.product_name}
                      </p>

                      <p className="mt-0.5 text-[10px] font-semibold text-black/40">
                        ₹{product.price}
                      </p>

                    </div>

                    {/* CHECK */}

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                        selected
                          ? "border-[#159447] bg-[#159447] text-white"
                          : "border-black/15 bg-white text-transparent"
                      }`}
                    >

                      <CheckIcon />

                    </div>

                  </button>
                );

              }
            )}

          </div>

        )}

      </div>

      {/* SELECTED PRODUCTS */}

      {selectedProductIds.length > 0 && (

        <div className="mt-3 flex flex-wrap gap-1.5">

          {selectedProductIds.map(
            (productId) => {

              const product =
                products.find(
                  (item) =>
                    item.id ===
                    productId
                );

              if (!product) {
                return null;
              }

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    toggleProductSelection(
                      product.id
                    )
                  }
                  className="flex items-center gap-1.5 rounded-full bg-[#159447]/10 px-3 py-1.5 text-[10px] font-bold text-[#159447]"
                >

                  {product.product_name}

                  <span className="text-[#159447]/60">
                    ×
                  </span>

                </button>
              );

            }
          )}

        </div>

      )}

    </div>

    {/* COMBO PRICE */}

    <div className="grid grid-cols-2 gap-3">

      <FormField label="Combo price">

        <div className="relative">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-black/35">
            ₹
          </span>

          <input
            type="number"
            min="1"
            step="0.01"
            value={offerPrice}
            onChange={(e) =>
              setOfferPrice(
                e.target.value
              )
            }
            required
            placeholder="99"
            className={`${inputClass} pl-9`}
          />

        </div>

      </FormField>

      <FormField label="Original value">

        <div className="relative">

          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-black/35">
            ₹
          </span>

          <input
            type="number"
            min="1"
            step="0.01"
            value={originalPrice}
            onChange={(e) =>
              setOriginalPrice(
                e.target.value
              )
            }
            placeholder="130"
            className={`${inputClass} pl-9`}
          />

        </div>

      </FormField>

    </div>

  </div>

)}

              {/* DATE */}

              <div className="grid grid-cols-2 gap-3">

                <FormField label="Valid from">

                  <input
                    type="date"
                    min={
                      getTodayIST()
                    }
                    value={validFrom}
                    onChange={(e) =>
                      setValidFrom(
                        e.target.value
                      )
                    }
                    required
                    className={inputClass}
                  />

                </FormField>

                <FormField label="Valid until">

<input
  type="date"
  min={
    validFrom
      ? addDaysToDate(validFrom, 1)
      : addDaysToDate(getTodayIST(), 1)
  }
  max={
    addMonthsToDate(
      validFrom || getTodayIST(),
      6
    )
  }
  value={validUntil}
  onChange={(e) =>
    setValidUntil(
      e.target.value
    )
  }
  required
  className={inputClass}
/>

</FormField>

              </div>

              {/* PREVIEW */}

              {(title ||
                discountPercent ||
                offerPrice) && (

                <div className="overflow-hidden rounded-[18px] border border-[#159447]/15 bg-[#159447]/[0.055] p-4">

                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#159447]/70">
                    Customer preview
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">

                    <div className="min-w-0">

                      <p className="truncate text-[15px] font-bold">
                        {title ||
                          "Your offer"}
                      </p>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-black/45">
                        {description ||
                          "Your special offer will appear here."}
                      </p>

                    </div>

                    <div className="shrink-0 rounded-[14px] bg-[#159447] px-3 py-2 text-center text-white">

                      {selectedType ===
                        "discount" &&
                        discountPercent && (

                          <p className="text-[17px] font-extrabold">
                            {
                              discountPercent
                            }
                            % OFF
                          </p>

                        )}

                      {selectedType ===
                        "combo" &&
                        offerPrice && (

                          <p className="text-[17px] font-extrabold">
                            ₹
                            {
                              offerPrice
                            }
                          </p>

                        )}

                      {selectedType ===
                        "offer" && (

                        <p className="text-[13px] font-extrabold">
                          SPECIAL
                        </p>

                      )}

                      <p className="text-[8px] font-semibold text-white/70">
                        OFFER
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* BUTTONS */}

              <div className="flex gap-3 pt-1">

                <button
                  type="button"
                  onClick={closeCreate}
                  disabled={saving}
                  className="h-12 flex-1 rounded-full border border-black/[0.09] bg-white text-[13px] font-semibold text-black/65 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 flex-[1.5] rounded-full bg-[#159447] text-[13px] font-bold text-white transition hover:bg-[#117d3b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingOfferId
                      ? "Save Changes"
                      : "Create Offer"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* OFFER CARD                                                                 */
/* -------------------------------------------------------------------------- */
function OfferCard({
  offer,
  products,
  onDelete,
  onToggle,
  onEdit,
}: {
  offer: Offer;
  products: Product[];
  onDelete: () => void;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">

      <div className="p-5 sm:p-6">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#159447]/10 text-[#159447]">

            {offer.type ===
              "discount" && (
              <PercentIcon />
            )}

            {offer.type ===
              "combo" && (
              <ComboIcon />
            )}

            {offer.type ===
              "offer" && (
              <GiftIcon />
            )}

          </div>

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              <StatusBadge
                status={offer.status}
              />

              <span className="rounded-full bg-black/[0.045] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.05em] text-black/40">
                {offer.type}
              </span>

            </div>

            <h3 className="mt-2.5 truncate text-[16px] font-bold">
              {offer.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-black/45">
              {offer.description}
            </p>

          </div>

          <div className="shrink-0 text-right">

            {offer.type ===
              "discount" &&
              offer.discountPercent && (

                <p className="text-[20px] font-extrabold tracking-[-0.04em] text-[#159447]">
                  {
                    offer.discountPercent
                  }%
                </p>

              )}

            {offer.type ===
              "combo" &&
              offer.offerPrice && (

                <p className="text-[20px] font-extrabold tracking-[-0.04em] text-[#159447]">
                  ₹
                  {
                    offer.offerPrice
                  }
                </p>

              )}

            {offer.type ===
              "offer" && (

              <p className="text-[13px] font-extrabold text-[#159447]">
                SPECIAL
              </p>

            )}

            {offer.type ===
              "discount" && (

              <p className="text-[8px] font-bold text-black/30">
                OFF
              </p>

            )}

          </div>

        </div>

        {/* COMBO PRODUCTS */}

{offer.type === "combo" &&
  offer.productIds &&
  offer.productIds.length > 0 && (

    <div className="mt-4">

      <div className="flex items-center justify-between">

        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-black/35">
          Included products
        </p>

        <span className="text-[10px] font-bold text-[#159447]">
          {offer.productIds.length} products
        </span>

      </div>

      <div className="mt-3 flex items-center gap-2.5">

        {offer.productIds.map(
          (productId) => {

            const product =
              products.find(
                (item) =>
                  item.id ===
                  productId
              );

            if (!product) {
              return null;
            }

            return (
              <div
                key={product.id}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] bg-[#f5f6f4] p-2"
              >

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[11px] bg-black/[0.05]">

                  {product.image_url ? (

                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-black/25">
                      IMG
                    </div>

                  )}

                </div>

                <p className="min-w-0 truncate text-[10px] font-bold text-black/65">
                  {product.product_name}
                </p>

              </div>
            );

          }
        )}

      </div>

    </div>

)}

        {/* COMBO SAVINGS */}

        {offer.type ===
          "combo" &&
          offer.originalPrice &&
          offer.offerPrice && (

            <div className="mt-4 rounded-[14px] bg-[#f5f6f4] px-3 py-2.5">

              <div className="flex items-center justify-between">

                <span className="text-[10px] font-semibold text-black/40">
                  Original value
                </span>

                <span className="text-[11px] font-semibold text-black/35 line-through">
                  ₹
                  {
                    offer.originalPrice
                  }
                </span>

              </div>

              <div className="mt-1 flex items-center justify-between">

                <span className="text-[10px] font-semibold text-black/40">
                  Customer saves
                </span>

                <span className="text-[11px] font-bold text-[#159447]">
                  ₹
                  {(
                    offer.originalPrice -
                    offer.offerPrice
                  ).toFixed(2)}
                </span>

              </div>

            </div>

          )}

        {/* VALIDITY */}

        <div className="mt-5 flex items-center justify-between border-t border-black/[0.06] pt-4">

          <div>

            <p className="text-[10px] font-semibold text-black/35">
              Validity
            </p>

            <p className="mt-0.5 text-[11px] font-semibold text-black/60">
              {
                formatDate(
                  offer.validFrom
                )
              }{" "}
              —{" "}
              {
                formatDate(
                  offer.validUntil
                )
              }
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] font-semibold text-black/35">
              Used
            </p>

            <p className="mt-0.5 text-[11px] font-bold">
              {offer.usage} times
            </p>

          </div>

        </div>

      </div>

      {/* CARD ACTIONS */}

      <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5 sm:px-6">

        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] font-bold text-black/45 transition hover:text-black"
        >
          {offer.isEnabled
            ? "Disable offer"
            : "Activate offer"}
        </button>

        <div className="flex items-center gap-1">

          <button
            type="button"
            onClick={onEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/40 transition hover:bg-black/[0.05] hover:text-black"
            aria-label="Edit offer"
          >
            <EditIcon />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full text-black/35 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Delete offer"
          >
            <TrashIcon />
          </button>

        </div>

      </div>

    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* OVERVIEW CARD                                                             */
/* -------------------------------------------------------------------------- */

function OverviewCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[19px] border border-black/[0.06] bg-white p-4 sm:p-5 ${className}`}
    >

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#159447]/10 text-[#159447]">
          {icon}
        </div>

        <span className="text-[24px] font-bold tracking-[-0.04em]">
          {value}
        </span>

      </div>

      <p className="mt-3 text-[11px] font-semibold text-black/45">
        {label}
      </p>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER BUTTON                                                             */
/* -------------------------------------------------------------------------- */

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2.5 text-[11px] font-bold transition ${
        active
          ? "bg-[#159447] text-white"
          : "border border-black/[0.07] bg-white text-black/50 hover:bg-black/[0.03]"
      }`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* OFFER TYPE BUTTON                                                         */
/* -------------------------------------------------------------------------- */

function OfferTypeButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[92px] flex-col items-center justify-center rounded-[15px] border px-2 text-center transition ${
        active
          ? "border-[#159447] bg-[#159447]/[0.055] text-[#159447]"
          : "border-black/[0.08] bg-white text-black/45 hover:bg-black/[0.025]"
      }`}
    >

      {icon}

      <span className="mt-2 text-[11px] font-bold">
        {title}
      </span>

      <span className="mt-0.5 text-[8px] text-black/35">
        {description}
      </span>

    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* FORM FIELD                                                                */
/* -------------------------------------------------------------------------- */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-[12px] font-bold text-black/65">
        {label}
      </label>

      {children}

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* STATUS                                                                    */
/* -------------------------------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: OfferStatus;
}) {
  const classes =
    status === "active"
      ? "bg-[#159447]/10 text-[#159447]"
      : status === "scheduled"
        ? "bg-orange-50 text-orange-600"
        : status === "disabled"
          ? "bg-red-50 text-red-500"
          : "bg-black/[0.06] text-black/40";

  const label =
    status === "active"
      ? "Active"
      : status === "scheduled"
        ? "Scheduled"
        : status === "disabled"
          ? "Disabled"
          : "Expired";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${classes}`}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-black/[0.12] bg-white px-6 py-14 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#159447]/10 text-[#159447]">
        <TagIcon />
      </div>

      <h3 className="mt-4 text-[16px] font-bold">
        No offers yet
      </h3>

      <p className="mx-auto mt-1.5 max-w-[340px] text-[12px] leading-5 text-black/40">
        Create a discount, combo or special offer to
        attract more customers to your shop.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 h-11 rounded-full bg-[#159447] px-5 text-[12px] font-bold text-white"
      >
        Create Offer
      </button>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DATE                                                                      */
/* -------------------------------------------------------------------------- */

function formatDate(
  date: string
) {
  if (!date) {
    return "Not set";
  }

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* -------------------------------------------------------------------------- */
/* INPUT STYLE                                                               */
/* -------------------------------------------------------------------------- */

const inputClass =
  "h-12 w-full rounded-[14px] border border-black/[0.09] bg-white px-4 text-[13px] font-medium outline-none transition placeholder:text-black/25 focus:border-[#159447]/50 focus:ring-4 focus:ring-[#159447]/[0.08]";

/* -------------------------------------------------------------------------- */
/* ICONS                                                                      */
/* -------------------------------------------------------------------------- */

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m20 13-7 7-10-10V4h6l11 9Z" />
      <circle
        cx="7.5"
        cy="8.5"
        r="1"
      />
    </svg>
  );
}

function PercentIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M19 5 5 19" />

      <circle
        cx="7"
        cy="7"
        r="2"
      />

      <circle
        cx="17"
        cy="17"
        r="2"
      />
    </svg>
  );
}

function ComboIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="4"
        width="7"
        height="7"
        rx="1.5"
      />

      <rect
        x="14"
        y="4"
        width="7"
        height="7"
        rx="1.5"
      />

      <rect
        x="8.5"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />

      <path d="M10 7.5h4" />
      <path d="M8 11l3 3" />
      <path d="M16 11l-3 3" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12v9H4v-9" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 7v14" />
      <path d="M12 7H8.5A2.5 2.5 0 1 1 11 4.5V7Z" />
      <path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5V7Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
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
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />

      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function CustomersIcon() {
  return (
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />

      <circle
        cx="9.5"
        cy="7"
        r="4"
      />

      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
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
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5A7 7 0 1 1 15.5 14c-.8.6-1.5 1.5-1.5 2.5h-4c0-1-.7-1.9-1.5-2.5Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
      width="17"
      height="17"
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
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}