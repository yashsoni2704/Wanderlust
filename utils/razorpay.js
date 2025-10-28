const Razorpay = require('razorpay');

function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_60v2W0km5tB9fH';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  return new Razorpay({ key_id, key_secret });
}

async function createOrder(amountInPaise, receipt) {
  const client = getClient();
  const order = await client.orders.create({ amount: amountInPaise, currency: 'INR', receipt });
  return order;
}

module.exports = { getClient, createOrder };

