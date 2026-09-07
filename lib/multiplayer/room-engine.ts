// Authoritative Multiplayer Room Engine for VYBZ // ARCADE SYSTEM
// Implements the server-authoritative state machine:
// LOBBY -> COUNTDOWN -> QUESTION -> RESULTS -> FINISHED
// Designed for database-backed polling without WebSockets or persistent processes.

import { db, isDatabaseConfigured, memoryDb } from "../db";
import { generateRoomCode, normalizeRoomCode } from "./room-code";
import { calculateAnswerPoints, buildLeaderboard } from "../game/scoring";
import {
  RoomStatus,
  RoomPollState,
  MultiplayerPlayer,
} from "@/types/multiplayer";
import { ArcadeOptionKey, VybzQuestion } from "@/types/vybz";

export interface CreateRoomResult {
  roomId: string;
  roomCode: string;
  hostUserId: string;
}

export interface JoinRoomResult {
  roomId: string;
  roomCode: string;
  players: { userId: string; displayName: string; isHost: boolean }[];
  status: RoomStatus;
}

// 1. CREATE ROOM
export async function createGameRoom(params: {
  gameId: string;
  hostUserId: string;
  displayName: string;
}): Promise<CreateRoomResult> {
  const roomCode = generateRoomCode();
  const roomId = `room_${Math.random().toString(36).substring(2, 11)}`;

  if (isDatabaseConfigured) {
    try {
      // Ensure user exists
      await db.user.upsert({
        where: { id: params.hostUserId },
        update: { displayName: params.displayName },
        create: { id: params.hostUserId, displayName: params.displayName },
      });

      const room = await db.gameRoom.create({
        data: {
          id: roomId,
          roomCode,
          gameId: params.gameId,
          hostUserId: params.hostUserId,
          status: "LOBBY",
          currentQuestion: 0,
          players: {
            create: {
              userId: params.hostUserId,
              displayName: params.displayName,
              score: 0,
              isReady: true,
              isConnected: true,
            },
          },
        },
      });

      return {
        roomId: room.id,
        roomCode: room.roomCode,
        hostUserId: room.hostUserId,
      };
    } catch (err) {
      console.warn("DB room creation failed, falling back to memory:", err);
    }
  }

  // Memory DB Fallback
  memoryDb.gameRooms.set(roomId, {
    id: roomId,
    roomCode,
    gameId: params.gameId,
    hostUserId: params.hostUserId,
    status: "LOBBY" as RoomStatus,
    currentQuestion: 0,
    questionStartedAt: null,
    questionDeadline: null,
    createdAt: new Date().toISOString(),
    players: new Map<string, any>([
      [
        params.hostUserId,
        {
          userId: params.hostUserId,
          displayName: params.displayName,
          score: 0,
          isReady: true,
          isConnected: true,
          lastSeenAt: new Date().toISOString(),
          answers: [],
        },
      ],
    ]),
    answers: new Map<string, any>(),
    events: [],
  });

  return { roomId, roomCode, hostUserId: params.hostUserId };
}

