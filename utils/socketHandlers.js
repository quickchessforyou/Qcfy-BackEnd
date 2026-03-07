import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
import CompetitionModel from "../models/CompetitionSchema.js";
import ParticipantModel from "../models/ParticipantSchema.js";
import CompetitionRankingModel from "../models/CompetitionRankingSchema.js";

/* =========================================================
   MODULE STATE
========================================================= */

let _io = null;

const getIO = () => _io;

/* =========================================================
   REDIS HELPERS
========================================================= */

const leaderboardKey = (competitionId) =>
  `leaderboard:${competitionId}`;

const redisScore = (p) =>
  p.puzzlesSolved * 1_000_000 -
  p.timeSpent * 1000 +
  p.score;

/* =========================================================
   BUILD REDIS LEADERBOARD
========================================================= */

const buildRedisLeaderboard = async (competitionId) => {
  try {
    const participants = await ParticipantModel.find({ competitionId }).lean();

    if (!participants.length) return;

    const pipeline = redis.pipeline();

    for (const p of participants) {
      if (p.userId) {
        pipeline.zadd(
          leaderboardKey(competitionId),
          redisScore(p),
          p.userId.toString()
        );
      }
    }

    await pipeline.exec();

  } catch (error) {
    console.error(`[Leaderboard] Redis build error`, error);
  }
};

/* =========================================================
   FAST REDIS LEADERBOARD FETCH
========================================================= */

const getCurrentLeaderboard = async (competitionId, limit = 100) => {
  try {
    const redisData = await redis.zrevrange(
      leaderboardKey(competitionId),
      0,
      limit - 1,
      "WITHSCORES"
    );

    if (!redisData || !redisData.length) {
      return [];
    }

    const result = [];

    for (let i = 0; i < redisData.length; i += 2) {
      result.push({
        rank: i / 2 + 1,
        userId: redisData[i],
        score: Number(redisData[i + 1])
      });
    }

    return result;
  } catch (error) {
    console.error(`[Leaderboard] Redis fetch error for ${competitionId}:`, error);
    return []; // Return empty leaderboard on Redis failure instead of crashing
  }
};

/* =========================================================
   SOCKET AUTH
========================================================= */

const authenticateSocket = (socket, next) => {
  try {

    const token = socket.handshake.auth.token;

    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;

    next();

  } catch {
    next(new Error("Authentication failed"));
  }
};

/* =========================================================
   AUTO START COMPETITION
========================================================= */

const autoStartCompetition = async (io, competition) => {

  const now = new Date();

  if (competition.status !== "UPCOMING") return;

  if (now < competition.startTime) return;

  competition.status = "LIVE";
  competition.isActive = true;

  await competition.save();

  await buildRedisLeaderboard(competition._id);

  console.log(`🚀 Competition ${competition._id} started`);

  io.to(`competition_${competition._id}`).emit("competitionStarted", {
    competitionId: competition._id,
    serverTime: Date.now()
  });

  scheduleCompetitionEnd(io, competition._id, competition.endTime);
};

/* =========================================================
   END COMPETITION
========================================================= */

const handleCompetitionEnd = async (io, competitionId) => {

  const leaderboard = await getCurrentLeaderboard(competitionId);

  io.to(`competition_${competitionId}`).emit("competitionEnded", {
    leaderboard,
    message: "Competition ended!",
    serverTime: Date.now()
  });

  (async () => {

    try {

      await CompetitionModel.findByIdAndUpdate(
        competitionId,
        {
          status: "ENDED",
          isActive: false
        }
      );

      await CompetitionRankingModel.deleteMany({ competitionId });

      if (leaderboard.length) {

        await CompetitionRankingModel.insertMany(
          leaderboard.map(p => ({
            competitionId,
            userId: p.userId,
            finalRank: p.rank,
            finalScore: p.score
          }))
        );

      }

      await redis.del(leaderboardKey(competitionId));

      console.log(`🏁 Competition ${competitionId} finalized`);

    } catch (err) {

      console.error("Final ranking save error:", err);

    }

  })();
};

/* =========================================================
   SCHEDULE END
========================================================= */

const scheduleCompetitionEnd = (io, competitionId, endTime) => {

  const delay = endTime.getTime() - Date.now();

  if (delay <= 0) return;

  setTimeout(() => {

    handleCompetitionEnd(io, competitionId);

  }, delay);

};

