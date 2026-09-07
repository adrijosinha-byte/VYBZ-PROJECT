"use client";

import React from "react";
import { Barcode } from "@/components/ui/Barcode";
import { LeaderboardEntry } from "@/types/api";

interface LeaderboardPodiumProps {
  roomState: any;
  playerId: string;
  onResetMatch: () => void;
  onNewChat: () => void;
  playClickSound: () => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  roomState,
  playerId,
  onResetMatch,
  onNewChat,
  playClickSound,
}) => {
  const leaderboard: LeaderboardEntry[] = roomState?.leaderboard || [];
  const isHost = roomState?.hostId === playerId;
  const totalRounds = roomState?.questions?.length || roomState?.settings?.roundCount || 5;

  const winner = leaderboard[0];

  return (
    <section
      id="section-leaderboard"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--void)",
        padding: "64px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 44,
          }}
        >
          <div
            className="jb"
            style={{
              fontSize: 11,
              color: "var(--green)",
              letterSpacing: "0.2em",
              marginBottom: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="led led-g pulse-g" />
            MATCH CONCLUDED // TOURNAMENT RESULTS
          </div>
          <h2
            className="sg"
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--txt)",
              margin: "0 0 10px",
              lineHeight: 1.1,
            }}
          >
            WHO KNOWS THE GC THE BEST?
          </h2>
          <div
            className="jb"
            style={{
              fontSize: 13,
              color: "var(--muted)",
              letterSpacing: "0.05em",
            }}
          >
            OFFICIAL GC LORE ACCURACY RANKINGS ACROSS {totalRounds} ROUNDS
          </div>
        </div>

        {/* Winner Hero Podium Banner */}
        {winner && (
          <div
            style={{
              background: "linear-gradient(180deg, rgba(255,208,0,0.12) 0%, rgba(255,208,0,0.02) 100%)",
              border: "2px solid var(--yellow)",
              boxShadow: "0 0 40px rgba(255,208,0,0.15)",
              padding: "36px 32px",
              marginBottom: 40,
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              className="jb"
              style={{
                fontSize: 10,
                color: "var(--yellow)",
                letterSpacing: "0.2em",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              ★ 1ST PLACE CHAMPION // UNDISPUTED GC LORE MASTER ★
            </div>
            <div
              className="sg"
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                color: "var(--yellow)",
                letterSpacing: "-0.03em",
                marginBottom: 8,
              }}
            >
              {winner.name}
            </div>
            <div
              className="jb"
              style={{
                fontSize: 14,
                color: "var(--txt)",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {winner.badgeTitle} • {winner.correctAnswers} / {totalRounds} CORRECT ({winner.accuracy}%)
            </div>
            <div
              className="jb"
              style={{
                fontSize: 12,
                color: "var(--yellow)",
                background: "rgba(255,208,0,0.1)",
                display: "inline-block",
                padding: "6px 16px",
                border: "1px solid var(--yellow)",
              }}
            >
              FINAL SCORE: {winner.score.toLocaleString()} PTS
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div
          style={{
            background: "var(--chassis)",
            border: "1px solid var(--border)",
            marginBottom: 36,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontFamily: "var(--jb)",
              fontSize: 12,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  color: "var(--muted)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                }}
              >
                <th style={{ padding: "14px 20px" }}>RANK</th>
                <th style={{ padding: "14px 20px" }}>PLAYER</th>
                <th style={{ padding: "14px 20px" }}>CORRECT</th>
                <th style={{ padding: "14px 20px" }}>ACCURACY</th>
                <th style={{ padding: "14px 20px" }}>SCORE</th>
                <th style={{ padding: "14px 20px" }}>GC TITLE / BADGE</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const isMe = entry.id === playerId;
                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                const rankColor = isFirst
                  ? "var(--yellow)"
                  : isSecond
                  ? "var(--txt)"
                  : isThird
                  ? "#D97706"
                  : "var(--muted)";

                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isMe ? "rgba(57,255,20,0.05)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "18px 20px", fontWeight: 700, color: rankColor }}>
                      #{entry.rank}
                    </td>
                    <td style={{ padding: "18px 20px" }}>
                      <div
                        className="sg"
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: isMe ? "var(--green)" : "var(--txt)",
                        }}
                      >
                        {entry.name} {isMe && "(YOU)"}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--muted)" }}>{entry.tag}</div>
                    </td>
                    <td style={{ padding: "18px 20px", fontWeight: 700, color: "var(--green)" }}>
                      {entry.correctAnswers} / {totalRounds}
                    </td>
                    <td style={{ padding: "18px 20px" }}>{entry.accuracy}%</td>
                    <td
                      style={{
                        padding: "18px 20px",
                        fontWeight: 700,
                        color: "var(--yellow)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {entry.score.toLocaleString()} PTS
                    </td>
                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          background: isFirst
                            ? "rgba(255,208,0,0.1)"
                            : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isFirst ? "var(--yellow)" : "var(--border)"}`,
                          color: isFirst ? "var(--yellow)" : "var(--txt)",
                          padding: "4px 8px",
                        }}
                      >
                        {entry.badgeTitle}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Host Replay & Navigation Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {isHost && (
              <button
                onClick={() => {
                  playClickSound();
                  onResetMatch();
                }}
                className="btn-green"
                style={{
                  padding: "14px 28px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                PLAY AGAIN WITH SAME PLAYERS →
              </button>
            )}
            <button
              onClick={() => {
                playClickSound();
                onNewChat();
              }}
              className="btn-ghost"
              style={{
                padding: "14px 24px",
                fontSize: 12,
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              SELECT NEW CHAT DOCUMENT
            </button>
          </div>

          <Barcode val="LEADERBOARD-VERIFIED" h={18} color="var(--muted)" />
        </div>
      </div>
    </section>
  );
};
