import jwt from "jsonwebtoken";
import CompetitionModel from "../models/CompetitionSchema.js";
import ParticipantModel from "../models/ParticipantSchema.js";
import CompetitionRankingModel from "../models/CompetitionRankingSchema.js";

/* =========================================================
   HELPER: Get Live Leaderboard (DB = single source of truth)
========================================================= */
const getCurrentLeaderboard = async (competitionId) => {
  try {
    const leaderboard = await ParticipantModel.find({ competitionId })
      .sort({ puzzlesSolved: -1, timeSpent: 1, score: -1 }) // Sort by puzzles solved, then time, then score
      .limit(100) // Increased limit for larger competitions
      .populate("userId", "name avatar")
      .select("userId username score puzzlesSolved timeSpent status submittedAt isSubmitted joinedAt") // Only select needed fields for performance
      .lean();

    return leaderboard.map((p, index) => ({
      rank: index + 1,
      userId: p.userId?._id,
      username: p.username,
      name: p.userId?.name,
      avatar: p.userId?.avatar,
      score: p.score || 0,
      puzzlesSolved: p.puzzlesSolved || 0,
      timeSpent: p.timeSpent || 0,
      status: p.status || (p.isSubmitted ? "SUBMITTED" : "JOINED"), // Fallback for older records
      submittedAt: p.submittedAt || null,
    }));
  } catch (err) {
    console.error("Leaderboard error:", err);
    return [];
  }
};

/* =========================================================
   AUTO START COMPETITION (SERVER CONTROL)
========================================================= */
const autoStartCompetition = async (io, competition) => {
  const now = new Date();

  if (competition.status === "UPCOMING" && now >= competition.startTime) {
    competition.status = "LIVE";
    competition.isActive = true;
    await competition.save();

    console.log(`Competition ${competition._id} AUTO STARTED`);

    io.to(`competition_${competition._id}`).emit("competitionStarted");

    // schedule auto end
    scheduleCompetitionEnd(io, competition._id, competition.endTime);
  }
};

/* =========================================================
   HANDLE COMPETITION END (SERVER CONTROL)
========================================================= */
const handleCompetitionEnd = async (io, competitionId) => {
  try {
    const finalLeaderboard = await getCurrentLeaderboard(competitionId);

    await CompetitionModel.findByIdAndUpdate(competitionId, {
      status: "ENDED",
      isActive: false,
      updatedAt: new Date(),
    });

    await CompetitionRankingModel.deleteMany({ competitionId });

    if (finalLeaderboard.length) {
      await CompetitionRankingModel.insertMany(
        finalLeaderboard.map((p) => ({
          competitionId,
          userId: p.userId,
          username: p.username,
          finalRank: p.rank,
          finalScore: p.score,
          puzzlesSolved: p.puzzlesSolved,
          totalTime: p.timeSpent,
          ENDEDAt: new Date(),
        }))
      );
    }

    io.to(`competition_${competitionId}`).emit("competitionEnded", {
      leaderboard: finalLeaderboard,
    });

    console.log(`Competition ${competitionId} ENDED`);
  } catch (err) {
    console.error("Competition end error:", err);
  }
};

/* =========================================================
   SCHEDULE AUTO END
========================================================= */
const scheduleCompetitionEnd = (io, competitionId, endTime) => {
  const now = new Date();
  const delay = endTime.getTime() - now.getTime();

  if (delay > 0) {
    setTimeout(() => {
      handleCompetitionEnd(io, competitionId);
    }, delay);

    console.log(
      `Competition ${competitionId} scheduled to end in ${Math.round(
        delay / 1000
      )} seconds`
    );
  }
};

/* =========================================================
   SOCKET AUTH MIDDLEWARE
========================================================= */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Auth token required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

/* =========================================================
   INITIALIZE SOCKET HANDLERS
========================================================= */
export const initializeSocketHandlers = (io) => {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, socket.userId);

    /* ---------------- JOIN ROOM ---------------- */
    socket.on("joinCompetition", async ({ competitionId }) => {
      try {
        const participant = await ParticipantModel.findOne({
          competitionId,
          userId: socket.userId,
        });

        if (!participant) {
          socket.emit("error", {
            message: "Join competition first (REST API)",
          });
          return;
        }

        socket.join(`competition_${competitionId}`);

        const leaderboard = await getCurrentLeaderboard(competitionId);
        socket.emit("leaderboardUpdate", leaderboard);
      } catch (err) {
        console.error("joinCompetition error:", err);
        socket.emit("error", { message: "Join failed" });
      }
    });

    /* ---------------- SUBMIT COMPETITION ---------------- */
    socket.on("submitCompetition", async ({ competitionId }) => {
      try {
        await ParticipantModel.findOneAndUpdate(
          { competitionId, userId: socket.userId },
          {
            status: "SUBMITTED",
            submittedAt: new Date(),
          }
        );

        const leaderboard = await getCurrentLeaderboard(competitionId);
        io.to(`competition_${competitionId}`).emit(
          "leaderboardUpdate",
          leaderboard
        );
      } catch (err) {
        console.error("submitCompetition error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  /* =========================================================
     SERVER START / RESTART SAFETY
  ========================================================= */
  const recoverCompetitions = async () => {
    try {
      const competitions = await CompetitionModel.find({
        endTime: { $gt: new Date() },
      });

      for (const comp of competitions) {
        if (comp.status === "LIVE") {
          scheduleCompetitionEnd(io, comp._id, comp.endTime);
        }

        if (comp.status === "UPCOMING") {
          await autoStartCompetition(io, comp);
          // Schedule start if not already started
          const now = new Date();
          const startDelay = comp.startTime.getTime() - now.getTime();
          if (startDelay > 0 && comp.status === "UPCOMING") {
            setTimeout(async () => {
              const updatedComp = await CompetitionModel.findById(comp._id);
              if (updatedComp && updatedComp.status === "UPCOMING") {
                await autoStartCompetition(io, updatedComp);
              }
            }, startDelay);
          }
        }
      }

      console.log(
        `Recovered ${competitions.length} competitions on server start`
      );
    } catch (err) {
      console.error("Recovery error:", err);
    }
  };

  recoverCompetitions();

  // Periodic check for competitions that should start (every 10 seconds)
  setInterval(async () => {
    try {
      const competitions = await CompetitionModel.find({
        status: "UPCOMING",
        startTime: { $lte: new Date() },
        endTime: { $gt: new Date() }
      });

      for (const comp of competitions) {
        await autoStartCompetition(io, comp);
      }
    } catch (err) {
      console.error("Auto-start check error:", err);
    }
  }, 10000); // Check every 10 seconds
};

/* =========================================================
   EXPORTS
========================================================= */
export {
  getCurrentLeaderboard,
  handleCompetitionEnd,
  scheduleCompetitionEnd,
};
