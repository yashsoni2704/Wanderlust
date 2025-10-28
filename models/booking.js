const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: false },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  roomsBooked: { type: Number, default: 1, min: 1 },
  guests: { type: Number, default: 1, min: 1 },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  stripeSessionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);

