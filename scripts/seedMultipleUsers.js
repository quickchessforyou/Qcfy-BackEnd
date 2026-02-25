import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/UserSchema.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we load .env from the root of backend
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedUsers = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB.");

        const password = "user@123";
        console.log(`Hashing password ${password}...`);
        const hashedPassword = await bcrypt.hash(password, 10);

        let createdCount = 0;

        for (let i = 1; i <= 10; i++) {
            const email = `user${i}@gmail.com`;
            const username = `user${i}`;
            const name = `Test User ${i}`;

            // Check if user exists by email
            const existingEmailUser = await User.findOne({ email });
            if (existingEmailUser) {
                console.log(`Email ${email} already exists in DB. Skipping.`);
                continue;
            }

            // Check if user exists by username
            const existingUsernameUser = await User.findOne({ username });
            if (existingUsernameUser) {
                console.log(`Username ${username} already exists in DB. Skipping.`);
                continue;
            }

            // Create user
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

            console.log(`Created user: ${email} with username: ${username}`);
            createdCount++;
        }

        console.log(`\nSuccessfully created ${createdCount} new users.`);
        console.log("Seeding script completed.");
        process.exit(0);

    } catch (error) {
        console.error("Error generating users:", error);
        process.exit(1);
    }
};

seedUsers();
