import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import CompetitionModel from './models/CompetitionSchema.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const comps = await CompetitionModel.find({}).lean();
    console.log("Found", comps.length, "competitions in DB");
    for (const c of comps) {
        const pCount = c.participants ? c.participants.length : 0;
        console.log(`ID: ${c._id} | Name: ${c.name} | Status: ${c.status} | Parts: ${pCount}`);
    }
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
