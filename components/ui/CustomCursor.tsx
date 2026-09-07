"use client";

import React, { useEffect, useRef, useState } from "react";

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // References that persist across frames without re-triggering React renders
  const mousePos = useRef({ x: -100, y: -100 });
  const boxPos = useRef({ x: -100, y: -100 });
  const hasMoved = useRef(false);

  useEffect(() => {
    // Only enable on desktop with fine pointer
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!hasMoved.current) {
        hasMoved.current = true;
        boxPos.current.x = e.clientX;
        boxPos.current.y = e.clientY;
        setIsVisible(true);
      }

      // Check context hover target
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      if (cursorTarget) {
        setLabel(cursorTarget.getAttribute("data-cursor"));
        setIsHovered(true);
      } else if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "LABEL" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest(".cartridge") ||
        target.closest(".ans-btn")
      ) {
        setLabel("TARGET");
        setIsHovered(true);
      } else {
        setLabel(null);
        setIsHovered(false);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // High performance RAF loop using direct GPU transforms
    const renderLoop = () => {
      if (cursorRef.current && hasMoved.current) {
        cursorRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }

      if (boxRef.current && hasMoved.current) {
        // Smooth lerp trailing targeting crosshair
        const dx = mousePos.current.x - boxPos.current.x;
        const dy = mousePos.current.y - boxPos.current.y;
        boxPos.current.x += dx * 0.45;
        boxPos.current.y += dy * 0.45;

        // Position box relative to cursor center
        const relX = boxPos.current.x - mousePos.current.x;
        const relY = boxPos.current.y - mousePos.current.y;
        boxRef.current.style.transform = `translate3d(${relX}px, ${relY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[99999] top-0 left-0"
      style={{
        willChange: "transform",
        transform: "translate3d(-100px, -100px, 0)",
      }}
    >
      {/* Central Phosphor Square Dot (Instant 1:1 hardware tracking) */}
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#39FF14] transition-transform duration-75 ${
          isClicking
            ? "scale-50 bg-[#00E5FF]"
            : isHovered
            ? "scale-125 shadow-[0_0_6px_#39FF14]"
            : "scale-100"
        }`}
      />

      {/* Target Crosshair Box (Smooth lerping target) */}
      <div
        ref={boxRef}
        className={`absolute border border-[#39FF14]/60 transition-all duration-150 ${
          isHovered
            ? "w-10 h-10 border-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.5)]"
            : "w-6 h-6 border-[#39FF14]/40"
        }`}
        style={{
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      >
        {/* Corner registration notches */}
        <div className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l border-[#39FF14]" />
        <div className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t border-r border-[#39FF14]" />
        <div className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b border-l border-[#39FF14]" />
        <div className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r border-[#39FF14]" />
      </div>

      {/* Context Badge Label */}
      {label && (
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0A0B0D] border border-[#39FF14] px-1.5 py-0.5 text-[8px] font-mono tracking-widest text-[#39FF14] shadow-[2px_2px_0px_#000000]"
          style={{ pointerEvents: "none" }}
        >
          [{label}]
        </div>
      )}
    </div>
  );
};
