import mongoose from "mongoose";

const CompetitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,

  // Competition timing
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number }, // Duration in minutes

  // Puzzles for this competition
  puzzles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Puzzle"
  }],

  // Competition settings
  maxParticipants: { type: Number },
  isActive: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["UPCOMING", "LIVE", "ENDED"],
    default: "UPCOMING"
  },


  // Access Control
  accessCode: { type: String }, // Optional password/code to join



  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
CompetitionSchema.index({ status: 1, startTime: 1 });
CompetitionSchema.index({ isActive: 1 });
CompetitionSchema.index({ "participants.user": 1 });

const CompetitionModel = mongoose.model("Competition", CompetitionSchema);

export default CompetitionModel;
