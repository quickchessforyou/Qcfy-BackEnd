import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/UserSchema.js";

// Load environment variables
dotenv.config();

const createUser = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    // User data
    const userData = {
      name: "Abhimanyu",
      username: "Abhimanyu2", // Changed to avoid conflict
      email: "gdeepasudeep@gmail.com",
      password: "qcfyabhimanyu7"
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      console.log("User already exists with this email or username");
      console.log("Existing user:", {
        name: existingUser.name,
        username: existingUser.username,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      });
      process.exit(0);
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    console.log("Creating user...");
    const user = await User.create({
      name: userData.name,
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0
    });

    console.log("User created successfully!");
    console.log("User details:", {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      rating: user.rating,
      createdAt: user.createdAt
    });

    process.exit(0);

  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
};

// Run the script
createUser();