// 2. JOIN ROOM
export async function joinGameRoom(params: {
  roomCode: string;
  userId: string;
  displayName: string;
}): Promise<JoinRoomResult> {
  const normCode = normalizeRoomCode(params.roomCode);

  if (isDatabaseConfigured) {
    try {
      await db.user.upsert({
        where: { id: params.userId },
        update: { displayName: params.displayName },
        create: { id: params.userId, displayName: params.displayName },
      });

      const room = await db.gameRoom.findUnique({
        where: { roomCode: normCode },
        include: { players: true },
      });

      if (!room) {
        throw new Error(`ROOM_NOT_FOUND // Room code '${normCode}' does not exist.`);
      }

      if (room.status === "FINISHED") {
        throw new Error("ROOM_FINISHED // This tournament has already ended.");
      }

      await db.roomPlayer.upsert({
        where: { roomId_userId: { roomId: room.id, userId: params.userId } },
        update: {
          displayName: params.displayName,
          isConnected: true,
          lastSeenAt: new Date(),
        },
        create: {
          roomId: room.id,
          userId: params.userId,
          displayName: params.displayName,
          score: 0,
          isReady: false,
          isConnected: true,
        },
      });

      const updatedPlayers = await db.roomPlayer.findMany({
        where: { roomId: room.id },
      });

      return {
        roomId: room.id,
        roomCode: room.roomCode,
        players: updatedPlayers.map((p) => ({
          userId: p.userId,
          displayName: p.displayName,
          isHost: p.userId === room.hostUserId,
        })),
        status: room.status as RoomStatus,
      };
    } catch (err: any) {
      if (!err.message.includes("ROOM_")) throw err;
    }
  }

  // Memory DB Fallback
  let foundRoom: any = null;
  for (const r of memoryDb.gameRooms.values()) {
    if (r.roomCode === normCode) {
      foundRoom = r;
      break;
    }
  }

  if (!foundRoom) {
    throw new Error(`ROOM_NOT_FOUND // Room code '${normCode}' does not exist.`);
  }

  if (!foundRoom.players.has(params.userId)) {
    foundRoom.players.set(params.userId, {
      userId: params.userId,
      displayName: params.displayName,
      score: 0,
      isReady: false,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      answers: [],
    });
  } else {
    const p = foundRoom.players.get(params.userId);
    p.displayName = params.displayName;
    p.isConnected = true;
    p.lastSeenAt = new Date().toISOString();
  }

  return {
    roomId: foundRoom.id,
    roomCode: foundRoom.roomCode,
    players: Array.from(foundRoom.players.values()).map((p: any) => ({
      userId: p.userId,
      displayName: p.displayName,
      isHost: p.userId === foundRoom.hostUserId,
    })),
    status: foundRoom.status,
  };
}

// Helper: Resolve either internal roomId or user-facing roomCode to internal roomId
export async function resolveRoomId(roomIdOrCode: string): Promise<string> {
  if (isDatabaseConfigured) {
    try {
      const room = await db.gameRoom.findFirst({
        where: {
          OR: [
            { id: roomIdOrCode },
            { roomCode: normalizeRoomCode(roomIdOrCode) },
          ],
        },
        select: { id: true },
      });
      if (room) return room.id;
    } catch {
      // DB error or fallback
    }
  }

  if (memoryDb.gameRooms.has(roomIdOrCode)) return roomIdOrCode;
  const norm = normalizeRoomCode(roomIdOrCode);
  for (const r of memoryDb.gameRooms.values()) {
    if (r.roomCode === norm) return r.id;
  }
  return roomIdOrCode;
}

// 3. SET READY
export async function setPlayerReady(
  roomIdOrCode: string,
  userId: string,
  ready: boolean
): Promise<boolean> {
  const roomId = await resolveRoomId(roomIdOrCode);
  if (isDatabaseConfigured) {
    try {
      await db.roomPlayer.update({
        where: { roomId_userId: { roomId, userId } },
        data: { isReady: ready },
      });
      return true;
    } catch {
      /**/
    }
  }

  const room = memoryDb.gameRooms.get(roomId);
  if (room && room.players.has(userId)) {
    room.players.get(userId).isReady = ready;
    return true;
  }
  return false;
}

// 4. START ROOM (Host Only)
export async function startRoomMatch(
  roomIdOrCode: string,
  hostUserId: string
): Promise<void> {
  const roomId = await resolveRoomId(roomIdOrCode);
  const timeLimitSec = 15;
  const now = new Date();
  const deadline = new Date(now.getTime() + timeLimitSec * 1000);

  if (isDatabaseConfigured) {
    try {
      const room = await db.gameRoom.findUnique({ where: { id: roomId } });
      if (!room) throw new Error("ROOM_NOT_FOUND");
      if (room.hostUserId !== hostUserId) throw new Error("UNAUTHORIZED // Host only.");

      await db.gameRoom.update({
        where: { id: roomId },
        data: {
          status: "QUESTION",
          currentQuestion: 0,
          startedAt: now,
          questionStartedAt: now,
          questionDeadline: deadline,
        },
      });
      return;
    } catch (err) {
      console.warn("DB start failed, using memory:", err);
    }
  }

  const memRoom = memoryDb.gameRooms.get(roomId);
  if (!memRoom) throw new Error("ROOM_NOT_FOUND");
  if (memRoom.hostUserId !== hostUserId) throw new Error("UNAUTHORIZED");

  memRoom.status = "QUESTION";
  memRoom.currentQuestion = 0;
  memRoom.questionStartedAt = now.toISOString();
  memRoom.questionDeadline = deadline.toISOString();
}

