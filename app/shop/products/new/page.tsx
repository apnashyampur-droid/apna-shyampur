"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  Suspense,
  useRef,
  useState,
} from "react";
import Cropper, { Area } from "react-easy-crop";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Grocery",
  "Vegetables",
  "Food",
  "Meat",
  "Electronics",
  "Medical",
  "Bakery",
  "Dairy",
  "Other",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

 function AddProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get("id");
  const isEditMode = Boolean(productId);

  const supabase = useMemo(() => createClient(), []);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shopId, setShopId] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
const [errors, setErrors] = useState<Record<string, string>>({});
const [cropOpen, setCropOpen] = useState(false);
const [cropImage, setCropImage] = useState<string | null>(null);
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
const [cropSaving, setCropSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

 useEffect(() => {
  let mounted = true;

  const loadShop = async () => {
    try {
      setLoading(true);
      setSubmitError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (userError || !user) {
        router.replace("/");
        return;
      }

   const { data: shop, error: shopError } = await supabase
  .from("shops")
  .select("id, category")
  .eq("user_id", user.id)
  .maybeSingle();

      if (!mounted) return;

      if (shopError) {
        console.error("Shop lookup error:", shopError);
        setSubmitError(
          "We couldn't verify your shop right now. Please try again."
        );
        return;
      }

      if (!shop) {
        setSubmitError(
          "You need an approved shop before you can manage products."
        );
        return;
      }

      setShopId(shop.id);
setCategory(shop.category ?? "");

if (!productId) {
  return;
}

      const { data: product, error: productError } = await supabase
        .from("products")
        .select(
          "id, shop_id, product_name, category, price, sale_price, description, available, image_url"
        )
        .eq("id", productId)
        .eq("shop_id", shop.id)
        .maybeSingle();

      if (!mounted) return;

      if (productError) {
        console.error("Product fetch error:", productError);
        setSubmitError(
          "We couldn't load this product right now. Please try again."
        );
        return;
      }

      if (!product) {
        setSubmitError("This product could not be found.");
        return;
      }

      setProductName(product.product_name ?? "");
      setPrice(
        product.price !== null && product.price !== undefined
          ? String(product.price)
          : ""
      );
      setSalePrice(
        product.sale_price !== null && product.sale_price !== undefined
          ? String(product.sale_price)
          : ""
      );
      setDescription(product.description ?? "");
      setAvailable(Boolean(product.available));

      // Keep existing image until user chooses a new one
      setExistingImageUrl(product.image_url ?? null);
      setImagePreview(product.image_url ?? null);
    } catch (error) {
      console.error("Product page load error:", error);

      if (mounted) {
        setSubmitError(
          "We couldn't load the product information right now. Please try again."
        );
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  loadShop();

  return () => {
    mounted = false;
  };
}, [router, supabase, productId]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  setErrors((current) => ({
    ...current,
    image: "",
  }));

  if (!file.type.startsWith("image/")) {
    setErrors((current) => ({
      ...current,
      image: "Please select a valid image file.",
    }));
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    setErrors((current) => ({
      ...current,
      image: "Image size must be 10 MB or smaller.",
    }));
    return;
  }

  const previewUrl = URL.createObjectURL(file);

  setCropImage(previewUrl);
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setCroppedAreaPixels(null);
  setCropOpen(true);
};

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleCropComplete = (
  _croppedArea: Area,
  croppedAreaPixelsValue: Area
) => {
  setCroppedAreaPixels(croppedAreaPixelsValue);
};

const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));

    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not prepare image editor.");
  }

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to crop image."));
        }
      },
      "image/jpeg",
      0.92
    );
  });
};

