const User = require("../models/user.js");
module.exports.renderSignupForm = async (req, res) => {
    res.render("users/signup.ejs");
}
module.exports.registerUser = async (req, res, next) => {
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
}
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
}
module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Successfully logged out!");
        res.redirect("/listings");
    });
}
module.exports.loginUser = (req, res) => {
    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.redirecturl || "/listings";
    res.redirect(redirectUrl);
}