import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const maintenanceMode =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  const pathname = request.nextUrl.pathname;

  // Maintenance page ko khud access karne dena hai
  if (pathname === "/maintenance") {
    return NextResponse.next();
  }

  // Maintenance ON hai to har page ko maintenance par bhejo
  if (maintenanceMode) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};