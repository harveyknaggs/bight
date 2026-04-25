export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Run on everything except static assets, images, and the auth API itself.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
