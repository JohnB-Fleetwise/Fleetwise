import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    // Drivers can only access the driver view
    if (role === "driver" && path !== "/dashboard/driver") {
      return NextResponse.redirect(new URL("/dashboard/driver", req.url));
    }

    // Admins and managers have full access
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
