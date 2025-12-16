import CompetitionModel from "../models/CompetitionSchema.js";
import PuzzleModel from "../models/PuzzleSchema.js";

// Create a new competition
export const createCompetition = async (req, res) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      duration,
      puzzles,
      maxParticipants,
    } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!name || !startTime || !endTime) {
      return res.status(400).json({
        message: "Name, start time, and end time are required",
      });
    }

    // Validate puzzles exist
    if (puzzles && puzzles.length > 0) {
      const existingPuzzles = await PuzzleModel.find({ _id: { $in: puzzles } });
      if (existingPuzzles.length !== puzzles.length) {
        return res.status(400).json({
          message: "Some puzzles do not exist",
        });
      }
    }

    // Determine status based on start time
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    let status = "upcoming";
    let isActive = false;

    if (now >= start && now <= end) {
      status = "live";
      isActive = true;
    } else if (now > end) {
      status = "completed";
      isActive = false;
    }

    const competition = await CompetitionModel.create({
      name,
      description,
      startTime,
      endTime,
      duration,
      puzzles: puzzles || [],
      maxParticipants,
      status,
      isActive,
      createdBy: req.admin._id,
    });

    res.status(201).json({
      message: "Competition created successfully",
      competition,
    });
  } catch (error) {
    console.error("Error creating competition:", error);
    res.status(500).json({
      message: "Failed to create competition",
      error: error.message,
    });
  }
};

// Get all competitions
export const getCompetitions = async (req, res) => {
  try {
    const { status, isActive } = req.query;

    const query = {};
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const competitions = await CompetitionModel.find(query)
      .populate("puzzles")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: competitions,
    });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch competitions",
    });
  }
};

// Get competition by ID
export const getCompetitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await CompetitionModel.findById(id)
      .populate("puzzles")
      .populate("participants.user", "name email")
      .populate("createdBy", "name email");

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: "Competition not found",
      });
    }

    res.status(200).json({
      success: true,
      data: competition,
    });
  } catch (error) {
    console.error("Error fetching competition:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch competition",
    });
  }
};

// Update competition
export const updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const competition = await CompetitionModel.findById(id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Validate puzzles if being updated
    if (updates.puzzles && updates.puzzles.length > 0) {
      const existingPuzzles = await PuzzleModel.find({
        _id: { $in: updates.puzzles },
      });
      if (existingPuzzles.length !== updates.puzzles.length) {
        return res.status(400).json({
          message: "Some puzzles do not exist",
        });
      }
    }

    // Update status based on times if they're being changed
    if (updates.startTime || updates.endTime) {
      const now = new Date();
      const start = new Date(updates.startTime || competition.startTime);
      const end = new Date(updates.endTime || competition.endTime);

      if (now >= start && now <= end) {
        updates.status = "live";
        updates.isActive = true;
      } else if (now > end) {
        updates.status = "completed";
        updates.isActive = false;
      } else {
        updates.status = "upcoming";
        updates.isActive = false;
      }
    }

    updates.updatedAt = new Date();

    Object.assign(competition, updates);
    await competition.save();

    res.status(200).json({
      message: "Competition updated successfully",
      competition,
    });
  } catch (error) {
    console.error("Error updating competition:", error);
    res.status(500).json({ message: "Failed to update competition" });
  }
};

// Delete competition
export const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await CompetitionModel.findByIdAndDelete(id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    res.status(200).json({ message: "Competition deleted successfully" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    res.status(500).json({ message: "Failed to delete competition" });
  }
};

// Join competition (for users)
export const joinCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const competition = await CompetitionModel.findById(id);
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Check if competition is active
    if (!competition.isActive) {
      return res.status(400).json({ message: "Competition is not active" });
    }

    // Check if already joined
    const alreadyJoined = competition.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res
        .status(400)
        .json({ message: "Already joined this competition" });
    }

    // Check max participants
    if (
      competition.maxParticipants &&
      competition.participants.length >= competition.maxParticipants
    ) {
      return res.status(400).json({ message: "Competition is full" });
    }

    competition.participants.push({
      user: userId,
      score: 0,
      completedPuzzles: [],
      joinedAt: new Date(),
    });

    await competition.save();

    res.status(200).json({
      message: "Joined competition successfully",
      competition,
    });
  } catch (error) {
    console.error("Error joining competition:", error);
    res.status(500).json({ message: "Failed to join competition" });
  }
};

// Submit puzzle solution in competition
export const submitSolution = async (req, res) => {
  try {
    const { id, puzzleId } = req.params;
    const { moves, timeTaken } = req.body;
    const userId = req.user._id;

    const competition = await CompetitionModel.findById(id).populate("puzzles");
    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Find participant
    const participant = competition.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!participant) {
      return res
        .status(400)
        .json({ message: "Not a participant in this competition" });
    }

    // Check if puzzle already completed
    if (participant.completedPuzzles.includes(puzzleId)) {
      return res.status(400).json({ message: "Puzzle already completed" });
    }

    // Verify puzzle is part of competition
    const puzzle = competition.puzzles.find(
      (p) => p._id.toString() === puzzleId
    );
    if (!puzzle) {
      return res
        .status(400)
        .json({ message: "Puzzle not part of this competition" });
    }

    // Validate solution (simplified - you can enhance this)
    const isCorrect =
      JSON.stringify(moves) === JSON.stringify(puzzle.solutionMoves);

    if (isCorrect) {
      participant.completedPuzzles.push(puzzleId);
      // Calculate score based on difficulty and time
      let points = 10;
      if (puzzle.difficulty === "medium") points = 20;
      if (puzzle.difficulty === "hard") points = 30;

      // Time bonus (if solved quickly)
      if (timeTaken < 30) points += 5;

      participant.score += points;

      await competition.save();

      res.status(200).json({
        message: "Solution correct!",
        points,
        totalScore: participant.score,
      });
    } else {
      res.status(400).json({ message: "Incorrect solution" });
    }
  } catch (error) {
    console.error("Error submitting solution:", error);
    res.status(500).json({ message: "Failed to submit solution" });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await CompetitionModel.findById(id).populate(
      "participants.user",
      "name email"
    );

    if (!competition) {
      return res.status(404).json({ message: "Competition not found" });
    }

    // Sort participants by score
    const leaderboard = competition.participants
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        user: p.user,
        score: p.score,
        completedPuzzles: p.completedPuzzles.length,
        joinedAt: p.joinedAt,
      }));

    res.status(200).json({
      competition: {
        name: competition.name,
        status: competition.status,
      },
      leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

export default {
  createCompetition,
  getCompetitions,
  getCompetitionById,
  updateCompetition,
  deleteCompetition,
  joinCompetition,
  submitSolution,
  getLeaderboard,
};
