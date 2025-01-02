export default (user,statuscode, res)=>{
    //create jwt token
    const token =user.getJwtToken();

    const options={
        expires: new Date(
            Date.now()+process.env.COOKIE_EXPIRES*24*60*60*1000
        ),
        httpOnly:true,
    };

    res.status(statuscode).cookie("token",token,options).json({
        token,
    })
}