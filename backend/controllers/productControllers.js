import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/product.js";
import Order from "../models/order.js"
import ErrorHandler from "../utils/errorHandler.js";
import APIFilters from "../utils/apiFilters.js";
import {delete_file, upload_file} from "../utils/cloudinary.js"


export const getProducts = async (req, res) => {
  const resPerPage = 4;
  const apiFilters = new APIFilters(Product, req.query).search().filter();
  let products = await apiFilters.query;
  let filterProductsCount= products.length;
  apiFilters.pagination(resPerPage);

  products = await apiFilters.query;

  let productCount = products.length;
  res.status(200).json({
    filterProductsCount,
    productCount,
    resPerPage,
    products,
  });
};

// create new product => api/v1/admin/product
export const newProduct = catchAsyncErrors(async (req, res) => {
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  res.status(200).json({
    product,
  });
});

// get single product => api/v1/product/:id
export const getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req?.params?.id).populate('reviews.user');

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    product,
  });
});

// get Admin product => api/v1/admin/products
export const getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();


  res.status(200).json({
    products,
  });
});

// update single product => api/v1/product/:id
export const updateProductDetails = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req?.params?.id);

  if (!product) {
    return res.status(404).json({
      error: "no product found with this id",
    });
  }

  product = await Product.findByIdAndUpdate(req?.params?.id, req.body, {
    new: true,
  });

  res.status(200).json({
    product,
  });
});

// upload product images => api/v1/admin/products/:id/upload_images
export const uploadProductImages = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req?.params?.id);

  console.log(req?.params?.id);
  

  if (!product) {
    return res.status(404).json({
      error: "no product found with this id",
    });
  }

const uploader =async(image)=>upload_file(image,"shopit/products");

const urls=await Promise.all((req?.body?.images).map(uploader));

product?.images?.push(...urls);

await product.save();

  res.status(200).json({
    product,
  });
});

// delete product images => api/v1/admin/products/:id/delete_image
export const deleteProductImage = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req?.params?.id);

  if (!product) {
    return res.status(404).json({
      error: "no product found with this id",
    });
  }

  const isDeleted=await delete_file(req.body.imgId);

  if(isDeleted){
    product.images=product?.images?.filter(
    (img)=> img.public_id !==req.body.imgId
    );
    await product.save(); 
  }


  res.status(200).json({
    product,
  });
});

// delete single product => api/v1/product/:id
export const deleteProductDetails = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req?.params?.id);

  if (!product) {
    return res.status(404).json({
      error: "no product found with this id",
    });
  }

  //delete images associated with this product
  for(let i=0;i<product?.images?.length;i++){
    await delete_file(product?.images[i].public_id);
  }

  await product.deleteOne();

  res.status(200).json({
    message: "Product Deleted",
  });
});

// create product review => api/v1/reviews
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      error: "no product found with this id",
    });
  }

  const isReviewed = product?.reviews.find(
    (r) => r.user.toString() === req?.user?._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req?.user?._id.toString()) {
        review.rating = rating;
        review.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;
  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// get Product review => api/v1/reviews
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id).populate("reviews.user");

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    reviews: product.reviews,
  });
});

export const deleteProductReview = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Filter out the review to delete
  const reviews = product?.reviews?.filter(
    (review) => review._id.toString() !== req?.query?.id.toString()
  );

  // Update the ratings and number of reviews
  const numOfReviews = reviews.length;
  const ratings =
    numOfReviews === 0
      ? 0
      : product?.reviews?.reduce((acc, item) => item.rating + acc, 0) / numOfReviews;


  product= await Product.findByIdAndUpdate(
    req.query.productId,
    {reviews,numOfReviews,ratings},
    {new:true}
  )

  res.status(200).json({
    success: true,
    product,
    message: "Review deleted successfully",
  });
});

export const canUserReview=catchAsyncErrors(async (req,res,next)=>{
  const orders=await Order.find({
    user:req?.user?._id,
    "orderItems.product": req.query.productId,
  });

  if(orders.length ===0){
    return res.status(200).json({canReview:false})
  }

  res.status(200).json({
    canReview:true,
  })
})
