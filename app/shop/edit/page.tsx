"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import Cropper, { Area } from "react-easy-crop";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
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

type ShopForm = {
  storeName: string;
  description: string;
  category: string;
  ownerName: string;
  phone: string;
  address: string;
  openingTime: string;
  closingTime: string;
};

type ShopRecord = {
  id: string;
  user_id: string;
  store_name: string | null;
  description: string | null;
  category: string | null;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  opening_time: string | null;
  closing_time: string | null;
  store_image_url: string | null;
};

type ChangeRequestPayload = {
  store_name?: string;
  description?: string;
  category?: string;
  owner_name?: string;
  phone?: string;
  address?: string;
  opening_time?: string;
  closing_time?: string;
  store_image_url?: string | null;
};

type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | null;

const initialForm: ShopForm = {
  storeName: "",
  description: "",
  category: "",
  ownerName: "",
  phone: "",
  address: "",
  openingTime: "",
  closingTime: "",
};

const inputClass =
  "w-full rounded-[13px] border border-black/[0.08] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold text-black outline-none transition placeholder:text-black/25 focus:border-[#159447]/35 focus:bg-white focus:ring-4 focus:ring-[#159447]/[0.06]";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CROPPED_IMAGE_SIZE = 10 * 1024 * 1024;

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  fileName: string
): Promise<File> => {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to prepare the cropped image.");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );

  if (!blob) {
    throw new Error("Unable to create the cropped image.");
  }

  if (blob.size > CROPPED_IMAGE_SIZE) {
    throw new Error("Cropped shop image must be 10 MB or smaller.");
  }

  return new File(
    [blob],
    `${fileName.replace(/\.[^/.]+$/, "") || "shop-image"}-cropped.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    }
  );
};

export default function EditShopPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState<ShopForm>(initialForm);
  const [originalForm, setOriginalForm] =
    useState<ShopForm>(initialForm);

  const [shop, setShop] = useState<ShopRecord | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [currentImageUrl, setCurrentImageUrl] =
    useState<string | null>(null);

  const [newImageFile, setNewImageFile] =
    useState<File | null>(null);

  const [newImagePreview, setNewImagePreview] =
    useState<string | null>(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropImage, setCropImage] =
    useState<string | null>(null);

  const [cropFileName, setCropFileName] =
    useState("shop-image.jpg");

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);

  const [cropSaving, setCropSaving] = useState(false);

  const [imageUploading, setImageUploading] =
    useState(false);

  /*
   * =========================================================
   * NEW:
   * CURRENT CHANGE REQUEST STATUS
   * =========================================================
   *
   * pending  -> edit screen locked
   * approved -> normal edit screen
   * rejected -> normal edit screen
   */

  const [changeRequestStatus, setChangeRequestStatus] =
    useState<ChangeRequestStatus>(null);

  /*
   * =========================================================
   * LOAD SHOP + CHECK LATEST CHANGE REQUEST
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadShop = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !user) {
          router.replace("/");
          return;
        }

        /*
         * =====================================================
         * FIRST:
         * CHECK LATEST SHOP CHANGE REQUEST
         * =====================================================
         */

        const {
          data: latestRequest,
          error: requestError,
        } = await supabase
          .from("shop_changes_request")
          .select("status, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (!mounted) return;

        if (requestError) {
          console.error(
            "Load shop change request error:",
            requestError
          );

          /*
           * If status column/table query fails,
           * don't silently lock the user.
           *
           * Show the actual error.
           */
          setErrorMessage(
            requestError.message ||
              "We couldn't check your shop change request."
          );

          return;
        }

        /*
         * IMPORTANT:
         *
         * Only PENDING locks the screen.
         *
         * approved/rejected/null = normal edit screen.
         */

        const status =
          (latestRequest?.status as ChangeRequestStatus) ||
          null;

        setChangeRequestStatus(status);

        /*
         * =====================================================
         * LOAD APPROVED SHOP
         * =====================================================
         */

        const {
          data: shopData,
          error: shopError,
        } = await supabase
          .from("store_applications")
          .select(
            `
              id,
              user_id,
              store_name,
              description,
              category,
              owner_name,
              phone,
              address,
              opening_time,
              closing_time,
              store_image_url
            `
          )
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (!mounted) return;

        if (shopError) {
          console.error(
            "Load shop error:",
            shopError
          );

          setErrorMessage(
            shopError.message ||
              "We couldn't load your shop details. Please try again."
          );

          return;
        }

        if (!shopData) {
          setErrorMessage(
            "Your shop details could not be found."
          );

          return;
        }

        const loadedForm: ShopForm = {
          storeName: shopData.store_name || "",
          description: shopData.description || "",
          category: shopData.category || "",
          ownerName: shopData.owner_name || "",
          phone: shopData.phone || "",
          address: shopData.address || "",
          openingTime: shopData.opening_time || "",
          closingTime: shopData.closing_time || "",
        };

        if (!mounted) return;

        setShop(shopData as ShopRecord);

        setForm(loadedForm);
        setOriginalForm(loadedForm);

        setCurrentImageUrl(
          shopData.store_image_url || null
        );
      } catch (error) {
        console.error(
          "Edit shop load error:",
          error
        );

        if (!mounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't load your shop details. Please try again."
        );
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
  }, [router, supabase]);

  /*
   * =========================================================
   * CLEAN PREVIEW URL
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  /*
   * =========================================================
   * UPDATE FORM FIELD
   * =========================================================
   */

  const updateField = <K extends keyof ShopForm>(
    field: K,
    value: ShopForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  /*
   * =========================================================
   * IMAGE SELECT
   * =========================================================
   */

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );

      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage(
        "Shop image must be 10 MB or smaller."
      );

      return;
    }

    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    const imageUrl = URL.createObjectURL(file);

    setCropImage(imageUrl);
    setCropFileName(file.name);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  };

  /*
   * =========================================================
   * CROP
   * =========================================================
   */

  const onCropComplete = useCallback(
    (
      _croppedArea: Area,
      croppedPixels: Area
    ) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const handleCropCancel = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);
    setCropOpen(false);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCropConfirm = async () => {
    if (
      !cropImage ||
      !croppedAreaPixels ||
      cropSaving
    ) {
      return;
    }

    try {
      setCropSaving(true);
      setErrorMessage("");

      const croppedFile = await getCroppedImg(
        cropImage,
        croppedAreaPixels,
        cropFileName
      );

      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
      }

      const croppedPreviewUrl =
        URL.createObjectURL(croppedFile);

      setNewImageFile(croppedFile);
      setNewImagePreview(croppedPreviewUrl);

      URL.revokeObjectURL(cropImage);

      setCropImage(null);
      setCropOpen(false);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error(
        "Crop image error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to crop the shop image."
      );
    } finally {
      setCropSaving(false);
    }
  };

  /*
   * =========================================================
   * CANCEL NEW IMAGE
   * =========================================================
   */

  const handleCancelNewImage = () => {
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
    }

    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setNewImagePreview(null);
    setNewImageFile(null);

    setCropImage(null);
    setCropOpen(false);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);
    setCroppedAreaPixels(null);

    setErrorMessage("");
    setSuccessMessage("");
  };

  /*
   * =========================================================
   * VALIDATION
   * =========================================================
   */

  const validateForm = () => {
    const storeName = form.storeName.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const ownerName = form.ownerName.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();

    if (!storeName) {
      return "Please enter your shop name.";
    }

    if (storeName.length > 32) {
      return "Shop name must be 32 characters or fewer.";
    }

    if (!description) {
      return "Please enter a shop description.";
    }

    if (description.length > 160) {
      return "Description must be 160 characters or fewer.";
    }

    if (!category) {
      return "Please select a shop category.";
    }

    if (!ownerName) {
      return "Please enter the owner name.";
    }

    if (!phone) {
      return "Please enter the shop mobile number.";
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return "Please enter a valid 10-digit Indian mobile number.";
    }

    if (!address) {
      return "Please enter your shop location.";
    }

    if (!form.openingTime) {
      return "Please select the opening time.";
    }

    if (!form.closingTime) {
      return "Please select the closing time.";
    }

    return "";
  };

  /*
   * =========================================================
   * BUILD ONLY CHANGED VALUES
   * =========================================================
   */

  const buildChanges = (): ChangeRequestPayload => {
    const changes: ChangeRequestPayload = {};

    if (
      form.storeName.trim() !==
      originalForm.storeName.trim()
    ) {
      changes.store_name =
        form.storeName.trim();
    }

    if (
      form.description.trim() !==
      originalForm.description.trim()
    ) {
      changes.description =
        form.description.trim();
    }

    if (
      form.category !==
      originalForm.category
    ) {
      changes.category = form.category;
    }

    if (
      form.ownerName.trim() !==
      originalForm.ownerName.trim()
    ) {
      changes.owner_name =
        form.ownerName.trim();
    }

    if (
      form.phone.trim() !==
      originalForm.phone.trim()
    ) {
      changes.phone = form.phone.trim();
    }

    if (
      form.address.trim() !==
      originalForm.address.trim()
    ) {
      changes.address =
        form.address.trim();
    }

    if (
      form.openingTime !==
      originalForm.openingTime
    ) {
      changes.opening_time =
        form.openingTime;
    }

    if (
      form.closingTime !==
      originalForm.closingTime
    ) {
      changes.closing_time =
        form.closingTime;
    }

    return changes;
  };

  /*
   * =========================================================
   * OPEN CONFIRMATION
   * =========================================================
   *
   * EXTRA SAFETY:
   *
   * Even if the UI somehow still exists while a request
   * becomes pending, don't allow another submission.
   */

  const handleSendForReview = async () => {
    if (saving) return;

    /*
     * If already pending, NEVER allow another request.
     */

    if (changeRequestStatus === "pending") {
      setErrorMessage(
        "Your shop changes are already under review."
      );

      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const changes = buildChanges();

    const hasTextChanges =
      Object.keys(changes).length > 0;

    const hasImageChange =
      !!newImageFile;

    if (
      !hasTextChanges &&
      !hasImageChange
    ) {
      setErrorMessage(
        "You haven't made any changes to your shop."
      );

      return;
    }

    setConfirmOpen(true);
  };

  /*
   * =========================================================
   * UPLOAD IMAGE
   * =========================================================
   */

  const uploadChangeImage = async (
    userId: string,
    requestId: string,
    file: File
  ) => {
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const safeExtension =
      extension.replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";

    const filePath =
      `${userId}/${requestId}/shop-image.${safeExtension}`;

    setImageUploading(true);

    try {
      const {
        error: uploadError,
      } = await supabase.storage
        .from("changes_request")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          }
        );

      if (uploadError) {
        console.error(
          "Change image upload error:",
          uploadError
        );

        throw new Error(
          uploadError.message ||
            "Unable to upload the new shop image."
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("changes_request")
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData?.publicUrl || null;

      if (!publicUrl) {
        throw new Error(
          "Unable to create the new shop image URL."
        );
      }

      return {
        path: filePath,
        url: publicUrl,
      };
    } finally {
      setImageUploading(false);
    }
  };

  /*
   * =========================================================
   * DELETE UPLOADED IMAGE IF INSERT FAILS
   * =========================================================
   */

  const deleteChangeImage = async (
    filePath: string
  ) => {
    try {
      const { error } =
        await supabase.storage
          .from("changes_request")
          .remove([filePath]);

      if (error) {
        console.error(
          "Cleanup change image error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Cleanup change image exception:",
        error
      );
    }
  };

  /*
   * =========================================================
   * FINAL SUBMIT
   * =========================================================
   *
   * FINAL OUTPUT:
   *
   * 1. Image -> changes_request bucket
   *
   * 2. Details -> shop_changes_request
   *
   * IMPORTANT:
   *
   * status is explicitly set to pending.
   *
   * This makes the request lock the edit screen.
   */

  const handleConfirmReview = async () => {
    if (saving) return;

    /*
     * FINAL FRONTEND SAFETY CHECK
     */

    if (changeRequestStatus === "pending") {
      setConfirmOpen(false);

      setErrorMessage(
        "Your shop changes are already under review."
      );

      return;
    }

    let uploadedImagePath: string | null = null;

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      /*
       * =====================================================
       * IMPORTANT:
       *
       * CHECK DATABASE AGAIN BEFORE INSERT.
       *
       * This prevents duplicate pending requests if the user
       * has the page open in multiple tabs.
       * =====================================================
       */

      const {
        data: existingPendingRequest,
        error: pendingCheckError,
      } = await supabase
        .from("shop_changes_request")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (pendingCheckError) {
        throw new Error(
          pendingCheckError.message ||
            "Unable to verify your existing shop changes."
        );
      }

      if (existingPendingRequest) {
        setChangeRequestStatus("pending");
        setConfirmOpen(false);

        return;
      }

      const changes = buildChanges();

      const hasTextChanges =
        Object.keys(changes).length > 0;

      const hasImageChange =
        !!newImageFile;

      if (
        !hasTextChanges &&
        !hasImageChange
      ) {
        throw new Error(
          "You haven't made any changes to your shop."
        );
      }

      /*
       * =====================================================
       * CREATE REQUEST ID
       * =====================================================
       */

      const requestId =
        crypto.randomUUID();

      /*
       * =====================================================
       * IMAGE
       * =====================================================
       */

      if (newImageFile) {
        const uploadedImage =
          await uploadChangeImage(
            user.id,
            requestId,
            newImageFile
          );

        uploadedImagePath =
          uploadedImage.path;

        changes.store_image_url =
          uploadedImage.url;
      }

      /*
       * =====================================================
       * INSERT CHANGE REQUEST
       * =====================================================
       */

      const {
        error: insertError,
      } = await supabase
        .from("shop_changes_request")
        .insert({
          id: requestId,
          user_id: user.id,
          changes,
          status: "pending",
          updated_at:
            new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          "Save shop changes error:",
          insertError
        );

        if (uploadedImagePath) {
          await deleteChangeImage(
            uploadedImagePath
          );
        }

        throw new Error(
          insertError.message ||
            "Unable to save your shop changes."
        );
      }

      /*
       * =====================================================
       * SUCCESS
       * =====================================================
       *
       * DO NOT router.replace("/shop")
       *
       * Instead:
       * immediately show the review screen.
       */

      setConfirmOpen(false);

      setChangeRequestStatus("pending");

      setSuccessMessage("");

      if (newImagePreview) {
        URL.revokeObjectURL(
          newImagePreview
        );
      }

      setNewImagePreview(null);
      setNewImageFile(null);
    } catch (error) {
      console.error(
        "Save shop changes error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your shop changes. Please try again."
      );

      setConfirmOpen(false);
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <EditHeader router={router} />

        <section className="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8 sm:py-10">
          <div className="animate-pulse">
            <div className="h-3 w-28 rounded-full bg-black/[0.07]" />

            <div className="mt-3 h-9 w-52 rounded-xl bg-black/[0.07]" />

            <div className="mt-3 h-4 w-80 rounded-full bg-black/[0.05]" />

            <div className="mt-8 rounded-[24px] bg-white p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map(
                  (item) => (
                    <div key={item}>
                      <div className="h-3 w-24 rounded-full bg-black/[0.07]" />

                      <div className="mt-2 h-12 rounded-[13px] bg-black/[0.05]" />
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 h-28 rounded-[13px] bg-black/[0.05]" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * PENDING SCREEN
   * =========================================================
   *
   * THIS IS THE MAIN CHANGE.
   *
   * While pending:
   *
   * - no form
   * - no cancel
   * - no save
   * - no back
   * - no home
   *
   * User can only see that changes are under review.
   */

  if (changeRequestStatus === "pending") {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
  <EditHeader router={router} />
  <section className="flex min-h-[calc(100vh-70px)] items-center justify-center px-5 py-10">
          <div className="w-full max-w-[470px]">
            <div className="rounded-[28px] border border-black/[0.07] bg-white px-6 py-9 text-center shadow-[0_18px_60px_rgba(0,0,0,.05)] sm:px-9 sm:py-11">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef5ef] text-[#159447]">
                <ReviewIcon />
              </div>

      <div className="text-[10px] font-black text-[#159447]">
  Changes submitted
</div>


              <h1 className="mt-2 text-[24px] font-black tracking-[-0.04em] sm:text-[28px]">
                 Review in progress
              </h1>

              <p className="mx-auto mt-3 max-w-[340px] text-[11px] leading-5 text-black/45">
                Your shop changes have been
                submitted successfully and are
                currently being reviewed.
              </p>

              <div className="mt-7 rounded-[16px] border border-[#159447]/10 bg-[#f2faf4] px-4 py-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-[#159447]">
                    <ClockIcon />
                  </div>

                  <div>
                   <div className="text-[10px] font-black text-[#159447]">
  Pending approval
</div>

                    <div className="mt-1 text-[9px] leading-4 text-[#159447]/65">
                     You can update your shop again once this request has been processed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center text-[8.5px] font-semibold text-black/25">
              Apna Shyampur · Shop Management
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * NORMAL EDIT SCREEN
   * =========================================================
   *
   * Reached when:
   *
   * - no request exists
   * - latest request is approved
   * - latest request is rejected
   */

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      <EditHeader router={router} />

      <section className="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8 sm:py-10">
        {/* PAGE INTRO */}

        <div className="mb-7">
          <div className="text-[9px] font-black tracking-[0.18em] text-[#159447]">
            SHOP MANAGEMENT
          </div>

          <h1 className="mt-2 text-[31px] font-black leading-none tracking-[-0.05em] sm:text-[39px]">
            Edit Shop
          </h1>

          <p className="mt-3 max-w-[600px] text-[12px] leading-5 text-black/45 sm:text-[13px]">
            Update the information customers
            see about your shop.
          </p>
        </div>

        {/* ERROR */}

        {errorMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-[15px] border border-red-500/10 bg-red-50 px-4 py-3.5 text-red-600">
            <WarningIcon />

            <div className="min-w-0">
              <div className="text-[10px] font-black">
                Unable to continue
              </div>

              <div className="mt-0.5 text-[9px] leading-4 text-red-600/75">
                {errorMessage}
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}

        {successMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-[15px] border border-[#159447]/10 bg-[#f2faf4] px-4 py-3.5 text-[#159447]">
            <CheckCircleIcon />

            <div className="min-w-0">
              <div className="text-[10px] font-black">
                Changes submitted
              </div>

              <div className="mt-0.5 text-[9px] leading-4 text-[#159447]/75">
                {successMessage}
              </div>
            </div>
          </div>
        )}

        {/* FORM */}

        <section className="overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(0,0,0,.04)]">
          {/* FORM HEADER */}

          <div className="border-b border-black/[0.06] px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#eef5ef] text-[#159447]">
                <StoreIcon />
              </div>

              <div>
                <h2 className="text-[13px] font-black tracking-[-0.02em]">
                  Shop Information
                </h2>

                <p className="mt-1 text-[9px] text-black/40">
                  Keep your shop information
                  accurate and up to date.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            {/* SHOP IMAGE */}

            <div className="mb-6">
              <Field
                label="Shop Photo"
                helper="Maximum 10 MB"
              >
                <div className="rounded-[16px] border border-black/[0.07] bg-[#fafafa] p-3">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative aspect-video w-[220px] shrink-0 overflow-hidden rounded-[14px] border border-black/[0.07] bg-white sm:w-[260px]">
                      {newImagePreview ? (
                        <img
                          src={newImagePreview}
                          alt="New shop preview"
                          className="h-full w-full object-cover"
                        />
                      ) : currentImageUrl ? (
                        <img
                          src={currentImageUrl}
                          alt="Current shop"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-black/25">
                          <StoreIcon size={22} />
                        </div>
                      )}

                      {newImagePreview && (
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-[#159447] px-2 py-1 text-[7px] font-black text-white">
                          NEW
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black">
                        {newImagePreview
                          ? "New photo selected"
                          : "Current shop photo"}
                      </div>

                      <p className="mt-1 text-[9px] leading-4 text-black/40">
                        Select a new photo and crop
                        it before submitting your
                        shop changes.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[11px] bg-[#159447] px-4 py-2.5 text-[9px] font-black text-white transition hover:bg-[#117d3c]">
                          <ImageIcon />

                          Change Photo

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={
                              handleImageChange
                            }
                            disabled={saving}
                          />
                        </label>

                        {newImagePreview && (
                          <button
                            type="button"
                            onClick={
                              handleCancelNewImage
                            }
                            disabled={saving}
                            className="rounded-[11px] border border-black/[0.08] bg-white px-4 py-2.5 text-[9px] font-black text-black/55 transition hover:text-black disabled:opacity-50"
                          >
                            Keep Current
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Field>
            </div>

            {/* TEXT FIELDS */}

            <div className="grid gap-5 sm:grid-cols-2">
              {/* SHOP NAME */}

              <Field
                label="Shop Name"
                required
                helper={`${form.storeName.length}/32`}
              >
                <input
                  type="text"
                  value={form.storeName}
                  maxLength={32}
                  onChange={(event) =>
                    updateField(
                      "storeName",
                      event.target.value
                    )
                  }
                  placeholder="Enter your shop name"
                  className={inputClass}
                />
              </Field>

              {/* CATEGORY */}

              <Field
                label="Shop Category"
                required
              >
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value
                      )
                    }
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>

                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/35">
                    <ChevronDownIcon />
                  </div>
                </div>
              </Field>

              {/* OWNER */}

              <Field
                label="Owner Name"
                required
              >
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(event) =>
                    updateField(
                      "ownerName",
                      event.target.value
                    )
                  }
                  placeholder="Enter owner's name"
                  className={inputClass}
                />
              </Field>

              {/* PHONE */}

              <Field
                label="Mobile Number"
                required
                helper="10-digit number"
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    updateField(
                      "phone",
                      value
                    );
                  }}
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* DESCRIPTION */}

            <div className="mt-5">
              <Field
                label="Shop Description"
                required
                helper={`${form.description.length}/160`}
              >
                <textarea
                  value={form.description}
                  maxLength={160}
                  rows={5}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Tell customers about your shop..."
                  className={`${inputClass} min-h-[125px] resize-none py-3.5 leading-5`}
                />
              </Field>
            </div>

            {/* LOCATION */}

            <div className="mt-5">
              <Field
                label="Shop Location"
                required
                helper="Your customer-facing address"
              >
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-[15px] text-[#159447]">
                    <LocationIcon />
                  </div>

                  <textarea
                    value={form.address}
                    rows={3}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    placeholder="Enter your shop address or location"
                    className={`${inputClass} min-h-[90px] resize-none py-3.5 pl-11 leading-5`}
                  />
                </div>
              </Field>
            </div>

            {/* TIMINGS */}

            <div className="mt-5">
              <div className="mb-2.5 flex items-center justify-between">
                <label className="text-[10px] font-black text-black/70">
                  Shop Timing

                  <span className="ml-1 text-[#159447]">
                    *
                  </span>
                </label>

                <span className="text-[8.5px] font-bold text-black/30">
                  When customers can visit
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TimeField
                  label="Opening Time"
                  value={form.openingTime}
                  onChange={(value) =>
                    updateField(
                      "openingTime",
                      value
                    )
                  }
                />

                <TimeField
                  label="Closing Time"
                  value={form.closingTime}
                  onChange={(value) =>
                    updateField(
                      "closingTime",
                      value
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="flex flex-col-reverse gap-2.5 border-t border-black/[0.06] bg-[#fafafa] px-5 py-5 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={() =>
                router.replace("/shop")
              }
              disabled={saving}
              className="inline-flex items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-6 py-3 text-[10px] font-black text-black/60 transition hover:border-black/[0.14] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={
                handleSendForReview
              }
              disabled={
                saving ||
                imageUploading
              }
              className="inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#159447] px-7 py-3 text-[10px] font-black text-white shadow-[0_8px_22px_rgba(21,148,71,.18)] transition hover:bg-[#117d3c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ||
              imageUploading ? (
                <>
                  <MiniSpinner />
                  Saving…
                </>
              ) : (
                <>
                  <SendIcon />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </section>

        {/* NOTE */}

        <div className="mt-4 rounded-[16px] border border-black/[0.06] bg-white/60 px-4 py-3.5 text-[8.5px] leading-4 text-black/35">
          Your edited information will be
          submitted for review before it appears
          publicly on your shop.
        </div>

        <div className="pb-8 pt-8 text-center">
          <div className="text-[8.5px] font-semibold text-black/25">
            Apna Shyampur · Shop Management
          </div>
        </div>
      </section>

      {/* =====================================================
          CONFIRM MODAL
          ===================================================== */}

      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[3px]">
          <div className="w-full max-w-[410px] overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_25px_80px_rgba(0,0,0,.18)]">
            <div className="px-6 pb-5 pt-6">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eef5ef] text-[#159447]">
                <SendIcon size={19} />
              </div>

              <h3 className="mt-4 text-center text-[16px] font-black tracking-[-0.03em]">
                Save Changes?
              </h3>

              <p className="mx-auto mt-2 max-w-[310px] text-center text-[10px] leading-4 text-black/45">
                Your changes will be submitted
                for review. You won't be able to
                submit another change request
                until this one is reviewed.
              </p>

              {/* CHANGE SUMMARY */}

              <div className="mt-5 rounded-[14px] border border-black/[0.06] bg-[#fafafa] p-3.5">
                <div className="text-[8px] font-black uppercase tracking-[0.12em] text-black/35">
                  Changes in this request
                </div>

                <div className="mt-2 space-y-1.5">
                  {Object.keys(
                    buildChanges()
                  ).map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-[9px] font-semibold text-black/60"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />

                      {formatChangeName(key)}
                    </div>
                  ))}

                  {newImageFile && (
                    <div className="flex items-center gap-2 text-[9px] font-semibold text-black/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />

                      Shop Photo
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 border-t border-black/[0.06] bg-[#fafafa] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setConfirmOpen(false)
                }
                disabled={saving}
                className="flex-1 rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[10px] font-black text-black/60 transition hover:border-black/[0.15] hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleConfirmReview
                }
                disabled={saving}
                className="flex-1 rounded-[12px] bg-[#159447] px-4 py-3 text-[10px] font-black text-white transition hover:bg-[#117d3c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <MiniSpinner />
                    Saving…
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CROP MODAL
          ===================================================== */}

      {cropOpen && cropImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-5 backdrop-blur-[4px]">
          <div className="flex max-h-[94vh] w-full max-w-[840px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,.28)]">
            {/* HEADER */}

            <div className="border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#159447]">
                    Shop Photo
                  </div>

                  <h3 className="mt-1 text-[16px] font-black tracking-[-0.03em]">
                    Crop your photo
                  </h3>

                  <p className="mt-1 text-[9px] leading-4 text-black/40">
                    Move and zoom the image to
                    select the part you want.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCropCancel
                  }
                  disabled={cropSaving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-[#fafafa] text-black/45 transition hover:text-black disabled:opacity-50"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* CROP AREA */}

            <div className="relative mx-5 mt-5 aspect-video overflow-hidden rounded-[18px] bg-[#111] sm:mx-6">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onCropComplete={
                  onCropComplete
                }
                onZoomChange={setZoom}
              />
            </div>

            {/* ZOOM */}

            <div className="px-5 pt-5 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-black/55">
                  Zoom
                </span>

                <span className="text-[9px] font-bold text-black/30">
                  {zoom.toFixed(1)}×
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) =>
                  setZoom(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-2.5 w-full accent-[#159447]"
              />

              <div className="mt-1 flex justify-between text-[7px] font-bold text-black/25">
                <span>MIN</span>
                <span>MAX</span>
              </div>
            </div>

            {/* ACTIONS */}

            <div className="mt-5 flex gap-2.5 border-t border-black/[0.06] bg-[#fafafa] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={
                  handleCropCancel
                }
                disabled={cropSaving}
                className="flex-1 rounded-[12px] border border-black/[0.08] bg-white px-4 py-3 text-[10px] font-black text-black/60 transition hover:border-black/[0.15] hover:text-black disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCropConfirm
                }
                disabled={
                  cropSaving ||
                  !croppedAreaPixels
                }
                className="flex-1 rounded-[12px] bg-[#159447] px-4 py-3 text-[10px] font-black text-white transition hover:bg-[#117d3c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cropSaving ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <MiniSpinner />
                    Preparing…
                  </span>
                ) : (
                  "Crop & Use Photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * =========================================================
 * CHANGE NAME
 * =========================================================
 */

function formatChangeName(key: string) {
  const names: Record<string, string> = {
    store_name: "Shop Name",
    description: "Description",
    category: "Category",
    owner_name: "Owner Name",
    phone: "Mobile Number",
    address: "Shop Location",
    opening_time: "Opening Time",
    closing_time: "Closing Time",
    store_image_url: "Shop Photo",
  };

  return names[key] || key;
}

/*
 * =========================================================
 * HEADER
 * =========================================================
 */

function EditHeader({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* APNA SHYAMPUR */}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111] text-[9px] font-black tracking-tight text-white sm:h-9 sm:w-9 sm:text-[10px]">
            AS
          </div>

          <div className="leading-none text-left">

            <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:gap-[5px] sm:text-[18px]">
              <span className="text-[#111]">APNA</span>
              <span className="text-[#159447]">SHYAMPUR</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[7.5px] font-bold tracking-[0.12em] text-black/55 sm:mt-1.5 sm:gap-2 sm:text-[9px] sm:tracking-[0.14em]">
              <span>LOCALS</span>
              <span className="text-[#159447]">•</span>
              <span>TRUSTED</span>
              <span className="text-[#159447]">•</span>
              <span>FAST</span>
            </div>

          </div>
        </button>

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
  );
}

/*
 * =========================================================
 * FIELD
 * =========================================================
 */

function Field({
  label,
  required = false,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <label className="text-[10px] font-black text-black/70">
          {label}

          {required && (
            <span className="ml-1 text-[#159447]">
              *
            </span>
          )}
        </label>

        {helper && (
          <span className="text-[8.5px] font-bold text-black/30">
            {helper}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

/*
 * =========================================================
 * TIME FIELD
 * =========================================================
 */

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[14px] border border-black/[0.07] bg-[#fafafa] p-3.5">
      <div className="mb-2 text-[8.5px] font-black uppercase tracking-[0.1em] text-black/40">
        {label}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#159447]">
          <ClockIcon />
        </div>

        <input
          type="time"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * REVIEW ICON
 * =========================================================
 */

function ReviewIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/*
 * =========================================================
 * STORE ICON
 * =========================================================
 */

function StoreIcon({
  size = 18,
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
      <path d="M3 10.5 5 4h14l2 6.5" />

      <path d="M4 10.5v8.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" />

      <path d="M3 10.5c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2" />

      <path d="M8 20v-4h8v4" />
    </svg>
  );
}

/*
 * =========================================================
 * CLOSE ICON
 * =========================================================
 */

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

/*
 * =========================================================
 * IMAGE ICON
 * =========================================================
 */

function ImageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
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
  );
}

/*
 * =========================================================
 * LOCATION ICON
 * =========================================================
 */

function LocationIcon() {
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
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

/*
 * =========================================================
 * CLOCK ICON
 * =========================================================
 */

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

/*
 * =========================================================
 * CHEVRON
 * =========================================================
 */

function ChevronDownIcon() {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/*
 * =========================================================
 * SEND ICON
 * =========================================================
 */

function SendIcon({
  size = 15,
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />

      <path d="M22 2 11 13" />
    </svg>
  );
}

/*
 * =========================================================
 * CHECK CIRCLE
 * =========================================================
 */

function CheckCircleIcon() {
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

      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

/*
 * =========================================================
 * WARNING
 * =========================================================
 */

function WarningIcon() {
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
      className="mt-0.5 shrink-0"
    >
      <path d="M12 3 2.8 20h18.4L12 3Z" />

      <path d="M12 9v4" />

      <path d="M12 16h.01" />
    </svg>
  );
}

/*
 * =========================================================
 * MINI SPINNER
 * =========================================================
 */

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
      className="animate-spin"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}