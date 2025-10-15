const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { validateUser, saveRedirectUrl } = require("../middleware/validation.js");

// Register Route - Show registration form
router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

// Register Route - Handle user registration
router.post("/signup", validateUser, wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body.user;
        // Check if email already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            req.flash("error", "Email address is already registered");
            return res.redirect("/signup");
        }
        const user = new User({ username, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch (e) {
        // Handle username duplicate error from passport-local-mongoose
        if (e.name === 'UserExistsError') {
            req.flash("error", "Username is already taken");
        } else {
            req.flash("error", "An error occurred during registration");
        }
        res.redirect("/signup");
    }
}));

// Login form
router.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

// Login route
router.post("/login", saveRedirectUrl, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Check if username/email was provided
            if (!req.body.username) {
                req.flash("error", "Please enter your username");
            } else if (!req.body.password) {
                req.flash("error", "Please enter your password");
            } else {
                req.flash("error", "Invalid username or password");
            }
            return res.redirect("/login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome back to Wanderlust!");
            let redirectUrl = res.locals.redirecturl || '/listings';
            res.redirect(redirectUrl);
        });
    })(req, res, next);
});

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    });
});

module.exports = router;