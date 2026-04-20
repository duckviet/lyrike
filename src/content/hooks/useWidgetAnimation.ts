import { useEffect, useRef, RefObject } from "react";
import gsap from "gsap";

export function useWidgetAnimation(show: boolean | string | undefined): { widgetRef: RefObject<HTMLDivElement | null> } {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!show || !widgetRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        widgetRef.current!,
        { opacity: 0, y: 20, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" },
      );
    }, widgetRef);

    return () => ctx.revert();
  }, [show]);

  return { widgetRef };
}
