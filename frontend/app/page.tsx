'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { Sun, CloudRain, ShieldCheck, Compass, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-[80vh] px-4 py-16 relative overflow-hidden bg-radial from-zinc-900 to-zinc-950 text-white select-none">
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
        {/* App Logo Emblem */}
        <div className="flex items-center justify-center p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 shadow-xl shadow-black/40">
          <Sun className="w-10 h-10 text-amber-400 animate-spin-slow" />
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 mb-6 leading-tight">
          WeatherComfort Analytics
        </h1>

        {/* Description */}
        <p className="max-w-xl text-lg sm:text-xl text-zinc-400 font-medium leading-relaxed mb-10">
          Real-time weather analytics calculating optimal outdoor comfort indices for major global cities, securely tracked and processed on demand.
        </p>

        {/* Action Panel */}
        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin" />
          ) : user ? (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-100 active:scale-98 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
          ) : (
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-100 active:scale-98 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer"
            >
              <span>Access Comfort Ranking</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
          )}
        </div>

        {/* Micro-Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl w-full">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl text-left backdrop-blur">
            <Compass className="w-6 h-6 text-teal-400 mb-3 shrink-0" />
            <h3 className="font-semibold text-zinc-200 mb-1.5">Multi-City Ranking</h3>
            <p className="text-sm text-zinc-400 leading-normal">
              Predefined global city databases processed concurrently using strict, stable ranking algorithms.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl text-left backdrop-blur">
            <CloudRain className="w-6 h-6 text-indigo-400 mb-3 shrink-0" />
            <h3 className="font-semibold text-zinc-200 mb-1.5">Comfort Index math</h3>
            <p className="text-sm text-zinc-400 leading-normal">
              Scientific parameters weighting Temperature, Humidity, Wind speed, and Cloudiness metrics.
            </p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl text-left backdrop-blur">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3 shrink-0" />
            <h3 className="font-semibold text-zinc-200 mb-1.5">Auth0 Security</h3>
            <p className="text-sm text-zinc-400 leading-normal">
              Token verification and endpoint security checking token authenticity and user permissions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
