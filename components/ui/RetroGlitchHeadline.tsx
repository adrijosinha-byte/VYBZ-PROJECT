"use client";

import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";

interface RetroGlitchHeadlineProps {
  text: string;
  triggerEntrance?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RetroGlitchHeadline: React.FC<RetroGlitchHeadlineProps> = ({
  text,
  triggerEntrance = false,
  className = "",
  style,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const words = text.split(" ");

  // Minimalistic retro glitch on a single character
  const triggerCharGlitch = useCallback((target: HTMLElement) => {
    if (!target) return;

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      target.style.color = "#39FF14";
      target.style.textShadow = "0 0 8px rgba(57, 255, 20, 0.6)";
      setTimeout(() => {
        target.style.color = "";
        target.style.textShadow = "";
      }, 200);
      return;
    }

    // Kill any active tween on this specific character to keep it responsive
    gsap.killTweensOf(target);

    // Random minimal micro offsets (1-2px)
    const jX1 = (Math.random() - 0.5) * 3;
    const jY1 = (Math.random() - 0.5) * 2;
    const skew1 = (Math.random() - 0.5) * 8;

    const jX2 = (Math.random() - 0.5) * 2;
    const jY2 = (Math.random() - 0.5) * 1.5;

    const tl = gsap.timeline({
      onComplete: () => {
        // Restore styling cleanly
        target.style.color = "";
        target.style.textShadow = "";
        target.style.transform = "";
      },
    });

    tl.to(target, {
      x: jX1,
      y: jY1,
      skewX: skew1,
      color: "#39FF14",
      textShadow:
        "0 0 10px rgba(57, 255, 20, 0.9), 0 0 2px #FFFFFF",
      duration: 0.05,
      ease: "power1.in",
    })
      .to(target, {
        x: jX2,
        y: jY2,
        skewX: 0,
        color: "#00E5FF",
        textShadow:
          "0 0 8px rgba(0, 229, 255, 0.8), 0 0 1px #FFFFFF",
        duration: 0.07,
        ease: "power1.out",
      })
      .to(target, {
        x: 0,
        y: 0,
        skewX: 0,
        color: "var(--txt)",
        textShadow: "0 0 4px rgba(57, 255, 20, 0.2)",
        duration: 0.12,
        ease: "power2.out",
      });
  }, []);

  // Entrance sweep: When triggerEntrance becomes true, ripple-glitch across all letters sequentially
  useEffect(() => {
    if (!triggerEntrance || !containerRef.current) return;

    const chars =
      containerRef.current.querySelectorAll<HTMLElement>(".retro-char");
    if (!chars || chars.length === 0) return;

    chars.forEach((charEl, idx) => {
      setTimeout(() => {
        triggerCharGlitch(charEl);
      }, idx * 45);
    });
  }, [triggerEntrance, triggerCharGlitch]);

  return (
    <h1
      ref={containerRef}
      className={`sg ${className}`}
      style={{
        margin: "0 0 24px",
        textTransform: "uppercase",
        cursor: "default",
        userSelect: "none",
        ...style,
      }}
    >
      {words.map((word, wIdx) => (
        <span
          key={`word-${wIdx}`}
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            marginRight: wIdx < words.length - 1 ? "0.28em" : 0,
          }}
        >
          {word.split("").map((char, cIdx) => (
            <span
              key={`char-${wIdx}-${cIdx}`}
              className="retro-char"
              onMouseEnter={(e) => triggerCharGlitch(e.currentTarget)}
              onTouchStart={(e) => triggerCharGlitch(e.currentTarget)}
              style={{
                display: "inline-block",
                position: "relative",
                transition: "color 0.1s ease",
                willChange: "transform, color, text-shadow",
              }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
};
