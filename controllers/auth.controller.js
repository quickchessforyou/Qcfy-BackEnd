import User from "../models/UserSchema.js";
import OTP from "../models/OTPSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendOTPEmail from "../utils/emailService.js";


const register = async (req,res)=>{
    try {
        const {name,email,password,username, wins, losses, draws} = req.body;
        if(!name || !email || !password || !username){
            return res.status(400).json({message:"All fields are required"});
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }

        const avatar = req.file ? req.file.path : "";
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password:hashedPassword,username,avatar, wins, losses, draws});
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"7d"});
        return res.status(200).json({message:"User registered successfully",user,token});

        

    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}


const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"User not found"});
        }
        const isPasswordMatched = await bcrypt.compare(password,user.password);
        if(!isPasswordMatched){
            return res.status(400).json({message:"Invalid password"});
        }
        const token = jwt.sign(
            {
            id:user._id
        },process.env.JWT_SECRET,{expiresIn:"7d"});
        return res.status(200).json({message:"User logged in successfully",user,token});
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
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
    console.log('📧 Sending OTP email...');
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      console.log('❌ Email sending failed');
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    console.log('✅ OTP process completed successfully');
    return res.status(200).json({ 
      message: "OTP sent successfully to your email",
      // In development, you might want to return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error.message);
    console.error("📋 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
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

export { register, login, sendOTP, verifyOTP }
