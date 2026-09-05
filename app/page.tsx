"use client"; 
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "@/lib/supabase/client"; 
 
const heroSlides = [ 
  { 
    title: "Order From Your Padosi Ki Dukaan", 
    description: 
      "Fresh essentials, everyday products and more — delivered from shops around you.", 
    image: 
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=90",
  },
  {
   title: "Your Local Shops in One Place",
    description:
      "Discover nearby shops, explore what they offer and order without going far.",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=90",
  },
  {
 title: "Keep Local Money Local",
description:
  "Support local businesses, create local opportunities, and help your community grow.",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=90",
  },
];

const categories = [
  {
    name: "Vegetables",
    icon: "vegetables",
    description: "Fresh vegetables from local shops",
  },
  {
    name: "Food",
    icon: "food",
    description: "Fresh meals from local kitchens",
  },
  {
    name: "Meat",
    icon: "meat",
    description: "Fresh meat from trusted local shops",
  },
  {
    name: "Electronics",
    icon: "electronics",
    description: "Phones, accessories and electronics",
  },
  {
    name: "Medical",
    icon: "medical",
    description: "Medicines and healthcare essentials",
  },
  {
    name: "Bakery",
    icon: "bakery",
    description: "Fresh bakery items from local shops",
  },
  {
    name: "Grocery",
    icon: "grocery",
    description: "Everyday groceries from nearby shops",
  },
  {
    name: "Dairy",
    icon: "dairy",
    description: "Fresh milk and dairy essentials",
  },
];



function CategoryIcon({ type }: { type: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 28 28",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "vegetables") {
    return (
      <svg {...common}>
        <path d="M14 24c-5.4-1.1-8-5.1-7.2-10.1C12 13.2 15 17.4 14 24Z" />
        <path d="M14 24c5.4-1.1 8-5.1 7.2-10.1C16 13.2 13 17.4 14 24Z" />
        <path d="M14 13c-1.1-3.7 1.2-7 5.4-8.3.7 4.2-1.1 7.1-5.4 8.3Z" />
        <path d="M14 24V13" />
      </svg>
    );
  }

  if (type === "food") {
    return (
      <svg {...common}>
        <path d="M5 12.5h18" />
        <path d="M7 12.5a7 7 0 0 1 14 0" />
        <path d="M8 17h12" />
        <path d="M9.5 21h9" />
        <path d="M11 7.5c.6-1 1.5-1.7 2.5-2" />
        <path d="M15.5 6c.7-.8 1.6-1.2 2.5-1.3" />
      </svg>
    );
  }

if (type === "meat") {
  return (
    <svg {...common}>
      <path d="M5.5 15.5c0-4.7 3.2-8.8 7.8-9.9 2.9-.7 6 .1 8 2.1 1.5 1.5 1.6 3.8.2 5.3l-1.3 1.3c-1.2 1.2-1.7 2.9-1.4 4.6.3 1.7-1 3.1-2.7 3.1H11c-3 0-5.5-2.5-5.5-5.5v-1Z" />
      <path d="M14.5 10.5c1.2-1.2 3.2-1.2 4.4 0s1.2 3.2 0 4.4-3.2 1.2-4.4 0-1.2-3.2 0-4.4Z" />
      <circle cx="16.7" cy="12.7" r="1.1" />
    </svg>
  );
}

  if (type === "electronics") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="20" height="15" rx="2.5" />
        <path d="M10 23h8" />
        <path d="M14 19v4" />
        <path d="M8.5 7.5h11" />
        <path d="M10 11h3" />
        <path d="M10 14h6" />
      </svg>
    );
  }

  if (type === "medical") {
    return (
      <svg {...common}>
        <rect x="4" y="6" width="20" height="16" rx="3" />
        <path d="M10 6V4.5A1.5 1.5 0 0 1 11.5 3h5A1.5 1.5 0 0 1 18 4.5V6" />
        <path d="M14 10v8" />
        <path d="M10 14h8" />
      </svg>
    );
  }

 if (type === "bakery") {
  return (
    <svg {...common}>
      <path d="M5 13.5 14 5l9 8.5" />
      <path d="M7 12.5V22h14v-9.5" />
      <path d="M10 22v-5h4v5" />
      <path d="M17 15h2" />
      <path d="M17 18h2" />
    </svg>
  );
}

  if (type === "grocery") {
    return (
      <svg {...common}>
        <path d="M5 7h18l-1.5 13h-15L5 7Z" />
        <path d="M9 7V5a5 5 0 0 1 10 0v2" />
        <path d="M9 12v4" />
        <path d="M14 12v4" />
        <path d="M19 12v4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 9h18" />
      <path d="M7 9v10a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V9" />
      <path d="M5 9a4 4 0 0 1 8 0 4 4 0 0 1 8 0" />
      <path d="M14 13v5" />
      <path d="M11.5 15.5h5" />
    </svg>
  );
}

