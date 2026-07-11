const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
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
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["ordered", "shipped", "delivered", "cancelled"],
      default: "ordered"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
