const User = require("../models/user.js");
const crypto = require('crypto');
const { sendPasswordResetEmail, sendPasswordResetOtpEmail } = require('../utils/emailService.js');
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
    req.flash("success", `Welcome back ${req.user.username}` );
    const redirectUrl = res.locals.redirecturl || "/listings";
    res.redirect(redirectUrl);
}

// Render forgot password form
module.exports.renderForgotPasswordForm = (req, res) => {
    res.render("users/forgot-password.ejs");
}

// Handle forgot password request (OTP-based)
module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email input
        if (!email || !email.trim()) {
            req.flash("error", "Please enter a valid email address.");
            return res.redirect("/forgot-password");
        }
        
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            req.flash("error", "Please enter a valid email address format.");
            return res.redirect("/forgot-password");
        }
        
        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        
        if (!user) {
            req.flash("error", "No account found with that email address. Please check your email or sign up for a new account.");
            return res.redirect("/forgot-password");
        }
        
        // Generate 6-digit OTP and store in session with metadata
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        req.session.passwordReset = {
            userId: user._id.toString(),
            email: user.email,
            otp,
            otpExpiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        // Send OTP email
        const emailResult = await sendPasswordResetOtpEmail(user.email, otp, user.username);

        if (emailResult.success) {
            req.flash("success", "OTP sent to your email address. Please enter it below.");
            return res.redirect("/verify-otp");
        } else {
            console.error("OTP email sending failed:", emailResult.error);
            req.session.passwordReset = undefined;
            req.flash("error", "Failed to send OTP email. Please try again later.");
            return res.redirect("/forgot-password");
        }
        
    } catch (error) {
        console.error("Forgot password error:", error);
        req.flash("error", "An unexpected error occurred. Please try again later.");
        res.redirect("/forgot-password");
    }
}

// Render OTP verification page
module.exports.renderVerifyOtp = (req, res) => {
    return res.render("users/verify-otp.ejs");
};

// Verify OTP and redirect to reset page
module.exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const sessionData = req.session.passwordReset;

        if (!sessionData) {
            req.flash("error", "Your OTP session has expired. Please request a new OTP.");
            return res.redirect("/forgot-password");
        }

        if (Date.now() > sessionData.otpExpiresAt) {
            req.session.passwordReset = undefined;
            req.flash("error", "OTP has expired. Please request a new one.");
            return res.redirect("/forgot-password");
        }

        if (!otp || otp.trim() !== sessionData.otp) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect("/verify-otp");
        }

        // OTP verified. Create short-lived token for reset page
        const resetToken = crypto.randomBytes(24).toString('hex');
        req.session.passwordReset.resetToken = resetToken;
        req.session.passwordReset.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        return res.redirect(`/reset-password/${resetToken}`);
    } catch (e) {
        console.error("verifyOtp error:", e);
        req.flash("error", "Something went wrong. Please try again.");
        return res.redirect("/forgot-password");
    }
};

// Render reset password form
module.exports.renderResetPasswordForm = async (req, res) => {
    try {
        const { token } = req.params;
        const sessionData = req.session.passwordReset;

        if (!sessionData || sessionData.resetToken !== token || Date.now() > sessionData.resetTokenExpiresAt) {
            req.flash("error", "Your reset session expired. Please request a new OTP.");
            return res.redirect("/forgot-password");
        }

        return res.render("users/reset-password.ejs", { token });
        
    } catch (error) {
        console.error("Reset password form error:", error);
        req.flash("error", "An error occurred. Please try again.");
        res.redirect("/forgot-password");
    }
}

// Handle password reset
module.exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;
        
        // Validate password input
        if (!password || !confirmPassword) {
            req.flash("error", "Please fill in all password fields.");
            return res.redirect(`/reset-password/${token}`);
        }
        
        // Validate password length
        if (password.length < 6) {
            req.flash("error", "Password must be at least 6 characters long.");
            return res.redirect(`/reset-password/${token}`);
        }
        
        // Validate passwords match
        if (password !== confirmPassword) {
            req.flash("error", "Passwords do not match. Please try again.");
            return res.redirect(`/reset-password/${token}`);
        }
        
        const sessionData = req.session.passwordReset;
        if (!sessionData || sessionData.resetToken !== token || Date.now() > sessionData.resetTokenExpiresAt) {
            req.flash("error", "Your reset session expired. Please request a new OTP.");
            return res.redirect("/forgot-password");
        }

        const user = await User.findById(sessionData.userId);
        if (!user) {
            req.flash("error", "User not found. Please try again.");
            return res.redirect("/forgot-password");
        }
        
        // Set new password
        await user.setPassword(password);
        
        await user.save();
        // Clear session reset data
        req.session.passwordReset = undefined;
        
        req.flash("success", "Your password has been successfully reset! You can now log in with your new password.");
        res.redirect("/login");
        
    } catch (error) {
        console.error("Reset password error:", error);
        req.flash("error", "An error occurred while resetting your password. Please try again or request a new reset link.");
        res.redirect(`/reset-password/${req.params.token}`);
    }
}