function ProcessIcon({ type }: { type: string }) {
  if (type === "search") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (type === "bag") {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
        <path d="M9 12v4" />
        <path d="M15 12v4" />
      </svg>
    );
  }

  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M14 14h5" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  const [activeSlide, setActiveSlide] = useState(0);
const [showSignIn, setShowSignIn] = useState(false);
const [user, setUser] = useState<any>(null);
const [authLoading, setAuthLoading] = useState(true);
const [shops, setShops] = useState<any[]>([]);
const [shopsLoading, setShopsLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [searchShops, setSearchShops] = useState<any[]>([]);
const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

const requireSignIn = (shopSlug: string) => {
  if (authLoading) return;

  if (!user) {
    setShowSignIn(true);
    return;
  }

  router.push(`/view-shop/${encodeURIComponent(shopSlug)}`);
};

 const goToSignIn = () => {
  setShowSignIn(false);
  router.push("/signin");
};

const isShopOpen = (
  openingTime: string | null,
  closingTime: string | null
) => {
  if (!openingTime || !closingTime) return false;

  const now = new Date();

  const currentTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const [currentHour, currentMinute] = currentTime.split(":").map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;

  const [openingHour, openingMinute] = openingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const [closingHour, closingMinute] = closingTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const openingMinutes = openingHour * 60 + openingMinute;
  const closingMinutes = closingHour * 60 + closingMinute;

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
};

const handleGoogleSignIn = async () => {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
  }
};

useEffect(() => {
  let mounted = true;

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (mounted) {
      setUser(user);
      setAuthLoading(false);
    }
  };

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, [supabase]);

  useEffect(() => {
  let mounted = true;

  const loadFeaturedShops = async () => {
    setShopsLoading(true);

    const { data, error } = await supabase
      .from("shops")
      .select(`
  id,
  name,
  slug,
  category,
  image_url,
  rating,
  address,
  opening_time,
  closing_time,
  is_active,
  is_featured,
  featured_order
`)
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("featured_order", {
        ascending: true,
        nullsFirst: false,
      })
      .limit(3);

 if (error) {
  console.error("Failed to load featured shops:", error);

  if (mounted) {
    setShops([]);
    setShopsLoading(false);
  }

  return;
}

if (mounted) {
  const shopsData = data ?? [];

  if (shopsData.length === 0) {
    setShops([]);
    setShopsLoading(false);
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
      discount_percent
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
      "HOME SHOP DISCOUNTS FETCH ERROR:",
      discountError
    );
  }

  const discountMap = new Map<
    string,
    {
      id: string;
      title: string | null;
      description: string | null;
      discount_percent: number | null;
    }
  >();

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
      "HOME SHOP OFFERS FETCH ERROR:",
      offerError
    );
  }

  const offerMap = new Map<
    string,
    {
      id: string;
      title: string | null;
      description: string | null;
      offer_kind: "flat" | "buy_get" | "free_item" | null;
      offer_value: number | null;
      minimum_order_value: number | null;
      buy_quantity: number | null;
      get_quantity: number | null;
    }
  >();

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
    activeDiscount: discountMap.get(shop.id) ?? null,
    activeOffer: offerMap.get(shop.id) ?? null,
  }));

  setShops(shopsWithDiscounts);
  setShopsLoading(false);
}
  };

  loadFeaturedShops();

  return () => {
    mounted = false;
  };
}, [supabase]);

