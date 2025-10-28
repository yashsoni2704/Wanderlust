const Listing = require("../models/listing");
const Booking = require("../models/booking");
const ExpressError = require("../utils/ExpressError");
const { cloudinary } = require("../cloudConfig");
const { geocodeLocation } = require("../utils/geocoding");

module.exports.index = async (req, res) => {
    const { where, checkIn, checkOut, guests } = req.query;
    let query = {};

    // Basic text filter if where provided
    if (where) {
        const whereRegex = new RegExp(where.trim(), 'i');
        query.$or = [
            { location: whereRegex },
            { country: whereRegex },
            { title: whereRegex }
        ];
    }

    // Guests hint: if provided, we can filter by price or any other heuristic later
    // For now we don't have capacity field; skipping capacity filter.

    const listings = await Listing.find(query).populate("owner");

    // Compute dynamic price and rooms left if dates/guests provided
    let parsedCheckIn = checkIn ? new Date(checkIn) : null;
    let parsedCheckOut = checkOut ? new Date(checkOut) : null;
    const numGuests = guests ? parseInt(guests, 10) : null;

    const enriched = [];
    for (const l of listings) {
        let adjPrice = l.price;
        let roomsLeft = l.totalRooms;

        // Price scaling by guest capacity
        if (numGuests && l.capacity) {
            const groups = Math.ceil(numGuests / l.capacity);
            adjPrice = l.price * groups; // simple multiplier per capacity group
        }

        // Rooms availability by existing bookings overlap
        if (parsedCheckIn && parsedCheckOut) {
            const overlaps = await Booking.aggregate([
                { $match: { listing: l._id, checkIn: { $lt: parsedCheckOut }, checkOut: { $gt: parsedCheckIn } } },
                { $group: { _id: "$listing", total: { $sum: "$roomsBooked" } } }
            ]);
            const booked = overlaps.length ? overlaps[0].total : 0;
            roomsLeft = Math.max(0, l.totalRooms - booked);
        }

        enriched.push({
            ...l.toObject(),
            adjustedPrice: adjPrice,
            roomsLeft
        });
    }

    res.render("listings/index.ejs", { allListings: enriched });
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
    
    // Geocode location to get coordinates
    if (listingData.location && listingData.country) {
        console.log(`Geocoding: ${listingData.location}, ${listingData.country}`);
        const coordinates = await geocodeLocation(listingData.location, listingData.country);
        if (coordinates) {
            listingData.coordinates = coordinates;
            console.log(`Coordinates found: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else {
            console.log("Could not geocode location");
        }
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
    // Compute optional breakdown if query has dates/guests
    const { checkIn, checkOut, guests } = req.query;
    let breakdown = null;
    let roomsLeftForRange = null;
    if (checkIn && checkOut && guests) {
        const numGuests = parseInt(guests, 10);
        const groups = Math.ceil(numGuests / (listing.capacity || 1));
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.max(1, Math.round((end - start) / (1000*60*60*24)));
        const perNight = listing.price * groups;
        const subtotal = perNight * nights;
        const serviceFee = Math.round(subtotal * 0.12);
        const cleaningFee = Math.round(0.05 * listing.price);
        const total = subtotal + serviceFee + cleaningFee;
        breakdown = { nights, perNight, subtotal, serviceFee, cleaningFee, total, groups };

        // compute rooms left for the selected range
        const overlaps = await Booking.aggregate([
            { $match: { listing: listing._id, checkIn: { $lt: end }, checkOut: { $gt: start } } },
            { $group: { _id: "$listing", total: { $sum: "$roomsBooked" } } }
        ]);
        const booked = overlaps.length ? overlaps[0].total : 0;
        roomsLeftForRange = Math.max(0, (listing.totalRooms || 1) - booked);
    }
    res.render("listings/individual.ejs", { listing, originalImageUrl, breakdown, checkIn, checkOut, guests, roomsLeftForRange });
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
        
        // Geocode location if it was changed
        if (updateData.location && updateData.country) {
            const newLocation = updateData.location !== listing.location || updateData.country !== listing.country;
            if (newLocation) {
                console.log(`Geocoding updated location: ${updateData.location}, ${updateData.country}`);
                const coordinates = await geocodeLocation(updateData.location, updateData.country);
                if (coordinates) {
                    updateData.coordinates = coordinates;
                    console.log(`Updated coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
                }
            }
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

// Create booking (decrement availability)
module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, rooms = 1, guests = 1 } = req.body;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found');
        return res.redirect('/listings');
    }
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!(start && end && end > start)) {
        req.flash('error', 'Invalid dates');
        return res.redirect(`/listings/${id}`);
    }
    // compute rooms left for range
    const overlaps = await Booking.aggregate([
        { $match: { listing: listing._id, checkIn: { $lt: end }, checkOut: { $gt: start } } },
        { $group: { _id: "$listing", total: { $sum: "$roomsBooked" } } }
    ]);
    const booked = overlaps.length ? overlaps[0].total : 0;
    const roomsLeft = Math.max(0, listing.totalRooms - booked);
    const roomsRequested = Math.max(1, parseInt(rooms, 10));
    if (roomsRequested > roomsLeft) {
        req.flash('error', `Only ${roomsLeft} room(s) left for those dates`);
        return res.redirect(`/listings/${id}`);
    }
    // Create pending booking; availability decreases after payment confirms
    const booking = await Booking.create({ listing: listing._id, user: req.user?._id, checkIn: start, checkOut: end, roomsBooked: roomsRequested, guests: parseInt(guests, 10) || 1, status: 'pending' });
    req.flash('success', 'Booking created! Complete payment to confirm.');
    res.redirect(`/bookings`);
}

// Availability API for a listing over a date range
module.exports.getAvailability = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (!checkIn || !checkOut) return res.status(400).json({ error: 'checkIn and checkOut required' });
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (!(start && end && end > start)) return res.status(400).json({ error: 'Invalid date range' });

    // Count only confirmed bookings as blocking availability
    const overlaps = await Booking.aggregate([
        { $match: { listing: listing._id, status: 'confirmed', checkIn: { $lt: end }, checkOut: { $gt: start } } },
        { $group: { _id: '$listing', total: { $sum: '$roomsBooked' } } }
    ]);
    const booked = overlaps.length ? overlaps[0].total : 0;
    const roomsLeft = Math.max(0, (listing.totalRooms || 1) - booked);
    return res.json({ roomsLeft, totalRooms: listing.totalRooms || 1 });
}