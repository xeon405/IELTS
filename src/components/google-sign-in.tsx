"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Official Google Identity Services "Sign in with Google" button.
 * Loads the GIS script, initializes it with the client ID, and renders the
 * branded button. The credential (ID token JWT) is passed to onCredential,
 * which sends it to POST /auth/google on the backend.
 */
export default function GoogleSignIn({
  clientId,
  onCredential,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredential(response.credential);
        },
        auto_select: false,
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-[#d8c8a8] bg-white/60 px-4 py-3 text-center text-xs font-semibold text-[#66746e]">
        Google sign-in is not configured yet. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to the frontend and GOOGLE_CLIENT_ID to
        the backend.
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="google-signin-button" />
    </div>
  );
}
