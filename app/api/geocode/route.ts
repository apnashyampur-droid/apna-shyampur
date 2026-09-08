import { NextResponse } from "next/server";

const GOOGLE_GEOCODING_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const address = searchParams.get("address");

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error(
        "GOOGLE_MAPS_API_KEY is missing."
      );

      return NextResponse.json(
        {
          error:
            "Location service is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /* ---------------------------------------------------------------------- */
    /* REVERSE GEOCODING: latitude + longitude → address                     */
    /* ---------------------------------------------------------------------- */

    if (lat && lng) {
      const response = await fetch(
        `${GOOGLE_GEOCODING_URL}?latlng=${encodeURIComponent(
          `${lat},${lng}`
        )}&key=${encodeURIComponent(apiKey)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Google reverse geocoding request failed:",
          response.status,
          response.statusText
        );

        return NextResponse.json(
          {
            error:
              "Unable to find your current address.",
          },
          {
            status: 502,
          }
        );
      }

      const data = await response.json();

      if (data.status !== "OK") {
        console.error(
          "Google reverse geocoding failed:",
          data.status,
          data.error_message || ""
        );

        return NextResponse.json(
          {
            error:
              "We found your location, but couldn't get its address.",
          },
          {
            status: 502,
          }
        );
      }

      const result =
        data.results?.[0];

      if (!result?.formatted_address) {
        return NextResponse.json(
          {
            error:
              "Address not found for your current location.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        address:
          result.formatted_address,
      });
    }

    /* ---------------------------------------------------------------------- */
    /* FORWARD GEOCODING: address → latitude + longitude                     */
    /* ---------------------------------------------------------------------- */

    if (address?.trim()) {
      const response = await fetch(
        `${GOOGLE_GEOCODING_URL}?address=${encodeURIComponent(
          address.trim()
        )}&key=${encodeURIComponent(apiKey)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Google address search request failed:",
          response.status,
          response.statusText
        );

        return NextResponse.json(
          {
            error:
              "Unable to search this address.",
          },
          {
            status: 502,
          }
        );
      }

      const data = await response.json();

      if (data.status !== "OK") {
        console.error(
          "Google address search failed:",
          data.status,
          data.error_message || ""
        );

        return NextResponse.json(
          {
            error:
              "We couldn't find that address. Please try a more specific address.",
          },
          {
            status: 404,
          }
        );
      }

      const result =
        data.results?.[0];

      const latitude =
        result?.geometry?.location?.lat;

      const longitude =
        result?.geometry?.location?.lng;

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return NextResponse.json(
          {
            error:
              "The selected address has invalid coordinates.",
          },
          {
            status: 502,
          }
        );
      }

      return NextResponse.json({
        address:
          result.formatted_address ||
          address.trim(),
        latitude,
        longitude,
      });
    }

    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        error:
          "Please provide coordinates or an address.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Geocoding route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process the location request.",
      },
      {
        status: 500,
      }
    );
  }
}