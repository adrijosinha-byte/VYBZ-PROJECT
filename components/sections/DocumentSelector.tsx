"use client";

import React, { useState, useRef } from "react";
import { CHAT_PRESETS, ChatPreset } from "@/lib/mock-data/chat-presets";
import { apiClient } from "@/lib/api-client";
import { Barcode } from "@/components/ui/Barcode";
import { TopQuote } from "@/types/api";

interface DocumentSelectorProps {
  onSelectChat: (chat: {
    sessionId?: string;
    title: string;
    participants: string[];
    topQuotes: TopQuote[];
    rawText: string;
  }) => void;
  onScrollToSetup: () => void;
  playClickSound: () => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  onSelectChat,
  onScrollToSetup,
  playClickSound,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("hackathon-night");
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [customChatData, setCustomChatData] = useState<{
    sessionId?: string;
    title: string;
    participants: string[];
    topQuotes: TopQuote[];
    rawText: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePreset = CHAT_PRESETS.find((p) => p.id === selectedPresetId) || CHAT_PRESETS[0];

  const handleSelectPreset = async (preset: ChatPreset) => {
    playClickSound();
    setIsCustomMode(false);
    setSelectedPresetId(preset.id);

    try {
      // Ingest into backend to register session and messages
      const res = await apiClient.ingestChat(preset.rawChatText, preset.title);
      onSelectChat({
        sessionId: res.sessionId,
        title: preset.title,
        participants: res.participants,
        topQuotes: res.topQuotes,
        rawText: preset.rawChatText,
      });
    } catch {
      onSelectChat({
        title: preset.title,
        participants: preset.participants,
        topQuotes: preset.topQuotes,
        rawText: preset.rawChatText,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playClickSound();
    setIsUploading(true);
    setUploadStatus("PARSING CHAT ARCHIVE...");
    setCustomFileName(file.name);

    try {
      const res = await apiClient.ingestChat(file);
      const rawText = await file.text();

      const parsedData = {
        sessionId: res.sessionId,
        title: file.name.replace(/\.[^/.]+$/, "").toUpperCase() + " // LORE",
        participants: res.participants,
        topQuotes: res.topQuotes,
        rawText,
      };

      setCustomChatData(parsedData);
      setIsCustomMode(true);
      setUploadStatus("CHAT ARCHIVE COMPILED");
      onSelectChat(parsedData);
    } catch (err: any) {
      console.error(err);
      setUploadStatus(`ERROR: ${err.message || "Failed to parse file"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const currentSelection = isCustomMode && customChatData ? customChatData : activePreset;

  return (
    <section
      id="section-document"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--chassis)",
        padding: "54px 0",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 24px" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--border)",
            paddingBottom: 16,
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              className="jb"
              style={{
                fontSize: 10,
                color: "var(--green)",
                letterSpacing: "0.15em",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="led led-g pulse-g" />
              PRIMARY STEP 01 // SOURCE ARCHIVE SELECTION
            </div>
            <h2
              className="sg"
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "var(--txt)",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              SELECT GROUP CHAT LORE.
            </h2>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span className="jb" style={{ fontSize: 9, color: "var(--muted)" }}>
              FORMAT: .TXT / .JSON / DISCORD / WHATSAPP
            </span>
            <Barcode val="DATA-FEED-01" h={18} color="var(--muted)" />
          </div>
        </div>

        {/* Two-Column Clean Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          {/* Left Column: Preset Lore Cartridges & Upload Button */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              className="jb"
              style={{
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              AVAILABLE LORE CARTRIDGES (INSTANT PLAY)
            </div>

            {CHAT_PRESETS.map((preset) => {
              const isSelected = !isCustomMode && selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: isSelected ? "rgba(57,255,20,0.06)" : "var(--void)",
                    border: `1px solid ${isSelected ? "var(--green)" : "var(--border)"}`,
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: "var(--green)",
                        color: "#000",
                        fontFamily: "var(--jb)",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 8px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      LOADED
                    </div>
                  )}
                  <div
                    className="jb"
                    style={{
                      fontSize: 9,
                      color: isSelected ? "var(--green)" : "var(--muted)",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    {preset.badge} • {preset.subtitle}
                  </div>
                  <div
                    className="sg"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: isSelected ? "var(--txt)" : "#C0C4CC",
                      marginBottom: 6,
                    }}
                  >
                    {preset.title}
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {preset.description}
                  </div>
                </button>
              );
            })}

            {/* Custom Chat File Drop / Upload Box */}
            <div
              style={{
                marginTop: 4,
                border: `1px dashed ${isCustomMode ? "var(--green)" : "var(--border)"}`,
                background: isCustomMode ? "rgba(57,255,20,0.04)" : "#070809",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 10,
                    color: isCustomMode ? "var(--green)" : "var(--yellow)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  OR LOAD YOUR OWN GROUP CHAT EXPORT
                </div>
                {uploadStatus && (
                  <span className="jb" style={{ fontSize: 9, color: "var(--green)" }}>
                    {uploadStatus}
                  </span>
                )}
              </div>
              <p
                className="jb"
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                Upload any WhatsApp, Discord, or Telegram chat export (.txt or .json). All names and quotes are extracted automatically.
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.json,.csv"
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="btn-ghost"
                  style={{
                    fontSize: 10,
                    padding: "8px 16px",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  {isUploading ? "INGESTING..." : "CHOOSE CHAT FILE →"}
                </button>
                {customFileName && (
                  <span
                    className="jb"
                    style={{
                      fontSize: 10,
                      color: "var(--green)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {customFileName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Lore Inspector & Verification Card */}
          <div
            style={{
              background: "var(--void)",
              border: "1px solid var(--border)",
              padding: "24px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--yellow)",
                    letterSpacing: "0.1em",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span className="led led-y pulse-y" />
                  CARTRIDGE INSPECTION // ACTIVE BUFFER
                </div>
                <span className="jb" style={{ fontSize: 9, color: "var(--muted)" }}>
                  STATUS: READY FOR GAMEPLAY
                </span>
              </div>

              <div
                className="sg"
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--txt)",
                  marginBottom: 16,
                }}
              >
                {currentSelection.title}
              </div>

              {/* Stats Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  background: "#080A0D",
                  border: "1px solid var(--border)",
                  padding: "12px",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>
                    PARTICIPANTS
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    {currentSelection.participants.length}
                  </div>
                </div>
                <div>
                  <div className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>
                    LORE QUOTES
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--yellow)",
                    }}
                  >
                    {currentSelection.topQuotes.length}
                  </div>
                </div>
                <div>
                  <div className="jb" style={{ fontSize: 8, color: "var(--muted)" }}>
                    READINESS
                  </div>
                  <div
                    className="jb"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--txt)",
                    }}
                  >
                    100%
                  </div>
                </div>
              </div>

              {/* Detected Participants List */}
              <div style={{ marginBottom: 20 }}>
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  DETECTED GC MEMBERS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {currentSelection.participants.map((name) => (
                    <span
                      key={name}
                      className="jb"
                      style={{
                        fontSize: 10,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        color: "var(--txt)",
                        padding: "3px 8px",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Quote Preview */}
              <div>
                <div
                  className="jb"
                  style={{
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  SAMPLE ARCHIVED QUOTE
                </div>
                {currentSelection.topQuotes[0] && (
                  <div
                    style={{
                      background: "#050607",
                      border: "1px solid var(--border)",
                      borderLeft: "3px solid var(--yellow)",
                      padding: "10px 14px",
                    }}
                  >
                    <div
                      className="jb"
                      style={{
                        fontSize: 11,
                        color: "var(--txt)",
                        fontStyle: "italic",
                        marginBottom: 4,
                      }}
                    >
                      &quot;{currentSelection.topQuotes[0].text}&quot;
                    </div>
                    <div
                      className="jb"
                      style={{ fontSize: 9, color: "var(--yellow)" }}
                    >
                      — {currentSelection.topQuotes[0].author}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Jump to Match Setup */}
            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <button
                onClick={() => {
                  playClickSound();
                  onScrollToSetup();
                }}
                className="btn-green"
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                PROCEED TO MATCH CONFIGURATION & LOBBY →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
