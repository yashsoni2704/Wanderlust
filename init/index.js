const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing");
const User = require("../models/user");

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

const initDb = async () => {
    try {
        // Clear existing listings
        await Listing.deleteMany({});
        
        // Find Yash's user account
        const yashUser = await User.findOne({ username: "Yash" });
        if (!yashUser) {
            console.log("Error: Yash user not found!");
            return;
        }

        // Add owner to each listing
        const listingsWithOwner = initData.data.map(listing => ({
            ...listing,
            owner: yashUser._id
        }));

        // Insert listings
        const insertedListings = await Listing.insertMany(listingsWithOwner);
        console.log(`${insertedListings.length} listings were initialized with owner: ${yashUser.username}`);
    } catch (err) {
        console.error("Error during initialization:", err);
    }
};

main().then(async ()=>{
    console.log("Connection Succesfull");
    await initDb();
}).catch((err)=>{console.log(err)});