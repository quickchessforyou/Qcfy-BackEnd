import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/UserSchema.js";

// Load environment variables
dotenv.config();

const createCustomUser = async () => {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
      console.log("Usage: npm run create:custom-user <name> <username> <email> <password>");
      console.log("Example: npm run create:custom-user \"John Doe\" johndoe john@example.com mypassword123");
      process.exit(1);
    }

    const [name, username, email, password] = args;

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username }
      ]
    });

    if (existingUser) {
      console.log("❌ User already exists with this email or username");
      console.log("Existing user:", {
        name: existingUser.name,
        username: existingUser.username,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      });
      process.exit(1);
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log("Creating user...");
    const user = await User.create({
      name: name,
      username: username,
      email: email,
      password: hashedPassword,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0
    });

    console.log("✅ User created successfully!");
    console.log("User details:", {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      rating: user.rating,
      createdAt: user.createdAt
    });

    console.log("\n🔑 Login credentials:");
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);

    process.exit(0);

  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
};

// Run the script
createCustomUser();