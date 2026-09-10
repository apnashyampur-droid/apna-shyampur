"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
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
  "Gifts & Toys",
  "Clothes",
  "Footwear",
  "Cosmetics",
];

const SERVICE_CENTER = {
  lat: 30.0614,
  lng: 78.2234,
};

const SERVICE_RADIUS_KM = 2.5;

export default function AddStore() {

  const loadGoogleMaps = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.google?.maps) {
    setGoogleMapsLoaded(true);
    return;
  }

  const existingScript =
    document.getElementById(
      "google-maps-script"
    ) as HTMLScriptElement | null;

  if (existingScript) {
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    existingScript.addEventListener(
      "load",
      () => {
        setGoogleMapsLoaded(
          !!window.google?.maps
        );
      },
      { once: true }
    );

    return;
  }

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    setLocationLoading(false);

    setErrors((prev) => ({
      ...prev,
      address:
        "Google Maps is not configured. Please try again later.",
    }));

    return;
  }

  const script =
    document.createElement("script");

  script.id = "google-maps-script";

  script.src =
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=geometry`;

  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
    } else {
      setLocationLoading(false);

      setErrors((prev) => ({
        ...prev,
        address:
          "Google Maps could not be initialized. Please try again.",
      }));
    }
  };

  script.onerror = () => {
    setLocationLoading(false);

    setErrors((prev) => ({
      ...prev,
      address:
        "We couldn't load Google Maps. Please try again.",
    }));
  };

  document.head.appendChild(script);
};

const reverseGeocodeLocation = async (
  latitude: number,
  longitude: number
) => {
  const response = await fetch(
    `/api/geocode?lat=${encodeURIComponent(
      latitude
    )}&lng=${encodeURIComponent(
      longitude
    )}`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.address) {
    throw new Error(
      data?.error ||
        "Reverse geocoding failed"
    );
  }

  return data.address as string;
};

  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
 const [shopLatitude, setShopLatitude] = useState<number | null>(null);
const [shopLongitude, setShopLongitude] = useState<number | null>(null);

const [locationLoading, setLocationLoading] = useState(false);
const [locationModal, setLocationModal] = useState(false);
const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
const [mapContainer, setMapContainer] =
  useState<HTMLDivElement | null>(null);

const [selectedMapLocation, setSelectedMapLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);

const [locationCandidate, setLocationCandidate] = useState<{
  address: string;
  latitude: number;
  longitude: number;
} | null>(null);

const mapRef = useRef<google.maps.Map | null>(null);
const markerRef = useRef<google.maps.Marker | null>(null);

const mapListenersRef =
  useRef<google.maps.MapsEventListener[]>([]);

const markerListenersRef =
  useRef<google.maps.MapsEventListener[]>([]);
  const [description, setDescription] = useState("");
  const [storeImage, setStoreImage] = useState<File | null>(null);
const [storeImagePreview, setStoreImagePreview] = useState("");
const [cropModalOpen, setCropModalOpen] = useState(false);
const [cropSource, setCropSource] = useState("");
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
const [isCropping, setIsCropping] = useState(false);
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("21:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
const [storeStatus, setStoreStatus] = useState<
  "pending" | "approved" | "rejected" | null
>(null);

  const [errors, setErrors] = useState<{
  storeName?: string;
  category?: string;
  description?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  storeImage?: string;
}>({});

const isInsideServiceArea = (
  latitude: number,
  longitude: number
) => {
  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat = toRadians(
    latitude - SERVICE_CENTER.lat
  );

  const dLng = toRadians(
    longitude - SERVICE_CENTER.lng
  );

  const lat1 = toRadians(SERVICE_CENTER.lat);
  const lat2 = toRadians(latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 *
      Math.cos(lat1) *
      Math.cos(lat2);

  const distance =
    2 *
    earthRadiusKm *
    Math.asin(Math.sqrt(a));

  return distance <= SERVICE_RADIUS_KM;
};

const createCroppedImage = async (
  imageSrc: string,
  cropPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<File> => {
  const image = new Image();

  image.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");

  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create image canvas.");
  }

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9)
  );

  if (!blob) {
    throw new Error("Could not process cropped image.");
  }

  return new File(
    [blob],
    `store-${Date.now()}.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    }
  );
};

const handleCropComplete = (
  _: any,
  croppedPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
) => {
  setCroppedAreaPixels(croppedPixels);
};

const handleApplyCrop = async () => {
  if (!cropSource || !croppedAreaPixels) return;

  setIsCropping(true);

  try {
    const croppedFile = await createCroppedImage(
      cropSource,
      croppedAreaPixels
    );

    setStoreImage(croppedFile);
    setStoreImagePreview(URL.createObjectURL(croppedFile));

    setCropModalOpen(false);
    setCropSource("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    setErrors((prev) => ({
      ...prev,
      storeImage: undefined,
    }));
  } catch (error) {
    console.error("IMAGE CROP ERROR:", error);

    setErrors((prev) => ({
      ...prev,
      storeImage: "Could not process this image. Please try another photo.",
    }));
  } finally {
    setIsCropping(false);
  }
};

