const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing");
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
};

const initDb = async () =>{
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};

main().then(async ()=>{
    console.log("Connection Succesfull");
    await initDb();
}).catch((err)=>{console.log(err)});