const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const methodoverride = require("method-override")
const path = require("path");
const ejsMate = require("ejs-mate");

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
};
main().then(() => { console.log("Connection Succesfull") }).catch((err) => { console.log(err) });
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.use(express.static(path.join(__dirname,"public")));
app.engine("ejs",ejsMate);

app.listen(9000, () => { console.log(`Server is running on http://localhost:9000/`) });
app.get("/",(req,res)=>{
    res.send("Home root");
});
app.get("/listings", async(req, res) => {
    let allListings = await Listing.find({});
    // console.log(allListings);
    res.render("listings/index.ejs", { allListings });
});
app.get("/listings/new",(req,res)=>{
    res.render("listings/new.ejs");
});
app.post("/listings",async(req,res)=>{
    // let {title,description,image,price,country,location} = req.body;
    let listing = req.body.listing;
    // console.log(listing);
    await Listing.insertOne(listing);
    res.redirect("/listings");
});
app.get("/listings/:id",async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    // console.log(listing);
    res.render("listings/individual.ejs",{listing});
});
app.get("/listings/:id/edit",async(req,res)=>{
    let {id} = req.params;
    let list = await Listing.findById(id);
    console.log(list);
    res.render("listings/edit.ejs",{list});
});
app.put("/listings/:id",async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect("/listings")
});
app.delete("/listings/:id/delete",async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id,{});
    res.redirect("/listings");
});