/* =========================================================
   SOCKET INITIALIZER
========================================================= */

export const initializeSocketHandlers = (io) => {

  _io = io;

  io.use(authenticateSocket);

  io.on("connection", (socket) => {

    console.log("🔌 Connected:", socket.userId);

    /* ==========================
       JOIN COMPETITION
    ========================== */

    socket.on("joinCompetition", async ({ competitionId }) => {

      try {

        socket.join(`competition_${competitionId}`);

        const competition = await CompetitionModel
          .findById(competitionId)
          .select("status startTime");

        const leaderboard = await getCurrentLeaderboard(competitionId);

        socket.emit("competitionJoined", {
          competitionState: competition.status,
          startTime: competition.startTime,
          serverTime: Date.now(),
          leaderboard
        });

      } catch (err) {

        console.error("joinCompetition:", err);

      }

    });

    /* ==========================
       SUBMIT
    ========================== */

    socket.on("submitCompetition", async ({ competitionId }) => {

      try {

        const participant = await ParticipantModel.findOneAndUpdate(
          { competitionId, userId: socket.userId },
          {
            status: "SUBMITTED",
            submittedAt: new Date()
          },
          { new: true }
        );

        await redis.zadd(
          leaderboardKey(competitionId),
          redisScore(participant),
          participant.userId.toString()
        );

        const leaderboard = await getCurrentLeaderboard(competitionId);

        io.to(`competition_${competitionId}`)
          .emit("leaderboardUpdate", leaderboard);

      } catch (err) {

        console.error("submitCompetition:", err);

      }

    });

    /* ==========================
       LEADERBOARD REFRESH
    ========================== */

    socket.on("refreshLeaderboard", async ({ competitionId }) => {

      try {

        const leaderboard = await getCurrentLeaderboard(competitionId);

        socket.emit("leaderboardUpdate", leaderboard);

      } catch (err) {

        console.error("refreshLeaderboard:", err);

      }

    });

    socket.on("disconnect", () => {

      console.log("❌ Disconnected:", socket.userId);

    });

  });

  /* =========================================================
     SERVER RESTART RECOVERY
  ========================================================= */

  const recover = async () => {

    const competitions = await CompetitionModel.find({
      endTime: { $gt: new Date() }
    });

    for (const comp of competitions) {

      if (comp.status === "LIVE") {

        await buildRedisLeaderboard(comp._id);

        scheduleCompetitionEnd(io, comp._id, comp.endTime);

      }

      if (comp.status === "UPCOMING") {

        autoStartCompetition(io, comp);

      }

    }

    console.log(`♻️ Recovered ${competitions.length} competitions`);

  };

  recover();

  /* =========================================================
     START CHECKER
  ========================================================= */

  // Removed 5-second polling interval. We now use precise timeouts.

};

/* =========================================================
   SCHEDULE START
========================================================= */

export const scheduleCompetitionStart = (io, competition) => {
  const delay = new Date(competition.startTime).getTime() - Date.now();

  if (delay <= 0) {
    autoStartCompetition(io, competition);
  } else {
    // We shouldn't exceed setTimeout max delay (~24.8 days)
    // Most competitions are scheduled within days, so it's fine for now,
    // but a real production system might use BullMQ or cron for long delays.
    setTimeout(async () => {
      try {
        const comp = await CompetitionModel.findById(competition._id);
        if (comp && comp.status === "UPCOMING") {
          await autoStartCompetition(io, comp);
        }
      } catch (err) {
        console.error("Scheduled start error:", err);
      }
    }, delay);
  }
};

/* =========================================================
   ADD PARTICIPANT
========================================================= */

export const addParticipantToLeaderboard = async (
  competitionId,
  participant
) => {

  try {

    await redis.zadd(
      leaderboardKey(competitionId),
      redisScore(participant),
      participant.userId.toString()
    );

  } catch (err) {

    console.error("Redis add error:", err);

  }

  if (_io) {

    const leaderboard = await getCurrentLeaderboard(competitionId);

    _io.to(`competition_${competitionId}`)
      .emit("leaderboardUpdate", leaderboard);

  }

};

export {
  getCurrentLeaderboard,
  handleCompetitionEnd,
  scheduleCompetitionEnd,
  getIO,
  leaderboardKey,
  redisScore
};