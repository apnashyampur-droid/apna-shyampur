"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Script from "next/script";
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

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (
    response: RazorpaySuccessResponse
  ) => void | Promise<void>;
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: string,
    callback: (
      response: RazorpayFailureResponse
    ) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

export default function CheckoutPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [cart, setCart] =
    useState<SavedCart | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [orderCreated, setOrderCreated] =
    useState(false);

  const [orderNumber, setOrderNumber] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<"upi" | "cod">("upi");

  /* LOAD CHECKOUT DATA */

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        setLoading(true);
        setError(null);

        /* CART */

        const savedCart =
          localStorage.getItem(
            "apna_shyampur_cart"
          );

        if (!savedCart) {
          router.replace("/view-cart");
          return;
        }

        const parsedCart =
          JSON.parse(savedCart) as SavedCart;

        if (
          !parsedCart?.shopId ||
          !Array.isArray(parsedCart.items) ||
          parsedCart.items.length === 0
        ) {
          router.replace("/view-cart");
          return;
        }

        setCart(parsedCart);

        /* USER */

        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        /* PROFILE */

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "full_name, phone, address, latitude, longitude"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const loadedProfile: Profile = {
          full_name:
            profileData?.full_name ?? null,

          phone:
            profileData?.phone ?? null,

          address:
            profileData?.address ?? null,

          latitude:
            profileData?.latitude ?? null,

          longitude:
            profileData?.longitude ?? null,
        };

        setProfile(loadedProfile);
      } catch (err) {
        console.error(
          "Checkout load error:",
          err
        );

        setError(
          "Unable to load checkout. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, [router, supabase]);

  /* SUBTOTAL */

  const subtotal = useMemo(() => {
    if (!cart) return 0;

    return cart.items.reduce(
      (total, item) => {
        const price =
          item.salePrice !== null
            ? Number(item.salePrice)
            : Number(item.price);

        return (
          total +
          price * item.quantity
        );
      },
      0
    );
  }, [cart]);

  const deliveryCharge = 0;

  const total =
    subtotal + deliveryCharge;

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

  /* FORMAT PRICE */

  const formatPrice = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN"
    ).format(Math.round(value));
  };

  /* COD ORDER */

  const handleCodOrder = async () => {
    if (placingOrder) return;

    if (!cart) {
      setError("Your cart is empty.");
      return;
    }

    if (!profileComplete || !profile) {
      setError(
        "Please complete your profile before placing the order."
      );
      return;
    }

    setError(null);
    setPlacingOrder(true);

    try {

      setOrderNumber(
        `AS${Date.now()
          .toString()
          .slice(-6)}`
      );

      setOrderCreated(true);
    } catch (err) {
      console.error(
        "COD order error:",
        err
      );

      setError(
        "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  /* RAZORPAY PAYMENT */

const handleRazorpayPayment = async () => {
  if (placingOrder) return;

  if (!cart) {
    setError("Your cart is empty.");
    return;
  }

  if (!profileComplete || !profile) {
    setError(
      "Please complete your profile before placing the order."
    );
    return;
  }

  setError(null);
  setPlacingOrder(true);

  try {
 
    if (!window.Razorpay) {
      throw new Error(
        "Payment gateway is still loading. Please try again."
      );
    }

    const configResponse =
      await fetch(
        "/api/razorpay/config",
        {
          method: "GET",
          cache: "no-store",
        }
      );

    const configData =
      await configResponse.json();

    if (
      !configResponse.ok ||
      !configData?.success ||
      !configData?.keyId
    ) {
      throw new Error(
        configData?.error ||
          "Razorpay payment key is not configured."
      );
    }

    const keyId =
      configData.keyId;

    const amountInPaise =
      Math.round(total * 100);

    if (
      !Number.isInteger(amountInPaise) ||
      amountInPaise < 100
    ) {
      throw new Error(
        "Invalid payment amount."
      );
    }

    /* CREATE RAZORPAY ORDER */

    const createOrderResponse =
      await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            amount: amountInPaise,
          }),
        }
      );

    const createOrderData =
      await createOrderResponse.json();

    if (
      !createOrderResponse.ok ||
      !createOrderData?.success ||
      !createOrderData?.orderId
    ) {
      throw new Error(
        createOrderData?.error ||
          "Unable to create payment order."
      );
    }

    const razorpayOrderId =
      createOrderData.orderId;

    /* RAZORPAY OPTIONS */

    const options: RazorpayOptions = {
      key: keyId,

      amount:
        createOrderData.amount,

      currency:
        createOrderData.currency ||
        "INR",

      name: "Apna Shyampur",

      description:
        "Apna Shyampur Order",

      order_id:
        razorpayOrderId,

      prefill: {
        name:
          profile.full_name ||
          "",

        contact:
          profile.phone ||
          "",
      },

      theme: {
        color: "#159447",
      },

      modal: {
        ondismiss: () => {
          setPlacingOrder(false);
          setError(null);
        },
      },

      handler:
        async (
          response
        ) => {
          try {
            setError(null);

            const verifyResponse =
              await fetch(
                "/api/razorpay/verify-payment",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify(
                    response
                  ),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData?.success
            ) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            const orderNumberValue = `AS${Date.now()
  .toString()
  .slice(-6)}`;

const orderItems = cart.items.map((item) => {
  const finalPrice =
    item.salePrice !== null
      ? Number(item.salePrice)
      : Number(item.price);

  return {
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: Number(item.price),
    sale_price:
      item.salePrice !== null
        ? Number(item.salePrice)
        : null,
    line_total:
      finalPrice * item.quantity,
  };
});

const {
  data: {
    user,
  },
} = await supabase.auth.getUser();

if (!user) {
  throw new Error(
    "Your session has expired. Please login again."
  );
}

const { data: orderData, error: orderError } =
  await supabase
    .from("orders")
    .insert({
      order_number: orderNumberValue,

      user_id: user.id,

      shop_id: cart.shopId,

      status: "placed",

      payment_status: "paid",

      payment_method: "online",

      subtotal,

      delivery_fee: deliveryCharge,

      total_amount: total,

      customer_name:
        profile.full_name,

      customer_phone:
        profile.phone,

      delivery_address:
        profile.address,

      delivery_latitude:
        profile.latitude,

      delivery_longitude:
        profile.longitude,

      razorpay_order_id:
        response.razorpay_order_id,

      razorpay_payment_id:
        response.razorpay_payment_id,

      items: orderItems,
    })
    .select("id, order_number")
    .single();

if (orderError) {
  throw orderError;
}

setOrderNumber(
  orderData.order_number
);

setOrderCreated(true);
setPlacingOrder(false);
          } catch (err) {
            console.error(
              "Payment verification error:",
              err
            );

            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed. Please contact support if money was deducted."
            );

            setPlacingOrder(false);
          }
        },
    };

    const razorpay =
      new window.Razorpay(
        options
      );

    razorpay.on(
      "payment.failed",
      (
        response
      ) => {
        console.error(
          "Razorpay payment failed:",
          response
        );

        const description =
          response?.error
            ?.description;

        setError(
          description ||
            "Payment failed. Please try again."
        );

        setPlacingOrder(false);
      }
    );

    razorpay.open();
  } catch (err) {
    console.error(
      "Razorpay payment error:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Unable to start payment. Please try again."
    );

    setPlacingOrder(false);
  }
};

  /* PAYMENT ACTION */

  const handlePaymentSubmitted =
    async () => {
      if (placingOrder) return;

      if (paymentMethod === "cod") {
        await handleCodOrder();
        return;
      }

      await handleRazorpayPayment();
    };

  /* LOADING */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

        <header className="border-b border-black/[0.06] bg-[#f5f6f4]">

          <div className="mx-auto flex h-[70px] max-w-[1100px] items-center justify-between px-5 sm:px-8">

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

          </div>

        </header>

        <div className="mx-auto max-w-[760px] px-4 py-5 sm:px-6">

          <div className="h-32 animate-pulse rounded-[24px] bg-white" />

          <div className="mt-4 h-56 animate-pulse rounded-[24px] bg-white" />

        </div>

      </main>
    );
  }

  /* ORDER CREATED */

  if (orderCreated) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

        <div className="mx-auto flex min-h-screen max-w-[760px] flex-col px-4 py-6 sm:px-6">

          <header className="flex items-center justify-between">

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-black/65 transition hover:bg-black/[0.03]"
              aria-label="Go home"
            >
              <ArrowLeftIcon />
            </button>

            <div className="text-right">

              <div className="text-[15px] font-black tracking-[-0.04em]">
                APNA{" "}
                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-0.5 text-[8px] font-bold tracking-[0.08em] text-black/35">
                ORDER FROM YOUR PADOSI KI DUKAAN
              </div>

            </div>

          </header>

          <div className="flex flex-1 items-center justify-center py-12">

            <section className="w-full rounded-[28px] bg-white p-7 text-center shadow-[0_12px_45px_rgba(0,0,0,.06)] sm:p-10">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf7ef] text-[#159447]">
                <CheckIcon />
              </div>

              <h1 className="mt-6 text-[25px] font-black tracking-[-0.05em]">
                {paymentMethod === "cod"
                  ? "Order placed"
                  : "Payment successful"}
              </h1>

              <p className="mx-auto mt-2 max-w-[400px] text-[11px] leading-5 text-black/50">

                {paymentMethod === "cod"
                  ? "Your COD order has been placed successfully. You will pay when your order is delivered."
                  : "Your payment has been successfully verified. Your order can now be processed."}

              </p>

              {orderNumber && (
                <div className="mx-auto mt-5 inline-flex rounded-full bg-[#f5f6f4] px-4 py-2">

                  <span className="text-[10px] font-black">
                    Order #{orderNumber}
                  </span>

                </div>
              )}

              <div className="mt-7 rounded-[18px] border border-[#f0c36b]/35 bg-[#fff9ec] px-5 py-4 text-left">

                <p className="text-[10px] font-black">

                  {paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : "Payment verified"}

                </p>

                <p className="mt-1 text-[9px] leading-4 text-black/50">

                  {paymentMethod === "cod"
                    ? "Please keep the exact amount ready. You will pay the delivery person when your order arrives."
                    : "Your Razorpay payment has been verified successfully."}

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  router.push("/orders")
                }
                className="mt-6 inline-flex h-11 items-center justify-center rounded-[13px] bg-[#159447] px-6 text-[10px] font-black text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c] active:scale-[0.98]"
              >
                View Orders
              </button>

            </section>

          </div>

          <div className="pb-3 pt-8 text-center">

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

      </main>
    );
  }

  /* MAIN CHECKOUT */

  return (
    <main className="min-h-screen bg-[#f5f6f4] pb-28 text-[#111]">

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-[760px] px-4 py-5 sm:px-6">

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
            onClick={() =>
              router.push("/view-cart")
            }
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/20 hover:text-black sm:text-[11px]"
          >
            Back
          </button>

        </header>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-[18px] border border-red-500/15 bg-red-50 px-4 py-3">

            <p className="text-[10px] font-bold text-red-600">
              {error}
            </p>

          </div>
        )}

        {/* PROFILE */}

        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)] sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="text-[9px] font-black uppercase tracking-[0.08em] text-black/35">
                Deliver to
              </div>

              <h2 className="mt-1 text-[15px] font-black tracking-[-0.03em]">
                {profile?.full_name ||
                  "Your Name"}
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/profile")
              }
              className="text-[9px] font-black text-[#159447]"
            >
              Edit Profile
            </button>

          </div>

          <div className="mt-4 space-y-2">

            <div className="flex items-start gap-2">

              <PhoneIcon />

              <span className="text-[10px] font-semibold text-black/60">
                {profile?.phone ||
                  "Mobile number not added"}
              </span>

            </div>

            <div className="flex items-start gap-2">

              <LocationIcon />

              <span className="text-[10px] font-semibold leading-4 text-black/60">
                {profile?.address ||
                  "Delivery address not added"}
              </span>

            </div>

          </div>

          {!profileComplete && (
            <div className="mt-4 rounded-[16px] border border-[#f0c36b]/35 bg-[#fff9ec] px-4 py-3">

              <p className="text-[10px] font-black">
                Complete your profile
              </p>

              <p className="mt-1 text-[9px] leading-4 text-black/50">
                Add your name, mobile number and
                delivery address before placing
                your order.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/profile")
                }
                className="mt-3 text-[9px] font-black text-[#159447]"
              >
                Complete Profile →
              </button>

            </div>
          )}

        </section>

        {/* ORDER */}

        <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)] sm:p-6">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-[9px] font-black uppercase tracking-[0.08em] text-black/35">
                Your Order
              </div>

              <h2 className="mt-1 text-[15px] font-black tracking-[-0.03em]">
                {cart?.shopName}
              </h2>

            </div>

            <div className="rounded-full bg-[#eef8f1] px-3 py-1.5 text-[8px] font-black text-[#159447]">
              {cart?.items.length ?? 0}{" "}
              {cart?.items.length === 1
                ? "item"
                : "items"}
            </div>

          </div>

          <div className="mt-5 divide-y divide-black/[0.06]">

            {cart?.items.map(
              (item) => {

                const price =
                  item.salePrice !== null
                    ? Number(
                        item.salePrice
                      )
                    : Number(item.price);

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[#f5f6f4]">

                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-black/20">
                          <PackageIcon />
                        </div>
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-[11px] font-black">
                        {item.productName}
                      </p>

                      <p className="mt-0.5 text-[9px] font-semibold text-black/40">
                        ₹{formatPrice(price)} ×{" "}
                        {item.quantity}
                      </p>

                    </div>

                    <div className="text-[11px] font-black">
                      ₹
                      {formatPrice(
                        price *
                          item.quantity
                      )}
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>

        {/* BILL */}

        <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)] sm:p-6">

          <div className="space-y-3">

            <div className="flex items-center justify-between">

              <span className="text-[10px] font-semibold text-black/45">
                Item Total
              </span>

              <span className="text-[11px] font-bold">
                ₹{formatPrice(subtotal)}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-[10px] font-semibold text-black/45">
                Delivery
              </span>

              <span className="text-[10px] font-bold text-black/40">
                {deliveryCharge > 0
                  ? `₹${formatPrice(
                      deliveryCharge
                    )}`
                  : "To be calculated"}
              </span>

            </div>

            <div className="border-t border-black/[0.06] pt-3">

              <div className="flex items-center justify-between">

                <span className="text-[12px] font-black">
                  Total
                </span>

                <span className="text-[19px] font-black tracking-[-0.04em]">
                  ₹{formatPrice(total)}
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* PAYMENT */}

        <section className="mt-4 rounded-[24px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,.035)] sm:p-6">

          <div>

            <div className="text-[9px] font-black uppercase tracking-[0.08em] text-black/35">
              Payment
            </div>

            <h2 className="mt-1 text-[16px] font-black tracking-[-0.04em]">
              Choose Payment Method
            </h2>

            <p className="mt-1 text-[9px] leading-4 text-black/45">
              Select how you would like to pay for your order.
            </p>

          </div>

          {/* PAYMENT BOX */}

          <div className="mt-6 rounded-[20px] border border-black/[0.06] bg-[#f5f6f4] p-5">

            {/* PAYMENT METHODS */}

            <div className="grid gap-3 sm:grid-cols-2">

              {/* UPI */}

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("upi");
                  setError(null);
                }}
                className={`rounded-[16px] border p-4 text-left transition ${
                  paymentMethod === "upi"
                    ? "border-[#159447] bg-[#eef8f1]"
                    : "border-black/[0.08] bg-white hover:bg-black/[0.02]"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[11px] font-black">
                      UPI
                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-black/40">
                      Pay online instantly
                    </p>

                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      paymentMethod === "upi"
                        ? "border-[#159447] bg-[#159447]"
                        : "border-black/20 bg-white"
                    }`}
                  >

                    {paymentMethod === "upi" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}

                  </div>

                </div>

              </button>

              {/* COD */}

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("cod");
                  setError(null);
                }}
                className={`rounded-[16px] border p-4 text-left transition ${
                  paymentMethod === "cod"
                    ? "border-[#159447] bg-[#eef8f1]"
                    : "border-black/[0.08] bg-white hover:bg-black/[0.02]"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[11px] font-black">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-[8px] font-semibold text-black/40">
                      Pay when your order arrives
                    </p>

                  </div>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      paymentMethod === "cod"
                        ? "border-[#159447] bg-[#159447]"
                        : "border-black/20 bg-white"
                    }`}
                  >

                    {paymentMethod === "cod" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}

                  </div>

                </div>

              </button>

            </div>

            {/* AMOUNT */}

            <div className="mt-6 text-center">

              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-black/35">
                Amount to Pay
              </p>

              <p className="mt-1 text-[28px] font-black tracking-[-0.05em]">
                ₹{formatPrice(total)}
              </p>

            </div>

            {/* RAZORPAY UPI INFO */}

            {paymentMethod === "upi" && (
              <div className="mt-6 rounded-[18px] border border-black/[0.06] bg-white px-4 py-4">

                <div className="flex items-center justify-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef8f1] text-[#159447]">
                    <UpiIcon />
                  </div>

                  <div className="text-left">

                    <p className="text-[10px] font-black">
                      Secure UPI Payment
                    </p>

                    <p className="mt-0.5 text-[8px] font-semibold text-black/40">
                      Powered by Razorpay
                    </p>

                  </div>

                </div>

                <p className="mx-auto mt-3 max-w-[330px] text-center text-[8px] font-semibold leading-4 text-black/35">
                  Razorpay will open a secure checkout where you can choose your available UPI payment method.
                </p>

              </div>
            )}

            {/* COD MESSAGE */}

            {paymentMethod === "cod" && (
              <p className="mx-auto mt-4 max-w-[320px] text-center text-[9px] leading-4 text-black/45">
                Pay the exact amount in cash when your order is delivered.
              </p>
            )}

            {/* COD BUTTON */}

            {paymentMethod === "cod" && (
              <button
                type="button"
                disabled={
                  !profileComplete ||
                  placingOrder
                }
                onClick={
                  handlePaymentSubmitted
                }
                className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] text-[10px] font-black transition ${
                  profileComplete &&
                  !placingOrder
                    ? "bg-[#159447] text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] hover:bg-[#117d3c] active:scale-[0.98]"
                    : "cursor-not-allowed bg-black/[0.08] text-black/30"
                }`}
              >

                {placingOrder
                  ? "Placing Order..."
                  : "Place COD Order"}

                {!placingOrder && (
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
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                )}

              </button>
            )}

          </div>

          {/* PAYMENT INFO */}

          <p className="mt-3 text-center text-[8px] font-semibold text-black/30">

            {paymentMethod === "upi"
              ? "Secure UPI payment through Razorpay Checkout"
              : "Cash payment at the time of delivery"}

          </p>

          {/* PAYMENT WARNING */}

          <div className="mt-6 rounded-[17px] border border-[#f0c36b]/35 bg-[#fff9ec] p-4">

            <div className="flex gap-2.5">

              <InfoIcon />

              <div>

                <p className="text-[10px] font-black">

                  {paymentMethod === "upi"
                    ? "Secure online payment"
                    : "Keep cash ready"}

                </p>

                <p className="mt-1 text-[9px] leading-4 text-black/50">

                  {paymentMethod === "upi"
                    ? "Your payment will open in Razorpay Checkout. Complete the payment there and return to Apna Shyampur."
                    : "Keep the exact amount ready. You will pay the delivery person when your order arrives."}

                </p>

              </div>

            </div>

          </div>

        </section>

        {/* TRUST NOTE */}

        <div className="mt-5 text-center">

          <p className="text-[8px] font-bold text-black/30">

            {paymentMethod === "upi"
              ? "Payments are securely processed through Razorpay."
              : "Your COD order will be processed after confirmation."}

          </p>

        </div>

      </div>

      {/* FOOTER */}

      <div className="mt-6 text-center">

        <p className="text-[9px] font-semibold text-black/30">

          © 2026{" "}

          <span className="text-black/55">
            PNT
          </span>

          <span className="text-[#159447]">
            VERSE
          </span>

        </p>

      </div>

      {/* BOTTOM CTA */}

      <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5">

        <div className="mx-auto flex max-w-[760px] items-center gap-3 rounded-[20px] border border-black/[0.08] bg-white/95 p-2.5 shadow-[0_18px_60px_rgba(0,0,0,.15)] backdrop-blur-xl sm:p-3">

          <div className="min-w-0 flex-1 pl-1">

            <div className="text-[8px] font-bold text-black/40">
              Total
            </div>

            <div className="mt-0.5 text-[17px] font-black tracking-[-0.04em]">
              ₹{formatPrice(total)}
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/view-cart")
            }
            className="hidden h-11 shrink-0 items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-4 text-[9px] font-black text-black/50 transition hover:bg-black/[0.03] sm:inline-flex"
          >
            Back
          </button>

          <button
            type="button"
            disabled={
              !profileComplete ||
              placingOrder
            }
            onClick={
              handlePaymentSubmitted
            }
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[13px] px-5 text-[9px] font-black transition sm:px-6 ${
              profileComplete &&
              !placingOrder
                ? "bg-[#159447] text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] hover:bg-[#117d3c] active:scale-[0.98]"
                : "cursor-not-allowed bg-black/[0.08] text-black/30"
            }`}
          >

            {placingOrder
              ? "Processing..."
              : paymentMethod === "upi"
                ? "Pay with UPI"
                : "Place COD Order"}

            {!placingOrder && (
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
            )}

          </button>

        </div>

      </div>

    </main>
  );
}

/* ICONS */

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

function CheckIcon() {
  return (
    <svg
      width="28"
      height="28"
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

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-black/30"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 0 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="14"
      height="14"
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

function PackageIcon() {
  return (
    <svg
      width="17"
      height="17"
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

function InfoIcon() {
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
      className="mt-0.5 shrink-0 text-[#c58a19]"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />

      <path d="M12 16v-4" />

      <path d="M12 8h.01" />
    </svg>
  );
}

function UpiIcon() {
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
      <path d="M7 3h10l-2 7h4L9 21l2-8H7l2-10Z" />
    </svg>
  );
}