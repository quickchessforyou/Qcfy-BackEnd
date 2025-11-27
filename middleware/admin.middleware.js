import AdminModel from "../models/AdminSchema.js";
import jwt from "jsonwebtoken";

const isAdmin = async (req, res, next) => {
    try {
        // Check if authorization header exists
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        // Extract token from "Bearer <token>"
        const authHeader = req.headers.authorization.split(" ");
        if (authHeader.length !== 2 || authHeader[0] !== "Bearer") {
            return res.status(401).json({ message: "Invalid authorization format" });
        }

        const atoken = authHeader[1];

        // Verify JWT token
        const decoded = jwt.verify(atoken, process.env.JWT_SECRET_KEY);
        if(decoded != process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        console.error("Error in admin middleware:", error);
        return res.status(500).json({ message: "Authentication failed" });
    }
}   

export default isAdmin;
