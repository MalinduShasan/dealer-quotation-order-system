const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },

  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],

  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