useEffect(() => {
  const loadSearchShops = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select(`
        id,
        name,
        slug,
        category,
        address
      `)
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("Failed to load search shops:", error);
      return;
    }

    setSearchShops(data ?? []);
  };

  loadSearchShops();
}, [supabase]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const searchSuggestions = searchQuery.trim()
  ? searchShops
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

  const slide = heroSlides[activeSlide];

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          <a href="#" className="flex items-center gap-3">

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
              AS
            </div>

            <div className="leading-none">

            <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:gap-[5px] sm:text-[18px]">
                <span className="text-[#111]">APNA</span>
                <span className="text-[#159447]">SHYAMPUR</span>
              </div>

               <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/60 sm:mt-1.5 sm:gap-2 sm:text-[9px] sm:tracking-[0.14em]">
                <span>LOCALS</span>
                <span className="text-[#159447]">•</span>
                <span>TRUSTED</span>
                <span className="text-[#159447]">•</span>
                <span>FAST</span>
              </div>

            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">

            <a
              href="#categories"
              className="text-[12px] font-semibold text-black/55 transition hover:text-black"
            >
              Categories
            </a>

            <a
              href="#shops"
              className="text-[12px] font-semibold text-black/55 transition hover:text-black"
            >
              Top Shops
            </a>

          </nav>

          <div className="flex items-center gap-2">

{user ? (
  <button
    onClick={() => router.push("/profile")}
    className="rounded-full px-3 py-2 text-[11px] font-bold text-black/85 transition hover:bg-white sm:px-4 sm:py-2 sm:text-[12px]"
  >
    My Profile
  </button>
) : (
  <button
    onClick={goToSignIn}
    className="rounded-full px-3 py-2 text-[11px] font-bold text-black/85 transition hover:bg-white sm:px-4 sm:py-2 sm:text-[12px]"
  >
    Sign in
  </button>
)}

<button
  onClick={() => router.push("/settings")}
  aria-label="Settings"
  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-black/75 transition hover:border-black/20 hover:bg-black/[0.03] hover:text-black"
>
  
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <circle cx="9" cy="7" r="2" fill="white" />
      <path d="M4 12h16" />
      <circle cx="15" cy="12" r="2" fill="white" />
      <path d="M4 17h16" />
      <circle cx="11" cy="17" r="2" fill="white" />
    </svg>
  </button>

</div>
        </div>
      </header>

    {/* SEARCH BAR */}

<div className="border-b border-black/[0.06] bg-[#f5f6f4]">
  <div className="mx-auto max-w-[1400px] px-5 py-2.5 sm:px-8 sm:py-3 lg:px-10">

    <form
      onSubmit={(e) => {
        e.preventDefault();

        const query = searchQuery.trim();

        if (!query) {
          router.push("/all-shops");
          return;
        }

        router.push(
          `/all-shops?search=${encodeURIComponent(query)}`
        );
      }}
    className="relative mx-auto flex w-full max-w-[900px] items-center gap-1.5 rounded-[15px] bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,.06)]"
    >

      <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[11px] px-3.5 text-black sm:h-11">

        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

       <input
  type="search"
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
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
 className="min-w-0 w-full bg-transparent text-[11px] font-medium text-black outline-none placeholder:text-black/35 sm:text-[12px] [&::-webkit-search-cancel-button]:appearance-none"
/>