const handleUseCurrentLocation = () => {
  if (
    typeof navigator === "undefined" ||
    !navigator.geolocation
  ) {
    setErrors((prev) => ({
      ...prev,
      address:
        "Your browser does not support location services.",
    }));

    return;
  }

  setLocationLoading(true);

  setErrors((prev) => ({
    ...prev,
    address: undefined,
  }));

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy;

      console.log(
        "SHOP GPS LOCATION:",
        {
          latitude,
          longitude,
          accuracyMeters:
            Number(
              accuracy.toFixed(1)
            ),
        }
      );

      if (
        !isInsideServiceArea(
          latitude,
          longitude
        )
      ) {
        setLocationLoading(false);

        setErrors((prev) => ({
          ...prev,
          address:
            "Sorry, your shop is outside Apna Shyampur's delivery area yet.",
        }));

        return;
      }

      setShopLatitude(latitude);
      setShopLongitude(longitude);

      setSelectedMapLocation({
        latitude,
        longitude,
      });

      setLocationCandidate(null);

      setLocationModal(true);

      setLocationLoading(false);

      loadGoogleMaps();
    },
    (error) => {
      console.error(
        "Shop geolocation error:",
        {
          code: error.code,
          message: error.message,
        }
      );

      setLocationLoading(false);

      if (error.code === 1) {
        setErrors((prev) => ({
          ...prev,
          address:
            "Location access was denied. Please allow location access for this site and try again.",
        }));
      } else if (error.code === 2) {
        setErrors((prev) => ({
          ...prev,
          address:
            "Your device could not determine your location. Please make sure Location is turned on and try again.",
        }));
      } else if (error.code === 3) {
        setErrors((prev) => ({
          ...prev,
          address:
            "We couldn't determine your shop location in time. Please try again.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          address:
            "We couldn't access your current location. Please try again.",
        }));
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );
};

