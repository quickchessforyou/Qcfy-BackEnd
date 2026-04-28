import mongoose from "mongoose";

const GameMoveSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "GameRoom" },
  moveNumber: Number,
  from: String, 
  to: String, 
  piece: String, 
  fen: String,   
  timeStamp: { type: Date, default: Date.now }
});


const GameMoveModel = mongoose.model("GameMove", GameMoveSchema);

export default GameMoveModel;