import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/errorHandler.js";

//create new order => /api/v1/orders/new
export const newOrder=catchAsyncErrors(async (req,res,next)=>{
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        paymentInfo,
    } =req.body

    const order=await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod,
        paymentInfo,
        user:req.user._id,
    });

    res.status(200).json({
        order,
    });
});

// get order details => /api/v1/orders/:id
export const getOrderDetails = catchAsyncErrors(async (req,res,next)=>{
    const order=await Order.findById(req.params.id).populate("user","name email");

    if(!order){
        return next(new ErrorHandler("No order with this ID",404));
    }

    res.status(200).json({
        order,
    });
});

// get current user order details => /api/v1/me/orders
export const myOrder = catchAsyncErrors(async (req,res,next)=>{
    const order=await Order.find({user:req.user._id});

    res.status(200).json({
        orderCount:order.length,
        order,
    });
});

// get all orders - ADMIN => /api/v1/admin/orders
export const allOrders = catchAsyncErrors(async (req,res,next)=>{
    const orders=await Order.find();

    res.status(200).json({
        orderCount:orders.length,
        orders,
    });
});

// update order - ADMIN => /api/v1/admin/orders/:id
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      return next(new ErrorHandler("No order with this ID", 404));
    }
  
    if (order?.orderStatus === "Delivered") {
      return next(new ErrorHandler("You have already delivered this order", 400));
    }

    let productNotFound=false;
  
    // Update product stock
    for (const item of order?.orderItems || []) {
      const product = await Product.findById(item?.product?.toString());
      if (!product) {
        productNotFound=true;
        break;
      }
      product.stock = product.stock - item.quantity;
      await product.save({ validateBeforeSave: false });
    }

    if(productNotFound){
        new ErrorHandler("No product found with one or more id, ",404);
    }
  
    // Update order status
    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
    }
    order.orderStatus = req.body.status;
  
    await order.save();
  
    res.status(200).json({
      success: true,
    });
  });
  
// delete order  => /api/v1/admin/orders/:id
export const deleteOrder = catchAsyncErrors(async (req,res,next)=>{
    const order=await Order.findById(req.params.id);

    if(!order){
        return next(new ErrorHandler("No order with this ID",404));
    }

    await order.deleteOne();
    res.status(200).json({
        success:true,
    });
});

async function getSalesData(startDate,endDate){
    const salesData=await Order.aggregate([
        {   //stage-1 filter results-
            $match:{
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            },
        },

        { //stage-2 group data
            $group:{
                _id:{
                    date: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}},
                },
                totalSales: {$sum: "$totalAmount"},
                numOrders: {$sum: 1}, //count the number of orders
            }
        }
    ]);

    // console.log("this is salesData before => ",salesData);

    const salesMap=new Map();

    let totalSales=0;
    let totalNumOrders=0;
    salesData.forEach((entry)=>{
        const date=entry?._id?.date;
        const sales=entry?.totalSales;
        const numOrders=entry?.numOrders;

        salesMap.set(date,{sales,numOrders});
        totalSales +=sales;
        totalNumOrders +=numOrders;
    });
    
    function getDatesBetween(startDate,endDate){
        const dates=[];
        let currentDate=new Date(startDate);
        while(currentDate<=new Date(endDate)){
            const formatteDate=currentDate.toISOString().split("T")[0];
            dates.push(formatteDate);
            currentDate.setDate(currentDate.getDate()+1);
        }
    // console.log("this is dats=> ",dates);
    
    return dates;

}
// console.log("Start Date:", startDate, "End Date:", endDate);

    const datesBetween=getDatesBetween(startDate,endDate);

    // console.log("this is datesBetween => ",datesBetween);
    const finalSalesData=datesBetween.map((date)=>({
        date,
        sales:(salesMap.get(date) || {sales: 0}).sales,
        numOrders:(salesMap.get(date) || {numOrders: 0}).numOrders,
    }));
    // console.log("this is salesData after => ",salesData);
    return {salesData: finalSalesData,totalSales,totalNumOrders};
}




// get sales data  => /api/v1/admin/get_sales
export const getSales = catchAsyncErrors(async (req,res,next)=>{
    
        const startDate=new Date(req.query.startDate);    
        const endDate=new Date(req.query.endDate);

        // console.log("Start Date:", req.query.startDate, "End Date:", endDate);
        
        startDate.setUTCHours(0,0,0,0);
        endDate.setUTCHours(23,59,59,999);

       const {salesData,totalSales,totalNumOrders}=await getSalesData(startDate,endDate);
        
    res.status(200).json({
        totalSales,
        totalNumOrders,
        sales: salesData,
    });
});