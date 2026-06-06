"use client";

import { useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * useNavigation — production-grade navigation hook.
 *
 * Wraps router.push with:
 * 1. isPending state — disable buttons immediately after first click
 * 2. Dedup guard — ignores repeated calls within 800ms
 * 3. startTransition — marks navigation as non-urgent so UI stays responsive
 *
 * Usage:
 *   const { navigate, isPending } = useNavigation();
 *   <button disabled={isPending} onClick={() => navigate('/workspace')}>Go</button>
 */
export function useNavigation() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const lastNavigateTime = useRef(0);
  const lastHref = useRef("");

  const navigate = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      const now = Date.now();
      // Dedup: ignore if same href within 800ms
      if (href === lastHref.current && now - lastNavigateTime.current < 800) {
        return;
      }
      lastNavigateTime.current = now;
      lastHref.current = href;

      startTransition(() => {
        if (options?.replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      });
    },
    [router]
  );

  const navigateReplace = useCallback(
    (href: string) => navigate(href, { replace: true }),
    [navigate]
  );

  return { navigate, navigateReplace, isPending };
}
