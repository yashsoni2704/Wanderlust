const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateListing, validateReview } = require("../middleware/validation.js");

// Index Route - Show all listings
router.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New Route - Form to create new listing
router.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Create Route - Create new listing
router.post("/listings",validateListing, wrapAsync(async (req, res) => {
    if(!req.body.listing){
        throw new ExpressError("Invalid Listing Data", 400);
    };
    const listingData = req.body.listing;
    // Handle image
    if (!listingData.image || listingData.image.trim() === "") {
        // If no image URL is provided, remove the image field to use schema defaults
        delete listingData.image;
    } else {
        // If image URL is provided, set it with proper structure
        listingData.image = {
            url: listingData.image,
            filename: 'userprovidedimage'
        };
    }
    const newListing = new Listing(listingData);
    if(!newListing.title || !newListing.description || !newListing.price){
        throw new ExpressError("Data missing", 400);
    }
    await newListing.save();
    req.flash('success', 'Successfully made a new listing!');
    res.redirect("/listings");
}));

// Show Route - Show individual listing
router.get("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    res.render("listings/individual.ejs", { listing });
}));

//Review Route - Add a review to a listing
router.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
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
router.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError("Listing Not Found", 404);

    // Remove review from listing
    listing.reviews.pull(reviewId);
    await listing.save();

    // Delete review document
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted a review!');
    res.redirect(`/listings/${id}`);
}));

// Edit Route - Form to edit listing
router.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    res.render("listings/edit.ejs", { list: listing });
}));

// Update Route - Update listing
router.put("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${id}`);
}));

// Delete Route - Delete listing
router.delete("/listings/:id/delete", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted a listing!');
    res.redirect("/listings");
}));

module.exports = router;