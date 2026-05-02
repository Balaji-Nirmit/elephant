import { useEffect, useState } from "react";

const TABLET_BREAKPOINT = 1024;

/**
 * Returns true on phones AND tablets (anything ≤ 1023px wide OR a coarse pointer).
 * Used to swap in mobile-friendly editing affordances (no ctrl+/, fixed toolbar above keyboard).
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    const compute = () => {
      const widthSmall = window.innerWidth < TABLET_BREAKPOINT;
      const coarse =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;
      setIsTouch(widthSmall || coarse);
    };

    compute();
    window.addEventListener("resize", compute);
    const mql = window.matchMedia("(pointer: coarse)");
    mql.addEventListener?.("change", compute);

    return () => {
      window.removeEventListener("resize", compute);
      mql.removeEventListener?.("change", compute);
    };
  }, []);

  return isTouch;
}
