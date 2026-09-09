"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileData = {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
};

type EditingField =
  | "full_name"
  | "phone"
  | "address"
  | null;

type LocationCandidate = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

const supabase = createClient();

/* -------------------------------------------------------------------------- */
/* SERVICE AREA                                                               */
/* -------------------------------------------------------------------------- */

const SERVICE_CENTER = {
  lat: 30.0614,
  lng: 78.2234,
};

const SERVICE_RADIUS_KM = 2.5;

/*
 * We do not accept extremely inaccurate device readings.
 *
 * <= 100m  = excellent
 * <= 250m  = acceptable
 * > 250m   = too inaccurate for delivery verification
 *
 * NOTE:
 * This does NOT make GPS more accurate.
 * It simply prevents obviously bad/cached/network readings
 * from being saved as the user's delivery location.
 */
const MAX_ACCEPTABLE_ACCURACY_METERS = 250;

/*
 * We collect several GPS readings and keep the most accurate one.
 */
const LOCATION_SAMPLE_COUNT = 4;

/* -------------------------------------------------------------------------- */
/* DISTANCE                                                                    */
/* -------------------------------------------------------------------------- */

function distanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadius = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function isInsideServiceArea(
  lat: number,
  lng: number
) {
  const distance = distanceInKm(
    SERVICE_CENTER.lat,
    SERVICE_CENTER.lng,
    lat,
    lng
  );

  console.log(
    "SERVICE AREA DEBUG:",
    {
      latitude: lat,
      longitude: lng,
      distanceKm:
        Number(distance.toFixed(3)),
      radiusKm: SERVICE_RADIUS_KM,
      accepted:
        distance <= SERVICE_RADIUS_KM,
    }
  );

  return distance <= SERVICE_RADIUS_KM;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                   */
/* -------------------------------------------------------------------------- */

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] =
    useState<any>(null);

  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState<EditingField>(null);

  const [editValue, setEditValue] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* ------------------------------------------------------------------------ */
  /* LOCATION STATE                                                           */
  /* ------------------------------------------------------------------------ */

  const [locationModal, setLocationModal] =
    useState(false);

  const [locationMode, setLocationMode] =
    useState<"current" | null>(null);

  const [
    locationCandidate,
    setLocationCandidate,
  ] =
    useState<LocationCandidate | null>(
      null
    );

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState("");

  const [deleteLocationOpen, setDeleteLocationOpen] =
    useState(false);

  const [deletingLocation, setDeletingLocation] =
    useState(false);

  /*
   * watchPosition ID.
   *
   * This lets us properly stop GPS tracking
   * when modal closes / component unmounts.
   */
  const watchIdRef =
    useRef<number | null>(null);

  /*
   * Prevent old GPS callbacks from changing
   * a newly opened location request.
   */
  const locationRequestIdRef =
    useRef(0);

  /*
   * Best GPS reading collected during
   * the current request.
   */
  const bestPositionRef =
    useRef<{
      latitude: number;
      longitude: number;
      accuracy: number;
    } | null>(null);

  /*
   * Number of readings collected.
   */
  const locationSampleCountRef =
    useRef(0);

  /* ------------------------------------------------------------------------ */
  /* CLEANUP GPS                                                              */
  /* ------------------------------------------------------------------------ */

  const stopLocationWatch = () => {
    if (
      watchIdRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;

      console.log(
        "GPS WATCH STOPPED"
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* LOAD PROFILE                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const {
          data: {
            user: currentUser,
          },
        } =
          await supabase.auth.getUser();

        if (!mounted) return;

        if (!currentUser) {
          router.replace("/signin");
          return;
        }

        setUser(currentUser);

        const {
          data: profileData,
          error,
        } = await supabase
          .from("profiles")
          .select(
            `
              full_name,
              avatar_url,
              phone,
              address,
              latitude,
              longitude,
              location_updated_at
            `
          )
          .eq(
            "id",
            currentUser.id
          )
          .maybeSingle();

        if (error) {
          console.error(
            "PROFILE FETCH ERROR:",
            error
          );
        }

        if (!mounted) return;

        setProfile({
          full_name:
            profileData?.full_name ??
            currentUser.user_metadata
              ?.full_name ??
            currentUser.user_metadata
              ?.name ??
            "",

          avatar_url:
            profileData?.avatar_url ??
            null,

          phone:
            profileData?.phone ??
            "",

          address:
            profileData?.address ??
            "",

          latitude:
            profileData?.latitude ??
            null,

          longitude:
            profileData?.longitude ??
            null,

          location_updated_at:
            profileData?.location_updated_at ??
            null,
        });

        setLoading(false);
      } catch (error) {
        console.error(
          "LOAD PROFILE ERROR:",
          error
        );

        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session?.user) {
            router.replace("/signin");
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();

      stopLocationWatch();
    };
  }, [router]);

  /* ------------------------------------------------------------------------ */
  /* EDITING                                                                  */
  /* ------------------------------------------------------------------------ */

  const startEditing = (
    field: EditingField
  ) => {
    if (!profile || !field) {
      return;
    }

    if (field === "address") {
      openLocationPicker();
      return;
    }

    setEditing(field);

    setEditValue(
      profile[field] ?? ""
    );
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValue("");
  };

  /* ------------------------------------------------------------------------ */
  /* SAVE NAME / PHONE                                                        */
  /* ------------------------------------------------------------------------ */

  const saveField = async (
    field: "full_name" | "phone"
  ) => {
    if (!user || !profile) {
      return;
    }

    const value =
      editValue.trim();

    if (!value) {
      return;
    }

    if (
      field === "phone" &&
      value.replace(/\D/g, "").length !== 10
    ) {
      return;
    }

    setSaving(true);

    try {
      console.log(
        "SAVING PROFILE FIELD:",
        {
          userId: user.id,
          field,
          value,
        }
      );

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            [field]: value,
          })
          .eq("id", user.id)
          .select(
            `
              full_name,
              avatar_url,
              phone,
              address,
              latitude,
              longitude,
              location_updated_at
            `
          )
          .maybeSingle();

      if (error) {
        console.error(
          "PROFILE UPDATE ERROR:",
          error
        );

        setSaving(false);
        return;
      }

      /*
       * VERY IMPORTANT:
       *
       * If Supabase returns no row, the update did not
       * actually update a profile row.
       */
      if (!data) {
        console.error(
          "PROFILE UPDATE RETURNED NO ROW."
        );

        setSaving(false);
        return;
      }

      console.log(
        "PROFILE FIELD SAVED:",
        data
      );

      setProfile({
        full_name:
          data.full_name ?? "",

        avatar_url:
          data.avatar_url ?? null,

        phone:
          data.phone ?? "",

        address:
          data.address ?? "",

        latitude:
          data.latitude ?? null,

        longitude:
          data.longitude ?? null,

        location_updated_at:
          data.location_updated_at ??
          null,
      });

      setEditing(null);
      setEditValue("");
    } catch (error) {
      console.error(
        "PROFILE SAVE EXCEPTION:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* OPEN LOCATION PICKER                                                     */
  /* ------------------------------------------------------------------------ */

  const openLocationPicker = () => {
    /*
     * Stop any previous GPS request first.
     */
    stopLocationWatch();

    /*
     * Increment request ID so old callbacks become invalid.
     */
    locationRequestIdRef.current += 1;

    setLocationMode("current");
    setLocationModal(true);
    setLocationError("");
    setLocationCandidate(null);

    bestPositionRef.current = null;
    locationSampleCountRef.current = 0;

    getCurrentLocation();
  };

  /* ------------------------------------------------------------------------ */
  /* CURRENT LOCATION                                                         */
  /* ------------------------------------------------------------------------ */

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationLoading(false);

      setLocationError(
        "Your browser does not support location services."
      );

      return;
    }

    const requestId =
      locationRequestIdRef.current;

    setLocationLoading(true);
    setLocationError("");
    setLocationCandidate(null);

    bestPositionRef.current = null;
    locationSampleCountRef.current = 0;

    console.log(
      "================================================"
    );

    console.log(
      "STARTING FRESH GPS LOCATION REQUEST"
    );

    console.log(
      "REQUEST ID:",
      requestId
    );

    console.log(
      "MAX ACCEPTABLE ACCURACY:",
      MAX_ACCEPTABLE_ACCURACY_METERS,
      "meters"
    );

    console.log(
      "================================================"
    );

    /* ---------------------------------------------------------------------- */
    /* FINALIZE LOCATION                                                      */
    /* ---------------------------------------------------------------------- */

    const finishWithLocation = async (
      latitude: number,
      longitude: number,
      accuracy: number
    ) => {
      if (
        requestId !==
        locationRequestIdRef.current
      ) {
        console.log(
          "IGNORING OLD LOCATION REQUEST"
        );

        return;
      }

      stopLocationWatch();

      console.log(
        "FINAL GPS READING:",
        {
          latitude,
          longitude,
          accuracyMeters: accuracy,
        }
      );

      /*
       * Accuracy protection.
       *
       * If device only gives us a 500m estimate,
       * do not pretend that it is exact.
       */
      if (
        accuracy >
        MAX_ACCEPTABLE_ACCURACY_METERS
      ) {
        setLocationLoading(false);

        setLocationError(
          `Your phone found a location, but the accuracy is too low (${Math.round(
            accuracy
          )}m). Please turn on your phone's Location/GPS and try again, preferably outdoors or near a window.`
        );

        return;
      }

      /*
       * Service area check BEFORE reverse geocoding.
       */
      if (
        !isInsideServiceArea(
          latitude,
          longitude
        )
      ) {
        setLocationLoading(false);

        setLocationError(
          "Sorry, Apna Shyampur is not available at your current location yet."
        );

        return;
      }

      try {
        console.log(
          "REVERSE GEOCODING:",
          {
            latitude,
            longitude,
            accuracy,
          }
        );

        const response =
          await fetch(
            `/api/geocode?lat=${encodeURIComponent(
              latitude
            )}&lng=${encodeURIComponent(
              longitude
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        console.log(
          "REVERSE GEOCODING RESPONSE:",
          {
            ok: response.ok,
            status: response.status,
            data,
          }
        );

        if (
          !response.ok ||
          !data?.address
        ) {
          setLocationLoading(false);

          setLocationError(
            "We found your location, but couldn't get the address. Please try again."
          );

          return;
        }

        const address =
          String(
            data.address
          ).trim();

        if (!address) {
          setLocationLoading(false);

          setLocationError(
            "We found your location, but couldn't get the address. Please try again."
          );

          return;
        }

        setLocationCandidate({
          address,
          latitude,
          longitude,
          accuracy,
        });

        setLocationLoading(false);
        setLocationError("");

        console.log(
          "LOCATION READY:",
          {
            address,
            latitude,
            longitude,
            accuracyMeters:
              accuracy,
          }
        );
      } catch (error) {
        console.error(
          "REVERSE GEOCODING ERROR:",
          error
        );

        setLocationLoading(false);

        setLocationError(
          "We found your location, but couldn't get its address. Please try again."
        );
      }
    };

    /* ---------------------------------------------------------------------- */
    /* WATCH POSITION                                                         */
    /* ---------------------------------------------------------------------- */

    watchIdRef.current =
      navigator.geolocation.watchPosition(
        (position) => {
          if (
            requestId !==
            locationRequestIdRef.current
          ) {
            return;
          }

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const accuracy =
            position.coords.accuracy;

          locationSampleCountRef.current += 1;

          console.log(
            "GPS READING:",
            {
              sample:
                locationSampleCountRef.current,

              latitude,

              longitude,

              accuracyMeters:
                accuracy,

              altitude:
                position.coords
                  .altitude,

              heading:
                position.coords
                  .heading,

              speed:
                position.coords.speed,

              timestamp:
                new Date(
                  position.timestamp
                ).toISOString(),
            }
          );

          /*
           * Keep the BEST accuracy reading.
           *
           * Smaller accuracy number = better.
           */
          if (
            !bestPositionRef.current ||
            accuracy <
              bestPositionRef.current
                .accuracy
          ) {
            bestPositionRef.current = {
              latitude,
              longitude,
              accuracy,
            };

            console.log(
              "NEW BEST GPS READING:",
              bestPositionRef.current
            );
          }

          /*
           * If we get a really good reading,
           * we don't need to wait for every sample.
           *
           * <= 50m is excellent for delivery.
           */
          if (
            accuracy <= 50
          ) {
            console.log(
              "EXCELLENT GPS ACCURACY. FINALIZING."
            );

            finishWithLocation(
              latitude,
              longitude,
              accuracy
            );

            return;
          }

          /*
           * After several readings, use the best one.
           */
          if (
            locationSampleCountRef.current >=
            LOCATION_SAMPLE_COUNT
          ) {
            const best =
              bestPositionRef.current;

            if (!best) {
              setLocationLoading(
                false
              );

              setLocationError(
                "We couldn't determine your current location. Please try again."
              );

              stopLocationWatch();

              return;
            }

            console.log(
              "ENOUGH GPS SAMPLES. USING BEST:",
              best
            );

            finishWithLocation(
              best.latitude,
              best.longitude,
              best.accuracy
            );
          }
        },

        (error) => {
          if (
            requestId !==
            locationRequestIdRef.current
          ) {
            return;
          }

          console.error(
            "GPS ERROR:",
            {
              code: error.code,
              message:
                error.message,
            }
          );

          stopLocationWatch();

          setLocationLoading(false);

          if (
            error.code === 1
          ) {
            setLocationError(
              "Location access was denied. Please allow location access for this site in your browser settings and try again."
            );

            return;
          }

          if (
            error.code === 2
          ) {
            setLocationError(
              "Your phone couldn't determine your location. Please turn on Location/GPS and try again. For the best result, try outdoors or near a window."
            );

            return;
          }

          if (
            error.code === 3
          ) {
            setLocationError(
              "Location detection timed out. Please keep Location/GPS turned on and try again."
            );

            return;
          }

          setLocationError(
            "We couldn't access your current location. Please try again."
          );
        },

        {
          /*
           * IMPORTANT:
           *
           * true means ask the device for its most accurate
           * available location.
           */
          enableHighAccuracy: true,

          /*
           * Do NOT allow stale cached coordinates.
           */
          maximumAge: 0,

          /*
           * Give the phone enough time to acquire GPS.
           */
          timeout: 60000,
        }
      );
  };

  /* ------------------------------------------------------------------------ */
  /* SAVE LOCATION                                                            */
  /* ------------------------------------------------------------------------ */

  const saveLocation = async () => {
    if (
      !user ||
      !locationCandidate ||
      !locationCandidate.address.trim() ||
      locationCandidate.latitude === null ||
      locationCandidate.longitude === null
    ) {
      return;
    }

    const {
      latitude,
      longitude,
      address,
      accuracy,
    } = locationCandidate;

    /*
     * Final accuracy check.
     */
    if (
      accuracy !== null &&
      accuracy >
        MAX_ACCEPTABLE_ACCURACY_METERS
    ) {
      setLocationError(
        `This location is not accurate enough to save (${Math.round(
          accuracy
        )}m accuracy). Please try again with GPS/Location turned on.`
      );

      return;
    }

    /*
     * Final service area check.
     */
    if (
      !isInsideServiceArea(
        latitude,
        longitude
      )
    ) {
      setLocationError(
        "Sorry, Apna Shyampur is not available at your current location yet."
      );

      return;
    }

    setLocationLoading(true);
    setLocationError("");

    const updatedAt =
      new Date().toISOString();

    console.log(
      "================================================"
    );

    console.log(
      "SAVING LOCATION TO SUPABASE"
    );

    console.log({
      userId: user.id,
      address:
        address.trim(),
      latitude,
      longitude,
      accuracyMeters:
        accuracy,
      location_updated_at:
        updatedAt,
    });

    console.log(
      "================================================"
    );

    try {
      /*
       * SELECT AFTER UPDATE IS VERY IMPORTANT.
       *
       * Earlier code only checked `error`.
       * Supabase can return no error even when
       * no profile row was actually changed.
       */
      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            address:
              address.trim(),

            latitude,

            longitude,

            location_updated_at:
              updatedAt,
          })
          .eq("id", user.id)
          .select(
            `
              full_name,
              avatar_url,
              phone,
              address,
              latitude,
              longitude,
              location_updated_at
            `
          )
          .maybeSingle();

      if (error) {
        console.error(
          "LOCATION SAVE ERROR:",
          error
        );

        setLocationLoading(false);

        setLocationError(
          "We couldn't save your location. Please try again."
        );

        return;
      }

      /*
       * If no row comes back, don't pretend
       * that the location was saved.
       */
      if (!data) {
        console.error(
          "LOCATION UPDATE RETURNED NO PROFILE ROW."
        );

        setLocationLoading(false);

        setLocationError(
          "Your location could not be saved to your profile. Please try again."
        );

        return;
      }

      console.log(
        "LOCATION SAVED + VERIFIED:",
        data
      );

      /*
       * Replace local profile with the ACTUAL
       * database response.
       *
       * This also protects phone/name from
       * accidentally disappearing locally.
       */
      setProfile({
        full_name:
          data.full_name ??
          profile?.full_name ??
          "",

        avatar_url:
          data.avatar_url ??
          profile?.avatar_url ??
          null,

        phone:
          data.phone ??
          profile?.phone ??
          "",

        address:
          data.address ??
          null,

        latitude:
          data.latitude ??
          null,

        longitude:
          data.longitude ??
          null,

        location_updated_at:
          data.location_updated_at ??
          null,
      });

      setLocationLoading(false);
      setLocationModal(false);
      setLocationCandidate(null);
      setLocationMode(null);
      setLocationError("");

      console.log(
        "LOCATION FLOW COMPLETED SUCCESSFULLY"
      );
    } catch (error) {
      console.error(
        "LOCATION SAVE EXCEPTION:",
        error
      );

      setLocationLoading(false);

      setLocationError(
        "We couldn't save your location. Please try again."
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* DELETE LOCATION                                                          */
  /* ------------------------------------------------------------------------ */

  const deleteLocation = async () => {
    if (
      !user ||
      !profile?.address
    ) {
      return;
    }

    setDeletingLocation(true);

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            address: null,
            latitude: null,
            longitude: null,
            location_updated_at:
              null,
          })
          .eq("id", user.id)
          .select(
            `
              full_name,
              avatar_url,
              phone,
              address,
              latitude,
              longitude,
              location_updated_at
            `
          )
          .maybeSingle();

      if (error) {
        console.error(
          "LOCATION DELETE ERROR:",
          error
        );

        setDeletingLocation(false);
        return;
      }

      if (!data) {
        console.error(
          "LOCATION DELETE RETURNED NO PROFILE ROW."
        );

        setDeletingLocation(false);
        return;
      }

      setProfile({
        full_name:
          data.full_name ?? "",

        avatar_url:
          data.avatar_url ?? null,

        phone:
          data.phone ?? "",

        address:
          data.address ?? null,

        latitude:
          data.latitude ?? null,

        longitude:
          data.longitude ?? null,

        location_updated_at:
          data.location_updated_at ??
          null,
      });

      setDeletingLocation(false);
      setDeleteLocationOpen(false);
    } catch (error) {
      console.error(
        "LOCATION DELETE EXCEPTION:",
        error
      );

      setDeletingLocation(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CLOSE LOCATION MODAL                                                     */
  /* ------------------------------------------------------------------------ */

  const closeLocationModal = () => {
    stopLocationWatch();

    locationRequestIdRef.current += 1;

    setLocationModal(false);
    setLocationMode(null);
    setLocationCandidate(null);
    setLocationError("");
    setLocationLoading(false);

    bestPositionRef.current = null;
    locationSampleCountRef.current = 0;
  };

  /* ------------------------------------------------------------------------ */
  /* DISPLAY DATA                                                             */
  /* ------------------------------------------------------------------------ */

  const displayName =
    profile?.full_name ||
    user?.user_metadata
      ?.full_name ||
    user?.user_metadata
      ?.name ||
    "Your Name";

  const email =
    user?.email || "";

  const hasCustomProfileName =
    !!profile?.full_name?.trim();

  const avatar =
    hasCustomProfileName
      ? null
      : user?.user_metadata
          ?.avatar_url ||
        user?.user_metadata
          ?.picture ||
        null;

  const initials =
    (profile?.full_name ||
      "U")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .toUpperCase();

  /* ------------------------------------------------------------------------ */
  /* LOADING SCREEN                                                           */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
        <header className="border-b border-black/[0.06] bg-[#f5f6f4]">
          <div className="mx-auto flex h-[70px] max-w-[1100px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[10px] font-black text-white">
                AS
              </div>

              <div className="leading-none">
                <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                  <span>
                    APNA
                  </span>

                  <span className="text-[#159447]">
                    SHYAMPUR
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[7px] font-bold tracking-[0.12em] text-black/45 sm:text-[8px]">
                  <span>
                    LOCALS
                  </span>

                  <span className="text-[#159447]">
                    •
                  </span>

                  <span>
                    TRUSTED
                  </span>

                  <span className="text-[#159447]">
                    •
                  </span>

                  <span>
                    FAST
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-black/10 border-t-[#159447]" />
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* MAIN                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#f5f6f4] text-[#111]">
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f5f6f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1100px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111] text-[10px] font-black tracking-tight text-white">
              AS
            </div>

            <div className="leading-none">
              <div className="flex items-baseline gap-[4px] text-[15px] font-black tracking-[-0.05em] sm:text-[18px]">
                <span>
                  APNA
                </span>

                <span className="text-[#159447]">
                  SHYAMPUR
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-[7px] font-bold tracking-[0.12em] text-black/45 sm:text-[8px]">
                <span>
                  LOCALS
                </span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>
                  TRUSTED
                </span>

                <span className="text-[#159447]">
                  •
                </span>

                <span>
                  FAST
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-[10px] font-bold text-black/65 transition hover:border-black/20 hover:text-black sm:text-[11px]"
          >
            Back
          </button>
        </div>
      </header>

      {/* PROFILE */}

      <section className="mx-auto max-w-[760px] px-5 py-10 sm:px-8 sm:py-14">
        {/* INTRO */}

        <div className="text-center">
          <div className="mx-auto flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[#111] text-[24px] font-black text-white shadow-[0_12px_35px_rgba(0,0,0,.10)]">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <h1 className="mt-5 text-[30px] font-black tracking-[-0.05em] sm:text-[36px]">
            {displayName}
          </h1>

          <p className="mt-2 text-[12px] text-black/40 sm:text-[13px]">
            {email}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#159447]/15 bg-[#159447]/[0.07] px-3 py-1.5 text-[9px] font-bold text-[#159447]">
            <span className="text-[7px]">
              ●
            </span>

            Google account connected
          </div>

          <p className="mx-auto mt-5 max-w-[390px] text-[11px] leading-5 text-black/40 sm:text-[12px]">
            Your details, your local shopping experience.
          </p>
        </div>

        {/* DETAILS CARD */}

        <div className="mt-10 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(0,0,0,.045)]">
          {/* NAME */}

          <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f1f5f1] text-[#159447]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    cx="12"
                    cy="8"
                    r="3.5"
                  />

                  <path d="M5 20c.8-3.8 3.1-5.8 7-5.8s6.2 2 7 5.8" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/35">
                    Full name
                  </div>

                  {editing !==
                    "full_name" && (
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          "full_name"
                        )
                      }
                      aria-label="Edit full name"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/35 transition hover:bg-black/[0.05] hover:text-black"
                    >
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
                    </button>
                  )}
                </div>

                {editing ===
                "full_name" ? (
                  <div className="mt-2">
                    <input
                      autoFocus
                      value={editValue}
                      maxLength={16}
                      onChange={(e) =>
                        setEditValue(
                          e.target.value.slice(
                            0,
                            16
                          )
                        )
                      }
                      className="h-11 w-full rounded-[12px] border border-black/10 bg-[#fafafa] px-3 text-[13px] font-semibold outline-none transition focus:border-[#159447]/40 focus:bg-white"
                      placeholder="Enter your full name"
                    />

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          cancelEditing
                        }
                        disabled={saving}
                        className="rounded-full border border-black/10 px-3.5 py-2 text-[10px] font-bold text-black/55 transition hover:bg-black/[0.03] disabled:opacity-40"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveField(
                            "full_name"
                          )
                        }
                        disabled={
                          saving ||
                          !editValue.trim()
                        }
                        className="rounded-full bg-[#159447] px-4 py-2 text-[10px] font-bold text-white transition hover:bg-[#0f7d3b] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 text-[13px] font-bold">
                    {profile?.full_name ||
                      "Add your name"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* EMAIL */}

          <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f1f5f1] text-[#159447]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2.5"
                  />

                  <path d="m4 7 8 6 8-6" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Email address
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="break-all text-[13px] font-bold">
                    {email}
                  </span>

                  <span className="rounded-full bg-[#159447]/[0.08] px-2 py-1 text-[8px] font-bold text-[#159447]">
                    VERIFIED
                  </span>
                </div>

                <div className="mt-1 text-[10px] text-black/35">
                  Managed through your Google account.
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE NUMBER */}

          <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f1f5f1] text-[#159447]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="6"
                    y="2.5"
                    width="12"
                    height="19"
                    rx="2.5"
                  />

                  <path d="M10 5h4" />
                  <path d="M11 18.5h2" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/35">
                    Mobile number
                  </div>

                  {editing !==
                    "phone" && (
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          "phone"
                        )
                      }
                      aria-label="Edit mobile number"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/35 transition hover:bg-black/[0.05] hover:text-black"
                    >
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
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1-1-4Z" />
                      </svg>
                    </button>
                  )}
                </div>

                {editing ===
                "phone" ? (
                  <div className="mt-2">
                    <div className="flex h-11 overflow-hidden rounded-[12px] border border-black/10 bg-[#fafafa] transition focus-within:border-[#159447]/40 focus-within:bg-white">
                      <div className="flex items-center border-r border-black/[0.07] px-3 text-[12px] font-bold text-black/55">
                        +91
                      </div>

                      <input
                        autoFocus
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={editValue}
                        onChange={(e) =>
                          setEditValue(
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                10
                              )
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold outline-none"
                        placeholder="Enter mobile number"
                      />
                    </div>

                    <div className="mt-1.5 text-[9px] text-black/35">
                      Enter your 10-digit mobile number.
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={
                          cancelEditing
                        }
                        disabled={saving}
                        className="rounded-full border border-black/10 px-3.5 py-2 text-[10px] font-bold text-black/55 transition hover:bg-black/[0.03] disabled:opacity-40"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveField(
                            "phone"
                          )
                        }
                        disabled={
                          saving ||
                          editValue.replace(
                            /\D/g,
                            ""
                          ).length !==
                            10
                        }
                        className="rounded-full bg-[#159447] px-4 py-2 text-[10px] font-bold text-white transition hover:bg-[#0f7d3b] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-2">
                    {profile?.phone ? (
                      <>
                        <span className="text-[13px] font-bold">
                          +91{" "}
                          {
                            profile.phone
                          }
                        </span>

                        <span className="rounded-full bg-[#159447]/[0.08] px-2 py-1 text-[8px] font-bold text-[#159447]">
                          ADDED
                        </span>
                      </>
                    ) : (
                      <span className="text-[13px] font-medium text-black/35">
                        Add your mobile number
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DELIVERY ADDRESS */}

          <div className="border-t border-black/[0.06] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              {/* ICON */}

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f1f5f1] text-[#159447]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />

                  <circle
                    cx="12"
                    cy="10"
                    r="2.5"
                  />
                </svg>
              </div>

              {/* CONTENT */}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-black/35">
                    Delivery address
                  </div>

                  {profile?.address?.trim() && (
                    <div className="flex items-center gap-1">
                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={
                          openLocationPicker
                        }
                        aria-label="Edit delivery address"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/35 transition hover:bg-black/[0.05] hover:text-black"
                      >
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
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1-1-4Z" />
                        </svg>
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteLocationOpen(
                            true
                          )
                        }
                        aria-label="Delete delivery address"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/30 transition hover:bg-red-50 hover:text-red-600"
                      >
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
                          <path d="M4 7h16" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M6 7l1 13h10l1-13" />
                          <path d="M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {profile?.address?.trim() ? (
                  <div className="mt-2">
                    <div className="rounded-[14px] border border-black/[0.06] bg-[#fafafa] px-3.5 py-3">
                      <div className="flex items-start gap-2.5">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 shrink-0 text-[#159447]"
                        >
                          <path d="M20 11c0 5-8 10-8 10S4 16 4 11a8 8 0 1 1 16 0Z" />

                          <circle
                            cx="12"
                            cy="11"
                            r="2.5"
                          />
                        </svg>

                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold leading-5 text-black/75">
                            {
                              profile.address
                            }
                          </div>

                          {profile.latitude !==
                            null &&
                            profile.longitude !==
                              null && (
                              <div className="mt-1 text-[8px] font-medium text-[#159447]">
                                Location verified
                              </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] leading-4 text-black/30">
                      This location will be used for delivery.
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="text-[12px] font-semibold text-black/45">
                      Add your delivery location
                    </div>

                    <div className="mt-1 text-[10px] leading-4 text-black/35">
                      Your location is required for delivery. We'll use your current device location.
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={
                          openLocationPicker
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-[#159447] px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#0f7d3b]"
                      >
                        <svg
                          width="14"
                          height="14"
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
                            r="7"
                          />

                          <circle
                            cx="12"
                            cy="12"
                            r="2"
                          />

                          <path d="M12 2v3" />
                          <path d="M12 19v3" />
                          <path d="M2 12h3" />
                          <path d="M19 12h3" />
                        </svg>

                        Use current location
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTNOTE */}

        <div className="mt-5 flex items-start gap-2 px-2 text-[9px] leading-4 text-black/30 sm:text-[10px]">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <path d="M12 3 5 6v5c0 4.8 2.9 8.3 7 10 4.1-1.7 7-5.2 7-10V6l-7-3Z" />

            <path d="m9 12 2 2 4-4" />
          </svg>

          <span>
            Your profile details are used to make ordering and delivery easier on Apna Shyampur.
          </span>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-black/[0.07] bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-baseline gap-[5px] text-[16px] font-black tracking-[-0.05em]">
              <span>
                APNA
              </span>

              <span className="text-[#159447]">
                SHYAMPUR
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-[7px] font-bold tracking-[0.14em] text-black/45">
              <span>
                LOCALS
              </span>

              <span className="text-[#159447]">
                •
              </span>

              <span>
                TRUSTED
              </span>

              <span className="text-[#159447]">
                •
              </span>

              <span>
                FAST
              </span>
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

      {/* ------------------------------------------------------------------ */}
      {/* LOCATION MODAL                                                     */}
      {/* ------------------------------------------------------------------ */}

      {locationModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-0 backdrop-blur-[3px] sm:items-center sm:p-5">
          <div className="w-full max-w-[500px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.20)] sm:rounded-[28px]">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div>
                <div className="text-[15px] font-black tracking-[-0.03em]">
                  Use current location
                </div>

                <div className="mt-1 text-[10px] text-black/40">
                  We'll use your device GPS location to verify your delivery area.
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeLocationModal
                }
                disabled={
                  locationLoading
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-black/50 transition hover:bg-black/[0.07] hover:text-black disabled:opacity-40"
                aria-label="Close"
              >
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
                  <path d="m6 6 12 12" />
                  <path d="m18 6-12 12" />
                </svg>
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="px-5 py-5 sm:px-6">
              {locationMode ===
                "current" && (
                <div className="rounded-[18px] border border-[#159447]/10 bg-[#159447]/[0.045] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#159447]/10 text-[#159447]">
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
                        <circle
                          cx="12"
                          cy="12"
                          r="7"
                        />

                        <circle
                          cx="12"
                          cy="12"
                          r="2"
                        />

                        <path d="M12 2v3" />
                        <path d="M12 19v3" />
                        <path d="M2 12h3" />
                        <path d="M19 12h3" />
                      </svg>
                    </div>

                    <div>
                      <div className="text-[12px] font-bold">
                        {locationLoading
                          ? "Finding your exact location…"
                          : locationCandidate
                          ? "Location found"
                          : locationError
                          ? "Location check"
                          : "Use current location"}
                      </div>

                      <div className="mt-1 text-[10px] leading-4 text-black/40">
                        We're taking multiple GPS readings and using the most accurate one before checking your delivery area.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {locationError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[14px] border border-red-200 bg-red-50 px-3.5 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-red-600"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />

                    <path d="M12 8v4" />
                    <path d="M12 16h.01" />
                  </svg>

                  <div className="text-[10px] font-semibold leading-4 text-red-700">
                    {locationError}
                  </div>
                </div>
              )}

              {/* SELECTED LOCATION */}

              {locationCandidate && (
                <div className="mt-4 rounded-[18px] border border-[#159447]/15 bg-[#159447]/[0.045] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#159447]/10 text-[#159447]">
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
                        <path d="M20 11c0 5-8 10-8 10S4 16 4 11a8 8 0 1 1 16 0Z" />

                        <circle
                          cx="12"
                          cy="11"
                          r="2.5"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#159447]">
                        Delivery location
                      </div>

                      <div className="mt-1 text-[12px] font-bold leading-5 text-black/75">
                        {
                          locationCandidate.address
                        }
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-medium text-[#159447]">
                          ✓ Delivery available
                        </span>

                        {locationCandidate.accuracy !==
                          null && (
                          <span className="rounded-full bg-[#159447]/10 px-2 py-1 text-[8px] font-bold text-[#159447]">
                            ±
                            {Math.round(
                              locationCandidate.accuracy
                            )}
                            m accuracy
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={
                    closeLocationModal
                  }
                  disabled={
                    locationLoading
                  }
                  className="rounded-full border border-black/10 px-4 py-2.5 text-[10px] font-bold text-black/55 transition hover:bg-black/[0.03] disabled:opacity-40"
                >
                  Cancel
                </button>

                {locationError &&
                  !locationLoading && (
                    <button
                      type="button"
                      onClick={
                        getCurrentLocation
                      }
                      className="rounded-full border border-[#159447]/20 bg-[#159447]/[0.05] px-4 py-2.5 text-[10px] font-bold text-[#159447] transition hover:bg-[#159447]/[0.09]"
                    >
                      Try again
                    </button>
                  )}

                {locationCandidate && (
                  <button
                    type="button"
                    onClick={
                      saveLocation
                    }
                    disabled={
                      locationLoading
                    }
                    className="rounded-full bg-[#159447] px-5 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#0f7d3b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {locationLoading
                      ? "Saving..."
                      : "Save location"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DELETE LOCATION MODAL                                              */}
      {/* ------------------------------------------------------------------ */}

      {deleteLocationOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 px-5 backdrop-blur-[3px]">
          <div className="w-full max-w-[390px] rounded-[24px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,.20)] sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
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
              </div>

              <div className="min-w-0">
                <h2 className="text-[15px] font-black tracking-[-0.02em]">
                  Remove delivery location?
                </h2>

                <p className="mt-1.5 text-[10px] leading-4 text-black/45">
                  Are you sure you want to remove your saved delivery location? You can add it again anytime.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteLocationOpen(
                    false
                  )
                }
                disabled={
                  deletingLocation
                }
                className="rounded-full border border-black/10 px-4 py-2.5 text-[10px] font-bold text-black/55 transition hover:bg-black/[0.03] disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  deleteLocation
                }
                disabled={
                  deletingLocation
                }
                className="rounded-full bg-red-600 px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingLocation
                  ? "Removing..."
                  : "Remove location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}