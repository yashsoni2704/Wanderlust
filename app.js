const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js"); 
const Review = require("./models/review.js");
const {listingSchema} = require("./schema.js");
const {reviewSchema} = require("./schema.js");

// Database Connection
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

main()
    .then(() => {
        console.log("Connection Successful");
    })
    .catch((err) => {
        console.log(err);
    });

// Express & EJS Configuration
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Root Route
app.get("/", (req, res) => {
    res.send("Home root");
});

const validateListing = (req,res,next)=>{
let {error} = listingSchema.validate(req.body);
if(error){
    let errMsg = error.details.map(el=>el.message).join(",");
    throw new ExpressError(errMsg,400);
}else{
    next();
}
}
const validateReview = (req,res,next)=>{
let {error} = reviewSchema.validate(req.body);
if(error){
    let errMsg = error.details.map(el=>el.message).join(",");
    throw new ExpressError(errMsg,400);
}else{
    next();
}
}

// Index Route - Show all listings
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
}));

// New Route - Form to create new listing
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Create Route - Create new listing
app.post("/listings",validateListing, wrapAsync(async (req, res) => {
    if(!req.body.listing){
        throw new ExpressError("Invalid Listing Data", 400);
    };
    const newListing = new Listing(req.body.listing);
    if(!newListing.title || !newListing.description || !newListing.price){
        throw new ExpressError("Data missing", 400);
    }
    await newListing.save();
    res.redirect("/listings");
}));

// Show Route - Show individual listing
app.get("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) {
        throw new ExpressError("Listing Not Found", 404);
    }
    res.render("listings/individual.ejs", { listing });
}));

//Review Route - Add a review to a listing
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
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

    console.log("New Review Added:", review);
    res.redirect(`/listings/${id}`);
}));

// Edit Route - Form to edit listing
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError("Listing Not Found", 404);
    }
    res.render("listings/edit.ejs", { list: listing });
}));

// Update Route - Update listing
app.put("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// Delete Route - Delete listing
app.delete("/listings/:id/delete", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

// 404 Route - Handle undefined routes
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

// Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh No, Something Went Wrong!";
    res.status(statusCode).render("error.ejs", { err });
});

// Start server
app.listen(9000, () => {
    console.log("Server is running on http://localhost:9000/listings");
});
