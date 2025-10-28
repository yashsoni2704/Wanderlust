const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { createOrder } = require("../utils/razorpay");
const { sendPasswordResetOtpEmail } = require("../utils/emailService");

// List current user's bookings
module.exports.listMine = async (req, res) => {
  const bookings = await Booking.find({ user: req.user?._id }).populate("listing");
  res.render("bookings/index.ejs", { bookings });
};

// Create Stripe checkout session placeholder (will fill with API key later)
module.exports.createCheckoutSession = async (req, res) => {
  const { id } = req.params; // booking id
  const booking = await Booking.findById(id).populate("listing");
  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/bookings");
  }
  // Amount: simple subtotal approximation (rooms * nights * price)
  const nights = Math.max(1, Math.round((booking.checkOut - booking.checkIn)/(1000*60*60*24)));
  const groups = Math.ceil((booking.guests || 1) / (booking.listing.capacity || 1));
  const perNight = booking.listing.price * groups;
  const subtotal = perNight * nights;
  const serviceFee = Math.round(subtotal * 0.12);
  const cleaningFee = Math.round(0.05 * booking.listing.price);
  const amount = subtotal + serviceFee + cleaningFee; // INR

  try {
    let order = null;
    const hasSecret = !!(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.trim());
    if (hasSecret) {
      order = await createOrder(amount * 100, `booking_${booking._id}`); // paise
    } else {
      // Fallback demo mode: no server order, pay via client-only Checkout
      order = { id: null, amount: amount * 100 };
    }
    // Render payment page
    return res.render("bookings/pay.ejs", {
      booking,
      order,
      rzKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_60v2W0km5tB9fH'
    });
  } catch (e) {
    console.error('Razorpay order error', e);
    req.flash('error', 'Payment initialization failed');
    return res.redirect('/bookings');
  }
};

// Payment callback (demo): mark booking confirmed on success
module.exports.paymentSuccess = async (req, res) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId).populate('listing user');
  if (!booking) {
    req.flash('error', 'Booking not found');
    return res.redirect('/bookings');
  }
  booking.status = 'confirmed';
  await booking.save();
  // Send confirmation email using existing email template (reuse OTP styling function for simplicity)
  try {
    if (booking.user?.email) {
      await sendPasswordResetOtpEmail(booking.user.email, 'BOOKED', booking.user.username);
    }
  } catch {}
  req.flash('success', 'Payment successful. Booking confirmed.');
  res.redirect('/bookings');
};


