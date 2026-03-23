import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/UserSchema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedUsers = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log("Connected to database.");

        const password = "user@123";
        console.log(`Hashing password ${password}...`);
        const hashedPassword = await bcrypt.hash(password, 10);

        let createdCount = 0;

        for (let i = 1; i <= 10; i++) {
            const email = `user${i}@gmail.com`;
            const username = `user${i}`;
            const name = `Test User ${i}`;

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                console.log(`User ${email} already exists. Skipping.`);
                continue;
            }

            const exactUsername = await User.findOne({ username });
            if (exactUsername) {
                console.log(`Username ${username} already exists. Skipping.`);
                continue;
            }

            await User.create({
                name,
                email,
                username,
                password: hashedPassword,
                rating: 1200,
                wins: 0,
                losses: 0,
                draws: 0
            });

            console.log(`Created user: ${email}`);
            createdCount++;
        }

        console.log(`\nSuccessfully created ${createdCount} new users.`);
        console.log("Database seeding completed.");
        process.exit(0);

    } catch (error) {
        console.error("Error generating users:", error);
        process.exit(1);
    }
};

seedUsers();
