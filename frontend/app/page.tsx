'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import {
  Compass,
  ShieldCheck,
  Database,
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Menu,
  X,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

export default function Home() {
  const { user, isLoading } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentYear = new Date().getFullYear();
  const ctaUrl = user ? '/dashboard' : '/auth/login';

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-zinc-200/80 dark:border-zinc-800/80 py-3 shadow-sm'
            : 'bg-transparent border-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Branding */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Image
                src="/Logo.png"
                alt="WeatherComfort Analytics Logo"
                width={32}
                height={32}
                className="object-contain rounded-md"
              />
              <span className="font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
                WeatherComfort
                <span className="hidden sm:inline text-zinc-500 font-normal">Analytics</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('comfort-index')}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors cursor-pointer"
              >
                Comfort Index
              </button>
            </nav>

            {/* Action Group */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              ) : user ? (
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm cursor-pointer"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-semibold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm shadow-sm cursor-pointer"
                >
                  Sign In
                </a>
              )}
            </div>

            {/* Mobile Header Buttons */}
            <div className="flex md:hidden items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-6 space-y-4 shadow-lg transition-all duration-300">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('comfort-index')}
                className="text-left text-base font-semibold text-zinc-700 dark:text-zinc-300 py-1"
              >
                Comfort Index
              </button>
            </nav>
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
              ) : user ? (
                <a
                  href="/dashboard"
                  className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm transition-all"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href="/auth/login"
                  className="flex items-center justify-center w-full py-3 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm transition-all"
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">
                Find the most comfortable city  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-500 dark:from-sky-400 dark:to-indigo-400">right now.</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                WeatherComfort Analytics normalizes temperature, humidity, wind, and cloudiness to compute a real-time outdoor Comfort Index. Compare environments instantly.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {isLoading ? (
                  <div className="w-8 h-8 border-3 border-zinc-300 dark:border-zinc-700 border-t-zinc-950 dark:border-t-zinc-100 rounded-full animate-spin" />
                ) : (
                  <a
                    href={ctaUrl}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-base shadow-md active:scale-98 group cursor-pointer"
                  >
                    <span>Explore Comfort Rankings</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 transition-colors text-base cursor-pointer"
                >
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right Mock Card Preview Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl dark:shadow-black/50 hover:scale-[1.02] transition-transform duration-300 relative group">
                <div className="absolute top-0 right-0 bg-zinc-900 text-white dark:bg-zinc-800 px-4 py-1.5 rounded-bl-xl font-bold text-xs">
                  SAMPLE PREVIEW
                </div>

                <div className="mb-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-baseline gap-1">
                    Tokyo
                    <span className="text-xs font-semibold text-zinc-400 uppercase">JP</span>
                  </h3>
                  <p className="text-xs text-zinc-500">Clear Skies</p>
                </div>

                {/* Score badge mockup */}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full font-bold text-sm border border-emerald-500/20">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    Comfort Score: 85.40
                  </div>
                </div>

                {/* Parameter grid mockup */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                    <Thermometer className="w-4 h-4 text-orange-500 shrink-0" />
                    <div>
                      <div className="text-zinc-400">Temp</div>
                      <div className="font-semibold">22.4°C</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                    <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="text-zinc-400">Humidity</div>
                      <div className="font-semibold">45%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                    <Wind className="w-4 h-4 text-teal-500 shrink-0" />
                    <div>
                      <div className="text-zinc-400">Wind Speed</div>
                      <div className="font-semibold">3.2 m/s</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
                    <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="text-zinc-400">Clouds</div>
                      <div className="font-semibold">0%</div>
                    </div>
                  </div>
                </div>

                {/* Micro breakdowns */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Humidity Comfort (25%)</span>
                    <span className="font-mono font-semibold">100.00 / 100</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-zinc-100/50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Intelligent features for environment benchmarking
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
              Designed from the ground up to retrieve, process, cache, and secure municipal weather comfort indices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 p-3 rounded-xl w-fit group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Live City Rankings</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Compare cities from most to least comfortable using current, concurrently gathered weather conditions.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 p-3 rounded-xl w-fit group-hover:scale-105 transition-transform">
                <Thermometer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Explainable Score</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                A transparent, weighted 0–100 score calculated dynamically based on Temperature, Humidity, Wind, and Cloudiness.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl w-fit group-hover:scale-105 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Fast, Cached Results</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Server-side dual-layer caching (dashboard & raw city caches) reduces api request latency and avoids rate limits.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group">
              <div className="bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 p-3 rounded-xl w-fit group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Secure Access</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Secure access guarantees through JSON Web Token (JWT) signature verification verified against live JWKS endpoints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Engineered with clean separation
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
              How the application orchestrates concurrent fetching, server calculations, and caching pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-full relative z-10 group">
              <div>
                <div className="text-4xl font-black text-zinc-200 dark:text-zinc-800 group-hover:text-sky-500/35 transition-colors font-mono">01</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Collect</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Cities are loaded from database configurations and live weather conditions are retrieved concurrently from weather providers.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-full relative z-10 group">
              <div>
                <div className="text-4xl font-black text-zinc-200 dark:text-zinc-800 group-hover:text-indigo-500/35 transition-colors font-mono">02</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Analyze</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The backend normalizes raw inputs (e.g. cloudiness and wind meters) and computes the comfort score according to weighted equations.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm flex flex-col justify-between h-full relative z-10 group">
              <div>
                <div className="text-4xl font-black text-zinc-200 dark:text-zinc-800 group-hover:text-emerald-500/35 transition-colors font-mono">03</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">Rank</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Cities are stably sorted from highest score to lowest score (resolving any score ties alphabetically) and output as active rankings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comfort Index Section */}
      <section id="comfort-index" className="py-20 bg-zinc-100/50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side documentation text */}
            <div className="lg:col-span-6 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                High-level Comfort Index breakdown
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The Comfort Index maps multiple atmospheric variables into a standardized 0–100 comfort heuristic. Each component represents a distinct weight:
              </p>

              {/* Equation preview */}
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-xs text-sky-600 dark:text-sky-400 flex items-center justify-between shadow-sm">
                <span>Comfort Index</span>
                <ChevronRight className="w-4 h-4 text-zinc-300" />
                <span>weighted weather signals</span>
                <ChevronRight className="w-4 h-4 text-zinc-300" />
                <span className="font-bold">0–100 score</span>
              </div>
            </div>

            {/* Right side metric weight chips */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Temperature</span>
                  <span className="text-xs font-mono font-bold text-orange-500 px-2 py-0.5 bg-orange-500/10 dark:bg-orange-500/20 rounded">40%</span>
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  The primary driver. Computes deviation from target temperate climates (ideal around 21°C).
                </p>
              </div>

              {/* Humidity */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Humidity</span>
                  <span className="text-xs font-mono font-bold text-blue-500 px-2 py-0.5 bg-blue-500/10 dark:bg-blue-500/20 rounded">25%</span>
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  Assesses moisture. Heavily impacts perceived heat indexes and thermal discomfort.
                </p>
              </div>

              {/* Wind Speed */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Wind Speed</span>
                  <span className="text-xs font-mono font-bold text-teal-500 px-2 py-0.5 bg-teal-500/10 dark:bg-teal-500/20 rounded">20%</span>
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  Factors air movement. Drafts cool down body temperatures but excess speed degrades comfort.
                </p>
              </div>

              {/* Cloudiness */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Cloudiness</span>
                  <span className="text-xs font-mono font-bold text-indigo-500 px-2 py-0.5 bg-indigo-500/10 dark:bg-indigo-500/20 rounded">15%</span>
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  Assesses light. Evaluates sunlight levels, balancing clear blue skies vs overcast conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Ready to compare city comfort?
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Sign in to access the live, cached Comfort Index dashboard.
          </p>

          <div className="pt-2">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-zinc-300 dark:border-zinc-700 border-t-zinc-950 dark:border-t-zinc-100 rounded-full animate-spin mx-auto" />
            ) : (
              <a
                href={ctaUrl}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-base shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
              >
                <span>{user ? 'Open Dashboard' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/Logo.png"
              alt="WeatherComfort Analytics Logo"
              width={24}
              height={24}
              className="object-contain rounded"
            />
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50 tracking-tight">
              WeatherComfort Analytics
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm text-center md:text-left leading-normal">
            Real-time multi-city comfort analysis and index ranking pipeline, engineered securely on the backend.
          </p>

          <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <span>© {currentYear} WeatherComfort Analytics. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
