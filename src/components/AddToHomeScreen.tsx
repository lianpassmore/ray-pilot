"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function AddToHomeScreen() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user already dismissed
    if (localStorage.getItem("ray-a2hs-dismissed")) return;

    // Detect iOS Safari (no beforeinstallprompt support)
    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);

    if (ios && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // Android / desktop Chrome — capture the native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem("ray-a2hs-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[60] animate-[fadeIn_0.4s_ease-out] sm:left-auto sm:right-6 sm:max-w-sm">
      <div className="rounded-2xl border border-charcoal/10 bg-linen p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <img
            src="/icon-192.png"
            alt="Ray"
            className="h-12 w-12 rounded-xl"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-charcoal">
              Add Ray to your home screen
            </p>
            <p className="mt-0.5 text-xs text-warm-grey">
              {isIOS
                ? "Tap the share button, then \"Add to Home Screen\"."
                : "Get quick access anytime — just like a real app."}
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="mt-0.5 text-warm-grey transition-colors hover:text-charcoal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!isIOS && (
          <button
            onClick={handleInstall}
            className="mt-4 w-full rounded-xl bg-charcoal py-2.5 text-sm font-medium text-linen transition-opacity hover:opacity-90"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
