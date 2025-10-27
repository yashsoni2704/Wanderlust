const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const listingSchema = new Schema({
  title: { 
    type: String, 
    required: [true, "Title is required"],
    minlength: [5, "Title must be at least 5 characters long"],
    maxlength: [100, "Title cannot be longer than 100 characters"]
  },
  description: { 
    type: String,
    required: [true, "Description is required"],
    maxlength: [1000, "Description cannot be longer than 1000 characters"]
  },
  image: {
    url: { type: String },
    filename: { type: String, default: "defaultimage" }
  },
  price: { 
    type: Number, 
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    max: [1000000, "Price cannot exceed 1,000,000"]
  },
  location: { 
    type: String,
    required: [true, "Location is required"],
    minlength: [3, "Location must be at least 3 characters long"],
    maxlength: [100, "Location cannot be longer than 100 characters"]
  },
  country: { 
    type: String,
    required: [true, "Country is required"],
    minlength: [3, "Country must be at least 3 characters long"],
    maxlength: [50, "Country cannot be longer than 50 characters"]
  },
  coordinates: {
    latitude: { 
      type: Number,
      required: false,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"]
    },
    longitude: { 
      type: Number,
      required: false,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"]
    }
  },
  reviews:[{ type: Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: Schema.Types.ObjectId, ref: "User" }
});

listingSchema.post("findOneAndDelete", async function(listing){
  if(listing){
    await mongoose.model("Review").deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = new mongoose.model("Listing", listingSchema);
module.exports = Listing;