// 5. SUBMIT ROOM ANSWER
export async function submitRoomAnswer(params: {
  roomId: string;
  userId: string;
  questionId: string;
  selectedAnswer: ArcadeOptionKey;
  responseTimeMs: number;
}): Promise<{
  correct: boolean;
  correctAnswer: ArcadeOptionKey;
  points: number;
  totalScore: number;
  explanation: string;
}> {
  const roomId = await resolveRoomId(params.roomId);
  // Check active room and question
  const pollState = await getRoomPollState(roomId, params.userId);
  if (pollState.status !== "QUESTION") {
    throw new Error("QUESTION_INACTIVE // Answers cannot be submitted in this state.");
  }

  // Load questions for the game
  let questions: VybzQuestion[] = [];
  if (isDatabaseConfigured) {
    try {
      const game = await db.game.findUnique({
        where: { id: pollState.gameId },
        include: { questions: { orderBy: { questionIndex: "asc" } } },
      });
      if (game) {
        questions = game.questions.map((q) => ({
          id: q.id,
          round: `ROUND 0${q.questionIndex + 1}`,
          category: q.category,
          prompt: q.prompt,
          quote: q.quote,
          options: q.optionsJson as any,
          correctAnswer: q.correctAnswer as ArcadeOptionKey,
          explanation: q.explanation,
          difficulty: q.difficulty as any,
          sourceType: q.sourceType as any,
          sourceMessageIds: q.sourceMessageIds as string[],
        }));
      }
    } catch {
      /**/
    }
  }

  if (questions.length === 0) {
    const memGame = memoryDb.games.get(pollState.gameId);
    questions = memGame?.questions || [];
  }

  const currentQ = questions[pollState.currentQuestionIndex];
  if (!currentQ) throw new Error("QUESTION_NOT_FOUND");

  const isCorrect = params.selectedAnswer === currentQ.correctAnswer;
  const scoreResult = calculateAnswerPoints({
    isCorrect,
    responseTimeMs: params.responseTimeMs,
    timeLimitSeconds: 15,
  });

  if (isDatabaseConfigured) {
    try {
      // Prevent duplicate answers
      const existing = await db.roomAnswer.findUnique({
        where: {
          roomId_questionId_userId: {
            roomId,
            questionId: params.questionId,
            userId: params.userId,
          },
        },
      });

      if (existing) {
        const player = await db.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId: params.userId } },
        });
        return {
          correct: existing.isCorrect,
          correctAnswer: currentQ.correctAnswer,
          points: existing.points,
          totalScore: player?.score || 0,
          explanation: currentQ.explanation,
        };
      }

      await db.roomAnswer.create({
        data: {
          roomId,
          questionId: params.questionId,
          userId: params.userId,
          selectedAnswer: params.selectedAnswer,
          isCorrect,
          responseTimeMs: params.responseTimeMs,
          points: scoreResult.totalPoints,
        },
      });

      const updatedPlayer = await db.roomPlayer.update({
        where: { roomId_userId: { roomId, userId: params.userId } },
        data: { score: { increment: scoreResult.totalPoints } },
      });

      return {
        correct: isCorrect,
        correctAnswer: currentQ.correctAnswer,
        points: scoreResult.totalPoints,
        totalScore: updatedPlayer.score,
        explanation: currentQ.explanation,
      };
    } catch (err) {
      console.warn("DB answer submission failed, falling back to memory:", err);
    }
  }

  // Memory Fallback
  const memRoom = memoryDb.gameRooms.get(roomId);
  const player = memRoom?.players.get(params.userId);
  if (!player) throw new Error("PLAYER_NOT_IN_ROOM");

  const ansKey = `${roomId}_${params.questionId}_${params.userId}`;
  if (!memRoom.answers.has(ansKey)) {
    memRoom.answers.set(ansKey, {
      questionId: params.questionId,
      userId: params.userId,
      selectedAnswer: params.selectedAnswer,
      isCorrect,
      responseTimeMs: params.responseTimeMs,
      points: scoreResult.totalPoints,
    });
    player.score += scoreResult.totalPoints;
    player.answers.push({ isCorrect, responseTimeMs: params.responseTimeMs });
  }

  return {
    correct: isCorrect,
    correctAnswer: currentQ.correctAnswer,
    points: scoreResult.totalPoints,
    totalScore: player.score,
    explanation: currentQ.explanation,
  };
}

