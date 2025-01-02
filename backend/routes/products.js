import express from "express";
import {
  canUserReview,
  createProductReview,
  deleteProductDetails,
  deleteProductImage,
  deleteProductReview,
  getAdminProducts,
  getProductDetails,
  getProductReviews,
  getProducts,
  newProduct,
  updateProductDetails,
  uploadProductImages,
} from "../controllers/productControllers.js";
import { authorizeRole, isAuthenticatedUser } from "../middlewares/auth.js";
const router = express.Router();

router.route("/products").get(getProducts);

router
  .route("/admin/products")
  .post(isAuthenticatedUser, authorizeRole("admin"), newProduct)
  .get(isAuthenticatedUser, authorizeRole("admin"), getAdminProducts);

  router
  .route("/admin/products/:id/upload_images")
  .put(isAuthenticatedUser, authorizeRole("admin"), uploadProductImages)

  router
  .route("/admin/products/:id/delete_image")
  .put(isAuthenticatedUser, authorizeRole("admin"), deleteProductImage)
  
router.route("/products/:id").get(getProductDetails);
router
  .route("/admin/products/:id")
  .put(isAuthenticatedUser, authorizeRole("admin"), updateProductDetails);
router
  .route("/admin/products/:id")
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteProductDetails);
router
  .route("/reviews")
  .put(isAuthenticatedUser, createProductReview)
  .get(isAuthenticatedUser, getProductReviews);

router
  .route("/admin/reviews")
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteProductReview);

router.route("/can_review").get(isAuthenticatedUser,canUserReview);
export default router;
