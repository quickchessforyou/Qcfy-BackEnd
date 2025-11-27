import jwt from "jsonwebtoken";
import User from "../models/UserSchema.js";


const isAuthenticated = async (req,res,next)=>{
    const token = req.headers.authorization.split(" ")[1];
    if(!token){
        res.status(401).json({message:"token is required"});
    }

    try{
        const decoded= jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
            return res.status(401).json({message:"user not found"});
        }
        req.user = user;
        next();
    }catch(err){
        res.status(401).json({message:"token is invalid"});
    }
    
}


const allowedRoles= (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(401).json({message:"route not allowed for this user"});
        }
        next();
    }
}
 
 export   {allowedRoles,isAuthenticated }