const handleCropSave = async () => {
  if (!cropImage || !croppedAreaPixels) return;

  try {
    setCropSaving(true);

    const croppedBlob = await createCroppedImage(
      cropImage,
      croppedAreaPixels
    );

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const croppedUrl = URL.createObjectURL(croppedBlob);

    const croppedFile = new File(
      [croppedBlob],
      `product-${crypto.randomUUID()}.jpg`,
      {
        type: "image/jpeg",
      }
    );

    setImageFile(croppedFile);
    setImagePreview(croppedUrl);

    URL.revokeObjectURL(cropImage);

    setCropImage(null);
    setCropOpen(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  } catch (error) {
    console.error("Product image crop error:", error);

    setErrors((current) => ({
      ...current,
      image: "Unable to crop this image. Please try another photo.",
    }));
  } finally {
    setCropSaving(false);
  }
};

const handleCropCancel = () => {
  if (cropImage) {
    URL.revokeObjectURL(cropImage);
  }

  setCropImage(null);
  setCropOpen(false);
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setCroppedAreaPixels(null);
};

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    const trimmedName = productName.trim();
    const trimmedDescription = description.trim();

    if (!imageFile && !isEditMode) {
  nextErrors.image = "Add a product image.";
}

    if (!trimmedName) {
      nextErrors.productName = "Product name is required.";
    } else if (trimmedName.length > 60) {
      nextErrors.productName = "Product name must be 60 characters or less.";
    }

    if (!category) {
      nextErrors.category = "Select a category.";
    }

if (!price.trim()) {
  nextErrors.price = "Enter the product price.";
} else if (
  !/^\d+(\.\d{1,2})?$/.test(price.trim()) ||
  Number(price) <= 0
) {
  nextErrors.price = "Enter a valid price.";
}

   if (salePrice.trim()) {
  if (
    !/^\d+(\.\d{1,2})?$/.test(salePrice.trim()) ||
    Number(salePrice) <= 0
  ) {
    nextErrors.salePrice = "Enter a valid sale price.";
  } else if (Number(salePrice) >= Number(price)) {
    nextErrors.salePrice =
      "Sale price must be lower than the regular price.";
  }
}
    

    if (!trimmedDescription) {
      nextErrors.description = "Add a short product description.";
    } else if (trimmedDescription.length > 280) {
      nextErrors.description =
        "Description must be 280 characters or less.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

 const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  setSubmitError("");

  if (!validate()) {
    return;
  }

  if (!shopId) {
    setSubmitError(
      "Your shop information is not ready yet. Please try again."
    );
    return;
  }

  try {
    setSaving(true);

    let imageUrl = existingImageUrl;

    if (imageFile) {
      const fileExtension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `${shopId}/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type,
        });

      if (uploadError) {
        console.error("Product image upload error:", uploadError);
        throw new Error("Failed to upload product image.");
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;

      // If this is edit mode and a new image was uploaded,
      // remove the old image only when it belongs to our bucket.
      if (isEditMode && existingImageUrl) {
        try {
          const oldUrl = new URL(existingImageUrl);
          const marker = "/storage/v1/object/public/product-images/";

          const markerIndex = oldUrl.pathname.indexOf(marker);

          if (markerIndex !== -1) {
            const oldFilePath = decodeURIComponent(
              oldUrl.pathname.slice(markerIndex + marker.length)
            );

            if (oldFilePath) {
              await supabase.storage
                .from("product-images")
                .remove([oldFilePath]);
            }
          }
        } catch (imageCleanupError) {
          console.warn(
            "Old product image cleanup failed:",
            imageCleanupError
          );
        }
      }
    }

    // EDIT MODE
    if (isEditMode && productId) {
      const { error: updateError } = await supabase
        .from("products")
        .update({
          product_name: productName.trim(),
          category,
          price: Number(price),
          sale_price: salePrice.trim() ? Number(salePrice) : null,
          description: description.trim(),
          available,
          image_url: imageUrl,
        })
        .eq("id", productId)
        .eq("shop_id", shopId);

      if (updateError) {
        console.error("Product update error:", updateError);

        // If a new image was uploaded but DB update failed,
        // remove the newly uploaded image.
        if (imageFile && imageUrl && imageUrl !== existingImageUrl) {
          try {
            const newUrl = new URL(imageUrl);
            const marker =
              "/storage/v1/object/public/product-images/";

            const markerIndex = newUrl.pathname.indexOf(marker);

            if (markerIndex !== -1) {
              const newFilePath = decodeURIComponent(
                newUrl.pathname.slice(markerIndex + marker.length)
              );

              if (newFilePath) {
                await supabase.storage
                  .from("product-images")
                  .remove([newFilePath]);
              }
            }
          } catch (cleanupError) {
            console.warn(
              "New product image cleanup failed:",
              cleanupError
            );
          }
        }

        throw new Error("Failed to update product.");
      }
    } else {
      // ADD MODE
      if (!imageUrl) {
        throw new Error("Product image is required.");
      }

      const { error: productError } = await supabase
        .from("products")
        .insert({
          shop_id: shopId,
          product_name: productName.trim(),
          category,
          price: Number(price),
          sale_price: salePrice.trim() ? Number(salePrice) : null,
          description: description.trim(),
          available,
          image_url: imageUrl,
        });

      if (productError) {
        console.error("Product insert error:", productError);

        if (imageFile && imageUrl) {
          try {
            const imageUrlObject = new URL(imageUrl);
            const marker =
              "/storage/v1/object/public/product-images/";

            const markerIndex = imageUrlObject.pathname.indexOf(marker);

            if (markerIndex !== -1) {
              const uploadedFilePath = decodeURIComponent(
                imageUrlObject.pathname.slice(
                  markerIndex + marker.length
                )
              );

              if (uploadedFilePath) {
                await supabase.storage
                  .from("product-images")
                  .remove([uploadedFilePath]);
              }
            }
          } catch (cleanupError) {
            console.warn(
              "Uploaded product image cleanup failed:",
              cleanupError
            );
          }
        }

        throw new Error("Failed to save product.");
      }
    }

    router.push("/shop/products");
  } catch (error) {
    console.error(
      isEditMode ? "Edit product error:" : "Add product error:",
      error
    );

    setSubmitError(
      isEditMode
        ? "Unable to update the product right now. Please try again."
        : "Unable to add the product right now. Please try again."
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} />

        <section className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
          <div className="animate-pulse">
            <div className="h-3 w-32 rounded-full bg-black/[0.07]" />
            <div className="mt-3 h-10 w-64 rounded-xl bg-black/[0.07]" />
            <div className="mt-3 h-4 w-80 rounded-full bg-black/[0.05]" />

            <div className="mt-8 h-[500px] rounded-[26px] bg-white" />
          </div>
        </section>
      </main>
    );
  }

  if (submitError && !shopId) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <ShopHeader router={router} />

        <section className="mx-auto flex min-h-[calc(100vh-70px)] w-full max-w-[700px] items-center justify-center px-5 py-10">
          <div className="w-full rounded-[28px] border border-black/[0.07] bg-white p-8 text-center shadow-[0_20px_70px_rgba(0,0,0,.05)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#fff4e5] text-[#c87900]">
              <WarningIcon />
            </div>

          <h1 className="mt-6 text-[24px] font-black tracking-[-0.04em]">
  {isEditMode ? "Unable to load product" : "Unable to add product"}
</h1>

            <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-5 text-black/45">
              {submitError}
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

      <section className="mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8 sm:py-10">
        {/* PAGE HEADER */}

        <div className="mb-7">
          <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]">
            PRODUCT MANAGEMENT
          </div>

       <h1 className="mt-2 text-[32px] font-black leading-none tracking-[-0.05em] sm:text-[40px]">
  {isEditMode ? "Edit Product" : "Add Product"}
</h1>

<p className="mt-3 text-[12px] text-black/45 sm:text-[13px]">
  {isEditMode
    ? "Update your product information and keep your catalogue accurate."
    : "Add a product to your shop catalogue and make it available to customers."}
</p>
</div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* IMAGE */}

          <section className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_15px_50px_rgba(0,0,0,.035)]">
            <div className="border-b border-black/[0.06] px-5 py-5 sm:px-7">
              <div className="text-[14px] font-black tracking-[-0.025em]">
                Product Image
              </div>

              <p className="mt-1 text-[9px] text-black/40">
                Use a clear photo that helps customers identify the product.
              </p>
            </div>

            <div className="p-5 sm:p-7">
              {imagePreview ? (
               <div className="relative overflow-hidden rounded-[20px] border border-black/[0.07] bg-white">
                  <div className="aspect-[16/10] w-full">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
  type="button"
  onClick={() => galleryInputRef.current?.click()}
  className="rounded-[12px] border border-black/[0.08] bg-white/95 px-4 py-2.5 text-[9px] font-black text-black shadow-sm backdrop-blur-md transition hover:bg-white"
>
  Change
</button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-[12px] border border-red-500/10 bg-white/95 px-4 py-2.5 text-[9px] font-black text-red-600 shadow-sm backdrop-blur-md transition hover:bg-red-50"
                    >
                      Remove
                    </button>
                   </div>
                </div>
            
            ) : (
  <>
    <div className="rounded-[20px] border border-dashed border-black/[0.12] bg-[#fafafa] p-7 sm:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[17px] bg-[#eef5ef] text-[#159447]">
        <ImageIcon />
      </div>

      <div className="mt-4 text-center text-[12px] font-black">
        {isEditMode ? "Add a product photo" : "Add product photo"}
      </div>

      <p className="mx-auto mt-1.5 max-w-[380px] text-center text-[9px] leading-4 text-black/40">
        Choose a photo from your gallery or take a new photo
        using your camera.
      </p>
    </div>

    <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={() => galleryInputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#159447] px-5 py-3 text-[10px] font-black text-white shadow-[0_8px_20px_rgba(21,148,71,.15)] transition hover:bg-[#117d3c]"
      >
        <GalleryIcon />
        Choose from Gallery
      </button>

      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-black/[0.08] bg-white px-5 py-3 text-[10px] font-black text-black/70 transition hover:border-black/[0.14] hover:bg-black/[0.02]"
      >
        <CameraIcon />
        Take Photo
      </button>
    </div>

    <div className="mt-4 text-center text-[8px] font-semibold text-black/25">
      JPG, PNG or WEBP · Maximum 10 MB
    </div>
  </>
)}

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />

              {errors.image && (
                <p className="mt-2 text-[9px] font-bold text-red-600">
                  {errors.image}
                </p>
              )}
          
             </div>
          </section>

          {/* BASIC INFORMATION */}

          <section className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:p-7">
            <div className="text-[14px] font-black tracking-[-0.025em]">
              Product Information
            </div>

            <p className="mt-1 text-[9px] text-black/40">
              Give customers the basic information they need.
            </p>

            <div className="mt-6 space-y-5">
              {/* NAME */}

              <Field
                label="Product Name"
                required
                error={errors.productName}
              >
                <input
                  type="text"
                  value={productName}
                  maxLength={60}
                  onChange={(event) => {
                    setProductName(event.target.value);

                    if (errors.productName) {
                      setErrors((current) => ({
                        ...current,
                        productName: "",
                      }));
                    }
                  }}
                  placeholder="e.g. Maggi Noodles"
                  className={inputClass(Boolean(errors.productName))}
                />

                <div className="mt-1.5 text-right text-[8px] font-semibold text-black/25">
                  {productName.length}/60
                </div>
              </Field>

              {/* CATEGORY */}

            {/* CATEGORY */}
<Field
  label="Category"
  required
  error={errors.category}
>
  <div
    className={`${inputClass(Boolean(errors.category))} cursor-not-allowed bg-black/[0.035] text-black/55`}
  >
    {category || "Shop category"}
  </div>

  <p className="mt-1.5 text-[8px] font-medium leading-4 text-black/30">
    Product category is automatically set from your shop category.
  </p>
</Field>

              {/* PRICE GRID */}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Regular Price"
                  required
                  error={errors.price}
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-black/40">
                      ₹
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(event) => {
                        setPrice(event.target.value);

                        if (errors.price) {
                          setErrors((current) => ({
                            ...current,
                            price: "",
                          }));
                        }
                      }}
                      placeholder="0.00"
                      className={`${inputClass(
                        Boolean(errors.price)
                      )} pl-8`}
                    />
                  </div>
                </Field>

                <Field
                  label="Sale Price"
                  optional
                  error={errors.salePrice}
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-black/40">
                      ₹
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={salePrice}
                      onChange={(event) => {
                        setSalePrice(event.target.value);

                        if (errors.salePrice) {
                          setErrors((current) => ({
                            ...current,
                            salePrice: "",
                          }));
                        }
                      }}
                      placeholder="Optional"
                      className={`${inputClass(
                        Boolean(errors.salePrice)
                      )} pl-8`}
                    />
                  </div>
                </Field>
              </div>

              {/* DESCRIPTION */}

              <Field
                label="Description"
                required
                error={errors.description}
              >
                <textarea
                  value={description}
                  maxLength={180}
                  onChange={(event) => {
                    setDescription(event.target.value);

                    if (errors.description) {
                      setErrors((current) => ({
                        ...current,
                        description: "",
                      }));
                    }
                  }}
                  placeholder="Describe the product, size, quantity or any useful details..."
                  rows={5}
                  className={`${inputClass(
                    Boolean(errors.description)
                  )} resize-none`}
                />

                <div className="mt-1.5 text-right text-[8px] font-semibold text-black/25">
                  {description.length}/180
                </div>
              </Field>
            </div>
          </section>

          {/* AVAILABILITY */}

          <section className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_15px_50px_rgba(0,0,0,.035)] sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-[14px] font-black tracking-[-0.025em]">
                  Product Availability
                </div>

                <p className="mt-1 max-w-[520px] text-[9px] leading-4 text-black/40">
                  Keep this enabled if customers can currently order or
                  purchase this product.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAvailable((current) => !current)}
                aria-label="Toggle product availability"
                aria-pressed={available}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  available ? "bg-[#159447]" : "bg-black/15"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    available ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div
              className={`mt-5 flex items-center gap-2 rounded-[13px] px-3.5 py-3 ${
                available ? "bg-[#f2faf4]" : "bg-[#f7f7f7]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  available ? "bg-[#159447]" : "bg-black/25"
                }`}
              />

              <span
                className={`text-[9px] font-black ${
                  available ? "text-[#159447]" : "text-black/45"
                }`}
              >
                {available
                  ? "Customers can see this product as available."
                  : "This product will be marked unavailable."}
              </span>
            </div>
          </section>

          {/* FORM ERROR */}

          {submitError && (
            <div className="rounded-[14px] border border-red-500/10 bg-red-50 px-4 py-3 text-[9px] font-bold leading-4 text-red-600">
              {submitError}
            </div>
          )}

          {/* ACTIONS */}


                       <div className="flex flex-col-reverse gap-2.5 pb-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/shop/products")}
              disabled={saving}
              className="rounded-[14px] border border-black/[0.08] bg-white px-6 py-3.5 text-[10px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#159447] px-7 py-3.5 text-[10px] font-black text-white shadow-[0_9px_24px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c] hover:shadow-[0_12px_28px_rgba(21,148,71,.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <MiniSpinner />
                  {isEditMode ? "Saving Changes…" : "Saving Product…"}
                </>
              ) : (
                <>
                  <CheckIcon />
                  {isEditMode ? "Save Changes" : "Add Product"}
                </>
              )}
            </button>
                    </div>
        </form>
      </section>

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
      
      {cropOpen && cropImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex h-[min(720px,92vh)] w-full max-w-[760px] flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.3)]">
            
            {/* HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/[0.07] px-5 py-4 sm:px-6">
              <div>
                <div className="text-[14px] font-black tracking-[-0.025em]">
                  Adjust Product Photo
                </div>

                <p className="mt-1 text-[9px] text-black/40">
                  Move and zoom the photo to fit your product perfectly.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCropCancel}
                disabled={cropSaving}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.025] text-[18px] font-medium text-black/50 transition hover:bg-black/[0.06] hover:text-black disabled:opacity-40"
                aria-label="Close image editor"
              >
                ×
              </button>
            </div>

            {/* CROPPER */}
            <div className="relative min-h-0 flex-1 bg-white">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 10}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                objectFit="contain"
                showGrid
              />
            </div>

            {/* CONTROLS */}
            <div className="shrink-0 border-t border-black/[0.07] bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-black/40">
                  Zoom
                </span>

                <span className="text-[10px] text-black/30">
                  −
                </span>

                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="h-1 flex-1 cursor-pointer accent-[#159447]"
                  aria-label="Zoom image"
                />

                <span className="text-[10px] text-black/30">
                  +
                </span>

                <span className="w-10 text-right text-[9px] font-bold text-black/40">
                  {zoom.toFixed(1)}×
                </span>
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
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
                  className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#159447] px-6 py-3 text-[10px] font-black text-white shadow-[0_8px_20px_rgba(21,148,71,.16)] transition hover:bg-[#117d3c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cropSaving ? (
                    <>
                      <MiniSpinner />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      Use This Photo
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

function Field({
  label,
  required = false,
  optional = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-[9px] font-black uppercase tracking-[0.1em] text-black/50">
          {label}

          {required && (
            <span className="ml-1 text-[#159447]">*</span>
          )}

          {optional && (
            <span className="ml-1.5 text-[8px] font-bold normal-case tracking-normal text-black/25">
              optional
            </span>
          )}
        </label>
      </div>

      {children}

      {error && (
        <p className="mt-1.5 text-[9px] font-bold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-[13px] border bg-[#fafafa] px-3.5 py-3 text-[11px] font-medium text-black outline-none transition placeholder:text-black/25 ${
    hasError
      ? "border-red-500/35 bg-red-50/30 focus:border-red-500/50"
      : "border-black/[0.08] focus:border-[#159447]/45 focus:bg-white"
  }`;
}

function ImageIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function GalleryIcon() {
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
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.4" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function CameraIcon() {
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
    >
      <path d="M4 7h4l1.5-2h5L16 7h4v12H4V7Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="m5 12 4 4L19 6" />
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

function MiniSpinner() {
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
      className="animate-spin"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

export default function AddProductPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
          <section className="mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
            <div className="animate-pulse">
              <div className="h-3 w-32 rounded-full bg-black/[0.07]" />
              <div className="mt-3 h-10 w-64 rounded-xl bg-black/[0.07]" />
              <div className="mt-3 h-4 w-80 rounded-full bg-black/[0.05]" />
              <div className="mt-8 h-[500px] rounded-[26px] bg-white" />
            </div>
          </section>
        </main>
      }
    >
      <AddProductPageContent />
    </Suspense>
  );
}