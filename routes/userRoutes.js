const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { validateUser, saveRedirectUrl } = require("../middleware/validation.js");
const userController = require("../controllers/users.js");
const user = require("../models/user.js");

router
.route("/signup")
// Register Route - Show registration form
.get(userController.renderSignupForm)
// Register Route - Handle user registration
.post(validateUser, wrapAsync(userController.registerUser));

router
.route("/login")
// Login form
.get(userController.renderLoginForm)
// Login route
.post(saveRedirectUrl, passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
}), userController.loginUser);

// Logout route
router.get("/logout", userController.logoutUser);

// Forgot password routes
router
    .route("/forgot-password")
    .get(userController.renderForgotPasswordForm)
    .post(wrapAsync(userController.forgotPassword));

// OTP verification routes
router
    .route("/verify-otp")
    .get(userController.renderVerifyOtp)
    .post(wrapAsync(userController.verifyOtp));

// Reset password routes
router
    .route("/reset-password/:token")
    .get(wrapAsync(userController.renderResetPasswordForm))
    .post(wrapAsync(userController.resetPassword));

module.exports = router;