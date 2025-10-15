const ExpressError = require("../utils/ExpressError");
const { listingSchema, reviewSchema, userSchema } = require("../schema.js");
const Review = require("../models/review.js");

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
        req.session.redirecturl = req.originalUrl;
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};

const isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You don't have permission to delete this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
const saveRedirectUrl = (req, res, next) => {
    if (req.session.redirecturl) {
        res.locals.redirecturl = req.session.redirecturl;
        delete req.session.redirecturl;  // Clear it from session after storing in res.locals
    } else {
        res.locals.redirecturl = '/listings';  // Default redirect if none saved
    }
    next();
};

const isAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        return next(new ExpressError("Review not found", 404));
    }
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Export all middleware functions (single export at end, after declarations)
module.exports = {
    validateListing,
    validateReview,
    validateUser,
    isLoggedIn,
    isReviewAuthor,
    saveRedirectUrl,
    isAuthor
};