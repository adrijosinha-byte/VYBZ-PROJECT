"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { apiClient } from "@/lib/api-client";
import { TopQuote } from "@/types/api";

export type UploadUiState = "IDLE" | "HOVER" | "PROCESSING" | "SUCCESS" | "ERROR";

interface ArcadeChatUploaderProps {
  onChatLoaded: (chat: {
    sessionId?: string;
    title: string;
    participants: string[];
    topQuotes: TopQuote[];
    rawText: string;
    messageCount?: number;
  }) => void;
  playClickSound?: () => void;
  playSuccessSound?: () => void;
  playErrorSound?: () => void;
}

export const ArcadeChatUploader: React.FC<ArcadeChatUploaderProps> = ({
  onChatLoaded,
  playClickSound,
  playSuccessSound,
  playErrorSound,
}) => {
  const [state, setState] = useState<UploadUiState>("IDLE");
  const [fileName, setFileName] = useState<string>("");
  const [messageCount, setMessageCount] = useState<number>(0);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Sensitive data consent modal states
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const textScrambleRef = useRef<HTMLDivElement>(null);

  // Drag & drop highlight state
  const [isDragOver, setIsDragOver] = useState(false);

  // GSAP Hover animations
  const handleMouseEnter = () => {
    if (state === "PROCESSING") return;
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.015,
        y: -2,
        duration: 0.18,
        ease: "power2.out",
      });
    }
    if (scanlineRef.current) {
      gsap.fromTo(
        scanlineRef.current,
        { top: "-100%", opacity: 0.8 },
        { top: "200%", opacity: 0, duration: 0.45, ease: "power1.inOut" }
      );
    }
  };

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.0,
        y: 0,
        duration: 0.18,
        ease: "power2.out",
      });
    }
  };

  const handleMouseDown = () => {
    if (state === "PROCESSING") return;
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.985,
        y: 1,
        duration: 0.08,
        ease: "power1.in",
      });
    }
  };

  const handleMouseUp = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.015,
        y: -2,
        duration: 0.12,
        ease: "power2.out",
      });
    }
  };

  // Trigger file browser
  const handleTriggerInput = () => {
    if (state === "PROCESSING") return;
    playClickSound?.();
    fileInputRef.current?.click();
  };

  // Intercept file selection and require explicit privacy consent
  const handleCandidateFile = (file: File) => {
    if (state === "PROCESSING") return;
    setPendingFile(file);
    setShowConsentModal(true);
  };

  const handleConfirmConsent = async () => {
    if (!pendingFile) return;
    const fileToProcess = pendingFile;
    setShowConsentModal(false);
    setPendingFile(null);
    await processFile(fileToProcess);
  };

  const handleRejectConsent = () => {
    setShowConsentModal(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Listen for Escape key to dismiss consent modal
  useEffect(() => {
    if (!showConsentModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleRejectConsent();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConsentModal]);

  // Real file upload processor
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleCandidateFile(file);
    // Reset file input value so re-uploading the same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setState("PROCESSING");
    setErrorMessage("");

    try {
      const [res, rawText] = await Promise.all([
        apiClient.ingestChat(file),
        file.text(),
      ]);

      const count = res.messageCount || 0;
      const parts = res.participants || [];
      setMessageCount(count);
      setParticipantCount(parts.length);
      setState("SUCCESS");
      playSuccessSound?.();

      onChatLoaded({
        sessionId: res.sessionId,
        title: file.name.replace(/\.[^/.]+$/, "").toUpperCase() + " // LORE",
        participants: parts,
        topQuotes: res.topQuotes || [],
        rawText,
        messageCount: count,
      });
    } catch (err: any) {
      console.error(err);
      setState("ERROR");
      setErrorMessage(err.message || "ARCHIVE READ FAILURE");
      playErrorSound?.();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleCandidateFile(file);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Hidden native HTML file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json,.csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-label="Upload chat file"
      />

      {/* Tactile Arcade Container Button */}
      <div
        ref={buttonRef}
        onClick={handleTriggerInput}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: "relative",
          background:
            state === "ERROR"
              ? "rgba(255, 51, 75, 0.1)"
              : state === "SUCCESS"
              ? "rgba(57, 255, 20, 0.08)"
              : isDragOver
              ? "rgba(0, 229, 255, 0.18)"
              : "rgba(8, 12, 18, 0.9)",
          border: `1.5px solid ${
            state === "ERROR"
              ? "var(--red)"
              : state === "SUCCESS"
              ? "var(--green)"
              : isDragOver
              ? "var(--cyan)"
              : "rgba(0, 229, 255, 0.45)"
          }`,
          boxShadow:
            state === "SUCCESS"
              ? "0 0 24px rgba(57,255,20,0.3), 3px 3px 0 #000000"
              : state === "ERROR"
              ? "0 0 24px rgba(255,51,75,0.3), 3px 3px 0 #000000"
              : isDragOver
              ? "0 0 35px rgba(0,229,255,0.45), 3px 3px 0 #000000"
              : "0 0 20px rgba(0,229,255,0.12), 3px 3px 0 #000000",
          padding: "16px 20px",
          cursor: state === "PROCESSING" ? "wait" : "pointer",
          overflow: "hidden",
          userSelect: "none",
          transition: "border-color 0.18s, background 0.18s, box-shadow 0.18s",
        }}
      >
        {/* Dynamic Scanline Sweep Highlight */}
        <div
          ref={scanlineRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 24,
            background:
              "linear-gradient(180deg, transparent, rgba(57,255,20,0.35), transparent)",
            pointerEvents: "none",
            zIndex: 10,
            opacity: 0,
          }}
        />

        {/* Ambient CRT raster lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)",
            opacity: 0.5,
            zIndex: 1,
          }}
        />

        {/* Corner Registration Brackets */}
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 7,
            height: 7,
            borderTop: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            borderLeft: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            width: 7,
            height: 7,
            borderTop: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            borderRight: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            left: -1,
            width: 7,
            height: 7,
            borderBottom: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            borderLeft: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 7,
            height: 7,
            borderBottom: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            borderRight: `2px solid ${
              state === "ERROR" ? "var(--red)" : "var(--green)"
            }`,
            pointerEvents: "none",
          }}
        />

        {/* Internal Arcade UI Header */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--jb)",
            fontSize: 9,
            letterSpacing: "0.14em",
            color: "var(--muted)",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Pulsing Status LED */}
            <span
              style={{
                width: 6,
                height: 6,
                background:
                  state === "ERROR"
                    ? "var(--red)"
                    : state === "PROCESSING"
                    ? "var(--yellow)"
                    : "var(--green)",
                boxShadow: `0 0 6px ${
                  state === "ERROR"
                    ? "var(--red)"
                    : state === "PROCESSING"
                    ? "var(--yellow)"
                    : "var(--green)"
                }`,
                display: "inline-block",
              }}
            />
            <span style={{ color: "var(--txt2)" }}>
              {state === "PROCESSING"
                ? "MEMORY BUS: ACTIVE"
                : state === "SUCCESS"
                ? "SLOT 01: LOADED"
                : state === "ERROR"
                ? "SLOT 01: FAULT"
                : "SLOT 01: READY"}
            </span>
          </div>
          <span style={{ fontSize: 8 }}>[.TXT / .JSON / .CSV]</span>
        </div>

        {/* Dynamic State View */}
        <div style={{ position: "relative", zIndex: 5 }}>
          {/* STATE 1: IDLE */}
          {state === "IDLE" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Glowing Tactical Upload Icon */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: "rgba(0,229,255,0.14)",
                    border: "1px solid var(--cyan)",
                    boxShadow: "0 0 12px rgba(0,229,255,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--cyan)",
                    fontFamily: "var(--jb)",
                    fontSize: 18,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  ↑
                </div>
                <div>
                  <div
                    className="sg"
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      color: "var(--txt)",
                      marginBottom: 3,
                    }}
                  >
                    CLICK TO BROWSE OR DRAG & DROP
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 10,
                      color: "var(--cyan)",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  >
                    INSTANT AUTONOMOUS INGESTION PORT →
                  </div>
                </div>
              </div>

              {/* High-visibility Action Badge */}
              <div
                className="jb"
                style={{
                  background: "var(--cyan)",
                  color: "#000",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "7px 14px",
                  letterSpacing: "0.12em",
                  boxShadow: "0 0 14px rgba(0,229,255,0.45)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>CHOOSE FILE</span>
                <span>→</span>
              </div>
            </div>
          )}

          {/* STATE 2: PROCESSING / SCANNING */}
          {state === "PROCESSING" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--yellow)",
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span className="blink">▲</span>
                  <span>SCANNING MEMORY BLOCKS...</span>
                </div>
                <span
                  className="jb"
                  style={{ fontSize: 9, color: "var(--muted)" }}
                >
                  {fileName}
                </span>
              </div>
              {/* Animated Progress Bar */}
              <div
                style={{
                  height: 4,
                  background: "var(--cart)",
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  className="pulse-g"
                  style={{
                    height: "100%",
                    width: "70%",
                    background: "var(--yellow)",
                    boxShadow: "0 0 8px var(--yellow)",
                  }}
                />
              </div>
            </div>
          )}

          {/* STATE 3: SUCCESS / LOADED */}
          {state === "SUCCESS" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "rgba(57,255,20,0.18)",
                    border: "1px solid var(--green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--green)",
                    fontFamily: "var(--jb)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
                <div>
                  <div
                    ref={textScrambleRef}
                    className="sg"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      color: "var(--green)",
                      textTransform: "uppercase",
                    }}
                  >
                    MEMORY ARCHIVE LOADED
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--txt2)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <span style={{ color: "var(--green)", fontWeight: 700 }}>
                      {messageCount || "LORE"}
                    </span>{" "}
                    MESSAGES //{" "}
                    <span style={{ color: "var(--cyan)", fontWeight: 700 }}>
                      {participantCount}
                    </span>{" "}
                    PARTICIPANTS
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerInput();
                }}
                className="jb"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border2)",
                  color: "var(--txt2)",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  padding: "4px 8px",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--green)";
                  e.currentTarget.style.color = "var(--green)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border2)";
                  e.currentTarget.style.color = "var(--txt2)";
                }}
              >
                REPLACE ↻
              </button>
            </div>
          )}

          {/* STATE 4: ERROR */}
          {state === "ERROR" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div
                  className="jb"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--red)",
                    letterSpacing: "0.08em",
                  }}
                >
                  ARCHIVE READ ERROR
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {errorMessage || "TRY AGAIN"}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerInput();
                }}
                className="jb"
                style={{
                  background: "var(--red)",
                  color: "#000",
                  border: "1px solid var(--red)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Retro-Arcade Data Privacy & Consent Warning Modal */}
      {showConsentModal && pendingFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleRejectConsent();
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 520,
              width: "100%",
              background: "#080A0E",
              border: "2px solid var(--yellow)",
              boxShadow: "0 0 50px rgba(255, 208, 0, 0.25), 0 0 100px rgba(0, 0, 0, 0.95)",
              padding: "26px 24px 22px",
              color: "var(--txt)",
              overflow: "hidden",
            }}
          >
            {/* Ambient CRT Raster Scanlines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 3px)",
                opacity: 0.6,
                zIndex: 1,
              }}
            />

            {/* Corner Registration Brackets */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "2px solid var(--yellow)", borderLeft: "2px solid var(--yellow)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -1, right: -1, width: 8, height: 8, borderTop: "2px solid var(--yellow)", borderRight: "2px solid var(--yellow)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -1, left: -1, width: 8, height: 8, borderBottom: "2px solid var(--yellow)", borderLeft: "2px solid var(--yellow)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: "2px solid var(--yellow)", borderRight: "2px solid var(--yellow)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 5 }}>
              {/* Header Warning Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  borderBottom: "1px solid rgba(255,208,0,0.2)",
                  paddingBottom: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    background: "rgba(255, 208, 0, 0.15)",
                    border: "1px solid var(--yellow)",
                    color: "var(--yellow)",
                    fontWeight: 900,
                    fontSize: 14,
                    fontFamily: "var(--jb)",
                  }}
                >
                  ⚠
                </span>
                <div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.15em",
                      color: "var(--yellow)",
                    }}
                  >
                    CRITICAL WARNING // DATA CONSENT REQUIRED
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: "var(--muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    SECURITY CLEARANCE CHECK // CHAT LOG INGESTION
                  </div>
                </div>
              </div>

              {/* Detected File Badge */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border2)",
                  padding: "8px 12px",
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "var(--jb)",
                  fontSize: 10,
                }}
              >
                <span style={{ color: "var(--txt2)" }}>STAGED ARCHIVE:</span>
                <span style={{ color: "var(--cyan)", fontWeight: 700 }}>
                  {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              {/* Warning Content */}
              <div
                className="jb"
                style={{
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: "var(--txt2)",
                  marginBottom: 20,
                  background: "rgba(255, 51, 75, 0.05)",
                  borderLeft: "3px solid var(--red)",
                  padding: "12px 14px",
                }}
              >
                <p style={{ margin: "0 0 10px 0", color: "#FFA8B4", fontWeight: 700 }}>
                  ALERT: SENSITIVE PRIVATE DATA NOTICE
                </p>
                <p style={{ margin: "0 0 8px 0" }}>
                  You are about to upload a chat log. Group chat files typically contain private conversations, participant names, phone numbers, timestamps, and sensitive personal information.
                </p>
                <p style={{ margin: 0 }}>
                  This data will be processed on the server to extract quotes and generate trivia gameplay. <strong style={{ color: "#FFF" }}>Please ensure you have explicit consent from all participants before uploading. Proceed at your own risk.</strong>
                </p>
              </div>

              {/* Action Decision Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                {/* Abort Button */}
                <button
                  type="button"
                  onClick={handleRejectConsent}
                  className="jb"
                  style={{
                    background: "rgba(255, 51, 75, 0.1)",
                    border: "1px solid var(--red)",
                    color: "var(--red)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    padding: "10px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--red)";
                    e.currentTarget.style.color = "#000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 51, 75, 0.1)";
                    e.currentTarget.style.color = "var(--red)";
                  }}
                >
                  [ ✖ DO NOT CONSENT // ABORT ]
                </button>

                {/* Consent & Proceed Button */}
                <button
                  type="button"
                  onClick={handleConfirmConsent}
                  className="jb"
                  style={{
                    background: "var(--yellow)",
                    border: "1px solid var(--yellow)",
                    color: "#000",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    padding: "10px 22px",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(255, 208, 0, 0.4)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 25px rgba(255, 255, 255, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--yellow)";
                    e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 208, 0, 0.4)";
                  }}
                >
                  [ ✔ I CONSENT & PROCEED ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