// 6. ADVANCE TO NEXT QUESTION (Host or Timeout)
export async function advanceRoomQuestion(
  roomIdOrCode: string,
  _hostUserId?: string
): Promise<void> {
  const roomId = await resolveRoomId(roomIdOrCode);
  const poll = await getRoomPollState(roomId);
  const nextIdx = poll.currentQuestionIndex + 1;
  const timeLimitSec = 15;
  const now = new Date();
  const deadline = new Date(now.getTime() + timeLimitSec * 1000);

  if (nextIdx < poll.totalQuestions) {
    if (isDatabaseConfigured) {
      try {
        await db.gameRoom.update({
          where: { id: roomId },
          data: {
            status: "QUESTION",
            currentQuestion: nextIdx,
            questionStartedAt: now,
            questionDeadline: deadline,
          },
        });
        return;
      } catch {
        /**/
      }
    }
    const memRoom = memoryDb.gameRooms.get(roomId);
    if (memRoom) {
      memRoom.status = "QUESTION";
      memRoom.currentQuestion = nextIdx;
      memRoom.questionStartedAt = now.toISOString();
      memRoom.questionDeadline = deadline.toISOString();
    }
  } else {
    // Tournament Finished
    if (isDatabaseConfigured) {
      try {
        await db.gameRoom.update({
          where: { id: roomId },
          data: {
            status: "FINISHED",
            endedAt: now,
          },
        });
        return;
      } catch {
        /**/
      }
    }
    const memRoom = memoryDb.gameRooms.get(roomId);
    if (memRoom) {
      memRoom.status = "FINISHED";
      memRoom.endedAt = now.toISOString();
    }
  }
}

