const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { validateListing, isLoggedIn } = require("../middleware/validation.js");
const listingController = require("../controllers/listings.js");

router
.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn, validateListing, wrapAsync(listingController.createListing)); 

router
.route("/new")
.get(isLoggedIn, listingController.renderNewForm);

router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn, validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn, wrapAsync(listingController.deleteListing));

// Edit Route - Form to edit listing
router.get("/:id/edit", isLoggedIn, wrapAsync(listingController.editListing));

module.exports = router;