"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const timeLimit = roomState?.settings?.timeLimitSeconds ?? 15;

  // Find local player state
  const localPlayer = roomState?.players?.find(
    (p: any) => p.id === playerId || p.userId === playerId
  );
  const myAnswer = localPlayer?.lastAnswer;
  const hasAnswered = localPlayer?.hasAnsweredCurrent;

  // Selected option state & manual lock-in state
  const [selectedKey, setSelectedKey] = useState<ArcadeOptionKey | null>(null);
  const [isLockedIn, setIsLockedIn] = useState<boolean>(false);

  // Reset on question change
  useEffect(() => {
    setSelectedKey(null);
    setIsLockedIn(false);
  }, [activeQ?.id, roomState?.currentQuestionIndex]);

  const effectiveLocked = Boolean(hasAnswered || isLockedIn);
  const lockedKey = myAnswer?.optionKey || (isLockedIn ? selectedKey : null);

  // Monotonic High-Precision Timer Engine
  // Uses client performance.now() to guarantee 100% uniform 1000ms-per-second decrements with zero clock skew
  const timerEngineRef = useRef<{
    startTime: number;
    initialRemainingMs: number;
    totalMs: number;
    questionKey: string;
  }>({
    startTime: typeof performance !== "undefined" ? performance.now() : Date.now(),
    initialRemainingMs: timeLimit * 1000,
    totalMs: timeLimit * 1000,
    questionKey: "",
  });

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(timeLimit);

  // Synchronize target duration and remaining time on question change
  useEffect(() => {
    setSelectedKey(null);
    setIsLockedIn(false);

    const qKey = `${activeQ?.id || "q"}_${roomState?.currentQuestionIndex ?? 0}`;
    const configuredSeconds = roomState?.settings?.timeLimitSeconds ?? timeLimit ?? 15;
    let totalMs = configuredSeconds * 1000;

    // Check if server set explicit questionStartedAt & questionDeadline
    if (roomState?.questionDeadline && roomState?.questionStartedAt) {
      const serverDuration =
        new Date(roomState.questionDeadline).getTime() -
        new Date(roomState.questionStartedAt).getTime();
      if (serverDuration >= 1000 && serverDuration <= 180000) {
        totalMs = serverDuration;
      }
    }

    // Determine initial remaining ms
    let initRemainingMs = totalMs;
    if (
      typeof roomState?.remainingSeconds === "number" &&
      roomState.remainingSeconds > 0 &&
      roomState.remainingSeconds < configuredSeconds - 1
    ) {
      // Reconnected mid-round
      initRemainingMs = roomState.remainingSeconds * 1000;
    }

    timerEngineRef.current = {
      startTime: performance.now(),
      initialRemainingMs: initRemainingMs,
      totalMs,
      questionKey: qKey,
    };

    setDisplaySeconds(Math.ceil(initRemainingMs / 1000));
  }, [activeQ?.id, roomState?.currentQuestionIndex, roomState?.settings?.timeLimitSeconds]);

  // Check if all players in the room have locked in their answers
  const totalPlayers = roomState?.players?.length || 1;
  const answeredPlayersCount =
    roomState?.players?.filter((p: any) => p.hasAnsweredCurrent)?.length ||
    (effectiveLocked ? 1 : 0);
  const allPlayersLockedIn =
    Boolean(
      (roomState?.players &&
        roomState.players.length > 0 &&
        roomState.players.every((p: any) => p.hasAnsweredCurrent)) ||
      (effectiveLocked && (!roomState?.players || roomState.players.length <= 1))
    );

  // Accelerate local timer to 2 seconds if all players have locked in
  useEffect(() => {
    if (isReveal) return;
    if (allPlayersLockedIn) {
      const elapsed = performance.now() - timerEngineRef.current.startTime;
      const currentRemaining = Math.max(0, timerEngineRef.current.initialRemainingMs - elapsed);
      // Smoothly transition to 2 seconds if more time remains
      if (currentRemaining > 2000) {
        timerEngineRef.current = {
          startTime: performance.now(),
          initialRemainingMs: 2000,
          totalMs: timerEngineRef.current.totalMs,
          questionKey: timerEngineRef.current.questionKey,
        };
      }
    }
  }, [allPlayersLockedIn, isReveal]);

  // Server poll sync: catch server early reveal (2s) or massive drift (> 3.5s) without jittering normal countdown
  useEffect(() => {
    if (isReveal) return;

    if (roomState?.questionDeadline) {
      const serverDeadlineMs = new Date(roomState.questionDeadline).getTime();
      const serverRemainingApprox = serverDeadlineMs - Date.now();
      // If server accelerated to reveal in 2 seconds
      if (serverRemainingApprox > 0 && serverRemainingApprox <= 2500) {
        const elapsed = performance.now() - timerEngineRef.current.startTime;
        const currentRemaining = Math.max(0, timerEngineRef.current.initialRemainingMs - elapsed);
        if (currentRemaining > 2000) {
          timerEngineRef.current = {
            startTime: performance.now(),
            initialRemainingMs: 2000,
            totalMs: timerEngineRef.current.totalMs,
            questionKey: timerEngineRef.current.questionKey,
          };
        }
      }
    }

    // Only resync if there is a severe desync (> 3.5s drift, e.g. tab was hidden or suspended)
    if (typeof roomState?.remainingSeconds === "number") {
      const elapsed = performance.now() - timerEngineRef.current.startTime;
      const currentRemainingSec = Math.ceil(
        Math.max(0, timerEngineRef.current.initialRemainingMs - elapsed) / 1000
      );
      const drift = Math.abs(currentRemainingSec - roomState.remainingSeconds);
      if (drift >= 4) {
        timerEngineRef.current = {
          startTime: performance.now(),
          initialRemainingMs: Math.max(0, roomState.remainingSeconds * 1000),
          totalMs: timerEngineRef.current.totalMs,
          questionKey: timerEngineRef.current.questionKey,
        };
      }
    }
  }, [roomState?.questionDeadline, roomState?.remainingSeconds, isReveal]);

  // Continuous 60fps timer animation loop: glides cooldown bar and updates seconds uniformly
  useEffect(() => {
    if (isReveal) {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = "0%";
      }
      setDisplaySeconds(0);
      return;
    }

    let frameId: number;

    const tick = () => {
      const elapsed = performance.now() - timerEngineRef.current.startTime;
      const timeLeftMs = Math.max(0, timerEngineRef.current.initialRemainingMs - elapsed);
      const totalMs = timerEngineRef.current.totalMs || (timeLimit * 1000);
      const ratio = Math.max(0, Math.min(1, timeLeftMs / totalMs));
      const secs = Math.ceil(timeLeftMs / 1000);

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(ratio * 100).toFixed(2)}%`;
        const color =
          allPlayersLockedIn
            ? "var(--yellow)"
            : secs <= 4
            ? "var(--red)"
            : secs <= 8
            ? "var(--yellow)"
            : "var(--green)";
        progressBarRef.current.style.backgroundColor = color;
        progressBarRef.current.style.boxShadow = `0 0 10px ${color}`;
      }

      setDisplaySeconds((prev) => (prev !== secs ? secs : prev));

      if (timeLeftMs > 0 && !isReveal) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isReveal, timeLimit, activeQ?.id, roomState?.currentQuestionIndex, allPlayersLockedIn]);

  // Dedicated action to lock in the chosen answer
  const handleLockIn = useCallback(() => {
    if (!selectedKey || effectiveLocked || isReveal) return;
    playClickSound();
    setIsLockedIn(true);
    onSelectOption(selectedKey);
  }, [selectedKey, effectiveLocked, isReveal, playClickSound, onSelectOption]);

  // Automatically register currently selected MCQ as the option selected if timer reaches 0 before manual lock-in
  useEffect(() => {
    if (displaySeconds === 0 && selectedKey && !effectiveLocked && !isReveal) {
      handleLockIn();
    }
  }, [displaySeconds, selectedKey, effectiveLocked, isReveal, handleLockIn]);

  // Keyboard shortcut listener:
  // A, B, C, D to switch between options freely
  // Enter to lock in the chosen option
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (effectiveLocked || isReveal) return;
      const key = e.key.toUpperCase();
      if (key === "A" || key === "B" || key === "C" || key === "D") {
        playClickSound();
        setSelectedKey(key as ArcadeOptionKey);
      } else if (e.key === "Enter") {
        if (selectedKey) {
          handleLockIn();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveLocked, isReveal, selectedKey, handleLockIn, playClickSound]);

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
    displaySeconds <= 4
      ? "var(--red)"
      : displaySeconds <= 8
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

          {/* Synchronized Continuous Countdown Timer Bar */}
          <div
            style={{
              height: 6,
              background: "#11141A",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              ref={progressBarRef}
              style={{
                height: "100%",
                width: "100%",
                background: timerColor,
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
                  border: `1px solid ${allPlayersLockedIn && !isReveal ? "var(--yellow)" : timerColor}`,
                  padding: "8px 16px",
                  background: "rgba(0,0,0,0.4)",
                  boxShadow: allPlayersLockedIn && !isReveal ? "0 0 12px rgba(255,208,0,0.35)" : "none",
                }}
              >
                <div className="jb" style={{ fontSize: 9, color: allPlayersLockedIn && !isReveal ? "var(--yellow)" : "var(--muted)", letterSpacing: "0.1em" }}>
                  {allPlayersLockedIn && !isReveal ? "REVEALING IN" : "REMAINING"}
                </div>
                <div
                  className="jb"
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: allPlayersLockedIn && !isReveal ? "var(--yellow)" : timerColor,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(displaySeconds).padStart(2, "0")}s
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
                marginBottom: 24,
              }}
            >
              {activeQ.options.map((opt: any) => {
                const isSelectedTentatively = !effectiveLocked && selectedKey === opt.key;
                const isMyLockedAnswer = effectiveLocked && (lockedKey === opt.key || (isLockedIn && selectedKey === opt.key));
                const isCorrectOption = isReveal && activeQ.correctAnswer === opt.key;
                const isWrongSelection = isReveal && isMyLockedAnswer && !myAnswer?.isCorrect;

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
                } else if (isMyLockedAnswer) {
                  borderColor = "var(--green)";
                  bgColor = "rgba(57,255,20,0.14)";
                  textColor = "var(--green)";
                } else if (isSelectedTentatively) {
                  borderColor = "var(--yellow)";
                  bgColor = "rgba(255,208,0,0.12)";
                  textColor = "var(--yellow)";
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (!effectiveLocked && !isReveal) {
                        playClickSound();
                        setSelectedKey(opt.key);
                      }
                    }}
                    disabled={effectiveLocked || isReveal}
                    style={{
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      padding: "20px 22px",
                      textAlign: "left",
                      cursor: effectiveLocked || isReveal ? "default" : "pointer",
                      transition: "transform 0.1s, border-color 0.2s, background-color 0.2s",
                      position: "relative",
                      boxShadow: isMyLockedAnswer
                        ? "0 0 20px rgba(57,255,20,0.3)"
                        : isSelectedTentatively
                        ? "0 0 16px rgba(255,208,0,0.25)"
                        : "none",
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
                      {isSelectedTentatively && !isReveal && (
                        <span
                          className="jb"
                          style={{
                            fontSize: 9,
                            background: "var(--yellow)",
                            color: "#000",
                            padding: "2px 6px",
                            fontWeight: 800,
                          }}
                        >
                          SELECTED ✎
                        </span>
                      )}
                      {isMyLockedAnswer && !isReveal && (
                        <span
                          className="jb"
                          style={{
                            fontSize: 9,
                            background: "var(--green)",
                            color: "#000",
                            padding: "2px 6px",
                            fontWeight: 800,
                          }}
                        >
                          ✔ LOCKED IN
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

            {/* Dedicated Action Button to Lock In Chosen Answer & Live HUD */}
            {!isReveal && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 28,
                  gap: 12,
                }}
              >
                {!effectiveLocked ? (
                  <button
                    type="button"
                    onClick={handleLockIn}
                    disabled={!selectedKey}
                    style={{
                      background: selectedKey
                        ? "var(--yellow)"
                        : "rgba(255,255,255,0.04)",
                      border: `2px solid ${
                        selectedKey ? "var(--yellow)" : "var(--border2)"
                      }`,
                      color: selectedKey ? "#000" : "var(--muted)",
                      fontFamily: "var(--jb)",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      padding: "16px 36px",
                      cursor: selectedKey ? "pointer" : "not-allowed",
                      boxShadow: selectedKey
                        ? "0 0 24px rgba(255, 208, 0, 0.45), 3px 3px 0 #000"
                        : "none",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transform: selectedKey ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{selectedKey ? "🔒" : "⌨"}</span>
                    <span>
                      {selectedKey
                        ? `LOCK IN ANSWER: OPTION [ ${selectedKey} ] → (PRESS ENTER)`
                        : "CHOOSE AN OPTION (A / B / C / D) TO LOCK IN"}
                    </span>
                  </button>
                ) : (
                  <div
                    className="jb"
                    style={{
                      background: allPlayersLockedIn
                        ? "rgba(255,208,0,0.12)"
                        : "rgba(57, 255, 20, 0.08)",
                      border: `2px solid ${allPlayersLockedIn ? "var(--yellow)" : "var(--green)"}`,
                      color: allPlayersLockedIn ? "var(--yellow)" : "var(--green)",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      padding: "14px 28px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: allPlayersLockedIn
                        ? "0 0 25px rgba(255,208,0,0.35)"
                        : "0 0 15px rgba(57, 255, 20, 0.2)",
                    }}
                  >
                    <span className={allPlayersLockedIn ? "led led-y pulse-y" : "pulse-g"}>
                      {allPlayersLockedIn ? "⚡" : "●"}
                    </span>
                    <span>
                      {allPlayersLockedIn
                        ? "ALL PLAYERS LOCKED IN // REVEALING ANSWER IN 2 SECONDS..."
                        : `OPTION [ ${lockedKey || selectedKey} ] LOCKED IN // WAITING FOR OTHER PLAYERS (${answeredPlayersCount}/${totalPlayers})...`}
                    </span>
                  </div>
                )}
              </div>
            )}

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
