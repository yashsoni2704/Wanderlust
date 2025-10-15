const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateListing, isLoggedIn } = require("../middleware/validation.js");

// Index Route - Show all listings
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({}).populate("owner");
    res.render("listings/index.ejs", { allListings });
}));

// New Route - Form to create new listing
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// Create Route - Create new listing
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
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
    // Set the owner to the currently logged in user
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash('success', 'Successfully made a new listing!');
    res.redirect("/listings");
}));

// Show Route - Show individual listing
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({path:"reviews", populate:{path:"author"}}).populate("owner");
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    res.render("listings/individual.ejs", { listing });
}));



// Edit Route - Form to edit listing
router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    res.render("listings/edit.ejs", { list: listing });
}));

// Update Route - Update listing
router.put("/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if(listing.owner && !listing.owner.equals(req.user._id)){
        req.flash("error", "You do not have permission to edit this listing!");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${id}`);
}));

// Delete Route - Delete listing
router.delete("/:id/delete", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if(listing.owner && !listing.owner.equals(req.user._id)){
        req.flash("error", "You do not have permission to delete this listing!");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted a listing!');
    res.redirect("/listings");
}));

module.exports = router;