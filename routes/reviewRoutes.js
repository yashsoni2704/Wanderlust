const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware/validation.js");
const reviewController = require("../controllers/reviews.js");


//Review Route - Add a review to a listing
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete Review Route - Delete a review from a listing
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));
module.exports = router;