useEffect(() => {
  if (
    !locationModal ||
    !googleMapsLoaded ||
    !mapContainer ||
    !selectedMapLocation ||
    !window.google?.maps
  ) {
    return;
  }

  /*
   * IMPORTANT:
   * Never recreate the map when candidate location changes.
   */
  if (mapRef.current) {
    return;
  }

  const initialPosition =
    new google.maps.LatLng(
      selectedMapLocation.latitude,
      selectedMapLocation.longitude
    );

  const map =
    new google.maps.Map(
      mapContainer,
      {
        center: initialPosition,
        zoom: 18,

        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,

        gestureHandling: "greedy",
        clickableIcons: false,

        mapTypeId:
          google.maps.MapTypeId.ROADMAP,
      }
    );

  mapRef.current = map;

  /*
   * Service area
   */
  const serviceCircle =
    new google.maps.Circle({
      map,
      center: {
        lat: SERVICE_CENTER.lat,
        lng: SERVICE_CENTER.lng,
      },
      radius:
        SERVICE_RADIUS_KM * 1000,

      strokeColor: "#159447",
      strokeOpacity: 0.8,
      strokeWeight: 1.5,

      fillColor: "#159447",
      fillOpacity: 0.06,

      clickable: false,
    });

  /*
   * Shop pin
   */
  const marker =
    new google.maps.Marker({
      map,
      position: initialPosition,
      draggable: true,
      title: "Set exact shop location",
    });

  markerRef.current = marker;

  /*
   * Update selected shop location
   * + reverse geocode address.
   */
  const updateMarkerLocation =
    async (
      position: google.maps.LatLng
    ) => {
      const latitude =
        position.lat();

      const longitude =
        position.lng();

      console.log(
        "SHOP PIN LOCATION:",
        {
          latitude,
          longitude,
        }
      );

      if (
        !isInsideServiceArea(
          latitude,
          longitude
        )
      ) {
        setLocationCandidate(null);

        setErrors((prev) => ({
          ...prev,
          address:
            "This location is outside Apna Shyampur's delivery area. Please place your shop pin inside the green area.",
        }));

        return;
      }

      setErrors((prev) => ({
        ...prev,
        address: undefined,
      }));

      setLocationLoading(true);

      try {
        const address =
          await reverseGeocodeLocation(
            latitude,
            longitude
          );

        setLocationCandidate({
          address,
          latitude,
          longitude,
        });
      } catch (error) {
        console.error(
          "Shop pin reverse geocode error:",
          error
        );

        setLocationCandidate(null);

        setErrors((prev) => ({
          ...prev,
          address:
            "We found your shop location, but couldn't get its address. Please move the pin slightly and try again.",
        }));
      } finally {
        setLocationLoading(false);
      }
    };

  /*
   * Drag pin
   */
  markerListenersRef.current.push(
    marker.addListener(
      "dragend",
      () => {
        const position =
          marker.getPosition();

        if (!position) return;

        updateMarkerLocation(
          position
        );
      }
    )
  );

  /*
   * Click anywhere on map
   */
  mapListenersRef.current.push(
    map.addListener(
      "click",
      (
        event: google.maps.MapMouseEvent
      ) => {
        if (!event.latLng) return;

        const latitude =
          event.latLng.lat();

        const longitude =
          event.latLng.lng();

        if (
          !isInsideServiceArea(
            latitude,
            longitude
          )
        ) {
          setLocationCandidate(null);

          setErrors((prev) => ({
            ...prev,
            address:
              "This location is outside Apna Shyampur's delivery area. Please select a point inside the green area.",
          }));

          return;
        }

        marker.setPosition(
          event.latLng
        );

        updateMarkerLocation(
          event.latLng
        );
      }
    )
  );

  /*
   * Initial reverse geocoding
   */
  updateMarkerLocation(
    initialPosition
  );

  /*
   * Cleanup only when the map
   * is actually removed.
   */
  return () => {
    mapListenersRef.current.forEach(
      (listener) =>
        listener.remove()
    );

    markerListenersRef.current.forEach(
      (listener) =>
        listener.remove()
    );

    mapListenersRef.current = [];
    markerListenersRef.current = [];

    serviceCircle.setMap(null);
    marker.setMap(null);

    markerRef.current = null;
    mapRef.current = null;
  };
}, [
  locationModal,
  googleMapsLoaded,
  mapContainer,
  selectedMapLocation,
]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const trimmedStoreName = storeName.trim();
    const trimmedDescription = description.trim();

    if (!trimmedStoreName) {
      newErrors.storeName = "Store name is required";
    } else if (trimmedStoreName.length > 32) {
      newErrors.storeName = "Store name can be up to 32 characters";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (!storeImage) {
  newErrors.storeImage = "Please add a photo of your shop";
}

    if (!trimmedDescription) {
      newErrors.description = "Short description is required";
    } else if (trimmedDescription.length > 160) {
  newErrors.description =
    "Short description can be up to 160 characters";
}

    if (!ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

   if (
  !address.trim() ||
  shopLatitude === null ||
  shopLongitude === null
) {
  newErrors.address = "Please set your shop location";
}

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // User check FIRST
    if (userError || !user) {
      alert("Please sign in before submitting your shop.");
      return;
    }

  const { data: existingStore, error: existingStoreError } = await supabase
  .from("store_applications")
  .select("id, status")
  .eq("user_id", user.id)
  .limit(1)
  .maybeSingle();

    if (existingStoreError) {
      console.error(
        "EXISTING SHOP CHECK ERROR:",
        existingStoreError
      );

      alert(
        "We couldn't verify your shop status. Please try again."
      );

      return;
    }

   if (existingStore) {
  const status = String(existingStore.status || "").toLowerCase();

  if (
    status === "pending" ||
    status === "under_review" ||
    status === "review"
  ) {
    setStoreStatus("pending");
    return;
  }

  if (status === "approved" || status === "active") {
    setStoreStatus("approved");
    return;
  }

  // REJECTED APPLICATION:
  // User is allowed to submit again.
  // Do NOT show rejected popup and do NOT return.
  // The existing application will be updated below.
}

    // Image check
    if (!storeImage) {
      alert("Please add a photo of your shop.");
      return;
    }

    // File extension
  const fileExtension = "jpg";

    // Safe because user has already been checked
   const uniqueId =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const filePath = `${user.id}/${uniqueId}.${fileExtension}`;

    // Upload store image
    const { error: uploadError } = await supabase.storage
      .from("store-images")
      .upload(filePath, storeImage, {
        cacheControl: "3600",
        upsert: false,
        contentType: storeImage.type,
      });

    if (uploadError) {
      console.error("SHOP IMAGE UPLOAD ERROR:", uploadError);

      alert(
        `Shop photo upload failed:\n\n${uploadError.message}`
      );

      return;
    }

    // Get public image URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("store-images")
      .getPublicUrl(filePath);

const applicationData = {
  user_id: user.id,
  store_name: storeName.trim(),
  category,
  description: description.trim(),
  owner_name: ownerName.trim(),
  phone: phone.replace(/\s/g, ""),
  address: address.trim(),
    latitude: shopLatitude,
  longitude: shopLongitude,
  opening_time: openingTime,
  closing_time: closingTime,
  store_image_url: publicUrl,
  status: "pending",
};

let data;
let error;

if (existingStore) {
  // Re-submit previously rejected application
  const result = await supabase
    .from("store_applications")
    .update(applicationData)
    .eq("id", existingStore.id)
    .select()
    .single();

  data = result.data;
  error = result.error;
} else {
  // First-time store submission
  const result = await supabase
    .from("store_applications")
    .insert(applicationData)
    .select()
    .single();

  data = result.data;
  error = result.error;
}

    if (error) {
      console.error("STORE INSERT ERROR:", error);
      console.error("STORE INSERT ERROR MESSAGE:", error.message);
      console.error("STORE INSERT ERROR DETAILS:", error.details);
      console.error("STORE INSERT ERROR HINT:", error.hint);
      console.error("STORE INSERT ERROR CODE:", error.code);

      alert(
        `Shop submission failed:\n\n${error.message}\n\nCode: ${error.code}`
      );

      return;
    }

    console.log("SHOP APPLICATION CREATED:", data);

    alert(
      "Your shop application has been submitted successfully. We will review it shortly."
    );

    router.push("/");
  } catch (error) {
    console.error("Unexpected shop application error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      {/* HEADER */}

   {/* HEADER */}

<header className="border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
  <div className="mx-auto flex h-[70px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

    <button
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

    <button
      type="button"
      onClick={() => router.push("/")}
      className="rounded-full border border-black/[0.08] bg-white/60 px-4 py-2 text-[11px] font-bold text-black/75 transition hover:border-black/[0.14] hover:bg-white hover:text-black sm:px-5 sm:text-[12px]"
    >
      Back
    </button>

  </div>
</header>

      {/* PAGE */}

      <section className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        {/* INTRO */}

        <div className="mx-auto max-w-[760px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#159447]/15 bg-[#159447]/[0.06] px-3 py-1.5 text-[9px] font-black tracking-[0.12em] text-[#159447]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#159447]" />
            FOR LOCAL BUSINESSES
          </div>

          <h1 className="mt-5 text-[38px] font-black leading-[0.98] tracking-[-0.055em] sm:text-[52px]">
            Bring your shop
            <br />
            <span className="text-[#159447]">online with us</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[570px] text-[13px] leading-6 text-black/45 sm:text-[14px]">
           Bring your shop online and make it easier for nearby customers to order from you.
          </p>
        </div>

        {/* TRUST STRIP */}

        <div className="mx-auto mt-9 grid max-w-[850px] gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7ef] text-[#159447]">
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
                <path d="M20 11a8 8 0 1 1-2.34-5.66" />
                <path d="M20 4v7h-7" />
              </svg>
            </div>

            <div>
              <div className="text-[11px] font-black">Simple setup</div>
              <div className="mt-0.5 text-[9px] text-black/40">
                Takes only a few minutes
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7ef] text-[#159447]">
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
                <path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <div>
              <div className="text-[11px] font-black">Verified listing</div>
              <div className="mt-0.5 text-[9px] text-black/40">
                We review every shop
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7ef] text-[#159447]">
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
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10v9h14v-9" />
                <path d="M9 19v-5h6v5" />
              </svg>
            </div>

            <div>
              <div className="text-[11px] font-black">Local reach</div>
              <div className="mt-0.5 text-[9px] text-black/40">
                Reach nearby customers
              </div>
            </div>
          </div>
        </div>

        {/* FORM */}

        <div className="mx-auto mt-8 max-w-[850px] overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-[0_20px_70px_rgba(0,0,0,.05)]">
          {/* FORM HEADER */}

          <div className="border-b border-black/[0.06] px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-[9px] font-bold tracking-[0.18em] text-[#159447]">
                  SHOP DETAILS
                </div>

                <h2 className="mt-2 text-[21px] font-black tracking-[-0.04em]">
                  Tell us about your shop
                </h2>

                <p className="mt-1.5 text-[11px] leading-5 text-black/40">
                  These details will be used to create your shop listing.
                </p>
              </div>

              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0f5f0] text-[#159447] sm:flex">
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
                  <path d="M4 10.5 12 4l8 6.5" />
                  <path d="M6 9.5V20h12V9.5" />
                  <path d="M9 20v-6h6v6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-6 py-7 sm:px-8 sm:py-8">
            {/* BASIC INFO */}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-[9px] font-black text-white">
                  1
                </div>

                <h3 className="text-[13px] font-black">
                  Basic information
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* STORE NAME */}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Shop name <span className="text-[#159447]">*</span>
                  </label>

                  <input
                    value={storeName}
                    maxLength={32}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 32);

                      setStoreName(value);

                      if (errors.storeName) {
                        setErrors((prev) => ({
                          ...prev,
                          storeName: undefined,
                        }));
                      }
                    }}
                    placeholder="e.g. Rawat General Store"
                    className={`h-12 w-full rounded-[13px] border bg-[#fafbf9] px-4 text-[12px] font-medium outline-none transition placeholder:text-black/25 focus:bg-white ${
                      errors.storeName
                        ? "border-red-300 focus:border-red-400"
                        : "border-black/[0.08] focus:border-[#159447]/40"
                    }`}
                  />

                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.storeName ? (
                      <p className="text-[9px] font-semibold text-red-500">
                        {errors.storeName}
                      </p>
                    ) : (
                      <span />
                    )}

                    <span className="text-[8px] font-medium text-black/30">
                      {storeName.length}/32
                    </span>
                  </div>
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Shop category <span className="text-[#159447]">*</span>
                  </label>

                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);

                        if (errors.category) {
                          setErrors((prev) => ({
                            ...prev,
                            category: undefined,
                          }));
                        }
                      }}
                      className={`h-12 w-full appearance-none rounded-[13px] border bg-[#fafbf9] px-4 pr-10 text-[12px] font-medium outline-none transition focus:bg-white ${
                        errors.category
                          ? "border-red-300"
                          : "border-black/[0.08] focus:border-[#159447]/40"
                      } ${
                        category ? "text-black" : "text-black/30"
                      }`}
                    >
                      <option value="">Select category</option>

                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/35"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>

                  {errors.category && (
                    <p className="mt-1.5 text-[9px] font-semibold text-red-500">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Short description{"160"}
                    <span className="text-[#159447]">*</span>
                  </label>

                  <input
                    value={description}
                    maxLength={160}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 160);

                      setDescription(value);

                      if (errors.description) {
                        setErrors((prev) => ({
                          ...prev,
                          description: undefined,
                        }));
                      }
                    }}
                    placeholder="What does your shop offer?"
                    className={`h-12 w-full rounded-[13px] border bg-[#fafbf9] px-4 text-[12px] font-medium outline-none transition placeholder:text-black/25 focus:bg-white ${
                      errors.description
                        ? "border-red-300 focus:border-red-400"
                        : "border-black/[0.08] focus:border-[#159447]/40"
                    }`}
                  />

                  <div className="mt-1.5 flex items-center justify-between">
                    {errors.description ? (
                      <p className="text-[9px] font-semibold text-red-500">
                        {errors.description}
                      </p>
                    ) : (
                      <span />
                    )}

                    <span className="text-[8px] font-medium text-black/30">
                      {description.length}/160
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* OWNER INFO */}

            <div className="border-t border-black/[0.06] pt-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-[9px] font-black text-white">
                  2
                </div>

                <h3 className="text-[13px] font-black">
                  Contact information
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* OWNER */}

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Owner name{" "}
                    <span className="text-[#159447]">*</span>
                  </label>

                  <input
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);

                      if (errors.ownerName) {
                        setErrors((prev) => ({
                          ...prev,
                          ownerName: undefined,
                        }));
                      }
                    }}
                    placeholder="e.g. Mukesh Rawat"
                    className={`h-12 w-full rounded-[13px] border bg-[#fafbf9] px-4 text-[12px] font-medium outline-none transition placeholder:text-black/25 focus:bg-white ${
                      errors.ownerName
                        ? "border-red-300"
                        : "border-black/[0.08] focus:border-[#159447]/40"
                    }`}
                  />

                  {errors.ownerName && (
                    <p className="mt-1.5 text-[9px] font-semibold text-red-500">
                      {errors.ownerName}
                    </p>
                  )}
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Mobile number <span className="text-[#159447]">*</span>
                  </label>

                  <div
                    className={`flex h-12 overflow-hidden rounded-[13px] border bg-[#fafbf9] focus-within:bg-white ${
                      errors.phone
                        ? "border-red-300"
                        : "border-black/[0.08] focus-within:border-[#159447]/40"
                    }`}
                  >
                    <div className="flex items-center border-r border-black/[0.07] px-3 text-[11px] font-bold text-black/45">
                      +91
                    </div>

                    <input
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);

                        setPhone(value);

                        if (errors.phone) {
                          setErrors((prev) => ({
                            ...prev,
                            phone: undefined,
                          }));
                        }
                      }}
                      inputMode="numeric"
                      placeholder="98765 43210"
                      className="min-w-0 flex-1 bg-transparent px-3 text-[12px] font-medium outline-none placeholder:text-black/25"
                    />
                  </div>

                  {errors.phone && (
                    <p className="mt-1.5 text-[9px] font-semibold text-red-500">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

          {/* LOCATION */}

<div className="border-t border-black/[0.06] pt-8">
  <div className="mb-4 flex items-center gap-2">
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-[9px] font-black text-white">
      3
    </div>

    <h3 className="text-[13px] font-black">
      Shop location
    </h3>
  </div>

  <div
    className={`rounded-[18px] border p-4 ${
      errors.address
        ? "border-red-200 bg-red-50/30"
        : "border-black/[0.07] bg-[#fafbf9]"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ec] text-[#159447]">
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
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-black">
          Where is your shop located?
          <span className="ml-1 text-[#159447]">*</span>
        </div>

        <p className="mt-1 text-[9px] leading-4 text-black/40">
          Your shop location is required so customers can see accurate
          distance and delivery availability.
        </p>
      </div>
    </div>

   {locationCandidate ? (
  <div className="mt-4 rounded-[13px] border border-[#159447]/15 bg-white px-4 py-3">
    <div className="flex items-start gap-2.5">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-[#159447]"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <div className="min-w-0">
        <div className="text-[9px] font-black text-[#159447]">
          Exact shop location selected
        </div>

        <p className="mt-1 text-[10px] leading-4 text-black/55">
          {locationCandidate.address}
        </p>
      </div>
    </div>
  </div>
) : address ? (
  <div className="mt-4 rounded-[13px] border border-[#159447]/15 bg-white px-4 py-3">
    <div className="flex items-start gap-2.5">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-[#159447]"
      >
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>

      <div className="min-w-0">
        <div className="text-[9px] font-black text-[#159447]">
          Shop location set
        </div>

        <p className="mt-1 text-[10px] leading-4 text-black/55">
          {address}
        </p>
      </div>
    </div>
  </div>
) : (
  <div className="mt-4 rounded-[13px] border border-dashed border-black/[0.10] bg-white px-4 py-4 text-center">
    <div className="text-[10px] font-bold text-black/40">
      Shop location not set
    </div>

    <p className="mt-1 text-[8px] text-black/30">
      Stand at your shop and set the pin on its exact location.
    </p>
  </div>
)}

    <button
      type="button"
      onClick={handleUseCurrentLocation}
      disabled={locationLoading}
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#111] px-4 py-3 text-[10px] font-black text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {locationLoading ? (
        <>
          <svg
            className="h-3.5 w-3.5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              opacity=".25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          Detecting shop location...
        </>
      ) : (
        <>
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
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76 2.83-2.83" />
            <circle cx="12" cy="12" r="3" />
          </svg>

         {address
  ? "Update shop location"
  : "Set shop location"}
        </>
      )}
    </button>

    <p className="mt-1 text-[8px] text-black/30">
  Stand at your shop, set the pin exactly where your shop is,
  then confirm the location.
</p>

    {errors.address && (
      <p className="mt-2 text-[9px] font-semibold text-red-500">
        {errors.address}
      </p>
    )}
  </div>
</div>

{/* STORE IMAGE */}

<div className="border-t border-black/[0.06] pt-8">
  <div className="mb-4 flex items-center gap-2">
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-[9px] font-black text-white">
      4
    </div>

    <h3 className="text-[13px] font-black">
      Shop photo
    </h3>
  </div>

  <div
    className={`rounded-[18px] border p-4 ${
      errors.storeImage
        ? "border-red-200 bg-red-50/30"
        : "border-black/[0.07] bg-[#fafbf9]"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ec] text-[#159447]">
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
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m21 15-5-5L5 20" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-black">
          Add a photo of your shop
          <span className="ml-1 text-[#159447]">*</span>
        </div>

        <p className="mt-1 text-[9px] leading-4 text-black/40">
          Upload a clear photo of your shop so we can verify your shop
          before approval.
        </p>
      </div>
    </div>

    {storeImagePreview ? (
      <div className="mt-4">
        <div className="relative overflow-hidden rounded-[15px] border border-black/[0.07] bg-black/[0.03] aspect-[16/9] w-full">
          <img
            src={storeImagePreview}
            alt="Store preview"
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            onClick={() => {
              setStoreImage(null);
              setStoreImagePreview("");

              if (errors.storeImage) {
                setErrors((prev) => ({
                  ...prev,
                  storeImage: undefined,
                }));
              }
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition hover:bg-black"
            aria-label="Remove shop image"
          >
            <svg
              width="14"
              height="14"
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
        </div>

    
        <div className="mt-3 flex items-center justify-between gap-3">
  <div className="min-w-0">
    <p className="truncate text-[9px] font-bold text-black/60">
      {storeImage?.name}
    </p>

    <p className="mt-0.5 text-[8px] text-black/30">
      {storeImage
        ? `${(storeImage.size / (1024 * 1024)).toFixed(1)} MB`
        : ""}
    </p>
  </div>

  <div className="flex shrink-0 items-center gap-2">
    {/* EDIT / CROP CURRENT PHOTO */}

    <button
      type="button"
      onClick={() => {
        if (!storeImagePreview) return;

        setCropSource(storeImagePreview);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropModalOpen(true);
      }}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-black/60 transition hover:border-[#159447]/30 hover:bg-[#159447]/[0.05] hover:text-[#159447]"
      aria-label="Edit shop photo"
      title="Edit photo"
    >
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
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    </button>

    {/* CHANGE PHOTO */}

    <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-2 text-[9px] font-black text-black/65 transition hover:border-black/[0.14] hover:bg-black/[0.02]">
      Change photo

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (!file) return;

          if (file.size > 10 * 1024 * 1024) {
          
            setErrors((prev) => ({
  ...prev,
  storeImage: "Image must be smaller than 10 MB",
}));

            e.target.value = "";
            return;
          }

          const imageUrl = URL.createObjectURL(file);

          setCropSource(imageUrl);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCroppedAreaPixels(null);
          setCropModalOpen(true);

          setErrors((prev) => ({
  ...prev,
  storeImage: undefined,
}));

          e.target.value = "";
        }}
      />
    </label>
  </div>
</div>
      </div>
    ) : (
      <label
        className={`mt-4 flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center rounded-[15px] border border-dashed bg-white transition ${
          errors.storeImage
            ? "border-red-300 hover:border-red-400"
            : "border-black/[0.12] hover:border-[#159447]/40 hover:bg-[#fbfdfb]"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">
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
            <path d="M12 16V5" />
            <path d="m7 10 5-5 5 5" />
            <path d="M5 19h14" />
          </svg>
        </div>

        <div className="mt-3 text-[10px] font-black">
          Choose shop photo
        </div>

       <div className="mt-1 text-center text-[8px] text-black/35">
  JPG, PNG or WebP · Maximum 10 MB
</div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        onChange={(e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
  setErrors((prev) => ({
    ...prev,
    storeImage: "Image must be smaller than 10 MB",
  }));

    e.target.value = "";
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  setCropSource(imageUrl);
  setCrop({ x: 0, y: 0 });
  setZoom(1);
  setCroppedAreaPixels(null);
  setCropModalOpen(true);

  e.target.value = "";
}}
        />
      </label>
    )}

    {errors.storeImage && (
      <p className="mt-2 text-[9px] font-semibold text-red-500">
        {errors.storeImage}
      </p>
    )}
  </div>
</div>

            {/* TIMINGS */}

            <div className="border-t border-black/[0.06] pt-8">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-[9px] font-black text-white">
  5
</div>

                <h3 className="text-[13px] font-black">
                  Shop timings
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Opening time
                  </label>

                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                className="h-12 w-full rounded-[13px] border border-black/[0.08] bg-[#fafbf9] px-4 text-[12px] font-medium outline-none focus:border-[#159447]/40 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold text-black/60">
                    Closing time
                  </label>

                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
              className="h-12 w-full rounded-[13px] border border-black/[0.08] bg-[#fafbf9] px-4 text-[12px] font-medium outline-none focus:border-[#159447]/40 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* INFO NOTE */}

            <div className="rounded-[18px] border border-[#159447]/10 bg-[#f1f7f1] p-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#159447]">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>

                <div>
                  <div className="text-[10px] font-black">
                    What happens next?
                  </div>

                  <p className="mt-1 text-[9px] leading-4 text-black/45">
                    After submitting, our team will review your shop details.
                    Once approved, your shop can appear on Apna Shyampur for
                    nearby customers.
                  </p>
                </div>
              </div>
            </div>

            {/* SUBMIT */}

            <div className="border-t border-black/[0.06] pt-7">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[15px] bg-[#111] px-6 text-[12px] font-black text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity=".25"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>

                    Submitting your shop...
                  </>
                ) : (
                  <>
                    Submit shop for review

                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      <path d="M5 12h13" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-[8px] leading-4 text-black/30">
                By submitting your shop, you confirm that the information
                provided is accurate.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM */}

        <div className="mx-auto mt-7 flex max-w-[850px] items-center justify-center gap-2 text-[9px] text-black/35">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>

          Your information is handled securely.
        </div>

        {locationModal && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-[620px] overflow-hidden rounded-[26px] bg-white shadow-2xl">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 border-b border-black/[0.07] px-5 py-4">
        <div>
          <div className="text-[9px] font-black tracking-[0.16em] text-[#159447]">
            SHOP LOCATION
          </div>

          <h3 className="mt-1 text-[18px] font-black tracking-[-0.04em]">
            Set your exact shop location
          </h3>

          <p className="mt-1 text-[9px] leading-4 text-black/40">
            Drag the pin or tap anywhere on the map to place it exactly where
            your shop is located.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLocationModal(false);
            setLocationCandidate(null);
            setLocationLoading(false);
          }}
          disabled={locationLoading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-black/55 transition hover:bg-black/[0.08] hover:text-black disabled:opacity-50"
          aria-label="Close location picker"
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
      </div>

      {/* MAP */}

      <div className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-[18px] border border-black/[0.08] bg-[#f3f4f2]">

          {!googleMapsLoaded ? (
            <div className="flex aspect-[16/10] items-center justify-center">
              <div className="flex flex-col items-center">
                <svg
                  className="h-5 w-5 animate-spin text-[#159447]"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                    opacity=".2"
                  />

                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <span className="mt-2 text-[9px] font-bold text-black/40">
                  Loading map...
                </span>
              </div>
            </div>
          ) : (
            <div
              ref={setMapContainer}
              className="h-[360px] w-full sm:h-[400px]"
            />
          )}

          {/* MAP HELP */}

          <div className="pointer-events-none absolute bottom-3 left-3 right-3">
            <div className="mx-auto max-w-[420px] rounded-[13px] border border-white/60 bg-white/90 px-3 py-2.5 text-center shadow-lg backdrop-blur-md">
              <div className="text-[9px] font-black text-black/70">
                Drag the pin to your shop
              </div>

              <div className="mt-0.5 text-[8px] text-black/40">
                Green area = Apna Shyampur delivery area
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED ADDRESS */}

      <div className="px-5 pt-4">
        {locationCandidate ? (
          <div className="rounded-[15px] border border-[#159447]/15 bg-[#f1f7f1] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#159447]">
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
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="text-[9px] font-black text-[#159447]">
                  Location ready
                </div>

                <p className="mt-1 text-[9px] leading-4 text-black/50">
                  {locationCandidate.address}
                </p>
              </div>
            </div>
          </div>
        ) : locationLoading ? (
          <div className="rounded-[15px] border border-black/[0.07] bg-[#fafbf9] px-4 py-3 text-center">
            <div className="text-[9px] font-bold text-black/40">
              Finding shop address...
            </div>
          </div>
        ) : (
          <div className="rounded-[15px] border border-black/[0.07] bg-[#fafbf9] px-4 py-3 text-center">
            <div className="text-[9px] font-bold text-black/40">
              Move the pin to your exact shop location
            </div>
          </div>
        )}
      </div>

      {/* ERROR */}

      {errors.address && (
        <div className="px-5 pt-3">
          <div className="rounded-[13px] border border-red-200 bg-red-50 px-3 py-2.5 text-center">
            <p className="text-[9px] font-semibold leading-4 text-red-500">
              {errors.address}
            </p>
          </div>
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex gap-3 px-5 py-5">

        <button
          type="button"
          onClick={() => {
            setLocationModal(false);
            setLocationCandidate(null);
            setLocationLoading(false);
          }}
          disabled={locationLoading}
          className="h-12 flex-1 rounded-[13px] border border-black/[0.08] bg-white text-[10px] font-black text-black/60 transition hover:bg-black/[0.03] disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            locationLoading ||
            !locationCandidate
          }
          onClick={() => {
            if (!locationCandidate) return;

            setShopLatitude(
              locationCandidate.latitude
            );

            setShopLongitude(
              locationCandidate.longitude
            );

            setAddress(
              locationCandidate.address
            );

            setLocationModal(false);
            setLocationCandidate(null);
            setLocationLoading(false);

            setErrors((prev) => ({
              ...prev,
              address: undefined,
            }));
          }}
          className="h-12 flex-[1.5] rounded-[13px] bg-[#111] text-[10px] font-black text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {locationLoading
            ? "Finding address..."
            : "Confirm shop location"}
        </button>

      </div>
    </div>
  </div>
)}

     {storeStatus && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
    <div className="w-full max-w-[390px] overflow-hidden rounded-[26px] bg-white shadow-2xl">

      {/* ICON */}
      <div className="flex justify-center pt-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7ef] text-[#159447]">
          {storeStatus === "pending" ? (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          ) : storeStatus === "approved" ? (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 pb-6 pt-5 text-center">

        {/* PENDING */}
        {storeStatus === "pending" && (
          <>
            <div className="text-[18px] font-black tracking-[-0.04em] text-[#111]">
              Shop already under review
            </div>

            <p className="mx-auto mt-2 max-w-[305px] text-[11px] leading-5 text-black/45">
              Your shop application has already been submitted and is
              currently being reviewed by our team.
            </p>

            <div className="mt-5 rounded-[15px] border border-[#159447]/10 bg-[#f1f7f1] px-4 py-3 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#159447]">
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
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>

                <p className="text-[9px] leading-4 text-black/50">
                  You don't need to submit another application.
                  We'll let you know once your shop has been reviewed.
                </p>
              </div>
            </div>
          </>
        )}

        {/* APPROVED */}
        {storeStatus === "approved" && (
          <>
            <div className="text-[18px] font-black tracking-[-0.04em] text-[#111]">
              Store already registered
            </div>

            <p className="mx-auto mt-2 max-w-[305px] text-[11px] leading-5 text-black/45">
              You already have an approved shop on Apna Shyampur.
              Each account can have only one shop.
            </p>

            <div className="mt-5 rounded-[15px] border border-[#159447]/10 bg-[#f1f7f1] px-4 py-3 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#159447]">
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
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>

                <p className="text-[9px] leading-4 text-black/50">
                  This account can only have one shop listing.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ACTIONS */}
        <div className="mt-5 flex gap-2.5">

          <button
            type="button"
            onClick={() => setStoreStatus(null)}
            className="h-11 flex-1 rounded-[13px] border border-black/[0.08] bg-white text-[10px] font-black text-black/60 transition hover:bg-black/[0.03]"
          >
            Okay
          </button>

          {storeStatus === "approved" && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-11 flex-1 rounded-[13px] bg-[#111] text-[10px] font-black text-white transition hover:bg-[#222]"
            >
              Go to home
            </button>
          )}

          {storeStatus === "pending" && (
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-11 flex-1 rounded-[13px] bg-[#111] text-[10px] font-black text-white transition hover:bg-[#222]"
            >
              Go to home
            </button>
          )}

        </div>
      </div>
    </div>
  </div>
)}

        {cropModalOpen && cropSource && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <div className="w-full max-w-[560px] overflow-hidden rounded-[24px] bg-white shadow-2xl">
      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-black/[0.07] px-5 py-4">
        <div>
          <div className="text-[9px] font-black tracking-[0.16em] text-[#159447]">
            ADJUST PHOTO
          </div>

          <h3 className="mt-1 text-[17px] font-black tracking-[-0.04em]">
            Position your shop photo
          </h3>

          <p className="mt-1 text-[9px] text-black/40">
            Drag the photo and zoom it so your shop looks right.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCropModalOpen(false);
            setCropSource("");
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-black/55 transition hover:bg-black/[0.08] hover:text-black"
          aria-label="Close cropper"
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
      </div>

      {/* CROP AREA */}

      <div className="px-5 pt-5">
        <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden rounded-[18px] bg-black">
          <Cropper
            image={cropSource}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            objectFit="contain"
            showGrid={true}
            restrictPosition={false}
          />
        </div>

        {/* ZOOM */}

        <div className="mt-5 rounded-[15px] border border-black/[0.07] bg-[#fafbf9] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-black/55">
              Zoom
            </span>

            <span className="text-[9px] font-bold text-[#159447]">
              {zoom.toFixed(1)}×
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-3 w-full accent-[#159447]"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-[8px] text-black/35">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 12h8" />
            <path d="M12 8v8" />
            <circle cx="12" cy="12" r="9" />
          </svg>

          Drag to reposition · Use the slider to zoom
        </div>
      </div>

      {/* ACTIONS */}

      <div className="flex gap-3 px-5 py-5">
        <button
          type="button"
          onClick={() => {
            setCropModalOpen(false);
            setCropSource("");
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          }}
          disabled={isCropping}
          className="h-12 flex-1 rounded-[13px] border border-black/[0.08] bg-white text-[10px] font-black text-black/60 transition hover:bg-black/[0.03] disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleApplyCrop}
          disabled={isCropping}
          className="h-12 flex-[1.5] rounded-[13px] bg-[#111] text-[10px] font-black text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCropping ? "Processing..." : "Use this photo"}
        </button>
      </div>
    </div>
  </div>
)}
      </section>

      {/* FOOTER */}

      <footer className="border-t border-black/[0.07] bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-7 sm:px-8 lg:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em]">
              <span>APNA</span>
              <span className="text-[#159447]">SHYAMPUR</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-[7px] font-bold tracking-[0.12em] text-black/40">
              <span>LOCALS</span>
              <span className="text-[#159447]">•</span>
              <span>TRUSTED</span>
              <span className="text-[#159447]">•</span>
              <span>FAST</span>
            </div>
          </div>

          <div className="text-[10px] font-semibold text-black/45">
            © 2026{" "}
            <span className="text-black/75">PNT</span>
            <span className="text-[#159447]">VERSE</span>
          </div>
        </div>
      </footer>
    </main>
  );
}