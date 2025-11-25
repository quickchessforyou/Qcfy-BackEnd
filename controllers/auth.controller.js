import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const register = async (req,res)=>{
    try {
        const {name,email,password,role} = req.body;
        if(!name || !email || !password || !role){
            return res.status(400).json({message:"All fields are required"});
        }
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }

        const image = req.file ? req.file.path : "";
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password:hashedPassword,role,image});
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
            id:user._id,
            role:user.role

        },process.env.JWT_SECRET,{expiresIn:"7d"});
        return res.status(200).json({message:"User logged in successfully",user,token});
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}



export {register,login}
