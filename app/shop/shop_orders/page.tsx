"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type OrderItem = {
  product_id: string;
  product_name: string;
  image_url: string | null;
  quantity: number;
  price: number;
  sale_price: number | null;
  line_total: number;
};

type ShopOrder = {
  id: string;
  order_number: string;
  user_id: string;
  shop_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  items: OrderItem[];
  shop_name: string | null;
  created_at: string;
  updated_at: string;
};

type FilterStatus =
  | "all"
  | "new"
  | "active"
  | "completed"
  | "history";

const ACTIVE_STATUSES: OrderStatus[] = [
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
];

const HISTORY_STATUSES: OrderStatus[] = [
  "delivered",
  "completed",
  "cancelled",
];

const COMPLETED_VISIBLE_MS =
  24 * 60 * 60 * 1000;

  function ShopOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null);

  const statusParam =
    searchParams.get("status");

  const currentFilter: FilterStatus =
    statusParam === "new" ||
    statusParam === "active" ||
    statusParam === "completed" ||
    statusParam === "history"
      ? statusParam
      : "all";

  /* -------------------------------------------------- */
  /* FORMATTERS */
  /* -------------------------------------------------- */

  const formatPrice = useCallback(
    (value: number) => {
      return new Intl.NumberFormat(
        "en-IN"
      ).format(
        Math.round(Number(value) || 0)
      );
    },
    []
  );

  const formatDateTime = useCallback(
    (date: string) => {
      try {
        return new Intl.DateTimeFormat(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          }
        ).format(new Date(date));
      } catch {
        return date;
      }
    },
    []
  );

  const formatShortDate = useCallback(
    (date: string) => {
      try {
        return new Intl.DateTimeFormat(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          }
        ).format(new Date(date));
      } catch {
        return date;
      }
    },
    []
  );

  /* -------------------------------------------------- */
  /* LOAD ORDERS */
  /* -------------------------------------------------- */

  const loadOrders = useCallback(
    async (showFullLoader = true) => {
      try {
        if (showFullLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        /* -------------------------------------------- */
        /* GET SHOP APPLICATION */
        /* -------------------------------------------- */

        const {
          data: application,
          error: applicationError,
        } = await supabase
          .from("store_applications")
          .select(
            "id, status, store_name"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (applicationError) {
          throw applicationError;
        }

        if (!application) {
          router.replace("/shop");
          return;
        }

        if (
          application.status !==
          "approved"
        ) {
          router.replace("/shop");
          return;
        }

        /* -------------------------------------------- */
        /* GET ACTUAL SHOP */
        /* -------------------------------------------- */

      const {
  data: actualShop,
  error: actualShopError,
} = await supabase
  .from("shops")
  .select("id, name, application_id")
  .eq("application_id", application.id)
  .maybeSingle();

if (actualShopError) {
  console.error("Actual shop lookup error:", {
    message: actualShopError.message,
    details: actualShopError.details,
    hint: actualShopError.hint,
    code: actualShopError.code,
  });

  throw actualShopError;
}

if (!actualShop?.id) {
  console.error("Shop lookup failed:", {
    applicationId: application.id,
    applicationStatus: application.status,
    userId: user.id,
    actualShop,
  });

  throw new Error(
    "Your approved shop could not be found."
  );
}

        const {
          data: orderData,
          error: orderError,
        } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            user_id,
            shop_id,
            status,
            payment_status,
            payment_method,
            subtotal,
            delivery_fee,
            total_amount,
            customer_name,
            customer_phone,
            delivery_address,
            delivery_latitude,
            delivery_longitude,
            items,
            shop_name,
            created_at,
            updated_at
          `)
          .eq(
            "shop_id",
            actualShop.id
          )
          .order("created_at", {
            ascending: false,
          });

        if (orderError) {
          throw orderError;
        }

        const normalizedOrders: ShopOrder[] =
          (orderData || []).map(
            (order) => ({
              id: order.id,
              order_number:
                order.order_number,
              user_id: order.user_id,
              shop_id: order.shop_id,

              status:
                normalizeStatus(
                  order.status
                ),

              payment_status:
                normalizePaymentStatus(
                  order.payment_status
                ),

              payment_method:
                order.payment_method,

              subtotal:
                Number(
                  order.subtotal
                ) || 0,

              delivery_fee:
                Number(
                  order.delivery_fee
                ) || 0,

              total_amount:
                Number(
                  order.total_amount
                ) || 0,

              customer_name:
                order.customer_name,

              customer_phone:
                order.customer_phone,

              delivery_address:
                order.delivery_address,

              delivery_latitude:
                order.delivery_latitude,

              delivery_longitude:
                order.delivery_longitude,

              items:
                Array.isArray(
                  order.items
                )
                  ? order.items
                  : [],

              shop_name:
                order.shop_name,

              created_at:
                order.created_at,

              updated_at:
                order.updated_at,
            })
          );

        setOrders(normalizedOrders);
      } catch (error) {
        console.error(
          "Shop orders load error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load orders. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
  const timer = window.setInterval(() => {
    setOrders((currentOrders) =>
      [...currentOrders]
    );
  }, 60 * 1000);

  return () => {
    window.clearInterval(timer);
  };
}, []);

  /* -------------------------------------------------- */
  /* REALTIME */
  /* -------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      channel = supabase
        .channel(
          `shop-orders-realtime-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          () => {
            if (!cancelled) {
              loadOrders(false);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [loadOrders, supabase]);

  /* -------------------------------------------------- */
  /* FILTER COUNTS */
  /* -------------------------------------------------- */
const counts = useMemo(() => {
  const now = Date.now();

  const newOrders = orders.filter(
    (order) =>
      order.status === "pending"
  ).length;

  const activeOrders = orders.filter(
    (order) =>
      ACTIVE_STATUSES.includes(
        order.status
      )
  ).length;

  const completedOrders =
    orders.filter((order) => {
     if (
  order.status !== "delivered" &&
  order.status !== "completed"
) {
  return false;
}

      const completedAt =
        new Date(
          order.updated_at
        ).getTime();

      return (
        now - completedAt <
        COMPLETED_VISIBLE_MS
      );
    }).length;

  const historyOrders =
    orders.filter((order) =>
      HISTORY_STATUSES.includes(
        order.status
      )
    ).length;

  return {
    all: orders.length,
    new: newOrders,
    active: activeOrders,
    completed: completedOrders,
    history: historyOrders,
  };
}, [orders]);

  /* -------------------------------------------------- */
  /* FILTERED ORDERS */
  /* -------------------------------------------------- */

const filteredOrders = useMemo(() => {
  const query =
    searchQuery.trim().toLowerCase();

  const now = Date.now();

  return orders.filter((order) => {
    let matchesStatus = true;

    if (currentFilter === "new") {
      matchesStatus =
        order.status === "pending";
    }

    if (currentFilter === "active") {
      matchesStatus =
        ACTIVE_STATUSES.includes(
          order.status
        );
    }

    if (currentFilter === "completed") {
      if (
  order.status !== "delivered" &&
  order.status !== "completed"
) {
  matchesStatus = false;
} else {
        const completedAt =
          new Date(
            order.updated_at
          ).getTime();

        matchesStatus =
          now - completedAt <
          COMPLETED_VISIBLE_MS;
      }
    }

    if (currentFilter === "history") {
      matchesStatus =
        HISTORY_STATUSES.includes(
          order.status
        );
    }

    if (!matchesStatus) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableText =
      [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.delivery_address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    return searchableText.includes(
      query
    );
  });
}, [
  currentFilter,
  orders,
  searchQuery,
]);

  /* -------------------------------------------------- */
  /* TAB NAVIGATION */
  /* -------------------------------------------------- */

  const changeFilter = (
    filter: FilterStatus
  ) => {
    if (filter === "all") {
      router.push(
        "/shop/shop_orders"
      );
      return;
    }

    router.push(
      `/shop/shop_orders?status=${filter}`
    );
  };

  /* -------------------------------------------------- */
  /* LOADING */
  /* -------------------------------------------------- */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader
          onBack={() =>
            router.push("/shop")
          }
        />

        <div className="mx-auto max-w-[1050px] px-4 py-5 sm:px-6 lg:px-8">
          <OrdersSkeleton />
        </div>
      </main>
    );
  }

  /* -------------------------------------------------- */
  /* MAIN */
  /* -------------------------------------------------- */

  return (
    <main className="min-h-screen bg-[#f5f6f4] pb-12 text-[#111]">
      <ShopHeader
        onBack={() =>
          router.push("/shop")
        }
      />

      <div className="mx-auto max-w-[1050px] px-4 py-5 sm:px-6 lg:px-8">
        {/* PAGE HEADING */}

        <section className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#159447]">
                Shop Orders
              </p>

              <h1 className="mt-1 text-[27px] font-black tracking-[-0.055em] sm:text-[32px]">
                Orders
              </h1>

              <p className="mt-1 max-w-[520px] text-[10px] font-semibold leading-5 text-black/45 sm:text-[11px]">
                View customer orders from your
                shop in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadOrders(false)
              }
              disabled={refreshing}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-[9px] font-black text-black/60 shadow-[0_4px_18px_rgba(0,0,0,.025)] transition hover:bg-black/[0.02] disabled:opacity-50"
            >
              <RefreshIcon
                spinning={refreshing}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </section>

        {/* ERROR */}

        {errorMessage && (
          <section className="mb-4 rounded-[18px] border border-red-500/15 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertIcon />

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-red-700">
                  Something went wrong
                </p>

                <p className="mt-1 text-[9px] font-semibold leading-4 text-red-600/75">
                  {errorMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadOrders(true)
                }
                className="shrink-0 text-[9px] font-black text-red-700"
              >
                Retry
              </button>
            </div>
          </section>
        )}

        {/* SUMMARY */}

        <section className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <SummaryCard
            label="New Orders"
            value={counts.new}
            icon={<OrderIcon />}
            accent="green"
            active={
              currentFilter === "new"
            }
            onClick={() =>
              changeFilter("new")
            }
          />

          <SummaryCard
            label="Active"
            value={counts.active}
            icon={<ClockIcon />}
            accent="orange"
            active={
              currentFilter === "active"
            }
            onClick={() =>
              changeFilter("active")
            }
          />

          <SummaryCard
            label="Completed"
            value={counts.completed}
            icon={<CheckIcon />}
            accent="blue"
            active={
              currentFilter === "completed"
            }
            onClick={() =>
              changeFilter("completed")
            }
          />

          <SummaryCard
            label="All Orders"
            value={counts.all}
            icon={<HistoryIcon />}
            accent="black"
            active={
              currentFilter === "all"
            }
            onClick={() =>
              changeFilter("all")
            }
          />
        </section>

        {/* TABS */}

        <section className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 rounded-[17px] border border-black/[0.06] bg-white p-1.5 shadow-[0_5px_22px_rgba(0,0,0,.025)]">
            <FilterTab
              label="All"
              count={counts.all}
              active={
                currentFilter === "all"
              }
              onClick={() =>
                changeFilter("all")
              }
            />

            <FilterTab
              label="New"
              count={counts.new}
              active={
                currentFilter === "new"
              }
              onClick={() =>
                changeFilter("new")
              }
              green
            />

            <FilterTab
              label="Active"
              count={counts.active}
              active={
                currentFilter === "active"
              }
              onClick={() =>
                changeFilter("active")
              }
            />

            <FilterTab
              label="Completed"
              count={counts.completed}
              active={
                currentFilter ===
                "completed"
              }
              onClick={() =>
                changeFilter(
                  "completed"
                )
              }
            />

            <FilterTab
              label="History"
              count={counts.history}
              active={
                currentFilter === "history"
              }
              onClick={() =>
                changeFilter("history")
              }
            />
          </div>
        </section>

        {/* SEARCH */}

        <section className="mt-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-black/25">
              <SearchIcon />
            </div>

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search by order number or customer..."
              className="h-12 w-full rounded-[17px] border border-black/[0.07] bg-white pl-11 pr-10 text-[10px] font-semibold text-black outline-none shadow-[0_5px_22px_rgba(0,0,0,.025)] placeholder:text-black/30 focus:border-[#159447]/35"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-black/35 hover:bg-black/[0.04] hover:text-black"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </section>

        {/* RESULT HEADER */}

        <section className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black">
              {getFilterTitle(
                currentFilter
              )}
            </p>

            <p className="mt-0.5 text-[8px] font-semibold text-black/35">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1
                ? "order"
                : "orders"}
              {searchQuery
                ? " found"
                : ""}
            </p>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
              className="text-[9px] font-black text-[#159447]"
            >
              Clear search
            </button>
          )}
        </section>

        {/* ORDERS */}

        <section className="mt-3 space-y-3">
          {filteredOrders.length ===
          0 ? (
            <EmptyOrders
              filter={currentFilter}
              hasSearch={Boolean(
                searchQuery.trim()
              )}
              onClear={() => {
                setSearchQuery("");
              }}
              onShowAll={() =>
                changeFilter("all")
              }
            />
          ) : (
            filteredOrders.map(
              (order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={
                    expandedOrderId ===
                    order.id
                  }
                  formatPrice={
                    formatPrice
                  }
                  formatDateTime={
                    formatDateTime
                  }
                  formatShortDate={
                    formatShortDate
                  }
                  onToggle={() =>
                    setExpandedOrderId(
                      (current) =>
                        current ===
                        order.id
                          ? null
                          : order.id
                    )
                  }
                />
              )
            )
          )}
        </section>

        {/* FOOTER */}

        <footer className="pt-12 text-center">
          <p className="text-[9px] font-semibold text-black/25">
            © 2026{" "}
            <span className="text-black/45">
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

/* ================================================== */
/* ORDER CARD */
/* ================================================== */

function OrderCard({
  order,
  expanded,
  formatPrice,
  formatDateTime,
  formatShortDate,
  onToggle,
}: {
  order: ShopOrder;
  expanded: boolean;
  formatPrice: (
    value: number
  ) => string;
  formatDateTime: (
    value: string
  ) => string;
  formatShortDate: (
    value: string
  ) => string;
  onToggle: () => void;
}) {
  const itemCount = order.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const isNew =
    order.status === "pending";

  return (
    <article
      className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_7px_28px_rgba(0,0,0,.035)] transition ${
        isNew
          ? "border-[#159447]/20"
          : "border-black/[0.06]"
      }`}
    >
      {/* NEW STRIP */}

      {isNew && (
        <div className="flex items-center gap-2 border-b border-[#159447]/10 bg-[#eef8f1] px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />

          <span className="text-[8px] font-black uppercase tracking-[0.08em] text-[#159447]">
            New order
          </span>

          <span className="ml-auto text-[8px] font-bold text-black/35">
            {formatShortDate(
              order.created_at
            )}
          </span>
        </div>
      )}

      {/* MAIN */}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* ORDER ICON */}

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
              isNew
                ? "bg-[#eef8f1] text-[#159447]"
                : "bg-[#f5f6f4] text-black/45"
            }`}
          >
            <PackageIcon />
          </div>

          {/* ORDER INFO */}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[12px] font-black tracking-[-0.02em]">
                #{order.order_number}
              </h2>

              <StatusBadge
                status={order.status}
              />
            </div>

            <p className="mt-1 truncate text-[10px] font-bold text-black/65">
              {order.customer_name ||
                "Customer"}
            </p>

            <p className="mt-0.5 text-[8px] font-semibold text-black/35">
              {itemCount}{" "}
              {itemCount === 1
                ? "item"
                : "items"}{" "}
              ·{" "}
              {formatDateTime(
                order.created_at
              )}
            </p>
          </div>

          {/* PRICE */}

          <div className="shrink-0 text-right">
            <p className="text-[16px] font-black tracking-[-0.04em]">
              ₹
              {formatPrice(
                order.total_amount
              )}
            </p>

            <PaymentBadge
              paymentMethod={
                order.payment_method
              }
              paymentStatus={
                order.payment_status
              }
            />
          </div>
        </div>

        {/* ITEM PREVIEW */}

        <div className="mt-4 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            {order.items
              .slice(0, 4)
              .map(
                (item, index) => (
                  <div
                    key={`${item.product_id}-${index}`}
                    className={`h-9 w-9 shrink-0 overflow-hidden rounded-[10px] border-2 border-white bg-[#f5f6f4] ${
                      index > 0
                        ? "-ml-2"
                        : ""
                    }`}
                  >
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
                        <PackageIcon
                          size={14}
                        />
                      </div>
                    )}
                  </div>
                )
              )}

            {order.items.length >
              4 && (
              <div className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-2 border-white bg-[#f0f1ef] text-[8px] font-black text-black/45">
                +
                {order.items.length -
                  4}
              </div>
            )}

            <div className="ml-3 min-w-0">
              <p className="truncate text-[9px] font-bold text-black/55">
                {order.items.length > 0
                  ? order.items
                      .slice(0, 2)
                      .map(
                        (item) =>
                          item.product_name
                      )
                      .join(", ")
                  : "No item details"}

                {order.items.length >
                  2
                  ? "..."
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* DELIVERY ADDRESS PREVIEW */}

        {order.delivery_address && (
          <div className="mt-4 flex items-start gap-2 rounded-[13px] bg-[#f7f7f5] px-3 py-2.5">
            <LocationIcon />

            <p className="line-clamp-2 text-[8px] font-semibold leading-4 text-black/45">
              {order.delivery_address}
            </p>
          </div>
        )}

        {/* ACTION */}

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-black/[0.08] bg-white px-4 text-[9px] font-black text-black/55 transition hover:bg-black/[0.025] hover:text-black"
          >
            {expanded
              ? "Hide Details"
              : "View Order"}

            <ChevronIcon
              open={expanded}
            />
          </button>
        </div>
      </div>

      {/* EXPANDED DETAILS */}

      {expanded && (
        <div className="border-t border-black/[0.06] bg-[#fafaf8] p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            {/* LEFT */}

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                    Order Items
                  </p>

                  <p className="mt-1 text-[11px] font-black">
                    {order.items.length}{" "}
                    {order.items.length ===
                    1
                      ? "product"
                      : "products"}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[15px] border border-black/[0.06] bg-white">
                {order.items.length ===
                0 ? (
                  <div className="px-4 py-5 text-center text-[9px] font-semibold text-black/35">
                    No item details available.
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.06]">
                    {order.items.map(
                      (
                        item,
                        index
                      ) => {
                        const finalPrice =
                          item.sale_price !==
                          null
                            ? Number(
                                item.sale_price
                              )
                            : Number(
                                item.price
                              );

                        return (
                          <div
                            key={`${item.product_id}-${index}`}
                            className="flex items-center gap-3 px-3 py-3"
                          >
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#f5f6f4]">
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
                              <p className="truncate text-[10px] font-black">
                                {
                                  item.product_name
                                }
                              </p>

                              <p className="mt-0.5 text-[8px] font-semibold text-black/40">
                                ₹
                                {formatPrice(
                                  finalPrice
                                )}{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </p>
                            </div>

                            <p className="text-[10px] font-black">
                              ₹
                              {formatPrice(
                                Number(
                                  item.line_total
                                ) ||
                                  finalPrice *
                                    Number(
                                      item.quantity
                                    )
                              )}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* CUSTOMER */}

              <div className="mt-4">
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                  Customer
                </p>

                <div className="mt-2 rounded-[15px] border border-black/[0.06] bg-white p-4">
                  <p className="text-[11px] font-black">
                    {order.customer_name ||
                      "Customer"}
                  </p>

                  {order.customer_phone && (
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="mt-2 flex items-center gap-2 text-[9px] font-bold text-[#159447]"
                    >
                      <PhoneIcon />
                      {order.customer_phone}
                    </a>
                  )}

                  {order.delivery_address && (
                    <div className="mt-3 flex items-start gap-2">
                      <LocationIcon />

                      <p className="text-[9px] font-semibold leading-4 text-black/50">
                        {
                          order.delivery_address
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                Order Summary
              </p>

              <div className="mt-2 rounded-[15px] border border-black/[0.06] bg-white p-4">
                <div className="space-y-3">
                  <SummaryRow
                    label="Item Total"
                    value={`₹${formatPrice(
                      order.subtotal
                    )}`}
                  />

                  <SummaryRow
                    label="Delivery"
                    value={
                      Number(
                        order.delivery_fee
                      ) > 0
                        ? `₹${formatPrice(
                            order.delivery_fee
                          )}`
                        : "Free"
                    }
                  />

                  <div className="border-t border-black/[0.06] pt-3">
                    <SummaryRow
                      label="Total"
                      value={`₹${formatPrice(
                        order.total_amount
                      )}`}
                      strong
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT */}

              <div className="mt-3 rounded-[15px] border border-black/[0.06] bg-white p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                  Payment
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black">
                      {getPaymentMethodLabel(
                        order.payment_method
                      )}
                    </p>

                    <p className="mt-0.5 text-[8px] font-semibold text-black/35">
                      {order.payment_status ===
                      "paid"
                        ? "Payment received"
                        : order.payment_status ===
                            "failed"
                          ? "Payment failed"
                          : "Payment pending"}
                    </p>
                  </div>

                  <PaymentStatusPill
                    status={
                      order.payment_status
                    }
                  />
                </div>
              </div>

              {/* ORDER TIMING */}

              <div className="mt-3 rounded-[15px] border border-black/[0.06] bg-white p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                  Timeline
                </p>

                <div className="mt-3 space-y-3">
                  <TimelineRow
                    label="Order placed"
                    value={formatDateTime(
                      order.created_at
                    )}
                    active
                  />

                  <TimelineRow
                    label="Last updated"
                    value={formatDateTime(
                      order.updated_at
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LOCATION */}

          {order.delivery_latitude !==
            null &&
            order.delivery_longitude !==
              null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_latitude},${order.delivery_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-between rounded-[15px] border border-[#159447]/10 bg-[#eef8f1] px-4 py-3 transition hover:bg-[#e3f4e9]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#159447]">
                    <LocationIcon />
                  </div>

                  <div>
                    <p className="text-[9px] font-black">
                      Delivery location
                    </p>

                    <p className="mt-0.5 text-[8px] font-semibold text-black/40">
                      Open customer location
                      in Maps
                    </p>
                  </div>
                </div>

                <ArrowRightIcon />
              </a>
            )}
        </div>
      )}
    </article>
  );
}

/* ================================================== */
/* HEADER */
/* ================================================== */

function ShopHeader({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <header className="border-b border-black/[0.06] bg-[#f5f6f4]">
      <div className="mx-auto flex h-[70px] max-w-[1050px] items-center justify-between px-4 sm:px-6 lg:px-8">
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

            <div className="mt-1 flex items-center gap-1.5 text-[7px] font-bold tracking-[0.12em] text-black/40 sm:text-[8px]">
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
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
        >
          Back
        </button>
      </div>
    </header>
  );
}

/* ================================================== */
/* SUMMARY CARD */
/* ================================================== */

function SummaryCard({
  label,
  value,
  icon,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent:
    | "green"
    | "orange"
    | "blue"
    | "black";
  active: boolean;
  onClick: () => void;
}) {
  const accentClasses = {
    green:
      "bg-[#eef8f1] text-[#159447]",

    orange:
      "bg-[#fff6e8] text-[#c58a19]",

    blue:
      "bg-[#eef3fb] text-[#4169a8]",

    black:
      "bg-[#f2f2f2] text-black/60",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[19px] border bg-white p-3.5 text-left shadow-[0_5px_22px_rgba(0,0,0,.025)] transition hover:-translate-y-[1px] ${
        active
          ? "border-[#159447]/25 ring-2 ring-[#159447]/5"
          : "border-black/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${accentClasses[accent]}`}
        >
          {icon}
        </div>

        {active && (
          <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />
        )}
      </div>

      <p className="mt-3 text-[20px] font-black tracking-[-0.05em]">
        {value}
      </p>

      <p className="mt-0.5 text-[8px] font-bold text-black/40">
        {label}
      </p>
    </button>
  );
}

/* ================================================== */
/* FILTER TAB */
/* ================================================== */

function FilterTab({
  label,
  count,
  active,
  onClick,
  green = false,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  green?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-[12px] px-3.5 text-[9px] font-black transition ${
        active
          ? "bg-[#111] text-white"
          : "text-black/45 hover:bg-black/[0.035] hover:text-black"
      }`}
    >
      {label}

      <span
        className={`min-w-[19px] rounded-full px-1.5 py-0.5 text-center text-[7px] ${
          active
            ? "bg-white/15 text-white"
            : green
              ? "bg-[#eef8f1] text-[#159447]"
              : "bg-black/[0.05] text-black/35"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* ================================================== */
/* STATUS BADGE */
/* ================================================== */

function StatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const config =
    getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[0.05em] ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  );
}

/* ================================================== */
/* PAYMENT BADGE */
/* ================================================== */

function PaymentBadge({
  paymentMethod,
  paymentStatus,
}: {
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
}) {
  const label =
    paymentMethod === "cod"
      ? "COD"
      : paymentMethod === "online"
        ? "Online"
        : paymentMethod === "upi"
          ? "UPI"
          : "Payment";

  const paid =
    paymentStatus === "paid";

  return (
    <span
      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[6px] font-black uppercase tracking-[0.04em] ${
        paid
          ? "bg-[#eef8f1] text-[#159447]"
          : "bg-[#fff6e8] text-[#b47a12]"
      }`}
    >
      {label}
      {" · "}
      {paid ? "PAID" : "PENDING"}
    </span>
  );
}

/* ================================================== */
/* PAYMENT STATUS */
/* ================================================== */

function PaymentStatusPill({
  status,
}: {
  status: PaymentStatus;
}) {
  const config = {
    paid: {
      label: "Paid",
      className:
        "bg-[#eef8f1] text-[#159447]",
    },

    pending: {
      label: "Pending",
      className:
        "bg-[#fff6e8] text-[#b47a12]",
    },

    failed: {
      label: "Failed",
      className:
        "bg-red-50 text-red-600",
    },

    refunded: {
      label: "Refunded",
      className:
        "bg-[#eef3fb] text-[#4169a8]",
    },
  }[status];

  return (
    <span
      className={`rounded-full px-2 py-1 text-[7px] font-black ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/* ================================================== */
/* EMPTY */
/* ================================================== */

function EmptyOrders({
  filter,
  hasSearch,
  onClear,
  onShowAll,
}: {
  filter: FilterStatus;
  hasSearch: boolean;
  onClear: () => void;
  onShowAll: () => void;
}) {
  let title =
    "No orders yet";

  let description =
    "Orders from your shop will appear here.";

  if (hasSearch) {
    title = "No matching orders";

    description =
      "Try another order number or customer name.";
  } else if (filter === "new") {
    title = "No new orders";

    description =
      "New customer orders will appear here.";
  } else if (filter === "active") {
    title = "No active orders";

    description =
      "Orders currently being processed will appear here.";
  } else if (
    filter === "completed"
  ) {
    title = "No completed orders";

    description =
      "Completed orders will appear here.";
  } else if (
    filter === "history"
  ) {
    title = "No order history";

    description =
      "Completed and cancelled orders will appear here.";
  }

  return (
    <div className="rounded-[24px] border border-black/[0.06] bg-white px-5 py-12 text-center shadow-[0_7px_28px_rgba(0,0,0,.025)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f6f4] text-black/25">
        <OrderIcon size={23} />
      </div>

      <h2 className="mt-5 text-[15px] font-black tracking-[-0.03em]">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-[340px] text-[9px] font-semibold leading-5 text-black/40">
        {description}
      </p>

      <div className="mt-5 flex justify-center gap-2">
        {hasSearch ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-[12px] bg-[#111] px-4 py-2.5 text-[8px] font-black text-white"
          >
            Clear Search
          </button>
        ) : filter !== "all" ? (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-[12px] bg-[#111] px-4 py-2.5 text-[8px] font-black text-white"
          >
            View All Orders
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ================================================== */
/* SKELETON */
/* ================================================== */

function OrdersSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-5">
        <div className="h-2.5 w-20 rounded-full bg-black/[0.07]" />

        <div className="mt-2 h-8 w-36 rounded-lg bg-black/[0.07]" />

        <div className="mt-2 h-3 w-64 rounded-full bg-black/[0.05]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-28 rounded-[19px] bg-white"
            />
          )
        )}
      </div>

      <div className="mt-5 h-14 rounded-[17px] bg-white" />

      <div className="mt-3 h-12 rounded-[17px] bg-white" />

      <div className="mt-5 space-y-3">
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              className="h-48 rounded-[22px] bg-white"
            />
          )
        )}
      </div>
    </div>
  );
}

/* ================================================== */
/* SMALL COMPONENTS */
/* ================================================== */

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-[9px] ${
          strong
            ? "font-black text-black"
            : "font-semibold text-black/40"
        }`}
      >
        {label}
      </span>

      <span
        className={`${
          strong
            ? "text-[15px] font-black tracking-[-0.03em]"
            : "text-[9px] font-bold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TimelineRow({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          active
            ? "bg-[#159447]"
            : "bg-black/15"
        }`}
      />

      <div className="min-w-0">
        <p className="text-[9px] font-black">
          {label}
        </p>

        <p className="mt-0.5 text-[8px] font-semibold text-black/35">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ================================================== */
/* HELPERS */
/* ================================================== */

function normalizeStatus(
  status: unknown
): OrderStatus {
  switch (status) {
    case "pending":
      return "pending";

    case "accepted":
      return "accepted";

    case "preparing":
      return "preparing";

    case "ready":
      return "ready";

    case "out_for_delivery":
  return "out_for_delivery";

case "delivered":
  return "delivered";

case "completed":
  return "completed";

    case "cancelled":
      return "cancelled";

    default:
      return "pending";
  }
}

function normalizePaymentStatus(
  status: unknown
): PaymentStatus {
  switch (status) {
    case "paid":
      return "paid";

    case "failed":
      return "failed";

    case "refunded":
      return "refunded";

    default:
      return "pending";
  }
}

function getStatusConfig(
  status: OrderStatus
) {
  switch (status) {
    case "pending":
      return {
        label: "New",
        className:
          "bg-[#eef8f1] text-[#159447]",
      };

    case "accepted":
      return {
        label: "Accepted",
        className:
          "bg-[#eef3fb] text-[#4169a8]",
      };

    case "preparing":
      return {
        label: "Preparing",
        className:
          "bg-[#fff6e8] text-[#b47a12]",
      };

    case "ready":
      return {
        label: "Ready",
        className:
          "bg-[#f1edfb] text-[#7154a6]",
      };

      case "out_for_delivery":
  return {
    label: "Out for Delivery",
    className:
      "bg-[#eaf5f9] text-[#27768d]",
  };

case "delivered":
  return {
    label: "Completed",
    className:
      "bg-[#eef8f1] text-[#159447]",
  };

case "completed":
  
      return {
        label: "Completed",
        className:
          "bg-[#eef8f1] text-[#159447]",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "bg-red-50 text-red-600",
      };
  }
}

function getPaymentMethodLabel(
  method: string | null
) {
  switch (method) {
    case "cod":
      return "Cash on Delivery";

    case "online":
      return "Online Payment";

    case "upi":
      return "UPI";

    default:
      return "Payment";
  }
}

function getFilterTitle(
  filter: FilterStatus
) {
  switch (filter) {
    case "new":
      return "New Orders";

    case "active":
      return "Active Orders";

    case "completed":
      return "Completed Orders";

    case "history":
      return "Order History";

    default:
      return "All Orders";
  }
}

/* ================================================== */
/* ICONS */
/* ================================================== */

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function ArrowRightIcon() {
  return (
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
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon({
  size = 17,
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
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function OrderIcon({
  size = 17,
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
      <path d="M6 3h12v18H6z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </svg>
  );
}

function PackageIcon({
  size = 17,
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

function ClockIcon() {
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function HistoryIcon() {
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
      <path d="M3 12a9 9 0 1 0 3-6.7" />

      <path d="M3 4v5h5" />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon() {
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
      <path d="M6 6l12 12" />

      <path d="M18 6 6 18" />
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
      width="12"
      height="12"
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

function RefreshIcon({
  spinning,
}: {
  spinning: boolean;
}) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        spinning
          ? "animate-spin"
          : ""
      }
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />

      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-red-500"
    >
      <path d="M10.3 3.2 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z" />

      <path d="M12 9v4" />

      <path d="M12 17h.01" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-black/30"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-black/30"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

 export default function ShopOrdersPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
          <div className="mx-auto max-w-[1050px] px-4 py-5 sm:px-6 lg:px-8">
            <OrdersSkeleton />
          </div>
        </main>
      }
    >
      <ShopOrdersContent />
    </Suspense>
  );
}