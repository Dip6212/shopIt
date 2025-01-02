import mongoose from "mongoose";
import Product from "../models/product.js";
import products from "./data.js";

const seedProducts = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://dipanmukherjee8482:izErn0nBkZ4tGmXU@cluster0.3h7uq.mongodb.net/Cluster0?retryWrites=true&w=majority",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    await Product.deleteMany();
    console.log("Products are deleted");

    await Product.insertMany(products);
    console.log("Products are added");

    await mongoose.disconnect(); // Graceful disconnection
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedProducts();


// import mongoose from "mongoose";

// const uri = "mongodb+srv://dipanmukherjee8482:izErn0nBkZ4tGmXU@cluster0.3h7uq.mongodb.net/Cluster0?retryWrites=true&w=majority";

// const connectDB = async () => {
//   try {
//     await mongoose.connect(uri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("Connected to MongoDB successfully!");
//     await mongoose.disconnect();
//   } catch (error) {
//     console.error("Error connecting to MongoDB:", error.message);
//   }
// };

// connectDB();