{searchQuery && (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => {
      setSearchQuery("");
      setShowSearchSuggestions(false);
    }}
    aria-label="Clear search"
    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-black transition hover:bg-black/[0.05]"
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

       </div>

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

      <button
        type="submit"
        className="h-10 rounded-[11px] bg-[#159447] px-5 text-[11px] font-bold text-white transition hover:bg-[#0f7d3b] active:scale-[0.98] sm:h-11 sm:px-7 sm:text-[12px]"
      >
        Search
      </button>

    </form>

  </div>
</div>

  {/* ================= HERO SECTION ================= */}
<section className="border-b border-black/[0.06]">
  <div className="mx-auto max-w-[1400px] px-5 py-5 sm:px-8 lg:px-10 lg:py-6">

    {/* MOBILE HERO */}
    <div
      className="relative h-[430px] overflow-hidden rounded-[24px] bg-[#111] sm:hidden"
      onTouchStart={(e) => {
        const startX = e.touches[0].clientX;
        const handleTouchEnd = (event: TouchEvent) => {
          const endX = event.changedTouches[0].clientX;
          const diff = startX - endX;

          if (Math.abs(diff) > 50) {
            if (diff > 0) {
              setActiveSlide((current) => (current + 1) % heroSlides.length);
            } else {
              setActiveSlide(
                (current) => (current - 1 + heroSlides.length) % heroSlides.length
              );
            }
          }
          window.removeEventListener("touchend", handleTouchEnd);
        };
        window.addEventListener("touchend", handleTouchEnd);
      }}
    >
      {/* MOBILE IMAGE WITH ANIMATION */}
      <img
        key={`mobile-image-${activeSlide}`}
        src={slide.image}
        alt="Local shopping"
        className="absolute inset-0 h-full w-full object-cover object-center animate-[heroImage_0.6s_ease-out_forwards]"
        draggable={false}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

      <div className="absolute right-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-1 rounded-full border border-white/30 bg-white/85 px-2.5 py-1.5 text-[8px] font-bold text-black shadow-lg backdrop-blur-md">
        <span className="text-[8px] text-[#159447]">●</span>
        <span className="truncate">Shyampur, Uttarakhand</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-6 text-white">

        <h1
          key={`mobile-title-${activeSlide}`}
          className="max-w-[330px] text-[30px] font-black leading-[0.94] tracking-[-0.055em] animate-[heroText_0.5s_ease-out_forwards]"
        >
          {slide.title}
        </h1>

        <p
          key={`mobile-description-${activeSlide}`}
          className="mt-3 max-w-[300px] text-[10px] leading-[1.55] text-white/65 animate-[heroText_0.6s_ease-out_forwards]"
        >
          {slide.description}
        </p>
      </div>
    </div>

    {/* DESKTOP HERO */}
    <div className="relative hidden min-h-[500px] grid-cols-[50%_50%] overflow-hidden rounded-[30px] bg-[#111] sm:grid lg:min-h-[580px]">
      
      {/* TEXT SIDE */}
      <div className="relative z-10 flex min-h-[500px] flex-col justify-between overflow-hidden px-10 py-11 text-white lg:min-h-[580px] lg:px-12 lg:py-12">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#159447]/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mt-7 max-w-lg lg:mt-12">
            <div className="mb-4 text-[14px] font-semibold text-[#43d17b]">
              Everything around you
            </div>

            <h1
              key={`desktop-title-${activeSlide}`}
              className="text-[53px] font-black leading-[0.94] tracking-[-0.055em] lg:text-[58px] animate-[heroText_0.5s_ease-out_forwards]"
            >
              {slide.title}
            </h1>

            <p
              key={`desktop-description-${activeSlide}`}
              className="mt-6 max-w-md text-[15px] leading-6 text-white/50 animate-[heroText_0.6s_ease-out_forwards]"
            >
              {slide.description}
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP IMAGE SIDE */}
      <div className="relative min-h-[500px] overflow-hidden bg-[#dfe9df] lg:min-h-[580px]">
        <img
          key={`desktop-image-${activeSlide}`}
          src={slide.image}
          alt="Local shopping"
          className="absolute inset-0 h-full w-full object-cover object-center animate-[heroImage_0.7s_ease-out_forwards]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-black/10" />

        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/85 px-3.5 py-2 text-[11px] font-bold text-black shadow-lg backdrop-blur-md">
          <span className="text-[8px] text-[#159447]">●</span>
          <span>Shyampur, Uttarakhand</span>
        </div>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
  {heroSlides.map((_, index) => (
    <button
      key={index}
      onClick={() => setActiveSlide(index)}
      aria-label={`Go to slide ${index + 1}`}
      className={`h-1.5 rounded-full transition-all duration-300 ${
        activeSlide === index
          ? "w-6 bg-white"
          : "w-1.5 bg-white/45 hover:bg-white/70"
      }`}
    />
  ))}
