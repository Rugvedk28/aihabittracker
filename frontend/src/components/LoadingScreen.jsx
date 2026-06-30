import { useEffect, useMemo, useRef, useState } from "react";

const MESSAGES = [
  "Connecting securely...",
  "Preparing today's dashboard...",
  "Loading AI insights...",
  "Synchronizing your habits...",
  "Almost ready...",
];

const HEALTH_TIMEOUT_MS = 1800;
const POLL_INTERVAL_MS = 2000;

export default function LoadingScreen({ onReady }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const notifiedRef = useRef(false);

  const healthUrl = useMemo(() => {
    const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    return `${base}/health`;
  }, []);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, 3000);

    return () => window.clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    let active = true;
    let intervalId;
    let timeoutId;
    let currentController = null;

    const finish = () => {
      if (!active || notifiedRef.current) return;
      notifiedRef.current = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      onReady?.();
    };

    const pingBackend = async () => {
      if (!active || notifiedRef.current) return;

      if (currentController) {
        currentController.abort();
      }

      const controller = new AbortController();
      currentController = controller;

      timeoutId = window.setTimeout(() => {
        controller.abort();
      }, HEALTH_TIMEOUT_MS);

      try {
        const response = await fetch(healthUrl, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          finish();
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          // Intentionally silent; we keep polling until the backend wakes up.
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (currentController === controller) {
          currentController = null;
        }
      }
    };

    pingBackend();
    intervalId = window.setInterval(pingBackend, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      if (currentController) {
        currentController.abort();
      }
    };
  }, [healthUrl, onReady]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_35%)]" />
      <div className="absolute left-10 top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
      <div className="absolute right-8 top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse [animation-delay:700ms]" />
      <div className="absolute bottom-8 left-1/4 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl animate-pulse [animation-delay:1200ms]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/8 p-6 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.85)] backdrop-blur-2xl sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-3xl font-semibold text-white shadow-lg shadow-sky-500/25 animate-pulse">
                P
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                ProHabit
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-300 sm:text-lg">
                Build better habits.
                <br />
                One day at a time.
              </p>

              <div className="mt-10 flex items-center gap-3 text-sm font-medium text-slate-200">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
                <span>Starting your workspace...</span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-full border border-white/15 border-t-cyan-300 bg-white/5"
                  style={{ animation: "spin 1s linear infinite" }}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500"
                      style={{ animation: "loading-slide 1.7s ease-in-out infinite" }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-300 transition-opacity duration-300">
                    {MESSAGES[messageIndex]}
                  </p>
                </div>
              </div>

              <p className="mt-10 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                The backend is hosted on Render's free tier.
                <br />
                The first visit may take around 20–40 seconds.
              </p>

              <p className="mt-8 text-xs uppercase tracking-[0.3em] text-slate-500">
                Crafted with ❤️ by Rugved Kulkarni
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-slide {
          0% {
            transform: translateX(-20%);
            opacity: 0.55;
          }
          50% {
            transform: translateX(140%);
            opacity: 1;
          }
          100% {
            transform: translateX(-20%);
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  );
}
