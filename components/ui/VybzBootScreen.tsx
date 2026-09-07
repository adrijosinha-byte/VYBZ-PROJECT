"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface VybzBootScreenProps {
  onComplete?: () => void;
}

export const VybzBootScreen: React.FC<VybzBootScreenProps> = ({ onComplete }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Master container ref
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase refs
  const diagTopLeftRef = useRef<HTMLDivElement>(null);
  const diagTopRightRef = useRef<HTMLDivElement>(null);
  const diagBottomLeftRef = useRef<HTMLDivElement>(null);
  const diagBottomRightRef = useRef<HTMLDivElement>(null);

  // Kinetic phase 2 ref
  const kineticAssemblyRef = useRef<HTMLDivElement>(null);

  // Main logo phase 3 refs
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  const logoMainRef = useRef<HTMLHeadingElement>(null);
  const logoRedGlitchRef = useRef<HTMLHeadingElement>(null);
  const logoCyanGlitchRef = useRef<HTMLHeadingElement>(null);

  // Subtitle & status phase 4 refs
  const sublineRef = useRef<HTMLDivElement>(null);
  const statusBadgeRef = useRef<HTMLDivElement>(null);
  const pressStartRef = useRef<HTMLDivElement>(null);

  // Phase 5 transition effect refs
  const flashOverlayRef = useRef<HTMLDivElement>(null);
  const beamWipeRef = useRef<HTMLDivElement>(null);
  const scanlinesRef = useRef<HTMLDivElement>(null);
  const frameBorderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      const container = containerRef.current;
      const logoWrapper = logoWrapperRef.current;
      const logoMain = logoMainRef.current;
      const logoRed = logoRedGlitchRef.current;
      const logoCyan = logoCyanGlitchRef.current;
      const subline = sublineRef.current;
      const statusBadge = statusBadgeRef.current;
      const pressStart = pressStartRef.current;
      const flash = flashOverlayRef.current;
      const beamWipe = beamWipeRef.current;
      const kineticAssembly = kineticAssemblyRef.current;
      const scanlines = scanlinesRef.current;
      const frameBorder = frameBorderRef.current;

      const finishBoot = () => {
        if (container) {
          container.style.display = "none";
          container.style.pointerEvents = "none";
          container.style.visibility = "hidden";
        }
        setIsDismissed(true);
        if (onComplete) {
          onComplete();
        }
      };

      if (prefersReducedMotion) {
        // Fast reduced-motion reveal: 0.4s clean transition
        const quickTl = gsap.timeline({ onComplete: finishBoot });
        quickTl
          .set([logoWrapper, logoMain], { opacity: 1, scale: 1 })
          .to(container, {
            opacity: 0,
            duration: 1.4,
            ease: "power2.inOut",
            delay: 0.3,
          });
        return;
      }

      // Initial element states
      gsap.set(container, { opacity: 1, visibility: "visible" });
      gsap.set(
        [
          diagTopLeftRef.current,
          diagTopRightRef.current,
          diagBottomLeftRef.current,
          diagBottomRightRef.current,
        ],
        { opacity: 0 }
      );
      gsap.set(kineticAssembly, { opacity: 0, scale: 0.9 });
      gsap.set(logoWrapper, { opacity: 0, scale: 0.72, skewX: -6 });
      gsap.set(logoMain, {
        opacity: 0,
        filter: "blur(14px)",
        scaleX: 1.25,
      });
      gsap.set([logoRed, logoCyan], { opacity: 0 });
      gsap.set([subline, statusBadge, pressStart], { opacity: 0, y: 8 });
      gsap.set(flash, { opacity: 0 });
      gsap.set(beamWipe, { top: "-10%", opacity: 0 });
      gsap.set(frameBorder, { opacity: 0, scale: 0.98 });
      gsap.set(scanlines, { opacity: 0.3 });

      // ── MASTER GSAP TIMELINE ─────────────────────────────────────────
      const master = gsap.timeline({
        onComplete: finishBoot,
      });

      // ═════════════════════════════════════════════════════════════════
      // PHASE 1 — SYSTEM WAKE (0.00s - 0.65s)
      // Monospace hardware diagnostics appear in peripheral HUD corners
      // ═════════════════════════════════════════════════════════════════
      master
        .to(
          frameBorder,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          },
          0.1
        )
        .to(
          diagTopLeftRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "steps(4)",
          },
          0.15
        )
        .to(
          diagTopRightRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: "steps(4)",
          },
          0.22
        )
        .to(
          diagBottomLeftRef.current,
          {
            opacity: 1,
            duration: 0.2,
            ease: "steps(3)",
          },
          0.32
        )
        .to(
          diagBottomRightRef.current,
          {
            opacity: 1,
            duration: 0.2,
            ease: "steps(3)",
          },
          0.4
        );

      // ═════════════════════════════════════════════════════════════════
      // PHASE 2 — SIGNAL ACTIVATION & KINETIC TYPOGRAPHY (0.55s - 1.25s)
      // Rapid CRT scanline flicker, digital glitch, letter stepping
      // V → VY → VYB → VYBZ
      // ═════════════════════════════════════════════════════════════════
      master
        // CRT flicker pulse
        .to(
          scanlines,
          {
            opacity: 0.85,
            duration: 0.08,
            repeat: 3,
            yoyo: true,
            ease: "rough({strength: 1.5, points: 10, template: power0.none})",
          },
          0.5
        )
        // Kinetic assembly box appears
        .to(
          kineticAssembly,
          {
            opacity: 1,
            scale: 1,
            duration: 0.08,
          },
          0.55
        )
        // Step 1: V
        .call(
          () => {
            if (kineticAssembly) kineticAssembly.innerText = "V";
          },
          undefined,
          0.58
        )
        .to(
          kineticAssembly,
          {
            x: -2,
            duration: 0.04,
            yoyo: true,
            repeat: 1,
          },
          0.6
        )
        // Step 2: VY
        .call(
          () => {
            if (kineticAssembly) kineticAssembly.innerText = "VY";
          },
          undefined,
          0.72
        )
        .to(
          kineticAssembly,
          {
            x: 3,
            duration: 0.04,
            yoyo: true,
            repeat: 1,
          },
          0.74
        )
        // Step 3: VYB
        .call(
          () => {
            if (kineticAssembly) kineticAssembly.innerText = "VYB";
          },
          undefined,
          0.86
        )
        .to(
          kineticAssembly,
          {
            x: -4,
            scale: 1.05,
            duration: 0.04,
            yoyo: true,
            repeat: 1,
          },
          0.88
        )
        // Step 4: VYBZ
        .call(
          () => {
            if (kineticAssembly) kineticAssembly.innerText = "VYBZ";
          },
          undefined,
          1.0
        )
        // Fade out kinetic placeholder as massive logo impact takes over
        .to(
          kineticAssembly,
          {
            opacity: 0,
            scale: 1.15,
            duration: 0.1,
            ease: "power1.in",
          },
          1.1
        );

      // ═════════════════════════════════════════════════════════════════
      // PHASE 3 — THE VYBZ LOGO REVEAL (1.12s - 2.00s)
      // Massive, heavy arcade cabinet impact:
      // scale 0.72 → 1.06 → 1.0, blur → sharp, stretch, skew, chromatic snap
      // ═════════════════════════════════════════════════════════════════
      master
        // Reveal logo wrapper
        .to(
          logoWrapper,
          {
            opacity: 1,
            scale: 1.06,
            skewX: 0,
            duration: 0.36,
            ease: "power3.out",
          },
          1.12
        )
        // Settle wrapper from overshoot to 1.0
        .to(
          logoWrapper,
          {
            scale: 1.0,
            duration: 0.28,
            ease: "back.out(2)",
          },
          1.48
        )
        // Animate main logo: blur drops, stretch normalizes, crisp appearance
        .to(
          logoMain,
          {
            opacity: 1,
            filter: "blur(0px)",
            scaleX: 1.0,
            duration: 0.35,
            ease: "power2.out",
          },
          1.12
        )
        // Chromatic split: Red & Cyan aberration offset jitter
        .set(
          [logoRed, logoCyan],
          {
            opacity: 0.8,
          },
          1.14
        )
        .to(
          logoRed,
          {
            x: -7,
            y: -2,
            duration: 0.06,
            repeat: 2,
            yoyo: true,
          },
          1.14
        )
        .to(
          logoCyan,
          {
            x: 7,
            y: 2,
            duration: 0.06,
            repeat: 2,
            yoyo: true,
          },
          1.14
        )
        // Snap chromatic layers back into alignment
        .to(
          [logoRed, logoCyan],
          {
            x: 0,
            y: 0,
            opacity: 0,
            duration: 0.16,
            ease: "power2.inOut",
          },
          1.32
        )
        // Subtle hardware screen shake on the whole container
        .to(
          container,
          {
            y: -3,
            duration: 0.03,
            repeat: 3,
            yoyo: true,
          },
          1.15
        );

      // ═════════════════════════════════════════════════════════════════
      // PHASE 4 — SYSTEM IDENTIFICATION (1.70s - 2.50s)
      // Subtitle line, status badge, and arcade prompt reveal
      // ═════════════════════════════════════════════════════════════════
      master
        .to(
          subline,
          {
            opacity: 1,
            y: 0,
            duration: 0.26,
            ease: "power2.out",
          },
          1.7
        )
        .to(
          statusBadge,
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
          },
          1.85
        )
        .to(
          pressStart,
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          },
          2.02
        );

      // ═════════════════════════════════════════════════════════════════
      // PHASE 5 — FINAL IMPACT & TRANSITION (2.55s - 3.25s)
      // Scale toward camera, brightness spike, horizontal CRT sweep,
      // and dissolve directly into the existing landing page
      // ═════════════════════════════════════════════════════════════════
      master
        // Hold briefly for visual gravitas (2.02s to 2.55s)
        // Rapid scale toward camera
        .to(
          logoWrapper,
          {
            scale: 1.08,
            duration: 0.25,
            ease: "power2.in",
          },
          2.55
        )
        // Screen brightness flash spike
        .to(
          flash,
          {
            opacity: 0.75,
            duration: 0.08,
            ease: "power1.in",
          },
          2.65
        )
        .to(
          flash,
          {
            opacity: 0,
            duration: 0.25,
            ease: "power2.out",
          },
          2.73
        )
        // High-energy horizontal CRT sweep traveling across viewport
        .set(
          beamWipe,
          {
            opacity: 1,
            top: "-5%",
          },
          2.62
        )
        .to(
          beamWipe,
          {
            top: "105%",
            duration: 0.42,
            ease: "power2.inOut",
          },
          2.62
        )
        // Fade out peripheral diagnostics
        .to(
          [
            diagTopLeftRef.current,
            diagTopRightRef.current,
            diagBottomLeftRef.current,
            diagBottomRightRef.current,
            subline,
            statusBadge,
            pressStart,
            frameBorder,
          ],
          {
            opacity: 0,
            duration: 0.2,
            ease: "power1.in",
          },
          2.65
        )
        // Collapse & wipe boot screen layer away to reveal landing page
        .to(
          container,
          {
            opacity: 0,
            scale: 1.03,
            filter: "blur(6px)",
            duration: 0.45,
            ease: "power2.inOut",
          },
          2.75
        );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [onComplete]);

  // If already dismissed from state, do not render into DOM
  if (isDismissed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="vybz-boot-screen"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99995, // Above landing page content, below CustomCursor (99999)
        background: "#0A0B0D", // var(--void)
        color: "#F3F1EC", // var(--txt)
        fontFamily: "var(--sg)",
        overflow: "hidden",
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        willChange: "transform, opacity, filter",
      }}
    >
      {/* ── CRT SCANLINES BACKGROUND LAYER ────────────────────────────── */}
      <div
        ref={scanlinesRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)",
          opacity: 0.4,
        }}
      />

      {/* ── CRT RADIAL VIGNETTE ────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {/* ── SUBTLE HARDWARE DOT MATRIX ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          backgroundImage:
            "radial-gradient(circle, rgba(57,255,20,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── RETRO ARCADE HUD REGISTRATION FRAME ───────────────────────── */}
      <div
        ref={frameBorderRef}
        style={{
          position: "absolute",
          inset: "16px",
          border: "1px solid rgba(57,255,20,0.14)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {/* Corner registration brackets */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 12,
            height: 12,
            borderTop: "2px solid #39FF14",
            borderLeft: "2px solid #39FF14",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 12,
            height: 12,
            borderTop: "2px solid #39FF14",
            borderRight: "2px solid #39FF14",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: -1,
            width: 12,
            height: 12,
            borderBottom: "2px solid #39FF14",
            borderLeft: "2px solid #39FF14",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 12,
            height: 12,
            borderBottom: "2px solid #39FF14",
            borderRight: "2px solid #39FF14",
          }}
        />
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          PERIPHERAL HARDWARE DIAGNOSTICS (PHASE 1)
      ═════════════════════════════════════════════════════════════════ */}
      {/* Top-Left Diagnostics */}
      <div
        ref={diagTopLeftRef}
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          zIndex: 10,
          fontFamily: "var(--jb)",
          fontSize: 10,
          color: "rgba(243,241,236,0.6)",
          letterSpacing: "0.12em",
          lineHeight: 1.6,
          textTransform: "uppercase",
        }}
      >
        <div style={{ color: "#39FF14", fontWeight: 700 }}>
          ┌ VYBZ SYSTEM // BIOS v4.02.1
        </div>
        <div>SYS_CHASSIS: RUNNING [60Hz]</div>
        <div>DUAL RHYTHM ENGINE: ONLINE</div>
        <div style={{ color: "#00E5FF" }}>PHOSPHOR GRID: ACTIVE</div>
      </div>

      {/* Top-Right Diagnostics */}
      <div
        ref={diagTopRightRef}
        style={{
          position: "absolute",
          top: 28,
          right: 28,
          zIndex: 10,
          fontFamily: "var(--jb)",
          fontSize: 10,
          color: "rgba(243,241,236,0.6)",
          letterSpacing: "0.12em",
          lineHeight: 1.6,
          textAlign: "right",
          textTransform: "uppercase",
        }}
      >
        <div>
          MEMORY CORE <span style={{ color: "#39FF14" }}>..... [ OK ]</span>
        </div>
        <div>
          CHAT ENGINE <span style={{ color: "#39FF14" }}>..... [ ONLINE ]</span>
        </div>
        <div>
          SOCIAL GRAPH <span style={{ color: "#00E5FF" }}>.... [ SYNCED ]</span>
        </div>
        <div>
          TRIVIA ENGINE <span style={{ color: "#39FF14" }}>... [ READY ]</span>
        </div>
        <div>
          ARCADE MODULE <span style={{ color: "#FFD000" }}>... [ ARMED ┐]</span>
        </div>
      </div>

      {/* Bottom-Left Diagnostics */}
      <div
        ref={diagBottomLeftRef}
        style={{
          position: "absolute",
          bottom: 28,
          left: 28,
          zIndex: 10,
          fontFamily: "var(--jb)",
          fontSize: 10,
          color: "rgba(126,130,140,0.85)",
          letterSpacing: "0.1em",
          lineHeight: 1.6,
        }}
      >
        <div>└ TERMINAL: HOST_PRIMARY_01</div>
        <div>BUS POLLING: 1000FPS // LATENCY: 0.18ms</div>
        <div style={{ color: "#39FF14" }}>STATUS: BOOT_INITIALIZED</div>
      </div>

      {/* Bottom-Right Diagnostics */}
      <div
        ref={diagBottomRightRef}
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          zIndex: 10,
          fontFamily: "var(--jb)",
          fontSize: 10,
          color: "rgba(126,130,140,0.85)",
          letterSpacing: "0.1em",
          lineHeight: 1.6,
          textAlign: "right",
        }}
      >
        <div>CREDITS: FREEPLAY // AUTO_LOAD</div>
        <div style={{ color: "#00E5FF" }}>STAGE: 05 / COMPLETE ┘</div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          PHASE 2: KINETIC TYPOGRAPHY ASSEMBLY (V → VY → VYB → VYBZ)
      ═════════════════════════════════════════════════════════════════ */}
      <div
        ref={kineticAssemblyRef}
        style={{
          position: "absolute",
          zIndex: 15,
          fontFamily: "var(--sg)",
          fontSize: "clamp(64px, 15vw, 190px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#39FF14",
          textShadow:
            "0 0 16px rgba(57,255,20,0.8), 0 0 35px rgba(57,255,20,0.4)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        V
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          PHASE 3: THE VYBZ LOGO REVEAL (MASSIVE CENTERPIECE)
      ═════════════════════════════════════════════════════════════════ */}
      <div
        ref={logoWrapperRef}
        style={{
          position: "relative",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
          willChange: "transform, opacity",
        }}
      >
        {/* Relative Anchor for Main and Chromatic Layers */}
        <div style={{ position: "relative" }}>
          {/* Red/Magenta Chromatic Split Layer */}
          <h1
            ref={logoRedGlitchRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              fontFamily: "var(--sg)",
              fontSize: "clamp(72px, 18vw, 230px)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
              textTransform: "uppercase",
              color: "#FF334B",
              opacity: 0,
              pointerEvents: "none",
              userSelect: "none",
              filter: "blur(1px)",
              mixBlendMode: "screen",
            }}
          >
            VYBZ
          </h1>

          {/* Cyan Chromatic Split Layer */}
          <h1
            ref={logoCyanGlitchRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              fontFamily: "var(--sg)",
              fontSize: "clamp(72px, 18vw, 230px)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
              textTransform: "uppercase",
              color: "#00E5FF",
              opacity: 0,
              pointerEvents: "none",
              userSelect: "none",
              filter: "blur(1px)",
              mixBlendMode: "screen",
            }}
          >
            VYBZ
          </h1>

          {/* Primary Massive VYBZ Logo */}
          <h1
            ref={logoMainRef}
            style={{
              position: "relative",
              fontFamily: "var(--sg)",
              fontSize: "clamp(72px, 18vw, 230px)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
              textTransform: "uppercase",
              color: "#F3F1EC",
              textShadow:
                "0 0 15px rgba(57,255,20,0.9), 0 0 40px rgba(57,255,20,0.5), 0 0 90px rgba(57,255,20,0.25), 4px 4px 0px #000000",
              margin: 0,
              padding: "0 16px",
              userSelect: "none",
              willChange: "transform, filter, opacity",
            }}
          >
            VYBZ
          </h1>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            PHASE 4: SYSTEM IDENTIFICATION & STATUS LINES
        ═════════════════════════════════════════════════════════════ */}
        {/* Arcade Subline */}
        <div
          ref={sublineRef}
          style={{
            marginTop: 18,
            fontFamily: "var(--jb)",
            fontSize: "clamp(10px, 1.6vw, 15px)",
            fontWeight: 700,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: "#39FF14",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textShadow: "0 0 10px rgba(57,255,20,0.6)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              background: "#39FF14",
              boxShadow: "0 0 8px #39FF14",
              display: "inline-block",
            }}
          />
          VYBZ // MEMORY ARCADE SYSTEM
          <span
            style={{
              width: 8,
              height: 8,
              background: "#39FF14",
              boxShadow: "0 0 8px #39FF14",
              display: "inline-block",
            }}
          />
        </div>

        {/* Initialization Complete Status Badge */}
        <div
          ref={statusBadgeRef}
          style={{
            marginTop: 12,
            background: "rgba(17,18,22,0.9)",
            border: "1px solid rgba(57,255,20,0.4)",
            padding: "4px 14px",
            fontFamily: "var(--jb)",
            fontSize: "clamp(9px, 1.2vw, 11px)",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#D8D5CC",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "3px 3px 0 #000000",
          }}
        >
          <span style={{ color: "#39FF14" }}>[SYS]</span>
          <span>INITIALIZATION COMPLETE</span>
          <span
            className="blink"
            style={{
              width: 6,
              height: 10,
              background: "#39FF14",
              display: "inline-block",
            }}
          />
        </div>

        {/* Purely Visual "PRESS START" Prompt */}
        <div
          ref={pressStartRef}
          style={{
            marginTop: 14,
            fontFamily: "var(--jb)",
            fontSize: "clamp(9px, 1.1vw, 11px)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#00E5FF",
            textShadow: "0 0 8px rgba(0,229,255,0.7)",
            opacity: 0,
          }}
        >
          ► READY // ENTERING SYSTEM
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          PHASE 5: TRANSITION & IMPACT OVERLAYS
      ═════════════════════════════════════════════════════════════════ */}
      {/* Screen Brightness Flash Spike Overlay */}
      <div
        ref={flashOverlayRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFFFFF",
          pointerEvents: "none",
          zIndex: 30,
          opacity: 0,
          mixBlendMode: "overlay",
        }}
      />

      {/* Phosphor Beam Wipe Bar */}
      <div
        ref={beamWipeRef}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 6,
          background:
            "linear-gradient(90deg, transparent 0%, #39FF14 20%, #FFFFFF 50%, #39FF14 80%, transparent 100%)",
          boxShadow:
            "0 0 25px #39FF14, 0 0 50px #00E5FF, 0 0 10px #FFFFFF",
          pointerEvents: "none",
          zIndex: 35,
          opacity: 0,
        }}
      />
    </div>
  );
};
