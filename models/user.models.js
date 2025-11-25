import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    image:{
        type:String,
    },
    password:{
        type:String,
        required:true,
        min:8
    }
})

const userModel = mongoose.model("User",userSchema)

export default userModel