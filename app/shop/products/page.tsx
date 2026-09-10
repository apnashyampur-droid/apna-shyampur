"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "All",
  "Grocery",
  "Vegetables",
  "Food",
  "Meat",
  "Electronics",
  "Medical",
  "Bakery",
  "Dairy",
  "Gifts & Toys",
  "Clothes",
  "Footwear",
  "Cosmetics",
];

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

type FilterType = "all" | "available" | "unavailable";

export default function ProductsPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<FilterType>("all");

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null
  );

  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const loadProducts = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setActionError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/");
          return;
        }

        const { data: shop, error: shopError } = await supabase
          .from("shops")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (shopError) {
          console.error("Shop lookup error:", shopError);
          setError(
            "We couldn't verify your shop right now. Please try again."
          );
          return;
        }

        if (!shop) {
          setError("You need an approved shop before you can manage products.");
          return;
        }

        setShopId(shop.id);

        const { data, error: productsError } = await supabase
          .from("products")
          .select(
            "id, shop_id, product_name, category, price, sale_price, description, available, image_url, created_at"
          )
          .eq("shop_id", shop.id)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Products fetch error:", productsError);
          setError(
            "We couldn't load your products right now. Please try again."
          );
          return;
        }

        setProducts((data ?? []) as Product[]);
      } catch (err) {
        console.error("Products page error:", err);
        setError("Something went wrong while loading your products.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((product) => product.available).length;
    const unavailable = total - available;

    return {
      total,
      available,
      unavailable,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.product_name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        category === "All" || product.category === category;

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && product.available) ||
        (availabilityFilter === "unavailable" && !product.available);

      return (
        matchesSearch && matchesCategory && matchesAvailability
      );
    });
  }, [products, search, category, availabilityFilter]);

  const handleAvailabilityToggle = async (product: Product) => {
    if (updatingProductId) return;

    const nextAvailable = !product.available;

    setUpdatingProductId(product.id);
    setActionError("");

    // Optimistic UI update
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, available: nextAvailable }
          : item
      )
    );

    try {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          available: nextAvailable,
        })
        .eq("id", product.id)
        .eq("shop_id", product.shop_id);

      if (updateError) {
        console.error("Availability update error:", updateError);

        // Roll back optimistic update
        setProducts((current) =>
          current.map((item) =>
            item.id === product.id
              ? { ...item, available: product.available }
              : item
          )
        );

        setActionError(
          `Couldn't update "${product.product_name}". Please try again.`
        );
      }
    } catch (err) {
      console.error("Availability toggle error:", err);

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, available: product.available }
            : item
        )
      );

      setActionError(
        `Couldn't update "${product.product_name}". Please try again.`
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deletingProductId) return;

    const product = deleteTarget;

    setDeletingProductId(product.id);
    setActionError("");

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("shop_id", product.shop_id);

      if (deleteError) {
        console.error("Product delete error:", deleteError);
        setActionError(
          `Couldn't delete "${product.product_name}". Please try again.`
        );
        return;
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete product error:", err);

      setActionError(
        `Couldn't delete "${product.product_name}". Please try again.`
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} />

        <section className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="animate-pulse">
            <div className="h-3 w-36 rounded-full bg-black/[0.07]" />

            <div className="mt-3 h-10 w-64 rounded-xl bg-black/[0.07]" />

            <div className="mt-3 h-4 w-[360px] max-w-full rounded-full bg-black/[0.05]" />

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="h-24 rounded-[20px] bg-white" />
              <div className="h-24 rounded-[20px] bg-white" />
              <div className="h-24 rounded-[20px] bg-white" />
            </div>

            <div className="mt-5 h-20 rounded-[22px] bg-white" />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-[390px] rounded-[24px] bg-white" />
              <div className="h-[390px] rounded-[24px] bg-white" />
              <div className="h-[390px] rounded-[24px] bg-white" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error && !shopId) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} />

        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[700px] items-center justify-center px-5 py-10">
          <div className="w-full rounded-[28px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.05)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff4e5] text-[#c87900]">
              <WarningIcon />
            </div>

            <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]">
              Unable to load products
            </h1>

            <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-5 text-black/45">
              {error}
            </p>

            <button
              type="button"
              onClick={() => router.push("/shop")}
              className="mt-7 rounded-[14px] bg-[#111] px-6 py-3 text-[11px] font-black text-white transition hover:bg-black/80"
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      <ShopHeader router={router} backTo="/shop" />

      <section className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]">
              PRODUCT MANAGEMENT
            </div>

            <h1 className="mt-2 text-[32px] font-black leading-none tracking-[-0.05em] sm:text-[40px]">
              All Products
            </h1>

            <p className="mt-3 max-w-[600px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
              Manage your shop catalogue, update availability and keep your
              products ready for customers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/shop/products/new")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#159447] px-5 py-3.5 text-[10px] font-black text-white shadow-[0_9px_24px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c]"
          >
            <PlusIcon />
            Add Product
          </button>
        </div>

        {/* STATS */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Products"
            value={stats.total}
            icon={<ProductsIcon />}
          />

          <StatCard
            label="Available"
            value={stats.available}
            icon={<CheckCircleIcon />}
            green
          />

          <StatCard
            label="Unavailable"
            value={stats.unavailable}
            icon={<PauseIcon />}
          />
        </div>

       {/* SEARCH + FILTERS */}
<section className="mt-5 rounded-[22px] border border-black/[0.07] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,.03)] sm:p-5">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    {/* SEARCH */}
    <div className="relative min-w-0 flex-1">
      <SearchIcon />

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search products..."
        className="h-[44px] w-full rounded-[13px] border border-black/[0.08] bg-[#fafafa] py-3 pl-10 pr-4 text-[11px] font-medium text-black outline-none transition placeholder:text-black/25 focus:border-[#159447]/45 focus:bg-white"
      />
    </div>

    {/* CATEGORY */}
    <div className="relative shrink-0">
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="h-[44px] w-full appearance-none rounded-[13px] border border-black/[0.08] bg-[#fafafa] pl-3.5 pr-10 text-[10px] font-bold text-black/65 outline-none transition focus:border-[#159447]/45 focus:bg-white sm:w-[158px]"
      >
        {CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {item === "All" ? "All Categories" : item}
          </option>
        ))}
      </select>

      {/* CUSTOM ARROW */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/35"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>

    {/* AVAILABILITY */}
    <div className="flex h-[44px] shrink-0 items-center rounded-[13px] border border-black/[0.08] bg-[#fafafa] p-1">
      <FilterButton
        active={availabilityFilter === "all"}
        onClick={() => setAvailabilityFilter("all")}
      >
        All
      </FilterButton>

      <FilterButton
        active={availabilityFilter === "available"}
        onClick={() => setAvailabilityFilter("available")}
      >
        Available
      </FilterButton>

      <FilterButton
        active={availabilityFilter === "unavailable"}
        onClick={() => setAvailabilityFilter("unavailable")}
      >
        Unavailable
      </FilterButton>
    </div>

    {/* REFRESH */}
    <button
      type="button"
      onClick={() => loadProducts(true)}
      disabled={refreshing}
      aria-label="Refresh products"
      className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[13px] border border-black/[0.08] bg-white text-black/50 transition hover:border-black/[0.14] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshIcon
        className={refreshing ? "animate-spin" : undefined}
      />
    </button>
  </div>
</section>

        {/* ACTION ERROR */}
        {actionError && (
          <div className="mt-4 flex items-start gap-2 rounded-[14px] border border-red-500/10 bg-red-50 px-4 py-3 text-[9px] font-bold leading-4 text-red-600">
            <WarningIconSmall />
            <span>{actionError}</span>
          </div>
        )}

        {/* RESULTS INFO */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-black/65">
              {filteredProducts.length}
            </span>{" "}
            <span className="text-[10px] font-medium text-black/35">
              {filteredProducts.length === 1 ? "product" : "products"}
            </span>
          </div>

          {(search || category !== "All" || availabilityFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setAvailabilityFilter("all");
              }}
              className="text-[9px] font-black text-[#159447] transition hover:text-[#117d3c]"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* EMPTY SHOP */}
        {products.length === 0 ? (
          <EmptyProducts
            onAdd={() => router.push("/shop/products/new")}
          />
        ) : filteredProducts.length === 0 ? (
          <NoResults onClear={() => {
            setSearch("");
            setCategory("All");
            setAvailabilityFilter("all");
          }} />
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
             <ProductCard
  key={product.id}
  product={product}
  updating={updatingProductId === product.id}
  deleting={deletingProductId === product.id}
  onToggle={() => handleAvailabilityToggle(product)}
  onDelete={() => setDeleteTarget(product)}
  onEdit={() => router.push(`/shop/products/new?id=${product.id}`)}
/>
            ))}
          </div>
        )}

        <div className="h-8" />
      </section>

      {/* FOOTER */}

     {/* FOOTER */}

