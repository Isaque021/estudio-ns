"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MAX_ANGLE = 18;

export function LogoTilt({ children }: { children: ReactNode }) {
  const plateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = plateRef.current;
    if (!element) return;

    const plate = element;
    const mouse = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let frame: number | null = null;
    let rotateX = 0;
    let rotateY = 0;

    function apply() {
      frame = null;
      plate.style.setProperty(
        "--plate-rotate-x",
        `${rotateX.toFixed(2)}deg`,
      );
      plate.style.setProperty(
        "--plate-rotate-y",
        `${rotateY.toFixed(2)}deg`,
      );
    }

    function reset() {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = null;
      rotateX = 0;
      rotateY = 0;

      plate.style.setProperty("--plate-rotate-x", "0deg");
      plate.style.setProperty("--plate-rotate-y", "0deg");
    }

    function onMove(event: PointerEvent) {
      if (
        event.pointerType !== "mouse" ||
        !mouse.matches ||
        reducedMotion.matches
      ) {
        return;
      }

      const bounds = (
        plate.parentElement ?? plate
      ).getBoundingClientRect();

      const radius = Math.max(bounds.width * 2, 280);
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const clamp = (value: number) =>
        Math.max(-1, Math.min(1, value));

      rotateX =
        -clamp((event.clientY - centerY) / radius) * MAX_ANGLE;

      rotateY =
        clamp((event.clientX - centerX) / radius) * MAX_ANGLE;

      if (frame === null) {
        frame = requestAnimationFrame(apply);
      }
    }

    function onPointerOut(event: PointerEvent) {
      if (event.relatedTarget === null) {
        reset();
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("blur", reset);
    mouse.addEventListener("change", reset);
    reducedMotion.addEventListener("change", reset);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", reset);
      mouse.removeEventListener("change", reset);
      reducedMotion.removeEventListener("change", reset);
      reset();
    };
  }, []);

  return (
    <div ref={plateRef} className="logo-plate pointer-events-none">
      {children}
    </div>
  );
}