"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Barcode } from "@/components/ui/Barcode";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ArcadeFooterProps {
  onReboot?: () => void;
  playClickSound?: () => void;
  playCoinSound?: () => void;
}

export const ArcadeFooter: React.FC<ArcadeFooterProps> = ({
  onReboot,
  playClickSound,
  playCoinSound,
}) => {
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const hudLinesRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const scanSweepRef = useRef<HTMLDivElement>(null);

  // Mini terminal state
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "WHAT MEMORY WILL YOU LOAD NEXT? INSERT ARCHIVE OR REBOOT SYSTEM."
  );
  const [commandInput, setCommandInput] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !footerRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 88%",
          end: "bottom top",
          toggleActions: "play reverse play reverse",
        },
      });

      // Initial states
      gsap.set(logoRef.current, { opacity: 0, y: 32, scale: 0.96 });
      gsap.set(hudLinesRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(telemetryRef.current, { opacity: 0, y: 20 });

      tl.to(hudLinesRef.current, {
        scaleX: 1,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
      })
        .to(
          logoRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          telemetryRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
          },
          "-=0.45"
        )
        .fromTo(
          scanSweepRef.current,
          { top: "-10%", opacity: 0.8 },
          { top: "110%", opacity: 0, duration: 0.85, ease: "power2.inOut" },
          "-=0.5"
        );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  const handleCommand = (cmd: string) => {
    playClickSound?.();
    const cleanCmd = cmd.trim().toUpperCase();
    if (cleanCmd === "REBOOT") {
      setTerminalOutput(">> EXECUTING CHASSIS REBOOT SEQUENCE...");
      setTimeout(() => {
        onReboot?.();
      }, 350);
    } else if (cleanCmd === "STATUS") {
      setTerminalOutput(">> ALL MEMORY NODES OPERATIONAL // FREQ: 60Hz // LATENCY: 0.18ms");
    } else if (cleanCmd === "LORE") {
      setTerminalOutput(">> CHAT FRAGMENTS PARSED // READY TO GENERATE CUSTOM ARCADE ROUNDS");
    } else if (cleanCmd === "CREDITS") {
      setTerminalOutput(">> VYBZ RETRO-FUTURISTIC ENGINE // CREATED FOR ARCADE MEMORY TOURNAMENTS");
    } else {
      setTerminalOutput(`>> UNRECOGNIZED INPUT: "${cleanCmd}". VALID: STATUS, LORE, CREDITS, REBOOT`);
    }
  };

  const handleRebootClick = () => {
    playCoinSound?.();
    setTerminalOutput(">> MANUAL SYSTEM REBOOT TRIGGERED...");
    onReboot?.();
  };

  return (
    <footer
      ref={footerRef}
      id="arcade-footer"
      style={{
        position: "relative",
        background: "var(--chassis)",
        borderTop: "1px solid var(--border)",
        padding: "80px 0 40px 0",
        fontFamily: "var(--sg)",
        color: "var(--txt)",
        overflow: "hidden",
      }}
    >
      {/* ── AMBIENT SCANLINE SWEEP ──────────────────────────────────── */}
      <div
        ref={scanSweepRef}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 30,
          background:
            "linear-gradient(180deg, transparent, rgba(57,255,20,0.25), transparent)",
          pointerEvents: "none",
          zIndex: 2,
          opacity: 0,
        }}
      />

      {/* ── CRT RASTER OVERLAY ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
          opacity: 0.6,
          zIndex: 1,
        }}
      />

      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 5,
        }}
      >
        {/* ── TOP HUD EXTENSION LINE ─────────────────────────────────── */}
        <div
          ref={hudLinesRef}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border2)",
            paddingBottom: 14,
            marginBottom: 48,
            fontFamily: "var(--jb)",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "var(--muted)",
            transformOrigin: "left center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--green)", fontWeight: 700 }}>
              ┌ TERMINAL CHASSIS // SHUTDOWN & ARCHIVE
            </span>
            <span style={{ color: "var(--border2)" }}>|</span>
            <span>SYSTEM BUS: 60Hz</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>PHOSPHOR: ACTIVE</span>
            <span style={{ color: "var(--green)" }}>READY ┐</span>
          </div>
        </div>

        {/* ── MONUMENTAL VYBZ ARCADE HEADLINE & REBOOT TRIGGER ────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 32,
            marginBottom: 56,
          }}
        >
          <div>
            <div
              className="jb"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--green)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "var(--green)",
                  boxShadow: "0 0 6px var(--green)",
                  display: "inline-block",
                }}
              />
              MEMORY ARCADE SYSTEM
            </div>

            <h2
              ref={logoRef}
              style={{
                fontFamily: "var(--sg)",
                fontSize: "clamp(54px, 12vw, 150px)",
                fontWeight: 800,
                lineHeight: 0.85,
                letterSpacing: "-0.05em",
                textTransform: "uppercase",
                color: "var(--txt)",
                margin: 0,
                textShadow:
                  "0 0 20px rgba(57,255,20,0.4), 4px 4px 0px #000000",
              }}
            >
              VYBZ
            </h2>
          </div>

          {/* ── CREATIVE INTERACTIVE ELEMENT: REBOOT VYBZ BUTTON ─────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              className="jb"
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              ARCADE CHASSIS SERVICE CONTROL
            </div>

            <button
              type="button"
              onClick={handleRebootClick}
              className="btn-arcade-reboot"
              style={{
                background: "var(--void)",
                border: "2px solid var(--green)",
                color: "var(--green)",
                fontFamily: "var(--jb)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "14px 28px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                boxShadow:
                  "0 0 14px rgba(57,255,20,0.35), 4px 4px 0 #000000",
                transition: "all 0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--green)";
                e.currentTarget.style.color = "#000";
                e.currentTarget.style.transform = "translate(-2px, -2px)";
                e.currentTarget.style.boxShadow =
                  "0 0 20px var(--green), 6px 6px 0 #000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--void)";
                e.currentTarget.style.color = "var(--green)";
                e.currentTarget.style.transform = "translate(0px, 0px)";
                e.currentTarget.style.boxShadow =
                  "0 0 14px rgba(57,255,20,0.35), 4px 4px 0 #000000";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translate(2px, 2px)";
                e.currentTarget.style.boxShadow = "2px 2px 0 #000000";
              }}
            >
              <span
                className="blink"
                style={{
                  width: 8,
                  height: 8,
                  background: "currentColor",
                  display: "inline-block",
                }}
              />
              REBOOT VYBZ ↺
            </button>

            <span
              className="jb"
              style={{
                fontSize: 9,
                color: "var(--muted)",
                letterSpacing: "0.08em",
              }}
            >
              TRIGGER HARDWARE BOOT SEQUENCE
            </span>
          </div>
        </div>

        {/* ── CREATIVE ELEMENT 2: RETRO TERMINAL CONSOLE ────────────── */}
        <div
          style={{
            background: "var(--void)",
            border: "1px solid var(--border)",
            padding: "20px 24px",
            marginBottom: 48,
            boxShadow: "4px 4px 0 #000000",
            position: "relative",
          }}
        >
          {/* Registration corner notches */}
          <div
            style={{
              position: "absolute",
              top: -1,
              left: -1,
              width: 8,
              height: 8,
              borderTop: "2px solid var(--green)",
              borderLeft: "2px solid var(--green)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 8,
              height: 8,
              borderBottom: "2px solid var(--green)",
              borderRight: "2px solid var(--green)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
              fontFamily: "var(--jb)",
              fontSize: 9,
              color: "var(--muted)",
              letterSpacing: "0.12em",
            }}
          >
            <span>&gt; INTERACTIVE MEMORY TERMINAL</span>
            <span>PROMPT ACTIVE</span>
          </div>

          <div
            className="jb"
            style={{
              fontSize: 11,
              color: "var(--green)",
              marginBottom: 14,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
              minHeight: 34,
            }}
          >
            {terminalOutput}
          </div>

          {/* Quick command buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              className="jb"
              style={{
                fontSize: 9,
                color: "var(--muted)",
                letterSpacing: "0.08em",
              }}
            >
              EXECUTE COMMAND:
            </span>
            {["STATUS", "LORE", "CREDITS", "REBOOT"].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleCommand(cmd)}
                className="jb"
                style={{
                  background: "var(--cart)",
                  border: "1px solid var(--border)",
                  color: "var(--txt2)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--green)";
                  e.currentTarget.style.color = "var(--green)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--txt2)";
                }}
              >
                [{cmd}]
              </button>
            ))}
          </div>
        </div>

        {/* ── TELEMETRY & SYSTEM STATUS GRID (PHASE 4) ───────────────── */}
        <div
          ref={telemetryRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 18,
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "24px 0",
            marginBottom: 36,
            fontFamily: "var(--jb)",
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
          <div>
            <div style={{ color: "var(--muted)", marginBottom: 4 }}>
              SYSTEM STATUS
            </div>
            <div
              style={{
                color: "var(--green)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--green)",
                  boxShadow: "0 0 6px var(--green)",
                  display: "inline-block",
                }}
              />
              ONLINE // STANDBY
            </div>
          </div>

          <div>
            <div style={{ color: "var(--muted)", marginBottom: 4 }}>
              MEMORY CORE
            </div>
            <div style={{ color: "var(--txt)", fontWeight: 700 }}>
              STABLE // SYNCHRONIZED
            </div>
          </div>

          <div>
            <div style={{ color: "var(--muted)", marginBottom: 4 }}>
              CHAT ENGINE
            </div>
            <div style={{ color: "var(--cyan)", fontWeight: 700 }}>
              READY // DUAL RHYTHM
            </div>
          </div>

          <div>
            <div style={{ color: "var(--muted)", marginBottom: 4 }}>
              SYS BUILD
            </div>
            <div style={{ color: "var(--txt)", fontWeight: 700 }}>
              01.04 // RELEASE
            </div>
          </div>

          <div>
            <div style={{ color: "var(--muted)", marginBottom: 4 }}>
              CREDITS
            </div>
            <div style={{ color: "var(--yellow)", fontWeight: 700 }}>
              FREEPLAY // UNLIMITED
            </div>
          </div>
        </div>

        {/* ── BOTTOM REGISTRATION BAR ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontFamily: "var(--jb)",
            fontSize: 9,
            color: "var(--muted)",
            letterSpacing: "0.1em",
          }}
        >
          <div>
            <span>└ VYBZ ARCADE PLATFORM // ALL RIGHTS RESERVED</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>SESSION ID: #0084-ARCADE</span>
            <Barcode val="VYBZ-SYSTEM-OK" h={14} color="var(--muted)" />
            <span style={{ color: "var(--green)" }}>┘</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
