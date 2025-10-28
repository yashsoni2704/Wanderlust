const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
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

        // Add owner and randomized capacity/rooms to each listing
        const listingsWithOwner = initData.data.map(listing => ({
            ...listing,
            owner: yashUser._id,
            capacity: Math.floor(Math.random()*3)+2, // 2-4
            totalRooms: Math.floor(Math.random()*16)+10 // 10-25
        }));

        // Insert listings
        const insertedListings = await Listing.insertMany(listingsWithOwner);
        console.log(`${insertedListings.length} listings were initialized with owner: ${yashUser.username}`);

        // Seed some random bookings in the upcoming month to vary availability
        await Booking.deleteMany({});
        const bookings = [];
        for (const l of insertedListings) {
            const numBookings = Math.floor(Math.random()*3); // 0-2 bookings per listing
            for (let i=0;i<numBookings;i++){
                const startOffset = Math.floor(Math.random()*20); // days from today
                const length = Math.floor(Math.random()*4)+1; // 1-4 nights
                const checkIn = new Date(); checkIn.setDate(checkIn.getDate()+startOffset);
                const checkOut = new Date(checkIn); checkOut.setDate(checkIn.getDate()+length);
                const roomsBooked = Math.min(l.totalRooms, Math.floor(Math.random()*l.totalRooms)+1);
                bookings.push({ listing: l._id, checkIn, checkOut, roomsBooked, guests: roomsBooked * l.capacity });
            }
        }
        if (bookings.length) {
            await Booking.insertMany(bookings);
            console.log(`Seeded ${bookings.length} random bookings`);
        }
    } catch (err) {
        console.error("Error during initialization:", err);
    }
};

main().then(async ()=>{
    console.log("Connection Succesfull");
    await initDb();
}).catch((err)=>{console.log(err)});