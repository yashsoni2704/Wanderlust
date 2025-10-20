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
.post(passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
}), userController.loginUser);

// Logout route
router.get("/logout", userController.logoutUser);

module.exports = router;