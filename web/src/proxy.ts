import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redirectTarget } from "@/middleware-logic";

export default auth((req) => {
  const target = redirectTarget(req.nextUrl.pathname, !!req.auth);
  if (target) return NextResponse.redirect(new URL(target, req.nextUrl));
});

// /api/sap/* does its own 401 JSON check (T4.2) rather than redirecting.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
