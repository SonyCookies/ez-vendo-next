"use client";
import {
  Zap,
  TrendingUp,
  BarChart3,
  Wrench,
  Globe,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Radio,
  Database,
  Shield,
  ArrowRight,
  Smartphone,
  Clock,
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="w-full min-h-dvh bg-white overflow-x-hidden">
      {/* ===== ANIMATED BACKGROUND PATTERN ===== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-white to-blue-50 opacity-60"></div>
        {/* Animated lines pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="lines"
              patternUnits="userSpaceOnUse"
              width="50"
              height="50"
            >
              <path
                d="M 0 0 L 50 50 M 50 0 L 0 50"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between relative z-10">
          <div className="flex sm:hidden relative items-center gap-2 ">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={40}
              height={40}
              className=""
            />
            <span className="font-bold text-xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>
          <div className="hidden sm:flex relative items-center gap-2 ">
            <Image
              src="/favicon.ico"
              alt="EZ-Vendo Logo"
              width={50}
              height={50}
              className=""
            />
            <span className="font-bold text-2xl">
              <span className="text-green-500">EZ</span>-Vendo
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#comparison"
              className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Why Us
            </a>
            <a
              href="#technology"
              className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Technology
            </a>
            <a
              href="/login"
              className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Login
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/login" className="block">
              <button className="px-4 sm:px-6 py-2 rounded-full border-2 border-emerald-600 text-emerald-600 text-xs sm:text-sm font-semibold hover:bg-emerald-50 transition-all duration-150 cursor-pointer">
                Login
              </button>
            </a>
            <a href="#cta" className="hidden sm:block">
              <button className="px-6 py-2 rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all duration-150 cursor-pointer">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full min-h-screen flex items-center justify-center px-6 sm:px-8 pt-32 pb-20 z-10">
        <div className="max-w-5xl mx-auto text-center w-full">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50/80 backdrop-blur-sm">
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-2">
              <Radio className="w-3.5 h-3.5" /> The Next Generation of Wi-Fi
              Access
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900 leading-tight text-balance">
            Tap. Connect.
            <br />
            <span className="bg-linear-to-r from-emerald-600 via-emerald-500 to-blue-600 bg-clip-text text-transparent">
              Scale.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed text-pretty">
            Revolutionary RFID-powered contactless Wi-Fi vending system. Say
            goodbye to coin jams, cash handling, and unreliable operations.
            Hello to data-driven profitability.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-16">
            <a href="#features">
              <button className="px-8 py-4 rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-base cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                Explore Solution <ArrowRight className="w-4 h-4" />
              </button>
            </a>
            <a href="#comparison">
              <button className="px-8 py-4 rounded-full border-2 border-emerald-600 text-emerald-600 font-semibold text-base cursor-pointer hover:bg-emerald-50 transition-all duration-300">
                Learn More
              </button>
            </a>
          </div>

          {/* Hero Visual - Stats Grid */}
          <div className="relative mt-16 group">
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-400/20 via-blue-400/20 to-emerald-400/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-300 opacity-75"></div>
            <div className="relative rounded-3xl p-8 sm:p-12 border border-emerald-100/50 bg-white/80 backdrop-blur-xl">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                    99.9%
                  </div>
                  <p className="text-sm text-gray-600">System Uptime</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                    2s
                  </div>
                  <p className="text-sm text-gray-600">Access Time</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                    100%
                  </div>
                  <p className="text-sm text-gray-600">Contactless</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                    Real-time
                  </div>
                  <p className="text-sm text-gray-600">Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section
        id="features"
        className="w-full py-24 px-6 sm:px-8 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
              Why EZ-Vendo
              <br />
              <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Wins.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience reliability, security, and profitability combined
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                2-second RFID access time. No delays, no frustrated customers,
                no lost revenue.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Enterprise Security
              </h3>
              <p className="text-gray-600">
                Military-grade encryption, real-time fraud detection, and RFID
                authentication.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Revenue Maximizer
              </h3>
              <p className="text-gray-600">
                All digital payments. Zero cash handling. Increase margins by
                40% or more.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Smart Analytics
              </h3>
              <p className="text-gray-600">
                Real-time dashboard with usage patterns, peak hours, and
                predictive insights.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Zero Maintenance
              </h3>
              <p className="text-gray-600">
                Solid-state RFID design. No moving parts. No coin jams. Built to
                last forever.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Global Scale
              </h3>
              <p className="text-gray-600">
                Cloud-based infrastructure supporting unlimited transactions
                worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM vs SOLUTION ===== */}
      <section
        id="comparison"
        className="w-full py-24 px-6 sm:px-8 relative z-10 bg-linear-to-b from-slate-50/50 to-white"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
              The EZ-Vendo
              <br />
              <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Difference.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem Column */}
            <div className="p-8 rounded-2xl bg-white border-2 border-red-200 relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-100/50 rounded-full blur-2xl group-hover:bg-red-200/50 transition-colors duration-300"></div>
              <div className="relative">
                <div className="text-5xl mb-4">🛑</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Traditional Piso Wi-Fi
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  The existing coin-operated model is riddled with critical
                  operational problems:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Coin jams, vandalism, and theft lead to frequent costly
                      repairs and downtime
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Manual cash collection creates security risks and
                      administrative overhead
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Zero customer data prevents pricing optimization and
                      capacity planning
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Poor customer experience leads to lost repeat business
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Solution Column */}
            <div className="p-8 rounded-2xl bg-white border-2 border-emerald-200 relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl group-hover:bg-emerald-200/50 transition-colors duration-300"></div>
              <div className="relative">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  EZ-Vendo Solution
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  RFID-powered contactless access transforms the entire
                  experience:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Solid-state design eliminates jamming, dramatically
                      improving reliability
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      100% digital transactions create auditable ledger with
                      automatic tracking
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Real-time business intelligence drives pricing and
                      capacity optimization
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      Seamless user experience builds loyalty and repeat revenue
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TECHNOLOGY STACK ===== */}
      <section
        id="technology"
        className="w-full py-24 px-6 sm:px-8 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
              Built on Modern
              <br />
              <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Technology.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade infrastructure designed for reliability and scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* RFID Technology */}
            <div className="p-8 rounded-2xl bg-linear-to-br from-emerald-50 to-blue-50 border border-emerald-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Advanced RFID
              </h3>
              <p className="text-gray-700 leading-relaxed">
                13.56 MHz ISO/IEC 14443 standard. Military-grade encryption.
                Instant authentication. Zero contact required.
              </p>
            </div>

            {/* Cloud Database */}
            <div className="p-8 rounded-2xl bg-linear-to-br from-emerald-50 to-blue-50 border border-emerald-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Cloud Ledger
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Google Firestore backend. 99.99% uptime. Real-time transaction
                ledger. Fully auditable and secure.
              </p>
            </div>

            {/* Network Control */}
            <div className="p-8 rounded-2xl bg-linear-to-br from-emerald-50 to-blue-50 border border-emerald-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Intelligent Control
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Linux-based network management. Real-time policy updates.
                MAC-based access control. Zero-trust security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SYSTEM ARCHITECTURE ===== */}
      <section className="w-full py-24 px-6 sm:px-8 relative z-10 bg-linear-to-b from-slate-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
              Three-Tier
              <br />
              <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Architecture.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Embedded Control Layer */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-2xl bg-white border border-gray-200">
                <div className="text-4xl mb-4">🔌</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Embedded Layer
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed text-sm">
                  ESP32 Microcontroller handles RFID reading, provides instant
                  feedback, and communicates authentication events.
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>RFID-RC522 Reader</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Audio/Visual Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>HTTP Web Server</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Gateway Layer */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-2xl bg-white border border-gray-200">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Gateway Layer
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed text-sm">
                  Orange Pi Zero 3 manages firewall rules, hosts Next.js apps,
                  and runs the access control API.
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Firewall Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Next.js Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Flask API Server</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Application Layer */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-8 rounded-2xl bg-white border border-gray-200">
                <div className="text-4xl mb-4">☁️</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Cloud Layer
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed text-sm">
                  Next.js with Google Firestore provides responsive interfaces
                  and real-time data management.
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Captive Portal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Customer Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Real-time Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section className="w-full py-24 px-6 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
              One Simple
              <br />
              <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                Pricing Model.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Flexible billing rate configured through your admin dashboard
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pricing Card 1 */}
            <div className="p-8 rounded-2xl bg-linear-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Default Rate</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₱0.50<span className="text-lg text-gray-600">/min</span>
                  </p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Fully customizable billing rate. Adjust anytime through your
                admin interface to match market conditions.
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>5-minute free trial for new users</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Daily 5-minute grace period</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Time packages: 5, 10, 30, 60 min</span>
                </li>
              </ul>
            </div>

            {/* Pricing Card 2 */}
            <div className="p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-emerald-500 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-gray-600">Revenue Potential</p>
                  <p className="text-3xl font-bold text-slate-900">
                    40%+ increase
                  </p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                No cash handling overhead. Zero coin jam downtime. Digital
                payments only. Maximum efficiency.
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Automatic transaction logging</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real-time revenue analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Peak usage insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section
        id="cta"
        className="w-full py-24 px-6 sm:px-8 relative z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-r from-emerald-600/10 via-emerald-500/5 to-emerald-600/10 -z-10"></div>
        <div className="absolute -top-40 right-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50/80 backdrop-blur-sm">
            <p className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-2">
              <Smartphone className="w-3.5 h-3.5" /> Ready to Transform Your
              Business?
            </p>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 text-balance">
            Join the Wi-Fi
            <br />
            <span className="bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              Revolution.
            </span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop losing money to coin jams and manual processing. Start scaling
            revenue with contactless, data-driven Wi-Fi vending.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-base cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
              Get Started Today <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="w-full py-12 px-6 sm:px-8 border-t border-gray-200 relative z-10 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#technology"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Technology
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div> */}

          <div className="pt-8 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-start">
              © 2025 EZ-Vendo. Redefining public Wi-Fi access. All rights
              reserved.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* <div className="flex items-center gap-6">
                <a
                  href="#"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"></path>
                  </svg>
                </a>
              </div> */}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
