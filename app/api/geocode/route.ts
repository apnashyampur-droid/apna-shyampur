import { NextResponse } from "next/server";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const address = searchParams.get("address");

    if (lat && lng) {
      const response = await fetch(
        `${NOMINATIM_URL}/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(
          lng
        )}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent":
              "ApnaShyampur/1.0 (local delivery website)",
            Accept:
              "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Nominatim reverse geocoding failed:",
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

      if (!data?.display_name) {
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
        address: data.display_name,
      });
    }

    if (address?.trim()) {
      const response = await fetch(
        `${NOMINATIM_URL}/search?format=jsonv2&q=${encodeURIComponent(
          address.trim()
        )}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent":
              "ApnaShyampur/1.0 (local delivery website)",
            Accept:
              "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "Nominatim address search failed:",
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

      if (!Array.isArray(data) || !data.length) {
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

      const result = data[0];

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

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
          result.display_name ||
          address.trim(),
        latitude,
        longitude,
      });
    }

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