</div>
      </div>
    </div>

  </div>
</section>

     <section
  id="categories"
  className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16"
>

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <div className="text-[10px] font-bold tracking-[0.2em] text-[#159447]">
              SHOP BY CATEGORY
            </div>

            <h2 className="mt-2.5 text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
  What are you{" "}
  <br className="hidden sm:block" />
  looking for?
</h2>

          </div>


 <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-4 lg:grid-cols-8">

  {categories.map((category) => (
    <button
  key={category.name}
  onClick={() =>
  router.push(`/all-shops?category=${encodeURIComponent(category.name)}`)
}
  className="group flex min-h-[185px] flex-col rounded-[22px] border border-black/[0.07] bg-white p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-[#159447]/30 hover:shadow-[0_18px_50px_rgba(0,0,0,.07)] active:scale-[0.98]"
>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0f5f0] text-[#159447] transition duration-300 group-hover:bg-[#159447] group-hover:text-white">
        <CategoryIcon type={category.icon} />
      </div>

      <div className="mt-5 text-[13px] font-black">
        {category.name}
      </div>

      <div className="mt-1.5 min-h-[30px] text-[10px] font-medium leading-[1.45] text-black/45">
        {category.description}
      </div>

      <div className="mt-auto pt-4">
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#159447]/15 bg-[#159447]/[0.06] px-3 py-1.5 text-[9px] font-black text-[#159447] transition-all duration-200 group-hover:border-[#159447]/30 group-hover:bg-[#159447] group-hover:text-white">
    Explore

    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  </span>
</div>

    </button>
  ))}

</div>

        
</div>

      </section>


     <section id="shops" className="bg-white py-12 sm:py-14">

        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

  <div>
    <div className="text-[10px] font-bold tracking-[0.2em] text-[#159447]">
      TOP SHOPS
    </div>

    <h2 className="mt-2.5 text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
      Discover the
      <br />
      local favourites
    </h2>

    <p className="mt-3 max-w-md text-[12px] leading-5 text-black/45 sm:text-[13px]">
      Highly rated local shops, trusted by the community and worth exploring.
    </p>
  </div>

  <button
    onClick={() => router.push("/all-shops")}
    className="group self-start inline-flex shrink-0 items-center gap-2 rounded-full bg-[#111] px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#222] sm:self-end"
  >
    <span>Explore all shops</span>

    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  </button>

</div>

