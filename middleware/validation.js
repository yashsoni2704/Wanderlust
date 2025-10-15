const ExpressError = require("../utils/ExpressError");
const { listingSchema, reviewSchema, userSchema } = require("../schema.js");

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body, { abortEarly: false });
    if (error) {
        // Group errors by field
        const errorsByField = {};
        error.details.forEach(err => {
            const field = err.path[err.path.length - 1];
            errorsByField[field] = err.message;
        });
        // Format error message nicely
        const errorMessage = Object.entries(errorsByField)
            .map(([field, message]) => `${message}`)
            .join('. ');
        throw new ExpressError(errorMessage, 400);
    } else {
        next();
    }
};

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        throw new ExpressError(errMsg, 400);
    } else {
        next();
    }
};

const validateUser = (req, res, next) => {
    let { error } = userSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(",");
        req.flash("error", errMsg);
        return res.redirect("/signup");
    }
    next();
};
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};

module.exports = {
    validateListing,
    validateReview,
    validateUser,
    isLoggedIn
};