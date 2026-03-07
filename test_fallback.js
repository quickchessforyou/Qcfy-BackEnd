import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import CompetitionModel from './models/CompetitionSchema.js';
import UserModel from './models/UserSchema.js';
import { getCurrentLeaderboard } from './utils/socketHandlers.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create dummy user
    const u = new UserModel({ username: "testuser", email: "test@test.com", passwordHash: "x" });
    await u.save();

    // Create dummy legacy comp
    const comp = new CompetitionModel({
        name: "Legacy Test",
        startTime: new Date(Date.now() - 1000000),
        endTime: new Date(Date.now() - 500000),
        participants: [{ user: u._id, score: 99 }]
    });
    await comp.save();

    console.log("Created legacy comp:", comp._id);

    // Run the fallback
    const board = await getCurrentLeaderboard(comp._id);
    console.log("Returned leaderboard length:", board.length);
    console.log("Data:", JSON.stringify(board, null, 2));

    // Clean up
    await UserModel.findByIdAndDelete(u._id);
    await CompetitionModel.findByIdAndDelete(comp._id);

    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
