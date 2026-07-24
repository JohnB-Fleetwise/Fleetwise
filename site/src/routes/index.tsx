import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-dvh">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Features */}
      <FeaturesSection />

      {/* Demo Preview */}
      <DemoPreviewSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-16 section-padding">
        <a href="#" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-fleet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">
            FleetWise
          </span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">
            How It Works
          </a>
          <a href="#features" className="hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">
            Pricing
          </a>
        </div>
        <a href="https://fleetwise-dashboard-k61wwq8gd-fleetwise.vercel.app/dashboard" className="btn-primary text-sm !px-4 !py-2">
          Start Free Trial
        </a>
      </nav>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-fleet-50 via-white to-blue-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto section-padding pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-fleet-100 px-4 py-1.5 text-sm font-medium text-fleet-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-fleet-500 animate-pulse" />
            New: Route Optimization
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.08]">
            Know where every vehicle is.
            <br />
            <span className="text-fleet-600">Right now.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Simple fleet tracking for small delivery and service businesses. See
            your vehicles on a live map, manage drivers, and track deliveries —
            all from one dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://fleetwise-dashboard-k61wwq8gd-fleetwise.vercel.app/dashboard" className="btn-primary text-lg !px-8 !py-3.5">
              Start Free Trial
            </a>
            <a
              href="#how-it-works"
              className="btn-secondary text-lg !px-8 !py-3.5"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-sm text-gray-400">
            No credit card required · 14-day free trial
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ───────────────────────────────────── */
const steps = [
  {
    num: "1",
    title: "Add Your Vehicles",
    desc: "Connect your fleet in under 60 seconds. Enter vehicle details, assign drivers, and you're ready to go — no hardware needed.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h5M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "Track in Real Time",
    desc: "Watch every vehicle move on a live map. Know exactly where your fleet is, who's on schedule, and who needs attention.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "Save Time & Money",
    desc: "Optimize routes, cut fuel costs, and reduce idle time. Most customers save 15–20% on operating costs in their first month.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-fleet-600 tracking-wider uppercase">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
            Get started in minutes, not days
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Three simple steps to take control of your fleet.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="relative text-center group">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-fleet-100 text-fleet-600 flex items-center justify-center mb-5 group-hover:bg-fleet-200 transition-colors">
                {step.icon}
              </div>
              <div className="absolute top-7 left-[calc(50%+2.5rem)] hidden md:block text-4xl font-extralight text-gray-200 -z-10 select-none">
                {step.num !== "3" ? "→" : ""}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────── */
const features = [
  {
    title: "Real-Time GPS Tracking",
    desc: "See every vehicle on a live map with location updates every few seconds. Know where your fleet is at all times.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Driver Management",
    desc: "Assign drivers to vehicles, track hours, and see who's on the road. Keep your team organized and accountable.",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Delivery Tracking",
    desc: "Track every delivery from dispatch to completion. Know which stops are done, in progress, or running late.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Route Optimization",
    desc: "Automatically find the most efficient routes. Cut fuel costs by up to 20% with intelligent multi-stop planning.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Maintenance Reminders",
    desc: "Never miss an oil change or service interval. Get proactive alerts based on mileage, time, or vehicle diagnostics.",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Mobile-Friendly Dashboard",
    desc: "Manage your fleet from anywhere. The full dashboard works on desktop, tablet, and your phone — no app required.",
    color: "bg-teal-100 text-teal-600",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-fleet-600 tracking-wider uppercase">
            Features
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
            Everything you need to run your fleet
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Built for small businesses — no complexity, no bloat.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Demo Preview ───────────────────────────────────── */
function DemoPreviewSection() {
  return (
    <section id="demo" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-fleet-600 tracking-wider uppercase">
            Dashboard Preview
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
            See your fleet at a glance
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            A clean, intuitive dashboard that puts everything you need right in
            front of you.
          </p>
        </div>
        {/* Styled mockup */}
        <div className="relative max-w-4xl mx-auto">
          <div className="rounded-xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
            {/* Mock header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 font-mono">
                FleetWise Dashboard
              </span>
            </div>
            {/* Mock content */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Vehicles", val: "12", sub: "75% utilization", bg: "bg-fleet-100", text: "text-fleet-700" },
                  { label: "Active Drivers", val: "8", sub: "Currently on shift", bg: "bg-green-100", text: "text-green-700" },
                  { label: "Deliveries Today", val: "47", sub: "94% on schedule", bg: "bg-purple-100", text: "text-purple-700" },
                  { label: "Miles Driven", val: "1,240", sub: "+12% vs last week", bg: "bg-amber-100", text: "text-amber-700" },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs text-gray-400 font-medium mb-1">{s.label}</div>
                    <div className={`text-xl sm:text-2xl font-bold ${s.text}`}>{s.val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
              {/* Mock map area */}
              <div className="bg-gray-100 rounded-lg border border-gray-200 h-64 relative overflow-hidden">
                {/* Simulated map grid + markers */}
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 40} x2="100%" y2={i * 40} stroke="#94a3b8" strokeWidth="0.5" />
                    ))}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
                    ))}
                  </svg>
                </div>
                {/* Map markers */}
                <div className="absolute top-[30%] left-[20%]">
                  <div className="w-3 h-3 bg-fleet-600 rounded-full animate-pulse ring-4 ring-fleet-200" />
                </div>
                <div className="absolute top-[50%] left-[55%]">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse ring-4 ring-green-200" />
                </div>
                <div className="absolute top-[70%] left-[35%]">
                  <div className="w-3 h-3 bg-fleet-600 rounded-full animate-pulse ring-4 ring-fleet-200" />
                </div>
                <div className="absolute top-[20%] left-[75%]">
                  <div className="w-3 h-3 bg-amber-500 rounded-full ring-4 ring-amber-200" />
                </div>
                {/* Dashed route lines */}
                <svg className="absolute inset-0" style={{ overflow: "visible" }}>
                  <line x1="20%" y1="30%" x2="55%" y2="50%" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
                  <line x1="55%" y1="50%" x2="35%" y2="70%" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 4" opacity="0.3" />
                </svg>
                {/* Map overlay label */}
                <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
                  Live Map — 3 vehicles active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ────────────────────────────────────────── */
const plans = [
  {
    name: "Starter",
    price: "$12",
    period: "/vehicle/mo",
    desc: "Everything you need to get started with fleet tracking.",
    features: [
      "Real-time GPS tracking",
      "Driver app access",
      "Basic reports",
      "Live map view",
      "Mobile-friendly dashboard",
      "Email support",
    ],
    highlighted: false,
    href: "https://buy.stripe.com/fZu4gzdZKgkd47f8I74wM00",
  },
  {
    name: "Professional",
    price: "$24",
    period: "/vehicle/mo",
    desc: "Advanced tools for growing fleets that need more.",
    features: [
      "Everything in Starter",
      "Route optimization",
      "Maintenance reminders",
      "Advanced analytics",
      "Delivery tracking",
      "Priority support",
    ],
    highlighted: true,
    href: "https://buy.stripe.com/dRm4gz08Ugkd7jr4rR4wM01",
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm font-semibold text-fleet-600 tracking-wider uppercase">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-fleet-600 text-white shadow-xl shadow-fleet-200 ring-4 ring-fleet-200"
                  : "bg-white shadow-sm border border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1">
                  Most Popular
                </div>
              )}
              <h3
                className={`text-xl font-bold mb-1 ${
                  plan.highlighted ? "text-white" : "text-gray-900"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`text-sm mb-6 ${
                  plan.highlighted ? "text-fleet-100" : "text-gray-500"
                }`}
              >
                {plan.desc}
              </p>
              <div className="mb-6">
                <span
                  className={`text-4xl font-extrabold ${
                    plan.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.highlighted ? "text-fleet-100" : "text-gray-400"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-fleet-200" : "text-fleet-500"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      className={
                        plan.highlighted ? "text-fleet-50" : "text-gray-600"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`block text-center rounded-lg py-3 font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? "bg-white text-fleet-700 hover:bg-fleet-50"
                    : "btn-primary w-full"
                }`}
              >
                Subscribe
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-fleet-700">
      <div className="max-w-3xl mx-auto section-padding text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to take control of your fleet?
        </h2>
        <p className="mt-4 text-lg text-fleet-100">
          Join hundreds of small businesses already using FleetWise. Start your
          free 14-day trial today — no credit card required.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://fleetwise-dashboard-k61wwq8gd-fleetwise.vercel.app/dashboard"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-fleet-700 bg-white hover:bg-fleet-50 transition-colors shadow-lg text-lg"
          >
            Start Free Trial
          </a>
          <a
            href="mailto:hello@fleetwise.app"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-white border-2 border-fleet-400 hover:bg-fleet-600 transition-colors text-lg"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto section-padding">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-fleet-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">FleetWise</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="mailto:hello@fleetwise.app" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
          <p className="text-sm">© 2026 FleetWise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
