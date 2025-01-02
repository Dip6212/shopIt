import express from "express";
import { authorizeRole, isAuthenticatedUser } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getOrderDetails, getSales, myOrder, newOrder, updateOrder } from "../controllers/orderControllers.js";
const router = express.Router();

router.route("/orders/new").post(isAuthenticatedUser, newOrder);
router.route("/orders/:id").get(isAuthenticatedUser, getOrderDetails);
router.route("/me/orders").get(isAuthenticatedUser, myOrder);
router.route("/admin/orders").get(isAuthenticatedUser, authorizeRole("admin"), allOrders);
router.route("/admin/get_sales").get(isAuthenticatedUser, authorizeRole("admin"), getSales);
router.route("/admin/orders/:id").put(isAuthenticatedUser, authorizeRole("admin"), updateOrder).delete(isAuthenticatedUser, authorizeRole("admin"), deleteOrder);

export default router;
