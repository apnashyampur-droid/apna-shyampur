"use client"; 
 
import { useEffect, useMemo, useRef, useState } from "react"; 
import { useRouter } from "next/navigation"; 
import Cropper, { Area } from "react-easy-crop"; 
import { createClient } from "@/lib/supabase/client"; 
 
type ShopStatus = 
  | "loading" 
  | "no-shop" 
  | "pending" 
  | "rejected" 
  | "approved"; 
 
type ShopData = { 
  id: string; 
  name: string; 
  description: string; 
  store_image_url: string | null; 
  status: "pending" | "rejected" | "approved"; 
}; 

type ShopDiscount = {
  id: string;
  title: string | null;
  description: string | null;
  discount_percent: number | null;
};
 
type DashboardStats = { 
  newOrders: number; 
  activeOrders: number; 
  completedOrders: number; 
  products: number; 
  availableProducts: number; 
  unavailableProducts: number; 
}; 
 
const emptyStats: DashboardStats = { 
  newOrders: 0, 
  activeOrders: 0, 
  completedOrders: 0, 
  products: 0, 
  availableProducts: 0, 
  unavailableProducts: 0, 
}; 

const createImage = (url: string): Promise<HTMLImageElement> => 
  new Promise((resolve, reject) => { 
    const image = new Image(); 
 
    image.addEventListener("load", () => resolve(image)); 
    image.addEventListener("error", reject); 
 
    image.setAttribute("crossOrigin", "anonymous"); 
    image.src = url; 
  }); 
 
async function getCroppedImage( 
  imageSrc: string, 
  pixelCrop: Area, 
  rotation = 0 
): Promise<Blob> { 
  const image = await createImage(imageSrc); 
 
  const canvas = document.createElement("canvas"); 
  const ctx = canvas.getContext("2d"); 
 
  if (!ctx) { 
    throw new Error("Unable to prepare image editor."); 
  } 
 
  const rotationRad = (rotation * Math.PI) / 180; 
 
  const sin = Math.abs(Math.sin(rotationRad)); 
  const cos = Math.abs(Math.cos(rotationRad)); 
 
  const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin; 
  const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos; 
 
  canvas.width = rotatedWidth; 
  canvas.height = rotatedHeight; 
 
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2); 
  ctx.rotate(rotationRad); 
  ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2); 
 
  ctx.drawImage(image, 0, 0); 
 
  const croppedCanvas = document.createElement("canvas"); 
  const croppedCtx = croppedCanvas.getContext("2d"); 
 
  if (!croppedCtx) { 
    throw new Error("Unable to create cropped image."); 
  } 
 
  croppedCanvas.width = pixelCrop.width; 
  croppedCanvas.height = pixelCrop.height; 
 
  croppedCtx.drawImage( 
    canvas, 
    pixelCrop.x, 
    pixelCrop.y, 
    pixelCrop.width, 
    pixelCrop.height, 
    0, 
    0, 
    pixelCrop.width, 
    pixelCrop.height 
  ); 
 
  return new Promise((resolve, reject) => { 
    croppedCanvas.toBlob( 
      (blob) => { 
        if (!blob) { 
          reject(new Error("Unable to create cropped image.")); 
          return; 
        } 
 
        resolve(blob); 
      }, 
      "image/jpeg", 
      0.92 
    ); 
  }); 
} 
 
