const Listing = require('../models/listing');
const Review = require('../models/review');
const ExpressError = require('../utils/ExpressError');
module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError("Listing Not Found", 404);

    // Create a new Review
    const { rating, comment } = req.body.review;
    const review = new Review({ rating, comment });
    review.author = req.user._id; // Set the author to the currently logged-in user
    await review.save();

    // Push review _id into listing.reviews
    listing.reviews.push(review);
    await listing.save();

    req.flash('success', 'Successfully added a review!');
    console.log("New Review Added:", review);
    res.redirect(`/listings/${id}`);
}

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    
    // Remove review from listing
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});

    // Delete review document
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted a review!');
    res.redirect(`/listings/${id}`);
}
