const mongoose = require('mongoose');
const Listing = require('../models/listing');
const { geocodeLocation } = require('./geocoding');

/**
 * Script to geocode existing listings that don't have coordinates
 * Run this with: node utils/geocodeExistingListings.js
 */
const geocodeExistingListings = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
        console.log("Connected to MongoDB");
        
        // Find all listings without coordinates or with empty coordinates
        const listings = await Listing.find({
            $or: [
                { 'coordinates.latitude': { $exists: false } },
                { 'coordinates.latitude': null },
                { 'coordinates': { $exists: false } }
            ]
        });
        
        console.log(`Found ${listings.length} listings to geocode`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const listing of listings) {
            if (listing.location && listing.country) {
                console.log(`\nGeocoding: ${listing.location}, ${listing.country}`);
                const coordinates = await geocodeLocation(listing.location, listing.country);
                
                if (coordinates) {
                    listing.coordinates = coordinates;
                    await listing.save();
                    console.log(`✓ Coordinates found: ${coordinates.latitude}, ${coordinates.longitude}`);
                    successCount++;
                    
                    // Be nice to the API - wait a bit between requests
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.log(`✗ Could not geocode ${listing.location}, ${listing.country}`);
                    failCount++;
                }
            }
        }
        
        console.log(`\nCompleted! Successfully geocoded: ${successCount}, Failed: ${failCount}`);
        
    } catch (error) {
        console.error('Error geocoding listings:', error);
    } finally {
        await mongoose.connection.close();
        console.log("Database connection closed");
    }
};

// Run the script
if (require.main === module) {
    geocodeExistingListings();
}

module.exports = { geocodeExistingListings };
