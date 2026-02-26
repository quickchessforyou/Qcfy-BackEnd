import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/UserSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const hashedPassword = await bcrypt.hash('user@123', 10);
        const usersToCreate = [];

        for (let i = 1; i <= 10; i++) {
            usersToCreate.push({
                name: `User ${i}`,
                email: `user${i}@example.com`,
                username: `user${i}`,
                password: hashedPassword,
                wins: 0,
                losses: 0,
                draws: 0,
                avatar: ''
            });
        }

        try {
            await User.insertMany(usersToCreate, { ordered: false });
            console.log('Successfully created users 1 through 10');
        } catch (insertError) {
            if (insertError.code === 11000) {
                console.log('Some users already exist. The script ignored duplicates.');
            } else {
                console.error('Error during insertion:', insertError);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

createUsers();
