import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import CompetitionModel from './models/CompetitionSchema.js';

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const compId = "69ac33f881f04791eb2e07ef";
    const comp = await CompetitionModel.findById(compId).populate('participants.user').lean();
    if (comp) {
        console.log(`Found competition ${comp.name}, Participants: ${comp.participants ? comp.participants.length : 'undefined'}`);
        if (comp.participants && comp.participants.length > 0) {
            console.log('User 0:', comp.participants[0].user);
        }
    } else {
        console.log(`Competition ${compId} not found`);
    }
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
