const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  dealer: { type: String } // optional for dealer info
}, { timestamps: true });


module.exports = mongoose.model("Product", productSchema);
