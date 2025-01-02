import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "./catchAsyncErrors.js";
import jwt from "jsonwebtoken";


export const isAuthenticatedUser=catchAsyncErrors(async (req,res,next)=>{
    const {token}=req.cookies;

    if(!token){
        return next (new ErrorHandler("Login first to access this route",401));
    }

    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    req.user=await User.findById(decoded.id);
    next();
});

export const authorizeRole=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`role ${req.user.role} is not allowed to access this role`,403));
        }

        next();
    }
}