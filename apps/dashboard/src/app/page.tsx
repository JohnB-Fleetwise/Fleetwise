import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-fleet-600 to-fleet-900 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg
              className="w-8 h-8 text-fleet-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h8M8 11h5M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            FleetWise
          </h1>
          <p className="mt-2 text-fleet-200 text-lg">
            Smarter fleet management starts here.
          </p>
        </div>

        {/* CTA card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Real-time fleet tracking, simplified.
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Track your vehicles, manage drivers, and optimize deliveries — all from one dashboard.
          </p>

          <Link
            href="/auth/signin"
            className="block w-full bg-fleet-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-fleet-700 transition-colors text-center"
          >
            Sign In
          </Link>

          <p className="mt-4 text-sm text-gray-500">
            New to FleetWise?{" "}
            <Link href="/auth/signup" className="text-fleet-600 font-medium hover:text-fleet-700">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-8 text-fleet-300 text-xs">
          &copy; {new Date().getFullYear()} FleetWise. All rights reserved.
        </p>
      </div>
    </div>
  );
}
