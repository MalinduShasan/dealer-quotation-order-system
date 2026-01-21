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
        quantity: { type: Number, required: true }
      }
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["quotation", "ordered"],
      default: "quotation"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", quotationSchema);