<div className="pb-8 pt-10 text-center">
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

      {/* DELETE MODAL */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          deleting={Boolean(deletingProductId)}
          onCancel={() => {
            if (!deletingProductId) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </main>
  );
}

function ProductCard({
  product,
  updating,
  deleting,
  onToggle,
  onDelete,
  onEdit,
}: {
  product: Product;
  updating: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.035)] transition hover:-translate-y-[1px] hover:shadow-[0_18px_55px_rgba(0,0,0,.055)]">
      {/* IMAGE */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f0f1f0]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
              !product.available ? "opacity-55 grayscale-[20%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-black/20">
            <ImagePlaceholderIcon />
          </div>
        )}

        {/* AVAILABILITY BADGE */}
        <div className="absolute left-3 top-3">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[8px] font-black backdrop-blur-md ${
              product.available
                ? "border-[#159447]/15 bg-white/90 text-[#159447]"
                : "border-black/[0.08] bg-white/90 text-black/45"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                product.available ? "bg-[#159447]" : "bg-black/25"
              }`}
            />
            {product.available ? "AVAILABLE" : "UNAVAILABLE"}
          </div>
        </div>

        {/* CATEGORY */}
        <div className="absolute right-3 top-3">
          <div className="rounded-full border border-black/[0.06] bg-white/90 px-2.5 py-1.5 text-[8px] font-black text-black/55 backdrop-blur-md">
            {product.category}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-black tracking-[-0.035em]">
              {product.product_name}
            </h2>

            <p className="mt-1.5 line-clamp-2 min-h-[30px] text-[9px] leading-4 text-black/40">
              {product.description || "No description added for this product."}
            </p>
          </div>
        </div>

        {/* PRICE */}
        <div className="mt-4 flex items-end gap-2">
          {product.sale_price !== null ? (
            <>
              <span className="text-[17px] font-black tracking-[-0.03em]">
                ₹{formatPrice(product.sale_price)}
              </span>

              <span className="pb-[2px] text-[10px] font-semibold text-black/30 line-through">
                ₹{formatPrice(product.price)}
              </span>

              <span className="mb-[1px] rounded-full bg-[#f0faf3] px-2 py-1 text-[7px] font-black text-[#159447]">
                SALE
              </span>
            </>
          ) : (
            <span className="text-[17px] font-black tracking-[-0.03em]">
              ₹{formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* DIVIDER */}
        <div className="my-4 h-px bg-black/[0.06]" />

        {/* AVAILABILITY CONTROL */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[9px] font-black text-black/65">
              Product status
            </div>

            <div className="mt-1 text-[8px] text-black/35">
              {product.available
                ? "Customers can order this product."
                : "Customers won't see this as available."}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            disabled={updating || deleting}
            aria-label={
              product.available
                ? `Mark ${product.product_name} unavailable`
                : `Mark ${product.product_name} available`
            }
            aria-pressed={product.available}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              product.available ? "bg-[#159447]" : "bg-black/15"
            } ${updating ? "cursor-wait opacity-60" : ""}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                product.available ? "left-6" : "left-1"
              }`}
            />

            {updating && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-2.5 w-2.5 rounded-full border border-black/20 border-t-transparent animate-spin" />
              </span>
            )}
          </button>
        </div>

        {/* ACTIONS */}
        <div className="mt-4 flex gap-2">
       <button
  type="button"
  onClick={onEdit}
  disabled={deleting}
  className="flex-1 rounded-[12px] border border-black/[0.08] bg-[#fafafa] px-3 py-2.5 text-[9px] font-black text-black/55 transition hover:border-black/[0.14] hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
