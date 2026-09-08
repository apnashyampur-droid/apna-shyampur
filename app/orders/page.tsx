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
  const value = (status || "").toLowerCase();

  if (value === "delivered") {
    return {
      label: "Delivered",
      className:
        "bg-[#eaf7ef] text-[#159447]",
    };
  }

  if (
    value === "out_for_delivery" ||
    value === "out for delivery"
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

  return {
    label: "Pending",
    className:
      "bg-[#fff9ec] text-[#b47b15]",
  };
}

function getPaymentStatus(
  paymentStatus: string | null,
  paymentMethod: string | null
) {
  const method =
    (paymentMethod || "").toLowerCase();

  const payment =
    (paymentStatus || "").toLowerCase();

  if (method === "cod") {
    if (
      payment === "paid" ||
      payment === "completed"
    ) {
      return "COD • Paid";
    }

    return "Cash on Delivery";
  }

  if (
    payment === "paid" ||
    payment === "completed"
  ) {
    return "UPI • Paid";
  }

  if (
    payment === "failed" ||
    payment === "cancelled"
  ) {
    return "UPI • Failed";
  }

  return "UPI • Pending";
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

function EmptyOrderIcon() {
  return (
    <svg
      width="28"
      height="28"
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

export default function OrdersPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null);

  const loadOrders = useCallback(
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
            "/sign-in?redirect=/orders"
          );
          return;
        }

        const {
          data,
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
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (ordersError) {
          console.error(
            "ORDERS FETCH ERROR:",
            ordersError
          );

          throw new Error(
            ordersError.message
          );
        }

        const formattedOrders: Order[] =
          (data || []).map((order) => ({
            ...order,
            subtotal:
              Number(order.subtotal) || 0,
            delivery_fee:
              Number(order.delivery_fee) || 0,
            total_amount:
              Number(order.total_amount) || 0,
            items: Array.isArray(order.items)
              ? (order.items as OrderItem[])
              : [],
          }));

        setOrders(formattedOrders);
      } catch (err) {
        console.error(
          "LOAD ORDERS ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your orders."
        );
      } finally {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleOrder = (
    orderId: string
  ) => {
    setExpandedOrderId((current) =>
      current === orderId
        ? null
        : orderId
    );
  };

  /* LOADING */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

        <div className="mx-auto max-w-[900px] px-4 py-5 sm:px-6">

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
                  ORDER HISTORY
                </div>
              </div>

            </div>

            <div className="h-9 w-16 animate-pulse rounded-full bg-white" />

          </header>

          <div className="py-6">

            <div className="h-8 w-44 animate-pulse rounded-lg bg-white" />

            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white" />

            <div className="mt-6 space-y-4">

              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-40 animate-pulse rounded-[24px] bg-white"
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
    router.push("/settings")
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
                Couldn't load orders
              </h1>

              <p className="mt-2 text-[10px] leading-5 text-black/45">
                {error}
              </p>

              <button
                type="button"
                onClick={loadOrders}
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

  /* EMPTY */

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

        <div className="mx-auto flex min-h-screen max-w-[900px] flex-col px-4 py-5 sm:px-6">

          <header className="flex items-center justify-between border-b border-black/[0.06] pb-5">

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
                  ORDER HISTORY
                </div>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/60"
            >
              Home
            </button>

          </header>

          <div className="flex flex-1 items-center justify-center py-16">

            <section className="w-full max-w-[480px] rounded-[28px] bg-white p-8 text-center shadow-[0_12px_45px_rgba(0,0,0,.05)] sm:p-10">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef8f1] text-[#159447]">
                <EmptyOrderIcon />
              </div>

              <h1 className="mt-6 text-[23px] font-black tracking-[-0.05em]">
                No orders yet
              </h1>

              <p className="mx-auto mt-2 max-w-[330px] text-[10px] leading-5 text-black/45">
                Your past purchases will appear
                here once you place your first
                order.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/")
                }
                className="mt-6 rounded-full bg-[#159447] px-6 py-3 text-[10px] font-black text-white shadow-[0_8px_22px_rgba(21,148,71,.16)]"
              >
                Start Shopping
              </button>

            </section>

          </div>

          <footer className="pb-3 pt-8 text-center">
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

  /* MAIN */

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      <div className="mx-auto max-w-[900px] px-4 py-5 pb-12 sm:px-6">

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
                <span>ORDER</span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>HISTORY</span>
              </div>

            </div>

          </div>

          <button
  type="button"
  onClick={() =>
    router.push("/settings")
  }
  className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/60 transition hover:border-black/20 hover:text-black"
>
  Back
</button>

        </header>

        {/* TITLE */}

        <section className="pt-6">

          <h1 className="text-[27px] font-black tracking-[-0.055em]">
            Order History
          </h1>

          <p className="mt-1 text-[10px] font-semibold text-black/40">
            Everything you have ordered from
            Apna Shyampur.
          </p>

        </section>

        {/* ORDERS */}

        <section className="mt-6 space-y-4">

          {orders.map((order) => {
            const isOpen =
              expandedOrderId ===
              order.id;

            const status =
              getOrderStatus(
                order.status
              );

            const payment =
              getPaymentStatus(
                order.payment_status,
                order.payment_method
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

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,.035)]"
              >

                {/* ORDER HEADER */}

                <button
                  type="button"
                  onClick={() =>
                    toggleOrder(
                      order.id
                    )
                  }
                  className="w-full text-left"
                  aria-expanded={isOpen}
                >

                  <div className="p-5 sm:p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

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

                        </div>

                        <h2 className="mt-2 truncate text-[14px] font-black tracking-[-0.025em]">
                          {order.shop_name ||
                            "Local Shop"}
                        </h2>

                        <p className="mt-1 text-[9px] font-semibold text-black/40">
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

                    {/* SMALL SUMMARY */}

                    <div className="mt-4 flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-[#f5f6f4] px-3 py-1.5 text-[8px] font-bold text-black/45">
                        {payment}
                      </span>

                      <span className="rounded-full bg-[#f5f6f4] px-3 py-1.5 text-[8px] font-bold text-black/45">
                        {items.length}{" "}
                        product
                        {items.length === 1
                          ? ""
                          : "s"}
                      </span>

                    </div>

                  </div>

                </button>

                {/* EXPANDED DETAILS */}

                {isOpen && (
                  <div className="border-t border-black/[0.06] px-5 pb-5 sm:px-6 sm:pb-6">

                    {/* ITEMS */}

                    <div className="pt-2">

                      <div className="pb-2 pt-3 text-[8px] font-black uppercase tracking-[0.1em] text-black/30">
                        Items
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
                                      Number(
                                        item.line_total
                                      ) ||
                                        finalPrice *
                                          Number(
                                            item.quantity
                                          )
                                    )}
                                  </div>

                                </div>
                              );
                            }
                          )
                        ) : (
                          <p className="py-4 text-[9px] font-semibold text-black/40">
                            Item details are
                            unavailable for
                            this order.
                          </p>
                        )}

                      </div>

                    </div>

                    {/* BILL */}

                    <div className="mt-4 rounded-[18px] bg-[#f5f6f4] p-4">

                      <div className="space-y-2.5">

                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-black/40">
                            Item Total
                          </span>

                          <span className="text-[10px] font-bold">
                            ₹
                            {formatPrice(
                              order.subtotal
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-black/40">
                            Delivery
                          </span>

                          <span className="text-[10px] font-bold">
                            {order.delivery_fee >
                            0
                              ? `₹${formatPrice(
                                  order.delivery_fee
                                )}`
                              : "Free"}
                          </span>
                        </div>

                        <div className="border-t border-black/[0.07] pt-2.5">

                          <div className="flex items-center justify-between">

                            <span className="text-[10px] font-black">
                              Total Paid
                            </span>

                            <span className="text-[16px] font-black tracking-[-0.03em]">
                              ₹
                              {formatPrice(
                                order.total_amount
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    </div>

                    {/* PAYMENT */}

                    <div className="mt-3 flex items-center justify-between rounded-[16px] border border-black/[0.06] bg-white px-4 py-3">

                      <div>

                        <p className="text-[8px] font-black uppercase tracking-[0.08em] text-black/30">
                          Payment
                        </p>

                        <p className="mt-1 text-[10px] font-black">
                          {payment}
                        </p>

                      </div>

                      <div
                        className={`rounded-full px-3 py-1.5 text-[8px] font-black ${
                          (
                            order.payment_status ||
                            ""
                          ).toLowerCase() ===
                            "paid" ||
                          (
                            order.payment_status ||
                            ""
                          ).toLowerCase() ===
                            "completed"
                            ? "bg-[#eaf7ef] text-[#159447]"
                            : "bg-[#fff9ec] text-[#b47b15]"
                        }`}
                      >
                        {(
                          order.payment_status ||
                          "pending"
                        ).toUpperCase()}
                      </div>

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

                    </div>

                  </div>
                )}

              </article>
            );
          })}

        </section>

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