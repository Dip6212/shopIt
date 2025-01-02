import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendToken from "../utils/sendToken.js";
import getResetPasswordTemplate from "../utils/emailTemplates.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import {delete_file, upload_file} from "../utils/cloudinary.js"

// register user -- api/v1/register
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
  });

  sendToken(user, 201, res);
});

// login user -- api/v1/login
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("please enter email & password", 400));
  }

  //find user in database
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  //check if passwword is correct
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

//logout user
export const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    message: "Logged Out",
  });
});
//upload user avatar => /api/v1/me/upload_avatar
export const uploadAvatar = catchAsyncErrors(async (req, res, next) => {
  
  const avatarResponse=await upload_file(req.body.avatar,"ShopIt/Avatar");

  if(req?.user?.avatar?.url){
    await delete_file(req?.user?.avatar?.public_id)
  }

  const user=await User.findByIdAndUpdate(req?.user?._id, {
    avatar: avatarResponse,
  });

  res.status(200).json({
    user,
  });
});

// forgot password -- api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  //find user in database
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("user not exist ", 401));
  }

  //get reset password token
  const resetToken = user.getResetPasswordToken();
  await user.save();

  //create reset password url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = getResetPasswordTemplate(user?.name, resetUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "ShopIt Password Recovery",
      message,
    });

    res.status(200).json({
      message: `email sent to ${user?.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return next(new ErrorHandler(error?.message, 500));
  }
});

// reset password -- api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if(!user){
    return next(new ErrorHandler("Password reset token is invalid or has been expired ", 404));
  }

  if(req.body.password!=req.body.confirmPassword){
    return next(new ErrorHandler("password and confirm password is not matched", 401));
  }

  user.password=req.body.password;

  user.resetPasswordToken=undefined;
  user.resetPasswordExpire=undefined;

  await user.save();

  sendToken(user,200,res);
});

//get current user profile => api/v1/me
export const getUserProfile=catchAsyncErrors(async (req,res,next)=>{
    const user= await User.findById(req?.user?._id);

    res.status(200).json({
        user
    });
});

// update user password => api/v1/password/update
export const updatePassword=catchAsyncErrors(async (req,res,next)=>{
    const user= await User.findById(req?.user?._id).select("+password");

    //check the previous user password
    const isPasswordMatched=await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("old password is incorrect", 400));
    }

    user.password = req.body.password;
    user.save();

    res.status(200).json({
        success:true
    });
});


// update user details => api/v1/me/update
export const updateProfile=catchAsyncErrors(async (req,res,next)=>{
    const newUserData={
      name:req.body.name,
      email:req.body.email
    }

    const user=await User.findByIdAndUpdate(req.user._id,newUserData,{new:true});

    res.status(200).json({
        user
    });
});

//get all user--ADMIN => api/v1/admin/users
export const getAllUsers=catchAsyncErrors(async (req,res,next)=>{
  const users= await User.find();

  res.status(200).json({
      users
  });
});

//get user detail--ADMIN => api/v1/admin/users/:id
export const getUserDetails=catchAsyncErrors(async (req,res,next)=>{
  const user= await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`no user exists with id ${req.params.id}`,404));
  }

  res.status(200).json({
      user
  });
});

//update user detail--ADMIN => api/v1/admin/users/:id
export const updateUserDetails=catchAsyncErrors(async (req,res,next)=>{
  const newUserData={
    name:req.body.name,
    email:req.body.email,
    role:req.body.role
  }

  const user=await User.findByIdAndUpdate(req.user._id,newUserData,{new:true});

  res.status(200).json({
      user
  });
});

//delete user detail--ADMIN => api/v1/admin/users/:id
export const deleteUserDetails=catchAsyncErrors(async (req,res,next)=>{
  const user= await User.findById(req.params.id);

  if(!user){
    return next(new ErrorHandler(`no user exists with id ${req.params.id}`,404));
  }

  if(user?.avatar?.public_id){
    await delete_file(user?.avatar?.public_id);
  }

 await user.deleteOne();

  res.status(200).json({
      success:true
  });
});
