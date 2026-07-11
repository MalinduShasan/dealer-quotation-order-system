const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
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
        price: { type: Number, required: true } // store price at time of quotation
      }
    ],
    totalPrice: { type: Number, required: true }, // renamed from totalAmount
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "ordered"], // better tracking
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", quotationSchema);
