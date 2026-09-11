import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const maintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  const pathname = request.nextUrl.pathname;

  // Maintenance page itself must remain accessible
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  // Static/public files must remain accessible during maintenance
  const isStaticFile =
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.(jpg|jpeg|png|webp|gif|svg|ico|mp3|wav|ogg|m4a|css|js|json|woff|woff2|ttf|otf)$/i.test(
      pathname
    );

  if (isStaticFile) {
    return NextResponse.next();
  }

  // Redirect normal pages to maintenance
  if (maintenanceMode) {
    return NextResponse.redirect(
      new URL("/maintenance", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};