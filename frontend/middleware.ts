import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files or icon files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
