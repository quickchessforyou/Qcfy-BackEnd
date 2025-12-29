import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    avatar: String,

    rating: { type: Number, default: 1200 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});



const userModel = mongoose.model("User", UserSchema)

export default userModel