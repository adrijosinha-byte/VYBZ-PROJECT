"use client";

import React, { useEffect, useRef } from "react";

interface NodeParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  label?: string;
  isTag?: boolean;
}

export const HeroInteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = container.offsetWidth);
    let height = (canvas.height = container.offsetHeight);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Mouse coordinates relative to hero container
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
      radius: 180,
    };

    // Resize handler with high-DPI support
    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.offsetWidth;
      height = canvas.height = container.offsetHeight;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    // Mouse move tracking (passive listener on window so it doesn't block events)
    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const inBounds =
        e.clientX >= rect.left - 50 &&
        e.clientX <= rect.right + 50 &&
        e.clientY >= rect.top - 50 &&
        e.clientY <= rect.bottom + 50;

      if (inBounds) {
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Retro Arcade Tags
    const ARCADE_LABELS = [
      "ROM: 0x4F",
      "MEM_BUS",
      "AUDIO_SYNTH",
      "60Hz // PHOSPHOR",
      "CHASSIS_01",
      "SECTOR 07",
      "SYS_CORE",
      "[+]",
      "DIAL_IN",
      "0x8A9C",
      "✦ LORE",
    ];

    let particles: NodeParticle[] = [];

    const initParticles = () => {
      particles = [];
      const count = prefersReducedMotion ? 24 : Math.min(65, Math.floor(width / 22));

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const isTag = i < ARCADE_LABELS.length && Math.random() > 0.4;
        const isCyan = Math.random() > 0.65;

        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * (prefersReducedMotion ? 0.1 : 0.4),
          vy: (Math.random() - 0.5) * (prefersReducedMotion ? 0.1 : 0.4),
          size: isTag ? 3 : Math.random() * 2.2 + 1.2,
          color: isCyan ? "#00E5FF" : "#39FF14",
          glowColor: isCyan ? "rgba(0, 229, 255, 0.4)" : "rgba(57, 255, 20, 0.4)",
          alpha: Math.random() * 0.45 + 0.25,
          label: isTag ? ARCADE_LABELS[i % ARCADE_LABELS.length] : undefined,
          isTag,
        });
      }
    };

    initParticles();

    // Pulse rings list created on interactive movement
    const rings: { x: number; y: number; radius: number; maxRadius: number; alpha: number }[] = [];
    let lastRingTime = 0;

    // Visibility observer to save CPU when scrolled past
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    // Main Canvas Render Loop
    const render = (time: number) => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // Occasionally spawn faint radar ripple at mouse position when active
      if (mouse.active && time - lastRingTime > 350 && !prefersReducedMotion) {
        rings.push({
          x: mouse.x,
          y: mouse.y,
          radius: 10,
          maxRadius: 160,
          alpha: 0.35,
        });
        lastRingTime = time;
      }

      // Draw and update radar ripple rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += 2.2;
        ring.alpha *= 0.96;

        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(57, 255, 20, ${ring.alpha * 0.5})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (ring.alpha < 0.02 || ring.radius >= ring.maxRadius) {
          rings.splice(i, 1);
        }
      }

      // Ambient Vector Grid Horizon Lines (faint arcade background mesh)
      ctx.strokeStyle = "rgba(57, 255, 20, 0.035)";
      ctx.lineWidth = 1;
      const gridStep = 48;
      const offsetX = (mouse.active ? (mouse.x - width / 2) * 0.03 : 0);
      const offsetY = (mouse.active ? (mouse.y - height / 2) * 0.03 : 0);

      ctx.beginPath();
      for (let x = (offsetX % gridStep); x < width; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = (offsetY % gridStep); y < height; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update & Draw Particles and Constellation lines
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Normal drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Mouse interaction: Elastic deflection and illumination
        let distToMouse = 9999;
        let mouseForce = 0;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          distToMouse = Math.sqrt(dx * dx + dy * dy);

          if (distToMouse < mouse.radius) {
            mouseForce = (1 - distToMouse / mouse.radius);
            // Deflect away gently with arcade spring physics
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * mouseForce * 3.5;
            p.y -= Math.sin(angle) * mouseForce * 3.5;

            // Connect laser beam to mouse cursor
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = p.color === "#00E5FF"
              ? `rgba(0, 229, 255, ${mouseForce * 0.38})`
              : `rgba(57, 255, 20, ${mouseForce * 0.38})`;
            ctx.lineWidth = mouseForce * 1.5;
            ctx.stroke();
          }
        }

        // Draw connections between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 95) {
            const linkAlpha = (1 - cdist / 95) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(57, 255, 20, ${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }

        // Draw Particle Core
        const activeAlpha = mouseForce > 0 ? Math.min(1, p.alpha + mouseForce * 0.6) : p.alpha;
        const activeSize = mouseForce > 0 ? p.size * (1 + mouseForce * 0.7) : p.size;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = activeAlpha;

        // Draw diamond square particle
        ctx.beginPath();
        ctx.rect(p.x - activeSize / 2, p.y - activeSize / 2, activeSize, activeSize);
        ctx.fill();

        // If hovered or has label, render retro arcade tag
        if (p.isTag && p.label) {
          ctx.font = "8px 'JetBrains Mono', monospace";
          ctx.fillStyle = mouseForce > 0 ? "#39FF14" : "rgba(216, 213, 204, 0.4)";
          ctx.globalAlpha = mouseForce > 0 ? 0.95 : 0.45;
          ctx.fillText(p.label, p.x + 8, p.y + 3);

          // Micro registration bracket
          if (mouseForce > 0.2) {
            ctx.strokeStyle = "rgba(57, 255, 20, 0.6)";
            ctx.strokeRect(p.x + 4, p.y - 8, ctx.measureText(p.label).width + 8, 14);
          }
        }

        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // Guarantees zero blocking of any user clicks/buttons
        overflow: "hidden",
        zIndex: 0, // Behind the hero text and buttons
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
