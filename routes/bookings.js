const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware/validation");
const bookingsController = require("../controllers/bookings");

router.get("/", isLoggedIn, wrapAsync(bookingsController.listMine));
router.post("/:id/pay", isLoggedIn, wrapAsync(bookingsController.createCheckoutSession));
router.post("/payment/success", isLoggedIn, wrapAsync(bookingsController.paymentSuccess));

module.exports = router;

