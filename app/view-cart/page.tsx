"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  salePrice: number | null;
  imageUrl: string | null;
};

type SavedCart = {
  shopId: string;
  shopName: string;
  shopSlug?: string;
  shopCategory?: string;
  items: CartItem[];
};

type Profile = {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ViewCartPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [cart, setCart] = useState<SavedCart | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  /* LOAD CART */

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(
        "apna_shyampur_cart"
      );

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    }
  }, []);

  /* LOAD PROFILE */

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
         .select(
  "full_name, phone, address, latitude, longitude"
)
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile load error:", error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  /* PROFILE CHECK */

 /* PROFILE CHECK */

const profileComplete = useMemo(() => {
  if (!profile) return false;

  const hasName =
    Boolean(profile.full_name?.trim());

  const hasPhone =
    Boolean(profile.phone?.trim());

  const hasAddress =
    Boolean(profile.address?.trim());

  return (
    hasName &&
    hasPhone &&
    hasAddress
  );
}, [profile]);

  /* CART DATA */

  const cartItems = cart?.items ?? [];

  const itemCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price =
        item.salePrice !== null
          ? Number(item.salePrice)
          : Number(item.price);

      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const deliveryCharge = 0;

  const total = subtotal + deliveryCharge;

  /* UPDATE QUANTITY */

  function updateQuantity(
    productId: string,
    change: number
  ) {
    if (!cart) return;

    const updatedItems = cart.items
      .map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + change,
        };
      })
      .filter((item) => item.quantity > 0);

    const updatedCart: SavedCart = {
      ...cart,
      items: updatedItems,
    };

    setCart(updatedCart);

    localStorage.setItem(
      "apna_shyampur_cart",
      JSON.stringify(updatedCart)
    );
  }

  /* CLEAR CART */

  function clearCart() {
    localStorage.removeItem(
      "apna_shyampur_cart"
    );

    setCart(null);
  }

  /* LOADING */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

        {/* HEADER */}

        <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

            <div className="flex items-center gap-3">

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

            </div>

            <div className="h-9 w-16 animate-pulse rounded-full bg-black/[0.05]" />

          </div>
        </header>

        {/* LOADING */}

        <section className="mx-auto max-w-[760px] px-5 py-10 sm:px-8">

          <div className="h-10 w-40 animate-pulse rounded-xl bg-black/[0.07]" />

          <div className="mt-6 h-24 animate-pulse rounded-[22px] bg-white" />

          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-[20px] bg-white"
              />
            ))}
          </div>

          <div className="mt-4 h-48 animate-pulse rounded-[22px] bg-white" />

        </section>

      </main>
    );
  }

  /* EMPTY CART */

  if (!cart || cart.items.length === 0) {
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

        {/* EMPTY STATE */}

        <section className="mx-auto flex min-h-[calc(100vh-70px)] max-w-[760px] items-center justify-center px-5 py-12 sm:px-8">

          <div className="w-full max-w-[390px] text-center">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#eaf6ee] text-[#159447]">

              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1" />
                <circle cx="19" cy="20" r="1" />
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
              </svg>

            </div>

            <h1 className="mt-5 text-[25px] font-black tracking-[-0.05em]">
              Your cart is empty
            </h1>

            <p className="mt-2 text-[12px] leading-5 text-black/45">
              Add products from a local shop to
              continue shopping.
            </p>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 rounded-[13px] bg-[#159447] px-6 py-3 text-[10px] font-black text-white transition hover:bg-[#117d3c] active:scale-[0.98]"
            >
              Continue Shopping
            </button>

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
      </main>
    );
  }

  /* MAIN CART */

  return (
    <main className="min-h-screen bg-[#f5f6f4] pb-32 text-[#111]">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          {/* BRAND */}

          <div className="flex items-center gap-3">

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


      {/* CONTENT */}

      <section className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8 sm:py-10">

        {/* TITLE */}

        <div>

          <div className="text-[9px] font-bold tracking-[0.16em] text-[#159447]">
            YOUR ORDER
          </div>

          <h1 className="mt-3 text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[46px]">
            Your Cart
          </h1>

          <p className="mt-3 max-w-[600px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
            Review your items before continuing to proceed.
          </p>

        </div>


        {/* SHOP */}

        <section className="mt-8 rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_15px_50px_rgba(0,0,0,.04)] sm:p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eaf6ee] text-[#159447]">

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10h18" />
                <path d="M5 10v9h14v-9" />
                <path d="M4 10 6 4h12l2 6" />
                <path d="M9 19v-5h6v5" />
              </svg>

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[8px] font-bold uppercase tracking-[0.14em] text-black/35">
                Ordering from
              </div>

              <h2 className="mt-1 truncate text-[16px] font-black tracking-[-0.035em]">
                {cart.shopName}
              </h2>

              {cart.shopCategory && (
                <p className="mt-1 text-[9px] font-semibold text-black/40">
                  {cart.shopCategory}
                </p>
              )}

            </div>

          </div>

        </section>


        {/* PROFILE WARNING */}

        {!profileComplete && (
          <section className="mt-4 rounded-[22px] border border-[#f0c36b]/40 bg-[#fff9ec] p-5">

            <div className="flex gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fff0ca] text-[#b77900]">

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
                  <circle cx="12" cy="8" r="3" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>

              </div>

              <div className="min-w-0 flex-1">

                <h3 className="text-[13px] font-black">
                  Complete your profile
                </h3>

                <p className="mt-1 text-[10px] leading-4 text-black/50">
                  Add your name, mobile number and delivery
                  location before placing your order.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="mt-3 rounded-[11px] bg-[#159447] px-4 py-2.5 text-[9px] font-black text-white transition hover:bg-[#117d3c] active:scale-[0.98]"
                >
                  Complete Profile
                </button>

              </div>

            </div>

          </section>
        )}


        {/* ITEMS */}

        <section className="mt-7">

          <div className="mb-3 flex items-center justify-between px-1">

            <h2 className="text-[15px] font-black tracking-[-0.025em]">
              Your Items
            </h2>

            <span className="text-[9px] font-bold text-black/35">
              {itemCount}{" "}
              {itemCount === 1 ? "item" : "items"}
            </span>

          </div>


          <div className="space-y-3">

            {cartItems.map((item) => {

              const price =
                item.salePrice !== null
                  ? Number(item.salePrice)
                  : Number(item.price);

              return (
                <div
                  key={item.productId}
                  className="rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_10px_35px_rgba(0,0,0,.035)] sm:p-5"
                >

                  <div className="flex gap-3.5">

                    {/* IMAGE */}

                    <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[16px] bg-[#f1f2f0]">

                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-black/20">

                          <svg
                            width="27"
                            height="27"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="18"
                              height="18"
                              rx="2"
                            />
                            <circle
                              cx="8.5"
                              cy="8.5"
                              r="1.5"
                            />
                            <path d="m21 15-5-5L5 21" />
                          </svg>

                        </div>
                      )}

                    </div>


                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-start justify-between gap-3">

                        <h3 className="line-clamp-2 text-[13px] font-black leading-[1.3] tracking-[-0.025em]">
                          {item.productName}
                        </h3>

                        <div className="shrink-0 text-right">

                          <div className="text-[14px] font-black">
                            ₹
                            {formatPrice(
                              price * item.quantity
                            )}
                          </div>

                          <div className="mt-0.5 text-[8px] font-semibold text-black/35">
                            ₹{formatPrice(price)} each
                          </div>

                        </div>

                      </div>


                      {/* QUANTITY */}

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center rounded-[11px] border border-black/[0.08] bg-[#f8f9f7]">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                -1
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center text-[17px] font-medium text-black/60 transition hover:bg-black/[0.04] active:scale-90"
                            aria-label={`Decrease ${item.productName}`}
                          >
                            −
                          </button>

                          <span className="w-7 text-center text-[10px] font-black">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                1
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center text-[17px] font-medium text-[#159447] transition hover:bg-black/[0.04] active:scale-90"
                            aria-label={`Increase ${item.productName}`}
                          >
                            +
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </section>


        {/* BILL */}

        <section className="mt-6 rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_15px_50px_rgba(0,0,0,.04)] sm:p-6">

          <h2 className="text-[16px] font-black tracking-[-0.025em]">
            Bill Details
          </h2>

          <div className="mt-5 space-y-3.5">

            <div className="flex items-center justify-between text-[11px] font-semibold">

              <span className="text-black/50">
                Item Total
              </span>

              <span>
                ₹{formatPrice(subtotal)}
              </span>

            </div>


            <div className="flex items-center justify-between text-[11px] font-semibold">

              <span className="text-black/50">
                Delivery Charge
              </span>

              <span className="text-black/45">
                To be calculated
              </span>

            </div>


            <div className="border-t border-dashed border-black/[0.1] pt-4">

              <div className="flex items-center justify-between">

                <span className="text-[14px] font-black">
                  Total
                </span>

                <span className="text-[20px] font-black tracking-[-0.04em]">
                  ₹{formatPrice(total)}
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* DELIVERY NOTE */}

        <section className="mt-4 rounded-[20px] bg-[#eef8f1] px-5 py-4">

          <div className="flex gap-3">

            <div className="mt-0.5 shrink-0 text-[#159447]">

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
                <path d="M12 21s7-4.35 7-10a7 7 0 0 0-14 0c0 5.65 7 10 7 10Z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>

            </div>

            <div>

              <p className="text-[10px] font-black">
                Local delivery
              </p>

              <p className="mt-1 text-[9px] leading-4 text-black/45">
                Your delivery charge will be based on the
                distance between the shop and your saved
                location.
              </p>

            </div>

          </div>

        </section>

      </section>


      {/* BOTTOM CTA */}

<div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5">

  <div className="mx-auto flex max-w-[760px] items-center gap-2.5 rounded-[20px] border border-black/[0.08] bg-white/95 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.15)] backdrop-blur-xl sm:gap-3 sm:p-3">

    <div className="min-w-0 flex-1 pl-1">

      <div className="text-[8px] font-bold text-black/40">
        Total
      </div>

      <div className="mt-0.5 text-[17px] font-black tracking-[-0.04em]">
        ₹{formatPrice(total)}
      </div>

    </div>


    {/* CLEAR CART */}

    <button
      type="button"
      onClick={clearCart}
      aria-label="Clear cart"
      className="inline-flex h-11 shrink-0 items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-3 text-[9px] font-black text-black/45 transition hover:border-red-500/20 hover:bg-red-50 hover:text-red-500 active:scale-[0.97] sm:px-4"
    >
      Clear Cart
    </button>


    {/* PROCEED */}

    <button
      type="button"
      disabled={!profileComplete}
      onClick={() => {
        if (!profileComplete) return;

        router.push("/checkout");
      }}
      className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[13px] px-5 text-[9px] font-black transition sm:px-6 ${
        profileComplete
          ? "bg-[#159447] text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] hover:bg-[#117d3c] active:scale-[0.98]"
          : "cursor-not-allowed bg-black/[0.08] text-black/30"
      }`}
    >
      Proceed

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
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>

    </button>

  </div>
      </div>


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