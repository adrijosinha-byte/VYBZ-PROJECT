"use client";

import React, { useEffect } from "react";
import { Barcode } from "@/components/ui/Barcode";
import { ArcadeOptionKey } from "@/types/api";

interface TriviaArenaProps {
  roomState: any;
  playerId: string;
  onSelectOption: (key: ArcadeOptionKey) => void;
  onAdvanceQuestion: () => void;
  playClickSound: () => void;
  playSuccessSound: () => void;
  playErrorSound: () => void;
}

export const TriviaArena: React.FC<TriviaArenaProps> = ({
  roomState,
  playerId,
  onSelectOption,
  onAdvanceQuestion,
  playClickSound,
  playSuccessSound: _playSuccessSound,
  playErrorSound: _playErrorSound,
}) => {
  const activeQ = roomState?.activeQuestion || roomState?.currentQuestion;
  const isHost = roomState?.hostId === playerId || roomState?.hostUserId === playerId;
  const isReveal = roomState?.status === "QUESTION_REVEAL" || roomState?.status === "RESULTS";
  const remainingSeconds = roomState?.remainingSeconds ?? 0;
  const timeLimit = roomState?.settings?.timeLimitSeconds ?? 15;
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / timeLimit));

  // Find local player state
  const localPlayer = roomState?.players?.find(
    (p: any) => p.id === playerId || p.userId === playerId
  );
  const myAnswer = localPlayer?.lastAnswer;
  const hasAnswered = localPlayer?.hasAnsweredCurrent;

  // Keyboard shortcut listener for options (A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered || isReveal) return;
      const key = e.key.toUpperCase();
      if (key === "A" || key === "B" || key === "C" || key === "D") {
        onSelectOption(key as ArcadeOptionKey);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAnswered, isReveal, onSelectOption]);

  if (!activeQ) {
    return (
      <section
        id="section-trivia-arena"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--chassis)",
          padding: "60px 0",
          textAlign: "center",
        }}
      >
        <div className="jb" style={{ fontSize: 12, color: "var(--muted)" }}>
          INITIALIZING ARCADE BENCH // SYNCING GAME STATE...
        </div>
      </section>
    );
  }

  // Timer Color Dynamics: Green -> Yellow -> Alert Red (< 5s)
  const timerColor =
    remainingSeconds <= 4
      ? "var(--red)"
      : remainingSeconds <= 8
      ? "var(--yellow)"
      : "var(--green)";

  return (
    <section
      id="section-trivia-arena"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "#050608",
        padding: "48px 0 64px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px" }}>
        {/* STANDOUT CENTERPIECE CABINET CONTAINER */}
        <div
          style={{
            background: "var(--void)",
            border: "2px solid var(--border)",
            boxShadow: "0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          {/* Cabinet Top Telemetry Bezel */}
          <div
            style={{
              background: "#080A0D",
              borderBottom: "1px solid var(--border)",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Left: Round & Mode Information */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="led led-g pulse-g" />
              <div
                className="jb"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--green)",
                  letterSpacing: "0.15em",
                }}
              >
                [ ROUND 0{(roomState.currentQuestionIndex ?? 0) + 1} / 0{roomState.totalQuestions || roomState.settings?.roundCount || 5} ]
              </div>
              <span style={{ color: "var(--border)" }}>|</span>
              <div
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--yellow)",
                  letterSpacing: "0.1em",
                }}
              >
                {roomState.settings?.mode || "ROM // 001: WHO SAID IT?"}
              </div>
            </div>

            {/* Right: Room & Score HUD */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div className="jb" style={{ fontSize: 10, color: "var(--muted)" }}>
                ROOM: <span style={{ color: "var(--txt)", fontWeight: 700 }}>{roomState.roomCode || roomState.code}</span>
              </div>
              <div
                className="jb"
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--yellow)",
                  background: "rgba(255,208,0,0.08)",
                  border: "1px solid var(--yellow)",
                  padding: "4px 12px",
                }}
              >
                SCORE: {localPlayer?.score?.toLocaleString() || 0} PTS
              </div>
              <Barcode val={`RND-${roomState.currentQuestionIndex + 1}`} h={16} color="var(--muted)" />
            </div>
          </div>

          {/* Synchronized Countdown Timer Bar */}
          <div
            style={{
              height: 6,
              background: "#11141A",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressRatio * 100}%`,
                background: timerColor,
                transition: "width 0.4s linear, background-color 0.3s ease",
                boxShadow: `0 0 10px ${timerColor}`,
              }}
            />
          </div>

          {/* Main Question & Quote Presentation Area */}
          <div style={{ padding: "36px 36px 28px" }}>
            {/* Header with Prompt & Digital Timer Display */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 20,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  className="jb"
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    letterSpacing: "0.12em",
                    marginBottom: 6,
                  }}
                >
                  CATEGORY: {activeQ.category || "WHO SAID IT?"}
                </div>
                <h3
                  className="sg"
                  style={{
                    fontSize: "clamp(24px, 3.2vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    color: "var(--txt)",
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  {activeQ.prompt}
                </h3>
              </div>

              {/* High-Impact Digital Clock */}
              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                  border: `1px solid ${timerColor}`,
                  padding: "8px 16px",
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                <div className="jb" style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>
                  REMAINING
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: timerColor,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(remainingSeconds).padStart(2, "0")}s
                </div>
              </div>
            </div>

            {/* Expansive Heroic Mystery Quote Box */}
            <div
              style={{
                background: "#020304",
                border: "1px solid var(--border)",
                borderLeft: "6px solid var(--green)",
                padding: "24px 28px",
                marginBottom: 32,
                position: "relative",
              }}
            >
              <div
                className="jb"
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: "0.15em",
                  marginBottom: 10,
                }}
              >
                ARCHIVED GROUP CHAT EXCERPT // VERBATIM
              </div>
              <div
                className="jb"
                style={{
                  fontSize: "clamp(18px, 2.2vw, 24px)",
                  color: "var(--txt)",
                  fontWeight: 600,
                  lineHeight: 1.45,
                  letterSpacing: "-0.01em",
                }}
              >
                {activeQ.quote}
              </div>
            </div>

            {/* 4 Large Responsive Option Pads (A, B, C, D) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {activeQ.options.map((opt: any) => {
                const isMySelection = myAnswer?.optionKey === opt.key;
                const isCorrectOption = isReveal && activeQ.correctAnswer === opt.key;
                const isWrongSelection = isReveal && isMySelection && !myAnswer?.isCorrect;

                let borderColor = "var(--border)";
                let bgColor = "var(--void)";
                let textColor = "var(--txt)";

                if (isReveal) {
                  if (isCorrectOption) {
                    borderColor = "var(--green)";
                    bgColor = "rgba(57,255,20,0.12)";
                    textColor = "var(--green)";
                  } else if (isWrongSelection) {
                    borderColor = "var(--red)";
                    bgColor = "rgba(255,51,75,0.12)";
                    textColor = "var(--red)";
                  } else {
                    borderColor = "#222";
                    textColor = "var(--muted)";
                  }
                } else if (isMySelection) {
                  borderColor = "var(--yellow)";
                  bgColor = "rgba(255,208,0,0.1)";
                  textColor = "var(--yellow)";
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      if (!hasAnswered && !isReveal) {
                        playClickSound();
                        onSelectOption(opt.key);
                      }
                    }}
                    disabled={hasAnswered || isReveal}
                    style={{
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      padding: "20px 22px",
                      textAlign: "left",
                      cursor: hasAnswered || isReveal ? "default" : "pointer",
                      transition: "transform 0.1s, border-color 0.2s, background-color 0.2s",
                      position: "relative",
                    }}
                  >
                    {/* Key badge & tag */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        className="jb"
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: textColor,
                          letterSpacing: "0.1em",
                        }}
                      >
                        [{opt.key}] {opt.tag}
                      </span>
                      {isMySelection && !isReveal && (
                        <span
                          className="jb"
                          style={{
                            fontSize: 9,
                            background: "var(--yellow)",
                            color: "#000",
                            padding: "2px 6px",
                            fontWeight: 700,
                          }}
                        >
                          LOCKED IN
                        </span>
                      )}
                      {isCorrectOption && (
                        <span
                          className="jb"
                          style={{
                            fontSize: 9,
                            background: "var(--green)",
                            color: "#000",
                            padding: "2px 6px",
                            fontWeight: 700,
                          }}
                        >
                          ✔ CORRECT
                        </span>
                      )}
                    </div>

                    {/* Participant / Answer Name */}
                    <div
                      className="sg"
                      style={{
                        fontSize: "clamp(20px, 2vw, 24px)",
                        fontWeight: 700,
                        color: textColor,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Answer Reveal Feedback Banner */}
            {isReveal && (
              <div
                style={{
                  background:
                    myAnswer?.isCorrect
                      ? "rgba(57,255,20,0.08)"
                      : "rgba(255,51,75,0.08)",
                  border: `1px solid ${
                    myAnswer?.isCorrect ? "var(--green)" : "var(--red)"
                  }`,
                  padding: "18px 22px",
                  marginBottom: 24,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: myAnswer?.isCorrect ? "var(--green)" : "var(--red)",
                      marginBottom: 4,
                    }}
                  >
                    {myAnswer?.isCorrect
                      ? `✔ CORRECT ATTRIBUTION // +${myAnswer.pointsAwarded || 500} PTS AWARDED!`
                      : "✖ INCORRECT ATTRIBUTION // +0 PTS"}
                  </div>
                  <div className="jb" style={{ fontSize: 11, color: "var(--txt)" }}>
                    {activeQ.explanation || "Group chat lore verified from source log."}
                  </div>
                </div>

                {isHost && (
                  <button
                    onClick={() => {
                      playClickSound();
                      onAdvanceQuestion();
                    }}
                    className="btn-green"
                    style={{
                      padding: "10px 22px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    NEXT ROUND →
                  </button>
                )}
              </div>
            )}

            {/* Live Connected Players Status Strip */}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div className="jb" style={{ fontSize: 9, color: "var(--muted)" }}>
                CONNECTED DEVICES STATUS:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {roomState.players.map((p: any) => (
                  <div
                    key={p.id}
                    className="jb"
                    style={{
                      fontSize: 10,
                      background: p.hasAnsweredCurrent
                        ? "rgba(57,255,20,0.08)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        p.hasAnsweredCurrent ? "var(--green)" : "var(--border)"
                      }`,
                      color: p.hasAnsweredCurrent ? "var(--green)" : "var(--muted)",
                      padding: "4px 10px",
                    }}
                  >
                    {p.displayName || p.name}: {p.hasAnsweredCurrent ? "✔ ANSWERED" : "THINKING..."}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