export default function ShopDashboard() { 
  const router = useRouter(); 
  const supabase = useMemo(() => createClient(), []); 
 
  const [shopStatus, setShopStatus] = useState<ShopStatus>("loading"); 
  const [shop, setShop] = useState<ShopData | null>(null); 
  const [stats, setStats] = useState<DashboardStats>(emptyStats); 
  const [errorMessage, setErrorMessage] = useState("");
const [activeDiscount, setActiveDiscount] =
  useState<ShopDiscount | null>(null);
 
  const [imageUploading, setImageUploading] = useState(false); 
  const [imageMessage, setImageMessage] = useState(""); 
 
  const imageInputRef = useRef<HTMLInputElement | null>(null); 
 
 
const [cropImageSrc, setCropImageSrc] = useState<string | null>(null); 
const [crop, setCrop] = useState({ x: 0, y: 0 }); 
const [cropZoom, setCropZoom] = useState(1); 
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>( 
  null 
); 
const [cropSaving, setCropSaving] = useState(false); 

  useEffect(() => { 
    let mounted = true; 
 
    const loadShop = async () => { 
      try { 
        setShopStatus("loading"); 
        setErrorMessage(""); 
 
        const { 
          data: { user }, 
          error: userError, 
        } = await supabase.auth.getUser(); 
 
        if (!mounted) return; 
 
        if (userError) { 
          console.error("Auth error:", userError); 
 
          setErrorMessage( 
            "We couldn't verify your account right now. Please try again." 
          ); 
 
          return; 
        } 
 
        if (!user) { 
          router.replace("/"); 
          return; 
        } 
 
        const { data: application, error: applicationError } = 
          await supabase 
            .from("store_applications") 
            .select( 
              ` 
                id, 
                user_id, 
                store_name, 
                description, 
                store_image_url, 
                status 
              ` 
            ) 
            .eq("user_id", user.id) 
            .order("created_at", { ascending: false }) 
            .limit(1) 
            .maybeSingle(); 
 
        if (!mounted) return; 
 
        if (applicationError) { 
          console.error("Shop application error:", { 
            message: applicationError.message, 
            details: applicationError.details, 
            hint: applicationError.hint, 
            code: applicationError.code, 
          }); 
 
          setErrorMessage( 
            applicationError.message || 
              "We couldn't load your shop right now. Please try again." 
          ); 
 
          return; 
        } 
 
        if (!application) { 
          setShop(null); 
          setStats(emptyStats); 
          setShopStatus("no-shop"); 
          return; 
        } 
 
        const status = String(application.status || "") 
          .trim() 
          .toLowerCase(); 
 
        if (status === "pending") { 
          setShop(null); 
          setStats(emptyStats); 
          setShopStatus("pending"); 
          return; 
        } 
 
        if (status === "rejected") { 
          setShop(null); 
          setStats(emptyStats); 
          setShopStatus("rejected"); 
          return; 
        } 
 
        if (status === "approved") {
  const { data: actualShop, error: actualShopError } = await supabase
    .from("shops")
    .select("id")
    .eq("application_id", application.id)
    .maybeSingle();

  if (!mounted) return;

  if (actualShopError) {
    console.error("Actual shop lookup error:", {
      message: actualShopError.message,
      details: actualShopError.details,
      hint: actualShopError.hint,
      code: actualShopError.code,
    });
  }

  const shopId = actualShop?.id || application.id;

  let productsCount = 0;
  let availableProductsCount = 0;
  let unavailableProductsCount = 0;

  if (actualShop?.id) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, available")
      .eq("shop_id", actualShop.id);

    if (productsError) {
      console.error("Products stats error:", {
        message: productsError.message,
        details: productsError.details,
        hint: productsError.hint,
        code: productsError.code,
      });
    } else {
      productsCount = products?.length ?? 0;

      availableProductsCount =
        products?.filter((product) => product.available === true).length ?? 0;

      unavailableProductsCount =
        products?.filter((product) => product.available === false).length ?? 0;
    }
  }

  setShop({
    id: shopId,
    name: application.store_name || "Your Shop",
    description:
      application.description ||
      "Add a description to tell customers about your shop.",
    store_image_url: application.store_image_url || null,
    status: "approved",
  });

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
    title,
    description,
    discount_percent
  `)
  .eq("shop_id", shopId)
  .eq("type", "discount")
  .eq("is_enabled", true)
  .lte("valid_from", today)
  .gte("valid_until", today)
  .not("discount_percent", "is", null)
  .order("created_at", {
    ascending: false,
  })
  .limit(1);

if (discountError) {
  console.error("SHOP DISCOUNT FETCH ERROR:", discountError);
  setActiveDiscount(null);
} else {
  setActiveDiscount(
    discountData?.[0]
      ? (discountData[0] as ShopDiscount)
      : null
  );
}

  setStats({
    newOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    products: productsCount,
    availableProducts: availableProductsCount,
    unavailableProducts: unavailableProductsCount,
  });

  setShopStatus("approved");

  return;
}
 
        console.warn( 
          "Unknown shop application status:", 
          application.status 
        ); 
 
        setShop(null); 
        setStats(emptyStats); 
        setShopStatus("no-shop"); 
      } catch (error) { 
        console.error("Shop dashboard error:", error); 
 
        if (!mounted) return; 
 
        setErrorMessage( 
          "We couldn't load your shop right now. Please try again." 
        ); 
 
        setShopStatus("no-shop"); 
      } 
    }; 
 
    loadShop(); 
 
    return () => { 
      mounted = false; 
    }; 
  }, [router, supabase]); 

  const handleShopImageClick = () => { 
    if (imageUploading) return; 
 
    imageInputRef.current?.click(); 
  }; 
 
   
  const handleCropComplete = ( 
    _croppedArea: Area, 
    croppedPixels: Area 
  ) => { 
    setCroppedAreaPixels(croppedPixels); 
  }; 
 
  const handleCropCancel = () => { 
    if (cropImageSrc) { 
      URL.revokeObjectURL(cropImageSrc); 
    } 
 
    setCropImageSrc(null); 
    setCrop({ x: 0, y: 0 }); 
    setCropZoom(1) 
    setCroppedAreaPixels(null); 
  }; 
 
  const handleCropSave = async () => { 
    if (!cropImageSrc || !croppedAreaPixels || !shop) return; 
 
    try { 
      setCropSaving(true); 
      setImageMessage(""); 
 
      const croppedBlob = await getCroppedImage( 
  cropImageSrc, 
  croppedAreaPixels 
); 
 
      const croppedFile = new File( 
        [croppedBlob], 
        `shop-${shop.id}-${Date.now()}.jpg`, 
        { 
          type: "image/jpeg", 
        } 
      ); 
 
      if (croppedFile.size > 10 * 1024 * 1024) { 
        throw new Error( 
          "The edited image is larger than 10 MB. Please try a smaller crop." 
        ); 
      } 
 
      const { 
        data: { user }, 
        error: userError, 
      } = await supabase.auth.getUser(); 
 
      if (userError || !user) { 
        throw new Error( 
          "Your session has expired. Please sign in again." 
        ); 
      } 
 
      const filePath = `${user.id}/${shop.id}-${Date.now()}.jpg`; 
 
      const { error: uploadError } = await supabase.storage 
        .from("store-images") 
        .upload(filePath, croppedFile, { 
          cacheControl: "3600", 
          upsert: true, 
          contentType: "image/jpeg", 
        }); 
 
      if (uploadError) { 
        console.error("Shop image upload error:", uploadError); 
 
        throw new Error( 
          uploadError.message || "Unable to upload shop image." 
        ); 
      } 
 
      const { 
        data: { publicUrl }, 
      } = supabase.storage 
        .from("store-images") 
        .getPublicUrl(filePath); 
 
      if (!publicUrl) { 
        throw new Error("Unable to create image URL."); 
      } 
 
      const { error: updateError } = await supabase 
        .from("store_applications") 
        .update({ 
          store_image_url: publicUrl, 
        }) 
        .eq("id", shop.id) 
        .eq("user_id", user.id); 
 
      if (updateError) { 
        console.error( 
          "Shop image database update error:", 
          updateError 
        ); 
 
        await supabase.storage 
          .from("store-images") 
          .remove([filePath]); 
 
        throw new Error( 
          updateError.message || 
            "Unable to save your shop image." 
        ); 
      } 
 
      setShop((current) => 
        current 
          ? { 
              ...current, 
              store_image_url: publicUrl, 
            } 
          : current 
      ); 
 
      handleCropCancel(); 
 
      setImageMessage("Shop image updated."); 
 
      window.setTimeout(() => { 
        setImageMessage(""); 
      }, 2500); 
    } catch (error) { 
      console.error("Save cropped shop image error:", error); 
 
      setImageMessage( 
        error instanceof Error 
          ? error.message 
          : "Unable to update shop image. Please try again." 
      ); 
    } finally { 
      setCropSaving(false); 
    } 
  }; 
 
  const handleShopImageChange = ( 
    event: React.ChangeEvent<HTMLInputElement> 
  ) => { 
    const file = event.target.files?.[0]; 
 
    event.target.value = ""; 
 
    if (!file || !shop) return; 
 
    setImageMessage(""); 
 
    if (!file.type.startsWith("image/")) { 
      setImageMessage("Please select an image file."); 
      return; 
    } 
 
    if (file.size > 10 * 1024 * 1024) { 
      setImageMessage("Image size must be 10 MB or smaller."); 
      return; 
    } 
 
    const objectUrl = URL.createObjectURL(file); 
 
    setCropImageSrc(objectUrl); 
    setCrop({ x: 0, y: 0 }); 
    setCropZoom(1); 
    setCroppedAreaPixels(null); 
  }; 
 
  const handleRetry = () => { 
    window.location.reload(); 
  }; 
 
  if (shopStatus === "loading") { 
    return ( 
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
        <ShopHeader router={router} /> 
 
        <section className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 lg:px-10"> 
          <DashboardSkeleton /> 
        </section> 
      </main> 
    ); 
  } 
 
  if (errorMessage) { 
    return ( 
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
        <ShopHeader router={router} /> 
 
        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[700px] items-center justify-center px-5 py-10"> 
          <div className="w-full rounded-[28px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.05)] sm:p-12"> 
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff4e5] text-[#c87900]"> 
              <WarningIcon /> 
            </div> 
 
            <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]"> 
              Something went wrong 
            </h1> 
 
            <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-5 text-black/45"> 
              {errorMessage} 
            </p> 
 
            <button 
              type="button" 
              onClick={handleRetry} 
              className="mt-7 rounded-[14px] bg-[#111] px-6 py-3 text-[11px] font-black text-white transition hover:bg-black/80" 
            > 
              Try Again 
            </button> 
          </div> 
        </section> 
      </main> 
    ); 
  } 
 
  if (shopStatus === "no-shop") { 
    return ( 
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
        <ShopHeader router={router} /> 
 
        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[900px] items-center justify-center px-5 py-12 sm:px-8"> 
          <div className="w-full overflow-hidden rounded-[30px] border border-black/[0.07] bg-white shadow-[0_25px_90px_rgba(0,0,0,.055)]"> 
            <div className="px-6 pb-9 pt-10 text-center sm:px-12 sm:pt-14"> 
              <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-[#eef5ef] text-[#159447]"> 
                <StoreIcon size={31} /> 
              </div> 
 
              <div className="mx-auto mt-7 max-w-[550px]"> 
                <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]"> 
                  SELL ON APNA SHYAMPUR 
                </div> 
 
                <h1 className="mt-3 text-[30px] font-black leading-[1.05] tracking-[-0.05em] sm:text-[40px]"> 
                  Your shop isn’t listed 
                </h1> 
 
                <p className="mx-auto mt-4 max-w-[500px] text-[12px] leading-6 text-black/45 sm:text-[13px]"> 
                  Your shop isn't currently listed on Apna Shyampur. Add your 
                  shop to showcase your products and start serving customers in 
                  your area. 
                </p> 
              </div> 
 
              <button 
                type="button" 
                onClick={() => router.push("/add-store")} 
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-[15px] bg-[#159447] px-7 py-3.5 text-[11px] font-black text-white shadow-[0_10px_25px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c] hover:shadow-[0_12px_30px_rgba(21,148,71,.24)]" 
              > 
                <PlusIcon /> 
                Add Your Shop 
              </button> 
            </div> 
 
            <div className="border-t border-black/[0.06] bg-[#fafafa] px-6 py-6 sm:px-10"> 
              <div className="grid gap-5 sm:grid-cols-3"> 
                <Feature 
                  icon={<ShopProfileIcon />} 
                  title="Create your shop" 
                  text="Build your local storefront." 
                /> 
 
                <Feature 
                  icon={<ProductIcon />} 
                  title="Add products" 
                  text="Show customers what you sell." 
                /> 
 
                <Feature 
                  icon={<OrderIcon />} 
                  title="Receive orders" 
                  text="Manage orders from one place." 
                /> 
              </div> 
            </div> 
          </div> 
        </section> 
      </main> 
    ); 
  } 
 
if (shopStatus === "pending") { 
  return ( 
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
      <ShopHeader router={router} /> 
 
      <StatusPage 
        type="pending" 
        title="Your shop is under review" 
        description="We're reviewing your shop details. You'll be able to manage your shop and products once your shop has been approved." 
        primaryText="" 
        onPrimary={() => {}} 
        onSecondary={() => router.push("/")} 
      /> 
    </main> 
  ); 
} 
 
 if (shopStatus === "rejected") { 
  return ( 
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
      <ShopHeader router={router} /> 
 
      <StatusPage 
        type="rejected" 
        title="Shop Application Rejected" 
        description="Your shop application was rejected because some of the information provided was incorrect or did not meet our requirements. Please review your details, make sure all information is accurate, and submit a new application with the correct details." 
        primaryText="Try Again" 
        onPrimary={() => router.push("/add-store")} 
        onSecondary={() => router.push("/")} 
      /> 
    </main> 
  ); 
} 
 
  return ( 
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]"> 
      <ShopHeader router={router} /> 
 
      <section className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10"> 
        {/* PAGE TITLE */} 
 
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"> 
          <div> 
            <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]"> 
              SHOP MANAGEMENT 
            </div> 
 
            <h1 className="mt-2 text-[32px] font-black leading-none tracking-[-0.05em] sm:text-[40px]"> 
              My Shop 
            </h1> 
 
            <p className="mt-3 text-[12px] text-black/45 sm:text-[13px]"> 
              Manage your shop, products, orders and offers. 
            </p> 
          </div> 
 
        </div> 
 
        <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(0,0,0,.045)]"> 
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#e9ece9]"> 
            {shop?.store_image_url ? ( 
              <img 
  src={shop.store_image_url} 
  alt={`${shop.name} shop image`} 
  className={`h-full w-full object-cover transition ${ 
    imageUploading ? "scale-[1.01] opacity-60" : "" 
  }`} 
/> 
            ) : ( 
              <div className="flex h-full flex-col items-center justify-center px-5 text-center"> 
                <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-white text-[#159447] shadow-sm"> 
                  <ImageIcon /> 
                </div> 
 
                <div className="mt-3 text-[11px] font-black"> 
                  Add a shop image 
                </div> 
 
                <div className="mt-1 text-[9px] text-black/40"> 
                  This image is shown to customers in your shop listing. 
                </div> 
              </div> 
            )} 
 
            {/* DARK OVERLAY WHILE UPLOADING */} 
 
            {imageUploading && ( 
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"> 
                <div className="rounded-full bg-white/95 px-4 py-2 text-[9px] font-black text-black shadow-lg"> 
                  Updating image… 
                </div> 
              </div> 
            )} 

            {activeDiscount &&
  activeDiscount.discount_percent !== null && (
  <div className="absolute left-3.5 top-3.5 z-20 w-[165px] sm:left-7 sm:top-7 sm:w-auto sm:max-w-[275px]">
  <div className="rounded-[14px] border border-white/20 bg-black/45 px-2.5 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,.22)] backdrop-blur-xl sm:rounded-[18px] sm:px-4 sm:py-3.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41 11 3.83V3H4v7h.83l9.58 9.59a2 3.35 0 0 0 2.83 0l3.35-3.35a2 3.35 0 0 0 2.83 0l3.35-3.35a2 3.35 0 0 0 0-2.83l-3.35-3.35a2 2 0 0 0-2.83 0l-3.35 3.35a2 2 0 0 0 0 2.83Z" />
              <circle cx="7.5" cy="7.5" r="1" />
            </svg>
          </div>

          <span className="text-[7.5px] font-black uppercase tracking-[0.12em] text-white/70 sm:text-[8px]">
            Special offer
          </span>
        </div>

       <div className="mt-1 text-[18px] font-black leading-none tracking-[-0.05em] sm:mt-2 sm:text-[28px]">
          {activeDiscount.discount_percent}% OFF
        </div>

        {activeDiscount.title && (
         <div className="mt-1 line-clamp-1 text-[8.5px] font-black leading-3.5 text-white sm:mt-1.5 sm:text-[12px] sm:leading-4">
            {activeDiscount.title}
          </div>
        )}

        {activeDiscount.description && (
  <div className="mt-0.5 line-clamp-2 text-[7.5px] font-medium leading-3 text-white/60 sm:mt-1 sm:text-[10px] sm:leading-4">
    {activeDiscount.description}
  </div>
)}

      </div>
    </div>
  )}
 
            {/* ACTIVE BADGE */} 
 
            <div className="absolute right-4 top-4"> 
              <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[9px] font-black text-[#159447] shadow-sm backdrop-blur-md"> 
                <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" /> 
                Active 
              </div> 
            </div> 
 
           <input 
  ref={imageInputRef} 
  type="file" 
  accept="image/jpeg,image/png,image/webp,image/heic,image/heif" 
  className="hidden" 
  onChange={handleShopImageChange} 
/> 
          </div> 
 
          {/* IMAGE MESSAGE */} 
 
          {imageMessage && ( 
            <div 
              className={`border-b px-5 py-2.5 text-center text-[9px] font-bold sm:px-7 ${ 
                imageMessage === "Shop image updated." 
                  ? "border-[#159447]/10 bg-[#f2faf4] text-[#159447]" 
                  : "border-red-500/10 bg-red-50 text-red-600" 
              }`} 
            > 
              {imageMessage} 
            </div> 
          )} 
 
          {/* SHOP INFO */} 
 
          <div className="relative px-5 py-6 sm:px-7 sm:py-7"> 
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> 
              <div className="min-w-0"> 
                <h2 className="truncate text-[21px] font-black tracking-[-0.04em] sm:text-[24px]"> 
                  {shop?.name || "Your Shop"} 
                </h2> 
 
                <p className="mt-2 line-clamp-2 max-w-[700px] text-[10px] leading-4 text-black/40 sm:text-[11px]"> 
                  {shop?.description || 
                    "Add a description to tell customers about your shop."} 
                </p> 
              </div> 
 
              <button 
                type="button" 
                onClick={() => router.push("/shop/edit")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[13px] border border-black/[0.08] bg-white px-5 py-3 text-[10px] font-black transition hover:border-black/[0.15] hover:bg-black/[0.015] sm:w-auto" 
              > 
                <EditIcon /> 
                Edit Shop Details 
              </button> 
            </div> 
          </div> 
        </section> 
 
        {/* STATS */} 
 
      {/* STATS */}

<section className="mt-5 grid gap-3 sm:grid-cols-3">
  <StatCard
    label="New Orders"
    value={stats.newOrders}
    icon={<OrderIcon />}
    accent="green"
    onClick={() => router.push("/shop/orders?status=new")}
  />

  <StatCard
    label="Products"
    value={stats.products}
    icon={<ProductIcon />}
    accent="dark"
    onClick={() => router.push("/shop/products")}
  />

  <StatCard
    label="Completed Orders"
    value={stats.completedOrders}
    icon={<CheckIcon />}
    accent="blue"
    onClick={() => router.push("/shop/orders?status=completed")}
  />
</section>
 
      {/* QUICK ACTIONS */} 

<section className="mt-8">
  <SectionHeading
    title="Quick Actions"
    subtitle="Common shop management tasks."
  />

 <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <ActionCard
    icon={<PlusIcon />}
    title="Add Product"
    description="Add a new item to your shop catalogue."
    onClick={() => router.push("/shop/products/new")}
  />

  <ActionCard
    icon={<DiscountIcon />}
    title="Create Discount"
    description="Create an offer for your customers."
    onClick={() => router.push("/shop/discounts")}
  />

  <ActionCard
    icon={<OrderIcon />}
    title="Manage Orders"
    description="View and manage customer orders."
    onClick={() => router.push("/shop/orders")}
  />

    <ActionCard
    icon={<DiscountIcon />}
    title="Discounts & Combos"
    description="Create discounts and product combos."
    onClick={() => router.push("/shop/discounts")}
  />
</div>
</section>
 
        {/* MAIN MANAGEMENT GRID */} 
 
        <section className="mt-8 grid gap-5 lg:grid-cols-2"> 
          {/* ORDERS */} 
 
          <DashboardPanel 
            title="Orders" 
            subtitle="Manage incoming and previous orders." 
            action="View all" 
            onAction={() => router.push("/shop/orders")} 
          > 
            <div className="grid gap-2.5 sm:grid-cols-2"> 
              <PanelLink 
                icon={<OrderIcon />} 
                title="New Orders" 
                value={`${stats.newOrders} waiting`} 
                onClick={() => router.push("/shop/orders?status=new")} 
                highlight 
              /> 
 
              <PanelLink 
                icon={<ClockIcon />} 
                title="Active Orders" 
                value={`${stats.activeOrders} in progress`} 
                onClick={() => router.push("/shop/orders?status=active")} 
              /> 
 
              <PanelLink 
                icon={<CheckIcon />} 
                title="Completed" 
                value={`${stats.completedOrders} completed`} 
                onClick={() => 
                  router.push("/shop/orders?status=completed") 
                } 
              /> 
 
              <PanelLink 
                icon={<HistoryIcon />} 
                title="Order History" 
                value="View all previous orders" 
                onClick={() => 
                  router.push("/shop/orders?status=history") 
                } 
              /> 
            </div> 
          </DashboardPanel> 
 
          {/* PRODUCTS */} 
 
          <DashboardPanel 
            title="Products" 
            subtitle="Keep your catalogue up to date." 
            action="Manage" 
            onAction={() => router.push("/shop/products")} 
          > 
            <div className="grid gap-2.5 sm:grid-cols-2"> 
              <PanelLink 
                icon={<ProductIcon />} 
                title="All Products" 
                value={`${stats.products} total products`} 
                onClick={() => router.push("/shop/products")} 
              /> 
 
              <PanelLink 
                icon={<CheckIcon />} 
                title="Available" 
                value={`${stats.availableProducts} available`} 
                onClick={() => 
                  router.push("/shop/products?availability=available") 
                } 
              /> 
 
              <PanelLink 
                icon={<EyeOffIcon />} 
                title="Unavailable" 
                value={`${stats.unavailableProducts} unavailable`} 
                onClick={() => 
                  router.push( 
                    "/shop/products?availability=unavailable" 
                  ) 
                } 
              /> 
 
              <PanelLink 
                icon={<PlusIcon />} 
                title="Add Product" 
                value="Add a new item" 
                onClick={() => router.push("/shop/products/new")} 
              /> 
            </div> 
          </DashboardPanel> 
        </section> 
 
        {/* BOTTOM MANAGEMENT */} 

<section className="mt-5 grid gap-5 md:grid-cols-2">
  <MiniManagementCard
    icon={<DiscountIcon />}
    title="Discounts & Offers"
    description="Create and manage special offers for your customers."
    button="Manage Discounts"
    onClick={() => router.push("/shop/discounts")}
  />

  <MiniManagementCard
    icon={<StarIcon />}
    title="Customer Feedback"
    description="See customer feedback and keep track of your shop rating."
    button="View Reviews"
    onClick={() => router.push("/shop/reviews")}
  />
</section>
 
        {/* FOOTER */} 
 
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
      </section> 
 
      {cropImageSrc && ( 
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"> 
  <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.35)]">
      {/* HEADER */} 
 
      <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4 sm:px-6"> 
        <div> 
          <div className="text-[15px] font-black tracking-[-0.03em]"> 
            Edit Shop Image 
          </div> 
 
          <div className="mt-1 text-[9px] text-black/40"> 
            Crop or zoom your image before saving. 
          </div> 
        </div> 
 
        <button 
          type="button" 
          onClick={handleCropCancel} 
          disabled={cropSaving} 
          className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-[#fafafa] text-black/55 transition hover:bg-black/[0.04] hover:text-black disabled:opacity-50" 
          aria-label="Close image editor" 
        > 
          <CloseIcon /> 
        </button> 
      </div> 
 
      {/* CROP AREA */} 
 
      <div className="relative mx-auto h-[210px] w-[92%] overflow-hidden rounded-[14px] bg-[#111] sm:h-[270px] sm:w-[82%]">
        <Cropper 
  image={cropImageSrc} 
  crop={crop} 
  zoom={cropZoom} 
  aspect={16 / 9} 
  objectFit="contain" 
  onCropChange={setCrop} 
  onZoomChange={setCropZoom} 
  onCropComplete={handleCropComplete} 
  showGrid 
/> 
      </div> 
 
      {/* CONTROLS */} 
 
      <div className="space-y-5 border-t border-black/[0.07] bg-white px-5 py-5 sm:px-6"> 
        {/* ZOOM */} 
 
        <div> 
          <div className="mb-2 flex items-center justify-between"> 
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-black/45"> 
              Zoom 
            </span> 
 
            <span className="text-[9px] font-bold text-black/35"> 
              {cropZoom.toFixed(1)}× 
            </span> 
          </div> 
 
          <input 
            type="range" 
            min={1} 
            max={4} 
            step={0.1} 
            value={cropZoom} 
            onChange={(event) => 
              setCropZoom(Number(event.target.value)) 
            } 
            className="h-1.5 w-full cursor-pointer accent-[#159447]" 
          /> 
        </div> 
 
        {/* ACTIONS */} 
 
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end"> 
          <button 
            type="button" 
            onClick={handleCropCancel} 
            disabled={cropSaving} 
            className="rounded-[13px] border border-black/[0.08] bg-white px-5 py-3 text-[10px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black disabled:opacity-50" 
          > 
            Cancel 
          </button> 
 
          <button 
            type="button" 
            onClick={handleCropSave} 
            disabled={cropSaving || !croppedAreaPixels} 
            className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#159447] px-6 py-3 text-[10px] font-black text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c] disabled:cursor-not-allowed disabled:opacity-60" 
          > 
            {cropSaving ? ( 
              <> 
                <MiniSpinner /> 
                Saving… 
              </> 
            ) : ( 
              <> 
                <CheckIcon /> 
                Save Image 
              </> 
            )} 
          </button> 
        </div> 
      </div> 
    </div> 
  </div> 
)} 
 
    </main> 
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
 
function StatusPage({ 
  type, 
  title, 
  description, 
  primaryText, 
  onPrimary, 
  onSecondary, 
}: { 
  type: "pending" | "rejected"; 
  title: string; 
  description: string; 
  primaryText: string; 
  onPrimary: () => void; 
  onSecondary: () => void; 
}) { 
  const pending = type === "pending"; 
 
  return ( 
    <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[850px] items-center justify-center px-5 py-12 sm:px-8"> 
      <div className="w-full rounded-[30px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_25px_90px_rgba(0,0,0,.055)] sm:p-14"> 
        <div 
          className={`mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[24px] ${ 
            pending 
              ? "bg-[#fff7e8] text-[#d58a00]" 
              : "bg-[#fff0f0] text-[#d14343]" 
          }`} 
        > 
          {pending ? <ClockIcon size={32} /> : <WarningIcon size={32} />} 
        </div> 
 
        <div className="mx-auto mt-7 max-w-[560px]"> 
          <div 
            className={`text-[9px] font-black tracking-[0.18em] ${ 
              pending ? "text-[#c88400]" : "text-[#d14343]" 
            }`} 
          > 
           {pending ? "SHOP APPLICATION" : "SHOP REJECTED"} 
          </div> 
 
          <h1 className="mt-3 text-[29px] font-black leading-[1.05] tracking-[-0.05em] sm:text-[39px]"> 
            {title} 
          </h1> 
 
          <p className="mt-4 text-[12px] leading-6 text-black/45 sm:text-[13px]"> 
            {description} 
          </p> 
        </div> 
 
    <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row"> 
  {!pending && primaryText && ( 
    <button 
      type="button" 
      onClick={onPrimary} 
      className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#159447] px-6 py-3.5 text-[11px] font-black text-white shadow-[0_8px_22px_rgba(21,148,71,.16)] transition hover:bg-[#117d3c] hover:shadow-[0_10px_28px_rgba(21,148,71,.22)]" 
    > 
      <PlusIcon /> 
      {primaryText} 
    </button> 
  )} 
 
  <button 
    type="button" 
    onClick={onSecondary} 
    className="rounded-[14px] border border-black/[0.08] bg-white px-6 py-3.5 text-[11px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black" 
  > 
    Back to Home 
  </button> 
</div> 
      </div> 
    </section> 
  ); 
} 
 
function DashboardSkeleton() { 
  return ( 
    <div className="animate-pulse"> 
      <div className="h-4 w-32 rounded-full bg-black/[0.07]" /> 
 
      <div className="mt-3 h-10 w-48 rounded-xl bg-black/[0.07]" /> 
 
      <div className="mt-3 h-4 w-72 rounded-full bg-black/[0.05]" /> 
 
      <div className="mt-8 overflow-hidden rounded-[26px] bg-white"> 
        <div className="h-[220px] bg-black/[0.05]" /> 
 
        <div className="p-7"> 
          <div className="h-6 w-48 rounded-lg bg-black/[0.07]" /> 
 
          <div className="mt-3 h-3 w-80 rounded-full bg-black/[0.05]" /> 
        </div> 
      </div> 
 
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"> 
        {[1, 2, 3, 4].map((item) => ( 
          <div key={item} className="h-28 rounded-[20px] bg-white" /> 
        ))} 
      </div> 
    </div> 
  ); 
} 
 
function Feature({ 
  icon, 
  title, 
  text, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  text: string; 
}) { 
  return ( 
    <div className="flex items-start gap-3"> 
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white text-[#159447] shadow-sm"> 
        {icon} 
      </div> 
 
      <div> 
        <div className="text-[10px] font-black">{title}</div> 
 
        <div className="mt-1 text-[9px] leading-4 text-black/40"> 
          {text} 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
function StatCard({ 
  label, 
  value, 
  icon, 
  accent, 
  onClick, 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  accent: "green" | "orange" | "dark" | "blue"; 
  onClick: () => void; 
}) { 
  const styles = { 
    green: "bg-[#eef5ef] text-[#159447]", 
    orange: "bg-[#fff5e8] text-[#c57a00]", 
    dark: "bg-[#f0f1f0] text-black/70", 
    blue: "bg-[#eef3fb] text-[#4272ad]", 
  }; 
 
  return ( 
    <button 
      type="button" 
      onClick={onClick} 
      className="group rounded-[20px] border border-black/[0.07] bg-white p-4 text-left shadow-[0_12px_35px_rgba(0,0,0,.025)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(0,0,0,.055)] sm:p-5" 
    > 
      <div className="flex items-center justify-between"> 
        <div 
          className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${styles[accent]}`} 
        > 
          {icon} 
        </div> 
 
        <ChevronIcon className="text-black/20 transition group-hover:translate-x-0.5 group-hover:text-black/45" /> 
      </div> 
 
      <div className="mt-5 text-[24px] font-black tracking-[-0.04em]"> 
        {value} 
      </div> 
 
      <div className="mt-1 text-[9px] font-bold text-black/40"> 
        {label} 
      </div> 
    </button> 
  ); 
} 
 
function SectionHeading({ 
  title, 
  subtitle, 
}: { 
  title: string; 
  subtitle: string; 
}) { 
  return ( 
    <div> 
      <h2 className="text-[18px] font-black tracking-[-0.035em]"> 
        {title} 
      </h2> 
 
      <p className="mt-1 text-[10px] text-black/40">{subtitle}</p> 
    </div> 
  ); 
} 
 
function ActionCard({ 
  icon, 
  title, 
  description, 
  onClick, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  onClick: () => void; 
}) { 
  return ( 
    <button 
      type="button" 
      onClick={onClick} 
      className="group rounded-[19px] border border-black/[0.07] bg-white p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,.025)] transition hover:-translate-y-0.5 hover:border-black/[0.1] hover:shadow-[0_15px_40px_rgba(0,0,0,.05)]" 
    > 
      <div className="flex items-center justify-between"> 
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eef5ef] text-[#159447]"> 
          {icon} 
        </div> 
 
        <ChevronIcon className="text-black/20 transition group-hover:translate-x-0.5 group-hover:text-black/45" /> 
      </div> 
 
      <div className="mt-4 text-[11px] font-black">{title}</div> 
 
      <div className="mt-1 text-[9px] leading-4 text-black/40"> 
        {description} 
      </div> 
    </button> 
  ); 
} 
 
function DashboardPanel({ 
  title, 
  subtitle, 
  action, 
  onAction, 
  children, 
}: { 
  title: string; 
  subtitle: string; 
  action: string; 
  onAction: () => void; 
  children: React.ReactNode; 
}) { 
  return ( 
    <section className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,.03)] sm:p-6"> 
      <div className="flex items-start justify-between gap-4"> 
        <div> 
          <h2 className="text-[16px] font-black tracking-[-0.03em]"> 
            {title} 
          </h2> 
 
          <p className="mt-1 text-[9px] text-black/40">{subtitle}</p> 
        </div> 
 
        <button 
          type="button" 
          onClick={onAction} 
          className="shrink-0 text-[9px] font-black text-[#159447] transition hover:text-[#117d3c]" 
        > 
          {action} 
        </button> 
      </div> 
 
      <div className="mt-5">{children}</div> 
    </section> 
     ); 
 
} 
 
