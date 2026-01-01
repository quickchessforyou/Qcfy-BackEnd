import User from "../models/UserSchema.js";
import OTP from "../models/OTPSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendOTPEmail from "../utils/emailService.js";
import PuzzleModel from "../models/PuzzleSchema.js";
import PuzzleHistoryModel from "../models/PuzzleHistorySchema.js";
import CompetitionModel from "../models/CompetitionSchema.js";
import fs from "fs";
import path from "path";


const register = async (req, res) => {
  try {
    const { name, email, password, username, wins, losses, draws } = req.body;
    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const avatar = req.file ? req.file.path : "";
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, username, avatar, wins, losses, draws });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ message: "User registered successfully", user, token });



  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}




const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        id: user._id
      }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({ message: "User logged in successfully", user, token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}



// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to user's email
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📨 Send OTP request received for:', email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    console.log('🔍 Checking if user exists...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ message: "User not found. Please register first." });
    }
    console.log('✅ User found:', user.email);

    // Delete any existing OTPs for this email
    console.log('🗑️  Deleting existing OTPs...');
    await OTP.deleteMany({ email });

    // Generate new OTP
    const otp = generateOTP();
    console.log('🔑 Generated OTP:', otp);

    // Save OTP to database
    console.log('💾 Saving OTP to database...');
    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    console.log('✅ OTP saved to database');

    // Send OTP via email
    //  console.log('📧 Sending OTP email...');
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      // console.log('❌ Email sending failed');
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    //console.log('✅ OTP process ENDED successfully');
    return res.status(200).json({
      message: "OTP sent successfully to your email",
      // In development, you might want to return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error.message);
    // console.error("📋 Error details:", {
    //   name: error.name,
    //   message: error.message,
    //   stack: error.stack
    // });
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify OTP and login user
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      isUsed: false,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "OTP verified successfully. Logged in.",
      user,
      token
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword
    });

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllPuzzles = async (req, res) => {
  try {
    const puzzles = await PuzzleModel.find();
    return res.status(200).json({ puzzles });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Get current user data with statistics
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated middleware

    // Find the user and exclude password
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get statistics
    // Count solved puzzles (where isSolved is true)
    const puzzlesSolved = await PuzzleHistoryModel.countDocuments({
      userId: userId,
      isSolved: true
    });

    // Count competitions participated in (where user is in participants array)
    const competitionsParticipated = await CompetitionModel.countDocuments({
      'participants.user': userId
    });

    // Convert user to object and add statistics
    const userObject = user.toObject();
    userObject.statistics = {
      puzzlesSolved,
      competitionsParticipated
    };

    return res.status(200).json({
      message: "User data retrieved successfully",
      user: userObject
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, username } = req.body;
    const userId = req.user._id; // Get user ID from authenticated middleware

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Handle file upload (avatar)
    let avatarPath = user.avatar; // Keep existing avatar by default
    if (req.file) {
      // Delete old avatar file if it exists
      if (user.avatar) {
        // Construct path relative to project root (where multer saves files)
        const oldAvatarPath = path.join(process.cwd(), user.avatar);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (err) {
          console.error("Error deleting old avatar:", err);
          // Continue even if deletion fails
        }
      }
      avatarPath = req.file.path; // Save new avatar path
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (req.file) updateData.avatar = avatarPath;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user error:", error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        error: error.message
      });
    }

    // Handle duplicate key error (for unique fields)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export { register, login, sendOTP, verifyOTP, resetPassword, getAllPuzzles, getCurrentUser, updateUser }
