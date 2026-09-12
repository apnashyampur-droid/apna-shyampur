"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  product_id: string;
  product_name: string;
  image_url: string | null;
  quantity: number;
  price: number;
  sale_price: number | null;
  line_total: number;
};

type Order = {
  id: string;
  order_number: string;
  shop_id: string | null;
  shop_name: string | null;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  created_at: string;
  items: OrderItem[] | null;
};

type Shop = {
  id: string;
  name: string;
  category: string;
};

const PLATFORM_CHARGES: Record<string, number> = {
  Grocery: 5,
  Food: 8,
  Medical: 6,
  Vegetables: 8,
  Meat: 10,
  Clothes: 10,
  Footwear: 9,
};

function normalizeCategory(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getChargeRate(category: string) {
  const normalized = normalizeCategory(category);

  const entry = Object.entries(
    PLATFORM_CHARGES
  ).find(
    ([key]) =>
      normalizeCategory(key) === normalized
  );

  return entry ? entry[1] : null;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN").format(
    Math.round(Number(value) || 0)
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getOrderStatus(status: string | null) {
  const value = (status || "")
    .toLowerCase()
    .replace(/-/g, "_");

  if (
    value === "delivered" ||
    value === "completed"
  ) {
    return {
      label:
        value === "completed"
          ? "Completed"
          : "Delivered",
      className:
        "bg-[#eaf7ef] text-[#159447]",
    };
  }

  if (
    value === "out_for_delivery"
  ) {
    return {
      label: "Out for Delivery",
      className:
        "bg-[#eef4ff] text-[#2563eb]",
    };
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return {
      label: "Cancelled",
      className:
        "bg-red-50 text-red-500",
    };
  }

  if (value === "rejected") {
    return {
      label: "Rejected",
      className:
        "bg-red-50 text-red-500",
    };
  }

  if (value === "accepted") {
    return {
      label: "Accepted",
      className:
        "bg-[#eef8f1] text-[#159447]",
    };
  }

  if (value === "preparing") {
    return {
      label: "Preparing",
      className:
        "bg-[#fff9ec] text-[#b47b15]",
    };
  }

  if (value === "ready") {
    return {
      label: "Ready",
      className:
        "bg-[#eef4ff] text-[#2563eb]",
    };
  }

  return {
    label: "Pending",
    className:
      "bg-[#fff9ec] text-[#b47b15]",
  };
}

function isChargeableOrder(
  status: string | null
) {
  const value = (status || "")
    .toLowerCase()
    .replace(/-/g, "_");

  return (
    value !== "cancelled" &&
    value !== "canceled" &&
    value !== "rejected"
  );
}

function PackageIcon() {
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
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function BackIcon() {
  return (
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ChargeIcon({
  size = 20,
}: {
  size?: number;
}) {
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
      <path d="M12 3v18" />
      <path d="M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" />
    </svg>
  );
}

function OrdersIcon() {
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
      <path d="M6 2h12" />
      <path d="M6 2v4a6 6 0 0 0 12 0V2" />
      <path d="M6 22h12" />
      <path d="M6 22v-4a6 6 0 0 1 12 0v4" />
      <path d="M9 9h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function ChevronIcon({
  open,
}: {
  open: boolean;
}) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${
        open ? "rotate-180" : ""
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function PlatformChargesPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [shop, setShop] =
    useState<Shop | null>(null);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null);

  const loadCharges = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace(
            "/sign-in?redirect=/shop/platform-charges"
          );
          return;
        }

        /*
         * FIRST:
         * Find the shop owned by the
         * currently signed-in shopkeeper.
         */

        const {
          data: shopData,
          error: shopError,
        } = await supabase
          .from("shops")
          .select(
            "id, name, category"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (shopError) {
          console.error(
            "SHOP FETCH ERROR:",
            shopError
          );

          throw new Error(
            shopError.message
          );
        }

        if (!shopData) {
          throw new Error(
            "Your approved shop could not be found."
          );
        }

        const currentShop: Shop = {
          id: shopData.id,
          name:
            shopData.name ||
            "Your Shop",
          category:
            shopData.category || "",
        };

        setShop(currentShop);

        /*
         * SECOND:
         * Fetch every order belonging
         * to this shop.
         */

        const {
          data: orderData,
          error: ordersError,
        } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            shop_id,
            shop_name,
            status,
            payment_status,
            payment_method,
            subtotal,
            delivery_fee,
            total_amount,
            created_at,
            items
          `)
          .eq("shop_id", currentShop.id)
          .order("created_at", {
            ascending: false,
          });

        if (ordersError) {
          console.error(
            "SHOP ORDERS FETCH ERROR:",
            ordersError
          );

          throw new Error(
            ordersError.message
          );
        }

        const formattedOrders: Order[] =
          (orderData || []).map(
            (order) => ({
              ...order,
              subtotal:
                Number(order.subtotal) || 0,
              delivery_fee:
                Number(order.delivery_fee) ||
                0,
              total_amount:
                Number(order.total_amount) ||
                0,
              items: Array.isArray(
                order.items
              )
                ? (order.items as OrderItem[])
                : [],
            })
          );

        setOrders(formattedOrders);
      } catch (err) {
        console.error(
          "LOAD PLATFORM CHARGES ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load platform charges."
        );
      } finally {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  const chargeRate = useMemo(() => {
    if (!shop) return null;

    return getChargeRate(
      shop.category
    );
  }, [shop]);

  const stats = useMemo(() => {
    if (chargeRate === null) {
      return {
        totalOrders: orders.length,
        orderValue: 0,
        platformCharges: 0,
        netValue: 0,
        chargeableOrders: 0,
      };
    }

    let orderValue = 0;
    let platformCharges = 0;
    let chargeableOrders = 0;

    for (const order of orders) {
      if (!isChargeableOrder(order.status)) {
        continue;
      }

      const base =
        Number(order.subtotal) || 0;

      const charge =
        (base * chargeRate) / 100;

      orderValue += base;
      platformCharges += charge;
      chargeableOrders += 1;
    }

    return {
      totalOrders: orders.length,
      orderValue,
      platformCharges,
      netValue:
        orderValue - platformCharges,
      chargeableOrders,
    };
  }, [orders, chargeRate]);

  /* LOADING */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <div className="mx-auto max-w-[980px] px-4 py-5 sm:px-6">

          <header className="flex h-[60px] items-center justify-between border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[10px] font-black text-white">
                AS
              </div>

              <div className="leading-none">
                <div className="text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                  APNA{" "}
                  <span className="text-[#159447]">
                    SHYAMPUR
                  </span>
                </div>

                <div className="mt-1 text-[7px] font-bold tracking-[0.12em] text-black/40 sm:text-[8px]">
                  PLATFORM CHARGES
                </div>
              </div>
            </div>

            <div className="h-9 w-16 animate-pulse rounded-full bg-white" />
          </header>

          <div className="py-7">
            <div className="h-8 w-52 animate-pulse rounded-lg bg-white" />

            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white" />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-28 animate-pulse rounded-[22px] bg-white"
                  />
                )
              )}
            </div>

            <div className="mt-5 h-32 animate-pulse rounded-[22px] bg-white" />

            <div className="mt-5 space-y-4">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-36 animate-pulse rounded-[24px] bg-white"
                  />
                )
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ERROR */

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <div className="mx-auto flex min-h-screen max-w-[900px] flex-col px-4 py-5 sm:px-6">

          <header className="flex items-center justify-between border-b border-black/[0.06] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[10px] font-black text-white">
                AS
              </div>

              <div className="text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                APNA{" "}
                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/shop")
              }
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/60 transition hover:border-black/20 hover:text-black"
            >
              Back
            </button>
          </header>

          <div className="flex flex-1 items-center justify-center py-16">
            <section className="w-full max-w-[460px] rounded-[26px] bg-white p-7 text-center shadow-[0_12px_45px_rgba(0,0,0,.05)]">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <span className="text-xl font-black">
                  !
                </span>
              </div>

              <h1 className="mt-5 text-[20px] font-black tracking-[-0.04em]">
                Couldn't load platform charges
              </h1>

              <p className="mt-2 text-[10px] leading-5 text-black/45">
                {error}
              </p>

              <button
                type="button"
                onClick={loadCharges}
                className="mt-6 rounded-full bg-[#159447] px-5 py-2.5 text-[9px] font-black text-white"
              >
                Try Again
              </button>

            </section>
          </div>
        </div>
      </main>
    );
  }

  const categoryConfigured =
    chargeRate !== null;

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      <div className="mx-auto max-w-[980px] px-4 py-5 pb-14 sm:px-6">

        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-black/[0.06] pb-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[10px] font-black tracking-tight text-white">
              AS
            </div>

            <div className="leading-none">

              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                <span>APNA</span>

                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7px] font-bold tracking-[0.12em] text-black/45 sm:text-[8px]">
                <span>PLATFORM</span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>CHARGES</span>
              </div>

            </div>

          </div>

          <button
  type="button"
  onClick={() =>
    router.push("/shop")
  }
  className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/60 transition hover:border-black/20 hover:text-black"
>
  Back
</button>

        </header>

        {/* TITLE */}

        <section className="pt-7">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>
              <h1 className="text-[28px] font-black tracking-[-0.055em] sm:text-[31px]">
                Platform Charges
              </h1>

              <p className="mt-1.5 max-w-[560px] text-[10px] font-semibold leading-5 text-black/40">
              See the charges applied to your shop's orders.
              </p>
            </div>

            <div className="shrink-0 rounded-[18px] border border-black/[0.06] bg-white px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,.025)]">

              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-black/30">
                Your Shop
              </p>

              <p className="mt-1 max-w-[210px] truncate text-[11px] font-black">
                {shop?.name || "Your Shop"}
              </p>

              <div className="mt-1.5 flex items-center gap-2">

                <span className="rounded-full bg-[#f5f6f4] px-2.5 py-1 text-[7px] font-black text-black/50">
                  {shop?.category || "Category"}
                </span>

                {categoryConfigured ? (
                  <span className="rounded-full bg-[#eaf7ef] px-2.5 py-1 text-[7px] font-black text-[#159447]">
                    {chargeRate}% Platform Charge
                  </span>
                ) : (
                  <span className="rounded-full bg-[#fff9ec] px-2.5 py-1 text-[7px] font-black text-[#b47b15]">
                    Rate Not Configured
                  </span>
                )}

              </div>

            </div>

          </div>

        </section>

        {/* SUMMARY */}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)]">

            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                Total Orders
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f5f6f4] text-black/55">
                <OrdersIcon />
              </div>
            </div>

            <p className="mt-4 text-[24px] font-black tracking-[-0.05em]">
              {stats.totalOrders}
            </p>

            <p className="mt-1 text-[8px] font-semibold text-black/35">
              {stats.chargeableOrders} chargeable
            </p>

          </div>

          <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)]">

            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
              Order Value
            </p>

            <p className="mt-5 text-[24px] font-black tracking-[-0.05em]">
              ₹{formatPrice(stats.orderValue)}
            </p>

            <p className="mt-1 text-[8px] font-semibold text-black/35">
              Before platform charges
            </p>

          </div>

          <div className="rounded-[22px] bg-[#111] p-5 text-white shadow-[0_8px_30px_rgba(0,0,0,.07)]">

            <div className="flex items-center justify-between">

              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/40">
                Platform Charges
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/10 text-white/80">
                <ChargeIcon size={17} />
              </div>

            </div>

            <p className="mt-4 text-[24px] font-black tracking-[-0.05em]">
              ₹{formatPrice(stats.platformCharges)}
            </p>

            <p className="mt-1 text-[8px] font-semibold text-white/35">
              {categoryConfigured
                ? `${chargeRate}% of eligible order value`
                : "Rate not configured"}
            </p>

          </div>

          <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)]">

            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
              After Charges
            </p>

            <p className="mt-5 text-[24px] font-black tracking-[-0.05em] text-[#159447]">
              ₹{formatPrice(stats.netValue)}
            </p>

            <p className="mt-1 text-[8px] font-semibold text-black/35">
              Order value minus platform charges
            </p>

          </div>

        </section>

        {/* HOW IT WORKS */}

        <section className="mt-5 rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.025)] sm:p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3.5">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eef5ef] text-[#159447]">
                <ChargeIcon />
              </div>

              <div>
                <h2 className="text-[13px] font-black tracking-[-0.03em]">
                  How your platform charge works
                </h2>

                {categoryConfigured ? (
                  <p className="mt-1 max-w-[650px] text-[9px] leading-4 text-black/40">
                    Your shop is in the{" "}
                    <span className="font-black text-black/60">
                      {shop?.category}
                    </span>{" "}
                    category. A{" "}
                    <span className="font-black text-[#159447]">
                      {chargeRate}%
                    </span>{" "}
                    platform charge is calculated on
                    the item value of each eligible order.
                  </p>
                ) : (
                  <p className="mt-1 max-w-[650px] text-[9px] leading-4 text-black/40">
                    A platform charge rate has not yet
                    been configured for your shop category.
                  </p>
                )}
              </div>

            </div>

            {categoryConfigured && (
              <div className="shrink-0 rounded-[16px] bg-[#f5f6f4] px-5 py-3 text-center">

                <p className="text-[7px] font-black uppercase tracking-[0.1em] text-black/30">
                  Your Rate
                </p>

                <p className="mt-0.5 text-[20px] font-black tracking-[-0.04em]">
                  {chargeRate}%
                </p>

              </div>
            )}

          </div>

          {categoryConfigured && (
            <div className="mt-5 grid gap-2 sm:grid-cols-3">

              <div className="rounded-[15px] bg-[#f5f6f4] p-3.5">
                <p className="text-[7px] font-black uppercase tracking-[0.08em] text-black/30">
                  Example
                </p>

                <p className="mt-1.5 text-[11px] font-black">
                  ₹1,000 order
                </p>
              </div>

              <div className="rounded-[15px] bg-[#f5f6f4] p-3.5">
                <p className="text-[7px] font-black uppercase tracking-[0.08em] text-black/30">
                  Platform Charge
                </p>

                <p className="mt-1.5 text-[11px] font-black text-[#b47b15]">
                  ₹
                  {formatPrice(
                    (1000 * chargeRate!) /
                      100
                  )}
                </p>
              </div>

              <div className="rounded-[15px] bg-[#eaf7ef] p-3.5">
                <p className="text-[7px] font-black uppercase tracking-[0.08em] text-[#159447]/60">
                  After Charge
                </p>

                <p className="mt-1.5 text-[11px] font-black text-[#159447]">
                  ₹
                  {formatPrice(
                    1000 -
                      (1000 * chargeRate!) /
                        100
                  )}
                </p>
              </div>

            </div>
          )}

        </section>

        {/* ORDERS TITLE */}

        <section className="mt-8">

          <div className="flex items-end justify-between gap-4">

            <div>
              <h2 className="text-[18px] font-black tracking-[-0.04em]">
                Order-wise Charges
              </h2>

              <p className="mt-1 text-[9px] font-semibold text-black/35">
                Every order's platform charge is shown separately.
              </p>
            </div>

            <div className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[8px] font-black text-black/45">
              {orders.length}{" "}
              {orders.length === 1
                ? "Order"
                : "Orders"}
            </div>

          </div>

        </section>

        {/* ORDERS */}

        {orders.length === 0 ? (
          <section className="mt-5 rounded-[26px] bg-white px-6 py-14 text-center shadow-[0_8px_30px_rgba(0,0,0,.035)]">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef8f1] text-[#159447]">
              <EmptyIcon />
            </div>

            <h3 className="mt-5 text-[19px] font-black tracking-[-0.04em]">
              No orders yet
            </h3>

            <p className="mx-auto mt-2 max-w-[340px] text-[9px] leading-5 text-black/40">
              Platform charge details will appear
              here when your shop receives orders.
            </p>

          </section>
        ) : (
          <section className="mt-5 space-y-4">

            {orders.map((order) => {
              const isOpen =
                expandedOrderId ===
                order.id;

              const status =
                getOrderStatus(
                  order.status
                );

              const items =
                Array.isArray(order.items)
                  ? order.items
                  : [];

              const itemCount =
                items.reduce(
                  (sum, item) =>
                    sum +
                    (Number(
                      item.quantity
                    ) || 0),
                  0
                );

              const chargeable =
                isChargeableOrder(
                  order.status
                );

              const baseAmount =
                Number(order.subtotal) || 0;

              const orderCharge =
                categoryConfigured &&
                chargeable
                  ? (baseAmount *
                      chargeRate!) /
                    100
                  : 0;

              const afterCharge =
                baseAmount -
                orderCharge;

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,.035)]"
                >

                  {/* ORDER HEADER */}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOrderId(
                        (current) =>
                          current ===
                          order.id
                            ? null
                            : order.id
                      )
                    }
                    className="w-full text-left"
                    aria-expanded={isOpen}
                  >

                    <div className="p-5 sm:p-6">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-[12px] font-black tracking-[-0.02em]">
                              Order #
                              {order.order_number}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[8px] font-black ${status.className}`}
                            >
                              {status.label}
                            </span>

                            {!chargeable && (
                              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[8px] font-black text-black/35">
                                No Charge
                              </span>
                            )}

                          </div>

                          <p className="mt-2 text-[9px] font-semibold text-black/40">
                            {formatDate(
                              order.created_at
                            )}
                          </p>

                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">

                          <div className="text-[15px] font-black tracking-[-0.03em]">
                            ₹
                            {formatPrice(
                              order.total_amount
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[8px] font-black text-black/35">
                            {itemCount}{" "}
                            {itemCount === 1
                              ? "item"
                              : "items"}

                            <ChevronIcon
                              open={isOpen}
                            />
                          </div>

                        </div>

                      </div>

                      {/* CHARGE SUMMARY */}

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

                        <div className="rounded-[14px] bg-[#f5f6f4] p-3">

                          <p className="text-[7px] font-black uppercase tracking-[0.08em] text-black/30">
                            Order Value
                          </p>

                          <p className="mt-1.5 text-[11px] font-black">
                            ₹
                            {formatPrice(
                              baseAmount
                            )}
                          </p>

                        </div>

                        <div className="rounded-[14px] bg-[#fff9ec] p-3">

                          <p className="text-[7px] font-black uppercase tracking-[0.08em] text-black/30">
                            Charge
                          </p>

                          <p className="mt-1.5 text-[11px] font-black text-[#b47b15]">
                            {chargeable &&
                            categoryConfigured
                              ? `${chargeRate}%`
                              : "—"}
                          </p>

                        </div>

                        <div className="rounded-[14px] bg-[#fff9ec] p-3">

                          <p className="text-[7px] font-black uppercase tracking-[0.08em] text-black/30">
                            Platform Fee
                          </p>

                          <p className="mt-1.5 text-[11px] font-black text-[#b47b15]">
                            {chargeable &&
                            categoryConfigured
                              ? `₹${formatPrice(
                                  orderCharge
                                )}`
                              : "₹0"}
                          </p>

                        </div>

                        <div className="rounded-[14px] bg-[#eaf7ef] p-3">

                          <p className="text-[7px] font-black uppercase tracking-[0.08em] text-[#159447]/60">
                            After Charge
                          </p>

                          <p className="mt-1.5 text-[11px] font-black text-[#159447]">
                            ₹
                            {formatPrice(
                              afterCharge
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                  </button>

                  {/* EXPANDED */}

                  {isOpen && (
                    <div className="border-t border-black/[0.06] px-5 pb-5 sm:px-6 sm:pb-6">

                      {/* ITEMS */}

                      <div className="pt-3">

                        <div className="pb-2 text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                          Order Items
                        </div>

                        <div className="divide-y divide-black/[0.06]">

                          {items.length > 0 ? (
                            items.map(
                              (
                                item,
                                index
                              ) => {

                                const basePrice =
                                  Number(
                                    item.price
                                  ) || 0;

                                const salePrice =
                                  item.sale_price !==
                                  null
                                    ? Number(
                                        item.sale_price
                                      )
                                    : null;

                                const finalPrice =
                                  salePrice !==
                                  null
                                    ? salePrice
                                    : basePrice;

                                const lineTotal =
                                  Number(
                                    item.line_total
                                  ) ||
                                  finalPrice *
                                    Number(
                                      item.quantity
                                    );

                                return (
                                  <div
                                    key={`${order.id}-${item.product_id}-${index}`}
                                    className="flex items-center gap-3 py-3"
                                  >

                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-[#f5f6f4]">

                                      {item.image_url ? (
                                        <img
                                          src={
                                            item.image_url
                                          }
                                          alt={
                                            item.product_name
                                          }
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-black/20">
                                          <PackageIcon />
                                        </div>
                                      )}

                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="line-clamp-2 text-[10px] font-black leading-4">
                                        {
                                          item.product_name
                                        }
                                      </p>

                                      <div className="mt-1 flex items-center gap-2">

                                        <span className="text-[9px] font-bold text-black/45">
                                          ₹
                                          {formatPrice(
                                            finalPrice
                                          )}{" "}
                                          ×{" "}
                                          {
                                            item.quantity
                                          }
                                        </span>

                                        {salePrice !==
                                          null &&
                                          salePrice <
                                            basePrice && (
                                            <span className="text-[8px] font-semibold text-black/25 line-through">
                                              ₹
                                              {formatPrice(
                                                basePrice
                                              )}
                                            </span>
                                          )}

                                      </div>

                                    </div>

                                    <div className="shrink-0 text-[10px] font-black">
                                      ₹
                                      {formatPrice(
                                        lineTotal
                                      )}
                                    </div>

                                  </div>
                                );
                              }
                            )
                          ) : (
                            <p className="py-4 text-[9px] font-semibold text-black/40">
                              Item details are
                              unavailable for this order.
                            </p>
                          )}

                        </div>

                      </div>

                      {/* CHARGE CALCULATION */}

                      <div className="mt-4 rounded-[19px] bg-[#f5f6f4] p-4 sm:p-5">

                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-2.5">

                            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[#159447]">
                              <ChargeIcon size={16} />
                            </div>

                            <div>
                              <p className="text-[9px] font-black">
                                Platform Charge Calculation
                              </p>

                              <p className="mt-0.5 text-[7px] font-semibold text-black/35">
                                Based on your shop category
                              </p>
                            </div>

                          </div>

                          {categoryConfigured && (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black text-[#159447]">
                              {chargeRate}%
                            </span>
                          )}

                        </div>

                        <div className="mt-4 space-y-2.5">

                          <div className="flex items-center justify-between">

                            <span className="text-[9px] font-semibold text-black/40">
                              Order Value
                            </span>

                            <span className="text-[10px] font-bold">
                              ₹
                              {formatPrice(
                                baseAmount
                              )}
                            </span>

                          </div>

                          <div className="flex items-center justify-between">

                            <span className="text-[9px] font-semibold text-black/40">
                              Platform Charge
                              {categoryConfigured
                                ? ` (${chargeRate}%)`
                                : ""}
                            </span>

                            <span className="text-[10px] font-bold text-[#b47b15]">
                              {chargeable &&
                              categoryConfigured
                                ? `- ₹${formatPrice(
                                    orderCharge
                                  )}`
                                : "₹0"}
                            </span>

                          </div>

                          <div className="border-t border-black/[0.07] pt-2.5">

                            <div className="flex items-center justify-between">

                              <span className="text-[10px] font-black">
                                After Platform Charge
                              </span>

                              <span className="text-[17px] font-black tracking-[-0.03em] text-[#159447]">
                                ₹
                                {formatPrice(
                                  afterCharge
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                        {!chargeable && (
                          <p className="mt-3 rounded-[12px] bg-white px-3 py-2 text-[8px] font-semibold text-black/40">
                            This order is{" "}
                            <span className="font-black">
                              {status.label.toLowerCase()}
                            </span>
                            , so no platform charge is
                            applied.
                          </p>
                        )}

                      </div>

                      {/* ORDER INFO */}

                      <div className="mt-3 rounded-[16px] border border-black/[0.06] px-4 py-3">

                        <div className="flex items-center justify-between gap-4">

                          <span className="text-[8px] font-bold text-black/35">
                            Order number
                          </span>

                          <span className="text-[9px] font-black">
                            #{order.order_number}
                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between gap-4">

                          <span className="text-[8px] font-bold text-black/35">
                            Placed on
                          </span>

                          <span className="text-right text-[9px] font-semibold text-black/60">
                            {formatDate(
                              order.created_at
                            )}
                          </span>

                        </div>

                        <div className="mt-2 flex items-center justify-between gap-4">

                          <span className="text-[8px] font-bold text-black/35">
                            Payment status
                          </span>

                          <span className="text-[9px] font-black">
                            {(
                              order.payment_status ||
                              "Pending"
                            )
                              .replace(
                                /_/g,
                                " "
                              )
                              .replace(
                                /\b\w/g,
                                (char) =>
                                  char.toUpperCase()
                              )}
                          </span>

                        </div>

                      </div>

                    </div>
                  )}

                </article>
              );
            })}

          </section>
        )}

        {/* FINAL SUMMARY */}

        {orders.length > 0 &&
          categoryConfigured && (
            <section className="mt-6 rounded-[24px] bg-[#111] p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,.08)] sm:p-6">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35">
                    Total Platform Charge
                  </p>

                  <p className="mt-2 text-[29px] font-black tracking-[-0.055em]">
                    ₹
                    {formatPrice(
                      stats.platformCharges
                    )}
                  </p>

                  <p className="mt-1 max-w-[470px] text-[8px] leading-4 text-white/40">
                    Calculated at {chargeRate}% on
                    eligible orders from your{" "}
                    {shop?.category} shop. Cancelled
                    and rejected orders are excluded.
                  </p>

                </div>

                <div className="rounded-[17px] bg-white/10 px-5 py-4 sm:min-w-[230px]">

                  <div className="flex items-center justify-between gap-6">

                    <span className="text-[8px] font-semibold text-white/40">
                      Order Value
                    </span>

                    <span className="text-[10px] font-black">
                      ₹
                      {formatPrice(
                        stats.orderValue
                      )}
                    </span>

                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-6">

                    <span className="text-[8px] font-semibold text-white/40">
                      Platform Charge
                    </span>

                    <span className="text-[10px] font-black text-[#8ee2ae]">
                      - ₹
                      {formatPrice(
                        stats.platformCharges
                      )}
                    </span>

                  </div>

                  <div className="mt-2.5 border-t border-white/10 pt-2.5">

                    <div className="flex items-center justify-between gap-6">

                      <span className="text-[8px] font-black text-white/70">
                        After Charges
                      </span>

                      <span className="text-[13px] font-black">
                        ₹
                        {formatPrice(
                          stats.netValue
                        )}
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </section>
          )}

        {/* FOOTER */}

        <footer className="pb-3 pt-10 text-center">

          <p className="text-[9px] font-semibold text-black/30">

            © 2026{" "}

            <span className="text-black/55">
              PNT
            </span>

            <span className="text-[#159447]">
              VERSE
            </span>

          </p>

        </footer>

      </div>

    </main>
  );
}