<div className="mt-6 grid gap-4 sm:mt-7 md:grid-cols-2 lg:grid-cols-3">

  {shopsLoading ? (
    Array.from({ length: 3 }).map((_, index) => (
      <article
        key={index}
        className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#f7f8f6]"
      >
        <div className="h-[235px] animate-pulse bg-black/[0.05]" />

        <div className="p-5">
          <div className="h-5 w-2/3 animate-pulse rounded bg-black/[0.06]" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-black/[0.05]" />

          <div className="mt-5 border-t border-black/[0.07] pt-3.5">
            <div className="h-4 w-1/4 animate-pulse rounded bg-black/[0.05]" />
          </div>
        </div>
      </article>
    ))
  ) : shops.length === 0 ? (
    <div className="col-span-full rounded-[24px] border border-black/[0.07] bg-[#f7f8f6] px-6 py-12 text-center">
      <div className="text-[13px] font-bold text-black/60">
         No top shops available right now.
      </div>

      <p className="mt-1.5 text-[11px] text-black/35">
        Explore all shops to find local stores near you.
      </p>
    </div>
  ) : (
    shops.map((shop) => (
      <article
        key={shop.id}
        className="group overflow-hidden rounded-[24px] border border-black/[0.07] bg-[#f7f8f6] transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(0,0,0,.08)]"
      >

          <div className="relative h-[235px] overflow-hidden">

  <img
    src={shop.image_url}
    alt={shop.name}
    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
  />

  {/* OPEN NOW / CLOSED */}

  <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold backdrop-blur">

    <span
      className={
        isShopOpen(shop.opening_time, shop.closing_time)
          ? "text-[#159447]"
          : "text-red-500"
      }
    >
      ●
    </span>

    {" "}

    {isShopOpen(shop.opening_time, shop.closing_time)
      ? "OPEN NOW"
      : "CLOSED"}

  </div>

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
                <circle
                  cx="7.5"
                  cy="7.5"
                  r="1"
                />
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
              <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 2 0 0 0 2.83 0l3.35-3.35Z" />
              <circle
                cx="7.5"
                cy="7.5"
                r="1"
              />
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

  <div className="absolute bottom-4 right-4 z-20 rounded-full bg-black/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
    ★ {Number(shop.rating ?? 0).toFixed(1)}
  </div>

</div>

        <div className="p-5">

          <h3 className="text-[17px] font-black tracking-tight">
            {shop.name}
          </h3>

          <p className="mt-1 text-[12px] text-black/40">
            {shop.category}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-black/[0.07] pt-3.5">

            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-black/40">

              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.2" />
              </svg>

              <span className="truncate">
                {shop.address || "Shyampur"}
              </span>

            </span>

            <button
              onClick={() => requireSignIn(shop.slug || shop.id)}
              className="group ml-3 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black text-[#159447]"
            >
              <span>View shop</span>

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path d="M5 12h13" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>

          </div>

        </div>

      </article>
    ))
  )}

</div>         

        </div>
      </section>


      {/* HOW IT WORKS */}

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-10">

        <div className="rounded-[30px] bg-[#111] px-7 py-10 text-white sm:px-10 lg:px-14 lg:py-14">

          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

            <div>

              <div className="text-[9px] font-bold tracking-[0.2em] text-[#43d17b]">
                HOW IT WORKS
              </div>

              <h2 className="mt-3 text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
                Local shopping
                <br />
                made simple
              </h2>

              <p className="mt-4 max-w-md text-[13px] leading-6 text-white/45">
                Find a nearby shop, choose what you need and get it delivered
                to your doorstep.
              </p>

            </div>


            <div className="grid gap-3 sm:grid-cols-3">

              <div className="rounded-[22px] bg-white/[0.06] p-5 transition duration-300 hover:bg-white/[0.09]">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#159447] text-white">
                  <ProcessIcon type="search" />
                </div>

                <h3 className="mt-7 text-[16px] font-black">
                  Find a shop
                </h3>

               <p className="mt-2 text-[11px] leading-5 text-white/40">
  Discover local shops around your location.
