import mongoose from "mongoose";

const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true, "Please Enter Product Name"],
        maxLength:[200, "Product Name Can't Cross 200 characters"],
    },
    price:{
        type:Number,
        required:[true,"Please Enter Prouct Price"],
        maxLength:[5,"Product price can not cross 5 digits"],
    },
    description:{
        type:String,
        required:[true, "please enter prouct description"],
    },
    ratings:{
        type:Number,
        default:0,
    },
    images:[
        {
            public_id:{
                type:String,
                required:true,
            },
            url:{
                type:String,
                required:true,
            },
        },
    ],
    category:{
        type:String,
        required:[true, "please enter prouct Category"],
        enum:{
            values:[
                "Electronics",
                "Cameras",
                "Laptops",
                "Accessories",
                "Headphones",
                "Food",
                "Books",
                "Outdoor",
                "Home",
            ],
            message:"please select correct category",
        },
    },
    seller:{
        type:String,
        required:[true, "please enter prouct Seller"],
    },
    stock:{
        type:Number,
        required:[true, "please enter prouct Stock"],
    },
    numOfReviews:{
        type:Number,
        default:0,
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true,
            },
            rating:{
                type:Number,
                required:true,
            },
            comment:{
                type:String,
                required:true,
            },
        }
    ],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:false,
    },
},
{timestamps:true},

);

export default mongoose.model("Product",productSchema);