>
  Edit
</button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-[12px] border border-red-500/10 bg-red-50/50 px-3.5 py-2.5 text-[9px] font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* DELETE MODAL                                                               */
/* -------------------------------------------------------------------------- */

function DeleteModal({
  product,
  deleting,
  onCancel,
  onConfirm,
}: {
  product: Product;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[26px] border border-black/[0.08] bg-white p-6 shadow-[0_25px_100px_rgba(0,0,0,.18)] sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-red-50 text-red-600">
          <TrashIcon />
        </div>

        <h2 className="mt-5 text-[20px] font-black tracking-[-0.04em]">
          Delete product?
        </h2>

        <p className="mt-2 text-[11px] leading-5 text-black/45">
          Are you sure you want to permanently delete{" "}
          <span className="font-black text-black/65">
            {product.product_name}
          </span>
          ?
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-[13px] border border-black/[0.08] bg-white px-5 py-3 text-[9px] font-black text-black/55 transition hover:border-black/[0.14] hover:text-black disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-red-600 px-5 py-3 text-[9px] font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting && <MiniSpinner />}
            {deleting ? "Deleting…" : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATES                                                               */
/* -------------------------------------------------------------------------- */

function EmptyProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="mt-5 rounded-[26px] border border-black/[0.07] bg-white px-6 py-14 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:px-10 sm:py-20">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#eef5ef] text-[#159447]">
        <ProductsIcon large />
      </div>

      <h2 className="mt-6 text-[21px] font-black tracking-[-0.04em]">
        No products yet
      </h2>

      <p className="mx-auto mt-2 max-w-[410px] text-[10px] leading-5 text-black/40">
        Your product catalogue is empty. Add your first product so customers
        can discover what your shop offers.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#159447] px-5 py-3 text-[9px] font-black text-white shadow-[0_8px_20px_rgba(21,148,71,.15)] transition hover:bg-[#117d3c]"
      >
        <PlusIcon />
        Add Your First Product
      </button>
    </section>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <section className="mt-5 rounded-[26px] border border-black/[0.07] bg-white px-6 py-14 text-center shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:py-20">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-black/[0.035] text-black/35">
        <SearchIcon large />
      </div>

      <h2 className="mt-5 text-[19px] font-black tracking-[-0.04em]">
        No matching products
      </h2>

      <p className="mx-auto mt-2 max-w-[380px] text-[10px] leading-5 text-black/40">
        Try changing your search or filters to find the product you're looking
        for.
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

/* -------------------------------------------------------------------------- */
/* STAT CARD                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
  green = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  green?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-black/[0.07] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,.03)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[8px] font-black uppercase tracking-[0.12em] text-black/35">
            {label}
          </div>

          <div className="mt-2 text-[26px] font-black leading-none tracking-[-0.05em]">
            {value}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${
            green
              ? "bg-[#eef8f0] text-[#159447]"
              : "bg-black/[0.035] text-black/40"
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[36px] items-center justify-center rounded-[10px] px-3.5 text-[8px] font-black whitespace-nowrap transition ${
        active
          ? "bg-white text-black shadow-sm"
          : "text-black/35 hover:text-black/65"
      }`}
    >
      {children}
    </button>
  );
}

function ShopHeader({
  router,
  backTo = "/",
}: {
  router: ReturnType<typeof useRouter>;
  backTo?: string;
}) {
  return (
    <header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
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
          onClick={() => router.push(backTo)}
          className="rounded-full border border-black/[0.08] bg-white/70 px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:text-[11px]"
        >
          Back
        </button>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function formatPrice(value: number) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* -------------------------------------------------------------------------- */
/* ICONS                                                                      */
/* -------------------------------------------------------------------------- */

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

function CheckCircleIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function PauseIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6" />
      <path d="M14 9v6" />
    </svg>
  );
}

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon({ large = false }: { large?: boolean }) {
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
      className={large ? "" : "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30"}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function RefreshIcon({ className = "" }: { className?: string }) {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
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

function WarningIconSmall() {
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
      className="mt-[1px] shrink-0"
    >
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function MiniSpinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}