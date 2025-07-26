const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const listingSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  image: {
    filename: String,
    url: {
      type: String,
      default: "https://images.unsplash.com/photo-1625505826533-...",
      set: (v) =>
        v === ""
          ? "https://images.unsplash.com/photo-1625505826533-..."
          : v,
    },
  },
  price: Number,
  location: String,
  country: String,
});
const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;