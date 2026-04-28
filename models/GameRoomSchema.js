import mongoose from "mongoose";

const GameRoomSchema = new mongoose.Schema({
  roomCode: { type: String, unique: true },
  whitePlayer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  blackPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  status: {
    type: String,
    enum: ["waiting", "started", "finished"],
    default: "waiting"
  },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  timeControl: {
    type: String,
    enum: ["1min", "3min", "5min", "10min"],
    default: "5min"
  },

  createdAt: { type: Date, default: Date.now }
});

const RoomModel = mongoose.model("Room", GameRoomSchema)

export default RoomModel;