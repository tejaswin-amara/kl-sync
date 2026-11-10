'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      !('serviceWorker' in navigator) ||
      !window.isSecureContext
    ) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .catch((error: unknown) => {
          console.warn(
            '[SW] Registration failed:',
            error instanceof Error ? error.message : 'Unknown error'
          );
        });
    };

    // React effects can run after the window's load event. Register
    // immediately in that case instead of waiting for an event that has
    // already fired (which would leave an old worker active indefinitely).
    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