// 7. GET ROOM POLL STATE (The Single Source of Truth for Polling)
export async function getRoomPollState(
  roomIdOrCode: string,
  clientUserId?: string
): Promise<RoomPollState> {
  const roomId = await resolveRoomId(roomIdOrCode);
  let roomRecord: any = null;
  let playersList: any[] = [];
  let answersList: any[] = [];
  let gameQuestions: VybzQuestion[] = [];

  if (isDatabaseConfigured) {
    try {
      roomRecord = await db.gameRoom.findUnique({
        where: { id: roomId },
        include: {
          players: true,
          answers: true,
          game: { include: { questions: { orderBy: { questionIndex: "asc" } } } },
        },
      });

      if (roomRecord) {
        playersList = roomRecord.players;
        answersList = roomRecord.answers;
        gameQuestions = roomRecord.game.questions.map((q: any) => ({
          id: q.id,
          round: `ROUND 0${q.questionIndex + 1}`,
          category: q.category,
          prompt: q.prompt,
          quote: q.quote,
          options: q.optionsJson,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          sourceType: q.sourceType,
          sourceMessageIds: q.sourceMessageIds,
        }));
      }
    } catch {
      /**/
    }
  }

  if (!roomRecord) {
    const memRoom = memoryDb.gameRooms.get(roomId);
    if (!memRoom) {
      throw new Error(`ROOM_NOT_FOUND // Room '${roomId}' does not exist.`);
    }
    roomRecord = memRoom;
    playersList = Array.from(memRoom.players.values());
    answersList = Array.from(memRoom.answers.values());
    const memGame = memoryDb.games.get(memRoom.gameId);
    gameQuestions = memGame?.questions || [];
  }

  const now = Date.now();
  let status = roomRecord.status as RoomStatus;
  const deadlineMs = roomRecord.questionDeadline
    ? new Date(roomRecord.questionDeadline).getTime()
    : null;

  // State Transition Check: If QUESTION and deadline passed, move to RESULTS
  if (status === "QUESTION" && deadlineMs && now >= deadlineMs) {
    status = "RESULTS";
    if (isDatabaseConfigured) {
      db.gameRoom.update({ where: { id: roomId }, data: { status: "RESULTS" } }).catch(() => {});
    }
    if (memoryDb.gameRooms.has(roomId)) {
      memoryDb.gameRooms.get(roomId).status = "RESULTS";
    }
  }

  const remainingSeconds = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 1000)) : 0;
  const currentQIndex = roomRecord.currentQuestion || 0;
  const rawQ = gameQuestions[currentQIndex] || null;

  // Mask answer while question is actively in play
  let currentQuestion: any = null;
  if (rawQ) {
    const isMasked = status === "QUESTION";
    currentQuestion = {
      ...rawQ,
      correctAnswer: isMasked ? undefined : rawQ.correctAnswer,
      explanation: isMasked ? undefined : rawQ.explanation,
    };
  }

  // Compile Player List with answered status
  const currentQId = rawQ?.id;
  const players: MultiplayerPlayer[] = playersList.map((p: any) => {
    const userAns = answersList.find(
      (a: any) => a.userId === p.userId && a.questionId === currentQId
    );
    return {
      id: p.id || p.userId,
      userId: p.userId,
      displayName: p.displayName,
      score: p.score || 0,
      isReady: Boolean(p.isReady),
      isConnected: Boolean(p.isConnected),
      lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt).toISOString() : new Date().toISOString(),
      isHost: p.userId === roomRecord.hostUserId,
      hasAnsweredCurrent: Boolean(userAns),
      lastAnswer:
        status === "RESULTS" || status === "FINISHED" || p.userId === clientUserId
          ? userAns
          : undefined,
    };
  });

  // Calculate Authoritative Leaderboard
  const leaderboardData = playersList.map((p: any) => {
    const userAnswers = answersList.filter((a: any) => a.userId === p.userId);
    return {
      userId: p.userId,
      displayName: p.displayName,
      score: p.score || 0,
      answers: userAnswers.map((a: any) => ({
        isCorrect: Boolean(a.isCorrect),
        responseTimeMs: Number(a.responseTimeMs) || 1500,
      })),
    };
  });

  const leaderboard = buildLeaderboard(leaderboardData);

  const leaderboardFormatted: any[] = leaderboard.map((e) => ({
    ...e,
    id: e.userId,
    name: e.displayName,
    tag: e.tag || `@${e.displayName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  }));

  return {
    roomId,
    roomCode: roomRecord.roomCode,
    gameId: roomRecord.gameId,
    hostUserId: roomRecord.hostUserId,
    status,
    currentQuestionIndex: currentQIndex,
    totalQuestions: gameQuestions.length,
    questionStartedAt: roomRecord.questionStartedAt
      ? new Date(roomRecord.questionStartedAt).toISOString()
      : null,
    questionDeadline: roomRecord.questionDeadline
      ? new Date(roomRecord.questionDeadline).toISOString()
      : null,
    remainingSeconds,
    currentQuestion,
    players: players.map((p) => ({
      ...p,
      name: p.displayName,
      tag: p.avatarTag || `@${p.displayName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      lastAnswer: p.lastAnswer
        ? {
            ...p.lastAnswer,
            optionKey: (p.lastAnswer as any).selectedAnswer || (p.lastAnswer as any).optionKey,
            pointsAwarded: (p.lastAnswer as any).points || (p.lastAnswer as any).pointsAwarded,
          }
        : undefined,
    })),
    leaderboard: leaderboardFormatted,
    recentEvents: [],
    isHost: clientUserId ? clientUserId === roomRecord.hostUserId : false,
    // Frontend compatibility aliases:
    id: roomId,
    code: roomRecord.roomCode,
    hostId: roomRecord.hostUserId,
    activeQuestion: currentQuestion,
    settings: {
      roundCount: gameQuestions.length || 5,
      timeLimitSeconds: 15,
      mode: currentQuestion?.category || "ROM // 001: WHO SAID IT?",
    },
  } as any;
}
