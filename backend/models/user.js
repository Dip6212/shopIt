import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"please enter your name"],
        maxLength:[50,"name cannot exceed 50 characters"],
    },

    email:{
        type:String,
        required:[true,"please enter your email"],
        unique:true,
    },

    password:{
        type:String,
        required:[true,"please enter password"],
        select:false,
        minLength:[6,"password can't be less than 6 characters"],
    },
    avatar:{
        public_id:String,
        url:String,
    },
    role:{
        type:String,
        default:"user",
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
 },
 {timestamps:true}
);

//encrypting password before saving the user

userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        next();
    }

    this.password=await bcrypt.hash(this.password,10);
});

// jwt token generate
userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES
    });
};

// compare password
userSchema.methods.comparePassword= async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password);
};

//generate password reset token
userSchema.methods.getResetPasswordToken=function(){
    //generate reset password token
    const resetToken=crypto.randomBytes(20).toString("hex");
    //hash and set to resetpasswordtoken
    this.resetPasswordToken= crypto.createHash("sha256").update(resetToken).digest("hex");

    //set token expire time
    this.resetPasswordExpire=Date.now() +30*60*1000;

    return resetToken;
}

export default mongoose.model("User",userSchema);