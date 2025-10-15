const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateListing, validateReview } = require("../middleware/validation.js");


//Review Route - Add a review to a listing
router.post("/", validateReview, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError("Listing Not Found", 404);

    // Create a new Review
    const { rating, comment } = req.body.review;
    const review = new Review({ rating, comment });
    await review.save();

    // Push review _id into listing.reviews
    listing.reviews.push(review);
    await listing.save();

    req.flash('success', 'Successfully added a review!');
    console.log("New Review Added:", review);
    res.redirect(`/listings/${id}`);
}));

// Delete Review Route - Delete a review from a listing
router.delete("/:reviewId", wrapAsync(async (req, res) => {
    const { reviewId } = req.params;
    const listing = await Listing.findOne({ reviews: reviewId });
    if (!listing) throw new ExpressError("Listing Not Found", 404);

    // Remove review from listing
    listing.reviews.pull(reviewId);
    await listing.save();

    // Delete review document
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted a review!');
    res.redirect(`/listings/${id}`);
}));
module.exports = router;