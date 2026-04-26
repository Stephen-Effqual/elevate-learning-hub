export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/student/:path*",
    "/chat/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/parent/:path*",
    "/api/chat/:path*",
    "/api/session/:path*",
    "/api/files/:path*",
    "/api/feedback/:path*",
    "/api/usage/:path*",
    "/api/report/:path*",
    "/api/admin/:path*",
  ],
};
