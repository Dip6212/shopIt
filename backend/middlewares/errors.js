import ErrorHandler from "../utils/errorHandler.js";

export default (err,req,res,next)=>{
    let error={
        statusCode: err?.statusCode || 500,
        message: err?.message || "internal server error",
    };

    // handle invalid mongoose id error
    if(err.name=="CastError"){
        const message=`resource not found. Invalid: ${err?.path}`;
        error=new ErrorHandler(message,404);
        
    }

    // handle duplicate user error
    if(err.code==11000){
        const message=`Duplicate ${Object.keys(err.keyValue)} entered`;
        error=new ErrorHandler(message,400);
        
    }

    // handle validation error
    if(err.name=="validatorError"){
        const message=Object.values(err.errors).map((value)=>value.message);
        error=new ErrorHandler(message,400);
        
    }

    // handle wrong jwt error
    if(err.name=="JsonWebTokenError"){
        const message=`JSON web Token is Inavlid. Try again!!!`;
        error=new ErrorHandler(message,400);  
    }
    // handle expired jwt error
    if(err.name=="JsonWebTokenError"){
        const message=`JSON web Token is Expired. Try again!!!`;
        error=new ErrorHandler(message,400);  
    }

    if(process.env.NODE_ENV=== "DEVELOPMENT"){
        res.status(error.statusCode).json({
            message:error.message,
            error:err,
            stack:err?.stack,
        });
    }

    if(process.env.NODE_ENV=== "PRODUCTION"){
        res.status(error.statusCode).json({
            message:error.message,
        });
    }

};