function PanelLink({ 
  icon, 
  title, 
  value, 
  onClick, 
  highlight = false, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  onClick: () => void; 
  highlight?: boolean; 
}) { 
  return ( 
    <button 
      type="button" 
      onClick={onClick} 
      className={`group flex items-center gap-3 rounded-[14px] border p-3 text-left transition ${ 
        highlight 
          ? "border-[#159447]/15 bg-[#f3faf5] hover:bg-[#edf7f0]" 
          : "border-black/[0.06] bg-[#fafafa] hover:bg-black/[0.02]" 
      }`} 
    > 
      <div 
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${ 
          highlight 
            ? "bg-white text-[#159447]" 
            : "bg-white text-black/55" 
        }`} 
      > 
        {icon} 
      </div> 
 
      <div className="min-w-0 flex-1"> 
        <div className="text-[10px] font-black">{title}</div> 
 
        <div className="mt-0.5 truncate text-[8.5px] text-black/40"> 
          {value} 
        </div> 
      </div> 
 
      <ChevronIcon className="shrink-0 text-black/20 transition group-hover:translate-x-0.5 group-hover:text-black/45" /> 
    </button> 
  ); 
} 
 
function MiniManagementCard({ 
  icon, 
  title, 
  description, 
  button, 
  onClick, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  button: string; 
  onClick: () => void; 
}) { 
  return ( 
    <div className="rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,.03)]"> 
      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eef5ef] text-[#159447]"> 
        {icon} 
      </div> 
 
      <h3 className="mt-4 text-[12px] font-black">{title}</h3> 
 
      <p className="mt-1.5 min-h-[38px] text-[9px] leading-4 text-black/40"> 
        {description} 
      </p> 
 
      <button 
        type="button" 
        onClick={onClick} 
        className="mt-4 text-[9px] font-black text-[#159447] hover:text-[#117d3c]" 
      > 
        {button} → 
      </button> 
    </div> 
  ); 
} 
 
function StoreIcon({ size = 19 }: { size?: number }) { 
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
      <path d="M3 10.5 5 4h14l2 6.5" /> 
      <path d="M4 10.5v8.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" /> 
      <path d="M3 10.5c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2" /> 
      <path d="M8 20v-4h8v4" /> 
    </svg> 
  ); 
} 
 
function StarIcon() { 
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
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /> 
    </svg> 
  ); 
} 
 
function StoreProfileIcon() { 
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
      <circle cx="12" cy="8" r="3" /> 
      <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" /> 
    </svg> 
  ); 
} 
 
function ShopProfileIcon() { 
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
      <path d="M4 20V9l8-5 8 5v11" /> 
      <path d="M8 20v-6h8v6" /> 
      <path d="M9 9h.01" /> 
      <path d="M15 9h.01" /> 
    </svg> 
  ); 
} 
 
function ProductIcon() { 
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
      <path d="m4 7 8-4 8 4-8 4-8-4Z" /> 
      <path d="m4 7 8 4 8-4" /> 
      <path d="M4 7v10l8 4 8-4V7" /> 
      <path d="M12 11v10" /> 
    </svg> 
  ); 
} 
 
function OrderIcon() { 
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
      <path d="M6 3h12l2 4H4l2-4Z" /> 
      <path d="M4 7h16v13H4z" /> 
      <path d="M9 11h6" /> 
      <path d="M9 15h4" /> 
    </svg> 
  ); 
} 
 
function HistoryIcon() { 
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
      <path d="M3 12a9 9 0 1 0 3-6.7" /> 
      <path d="M3 4v5h5" /> 
      <path d="M12 7v5l3 2" /> 
    </svg> 
  ); 
} 
 
function ClockIcon({ size = 18 }: { size?: number }) { 
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
      <circle cx="12" cy="12" r="9" /> 
      <path d="M12 7v5l3 2" /> 
    </svg> 
  ); 
} 
 
function CheckIcon() { 
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
      <path d="m5 12 4 4L19 6" /> 
    </svg> 
  ); 
} 
 
function EyeOffIcon() { 
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
      <path d="M3 3l18 18" /> 
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /> 
      <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.3 2-2.6 3.1" /> 
      <path d="M6.7 6.7C4.7 8.1 3.4 9.7 2.5 10c1 2 4.5 6 9.5 6 1 0 2-.2 2.9-.5" /> 
    </svg> 
  ); 
} 
 
function DiscountIcon() { 
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
      <path d="m20 13-7 7-10-10V4h6l11 9Z" /> 
      <circle cx="7.5" cy="8.5" r="1" /> 
      <path d="m12 12 4 4" /> 
      <path d="m16 12-4 4" /> 
    </svg> 
  ); 
} 
 
function ImageIcon() { 
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
      <rect x="3" y="4" width="18" height="16" rx="2" /> 
      <circle cx="8.5" cy="9" r="1.5" /> 
      <path d="m21 15-5-5L5 20" /> 
    </svg> 
  ); 
} 
 
function CloseIcon() { 
  return ( 
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    > 
      <path d="M6 6l12 12" /> 
      <path d="M18 6 6 18" /> 
    </svg> 
  ); 
} 
 
function EditIcon() { 
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
      <path d="M12 20h9" /> 
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /> 
    </svg> 
  ); 
} 
 
function SettingsIcon() { 
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
      <circle cx="12" cy="12" r="3" /> 
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.5-1H6v-2.4h.9a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.4v.8a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.8V14h-.8a1.7 1.7 0 0 0-1.5 1Z" /> 
    </svg> 
  ); 
} 
 
function PlusIcon() { 
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
      <path d="M12 5v14" /> 
      <path d="M5 12h14" /> 
    </svg> 
  ); 
} 
 
function ChevronIcon({ className = "" }: { className?: string }) { 
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
      className={className} 
    > 
      <path d="m9 18 6-6-6-6" /> 
    </svg> 
  ); 
} 
 
function WarningIcon({ size = 22 }: { size?: number }) { 
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
      <path d="M12 3 2.8 20h18.4L12 3Z" /> 
      <path d="M12 9v4" /> 
      <path d="M12 16h.01" /> 
    </svg> 
  ); 
} 
 
function MiniSpinner() { 
  return ( 
    <svg 
      width="16" 
      height="16" 
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