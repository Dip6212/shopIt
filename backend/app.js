import express from "express";
const app = express();
import { connectDatabase } from "./config/database.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/errors.js";
import path from "path";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

// uncaught error handling
process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err}`);
  console.log("shutting down the servers due to uncaught exceptions");
  process.exit(1);
});
if(process.env.NODE_ENV!=="PRODUCTION"){

  dotenv.config({ path: "backend/config/config.env" });
}
// connecting databse

connectDatabase();
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(cookieParser());

// import all routes
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import { fileURLToPath } from "url";

app.use("/api/v1", productRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", paymentRoutes);

// app.use(express.static(path.join(__dirname, "build")));

if(process.env.NODE_ENV === "PRODUCTION"){
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
};

app.use(errorMiddleware);

const server = app.listen(process.env.PORT, () => {
  console.log(
    `server started at port no ${process.env.PORT} in ${process.env.NODE_ENV}`
  );
});

// handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err}`);
  console.log("shutting down server due to unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
