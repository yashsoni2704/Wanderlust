const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");

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
    newListing.image = {
        url: req.file.path,
        filename: req.file.filename
    };
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
    res.render("listings/individual.ejs", { listing });
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
    res.render("listings/edit.ejs", { list: listing });
}
module.exports.updateListing = async (req, res) => {
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
    // Normalize image field similar to create flow
    if (Object.prototype.hasOwnProperty.call(updateData, 'image')) {
        const incoming = updateData.image;
        if (incoming == null || (typeof incoming === 'string' && incoming.trim() === "")) {
            // If user cleared the field, don't overwrite image; remove from update to keep existing
            delete updateData.image;
        } else if (typeof incoming === 'string') {
            updateData.image = { url: incoming, filename: 'userprovidedimage' };
        } // if it's already an object with url/filename, leave as-is
    }
    await Listing.findByIdAndUpdate(id, updateData, { runValidators: true });
    req.flash('success', 'Successfully updated the listing!');
    res.redirect(`/listings/${id}`);
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