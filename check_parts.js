import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import ParticipantModel from './models/ParticipantSchema.js';
import CompetitionRankingModel from './models/CompetitionRankingSchema.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const compId = "69ac33f881f04791eb2e07ef"; // The one from the screenshot
    // Wait, let's just find ANY participant
    const tId = "69ac33f881f04791eb2e07ef";

    console.log(`Checking competition: ${tId}`);

    const ranks = await CompetitionRankingModel.find({ competitionId: tId }).lean();
    console.log(`Rankings found: ${ranks.length}`);

    const parts = await ParticipantModel.find({ competitionId: tId }).lean();
    console.log(`Participants found: ${parts.length}`);

    if (parts.length > 0) {
        console.log("First participant:", JSON.stringify(parts[0], null, 2));
    }

    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
