const ExpressError = require("../utils/ExpressError");
const { listingSchema, reviewSchema } = require("../schema.js");

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

module.exports = {
    validateListing,
    validateReview
};