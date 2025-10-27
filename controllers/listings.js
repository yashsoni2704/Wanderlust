const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("owner");
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.createListing = async (req, res) => {
    if(!req.body.listing){
        throw new ExpressError("Invalid Listing Data", 400);
    };
    const listingData = req.body.listing;
    
    // Handle Cloudinary image upload
    if (req.file) {
        // If file was uploaded to Cloudinary, use the Cloudinary response
        listingData.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        console.log("Image uploaded to Cloudinary:", req.file.path);
    } else {
        // If no image was uploaded, remove the image field to use schema defaults
        delete listingData.image;
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
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({path:"reviews", populate:{path:"author"}}).populate("owner");
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload/", "/upload/h_300,w_250");
    res.render("listings/individual.ejs", { listing, originalImageUrl });
}

module.exports.editListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    if (!listing.owner || !listing.owner._id.equals(req.user._id)) {
        req.flash("error", "You do not have permission to edit this listing!");
        return res.redirect(`/listings/${id}`);
    }

    // Create optimized image URL for edit form (smaller, fixed size)
    let originalImageUrl = listing.image.url;
    
    if (originalImageUrl && originalImageUrl.includes("cloudinary.com")) {
        // For Cloudinary URLs, add transformation parameters
        originalImageUrl = originalImageUrl.replace("/upload/", "/upload/h_200,w_300,c_fill,f_auto,q_auto/");
    } else if (originalImageUrl) {
        // Keep original URL if it's not Cloudinary
        originalImageUrl = originalImageUrl;
    } else {
        originalImageUrl = "/images/default-listing.jpg"; // fallback image
    }

    res.render("listings/edit.ejs", { list: listing, originalImageUrl });
}
module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash('error', 'Cannot find that listing!');
            return res.redirect('/listings');
        }
        if (!listing.owner || !listing.owner.equals(req.user._id)) {
            req.flash("error", "You do not have permission to edit this listing!");
            return res.redirect(`/listings/${id}`);
        }
        
        const updateData = { ...req.body.listing };
        
        // Handle new image upload
        if (req.file) {
            console.log("New image uploaded:", req.file.path);
            // Delete old image from Cloudinary if it exists
            if (listing.image && listing.image.filename && listing.image.filename !== 'defaultimage') {
                try {
                    await cloudinary.uploader.destroy(listing.image.filename);
                    console.log("Old image deleted from Cloudinary");
                } catch (deleteError) {
                    console.log("Error deleting old image:", deleteError.message);
                }
            }
            // Set new image from uploaded file
            updateData.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }
        
        await Listing.findByIdAndUpdate(id, updateData, { runValidators: true });
        req.flash('success', 'Successfully updated the listing!');
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Error updating listing:", error);
        req.flash('error', 'Failed to update listing. Please try again.');
        res.redirect(`/listings/${req.params.id}/edit`);
    }
}
module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Cannot find that listing!');
        return res.redirect('/listings');
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to delete this listing!");
        return res.redirect(`/listings/${id}`);
    }
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted a listing!');
    res.redirect("/listings");
}