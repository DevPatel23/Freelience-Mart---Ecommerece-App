import express from "express"; //      express ni help thi router banavisu
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  updateProfileController,
  userOrdersController,
  adminAllOrdersController,
  orderStatusController,
  adminAllUsersController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

//router object
const router = express.Router(); //      aani help thi router banavisu alag alag

//////             routing process               /////

//     1.    REGISTER || METHOD:POST
router.post("/register", registerController); //     ( _ , callback func chhe controller) router method mate

//     5.    FORGOT PASSWORD || POST
router.post("/forgot-password", forgotPasswordController);

//     2.    LOGIN || METHOD:POST
router.post("/login", loginController);

//     3.    Test Routes for middleware
router.get("/test", requireSignIn, isAdmin, testController); //    jya sudhi aa middleware ni made tya sudhi API access par javay j ni
//                                                                 aa middleware atyre TEST krya ane tene aagad use karisu
//
//     4.    protected USER-route /(auth)
router.get("/auth-user", requireSignIn, (req, res) => {
  //                                                          authenticate user check karvana chhe etle /auth-user rakhyu
  res.status(200).send({ ok: true }); //          /auth-user ne private route ma access karsu --> etle dashboard page private bani jase,
}); //                                (req, res) valo controller ahi j sathe banai didho, jya sudhi ok-true ni thay tya sudhi aa route display nai thase
//

//     6.    protected ADMIN-route /(auth)
router.get("/auth-admin", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

router.put("/profile", requireSignIn, updateProfileController);

// code in 2024
// user orders
router.get("/orders", requireSignIn, userOrdersController);

// Admin orders
router.get("/all-orders", requireSignIn, isAdmin, adminAllOrdersController);

// Admin users
router.get("/all-users", requireSignIn, isAdmin, adminAllUsersController);

// orders status UPDATE
router.put(
  "/order-status/:orderId", //                        id na base par update krse ORDER ma STATUS ne
  requireSignIn,
  isAdmin,
  orderStatusController
);

export default router;