</p>

              </div>


              <div className="rounded-[22px] bg-white/[0.06] p-5 transition duration-300 hover:bg-white/[0.09]">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                  <ProcessIcon type="bag" />
                </div>

                <h3 className="mt-7 text-[16px] font-black">
                  Choose what you need
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-white/40">
                  Browse products available from your local shop.
                </p>

              </div>


              <div className="rounded-[22px] bg-white/[0.06] p-5 transition duration-300 hover:bg-white/[0.09]">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#159447] text-white">
                  <ProcessIcon type="delivery" />
                </div>

                <h3 className="mt-7 text-[16px] font-black">
                  Get it delivered
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-white/40">
                  Place your order and get it delivered nearby.
                </p>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* STORE CTA */}

      <section className="px-5 pb-16 sm:px-8 lg:px-10">

        <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[30px] bg-[#e7efe7]">

          <div className="grid items-center gap-8 px-7 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-14">

            <div>

              <div className="text-[9px] font-bold tracking-[0.2em] text-[#159447]">
                FOR LOCAL SHOPS
              </div>

              <h2 className="mt-3 max-w-2xl text-[34px] font-black leading-[1] tracking-[-0.05em] sm:text-[42px]">
                Bring your shop
                <br />
                online with us
              </h2>

              <p className="mt-4 max-w-xl text-[13px] leading-6 text-black/45 sm:text-[14px]">
                List your shop on Apna Shyampur, showcase your products and
                reach customers around you.
              </p>

            </div>

<button
  onClick={() => {
    if (!user) {
      setShowSignIn(true);
      return;
    }

    router.push("/add-store");
  }}
  className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#111] px-6 py-3.5 text-[12px] font-bold text-white transition hover:bg-[#222]"
>
  <span>Add your shop</span>

  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform duration-200 group-hover:translate-x-0.5"
    aria-hidden="true"
  >
    <path d="M5 12h13" />
    <path d="m13 6 6 6-6 6" />
  </svg>
</button>

          </div>
        </div>
      </section>


      {/* FOOTER */}

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

        {/* SIGN IN MODAL */}

{showSignIn && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
    onClick={() => setShowSignIn(false)}
  >
    <div
      className="relative w-full max-w-[400px] rounded-[28px] bg-white p-7 shadow-[0_30px_100px_rgba(0,0,0,.25)] sm:p-8"
      onClick={(e) => e.stopPropagation()}
    >

      {/* CLOSE */}

      <button
        onClick={() => setShowSignIn(false)}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-black/60 transition hover:bg-black/[0.1] hover:text-black"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      </button>

      {/* BRAND */}

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111] text-[10px] font-black tracking-tight text-white">
          AS
        </div>

        <div className="leading-none">

          <div className="flex items-baseline gap-[3px] text-[14px] font-black tracking-[-0.05em]">
            <span className="text-[#111]">APNA</span>
            <span className="text-[#159447]">SHYAMPUR</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[6.5px] font-bold tracking-[0.12em] text-black/45">
            <span>LOCALS</span>
            <span className="text-[#159447]">•</span>
            <span>TRUSTED</span>
            <span className="text-[#159447]">•</span>
            <span>FAST</span>
          </div>

        </div>

      </div>

      {/* TITLE */}

      <h2 className="mt-8 text-[27px] font-black tracking-[-0.045em]">
        Sign in to continue
      </h2>

      <p className="mt-2 max-w-[310px] text-[12px] leading-5 text-black/45">
        Sign in securely with your Google account to explore local shops and order from your neighbourhood.
      </p>

      {/* GOOGLE BUTTON */}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="mt-7 flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-black/[0.09] bg-white px-5 text-[12px] font-bold text-black transition hover:border-black/[0.16] hover:bg-[#fafafa]"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
          />
          <path
            fill="#34A853"
            d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.71-5.46-4.01H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
          />
          <path
            fill="#FBBC05"
            d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.62H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.38l3.24-2.53Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.37l3.24 2.53 3.24 2.53C7.31 7.85 9.46 6.14 12 6.14Z"
          />
        </svg>

        Continue with Google
      </button>

      {/* INFO */}

      <p className="mt-4 text-center text-[9px] font-medium leading-4 text-black/35">
  Your Google account keeps your sign-in simple and secure.
</p>

    </div>
  </div>
)}

      <style jsx global>{`
        @keyframes heroText {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroImage {
          from {
            opacity: 0;
            transform: scale(1.035);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

    </main>
  );
}

