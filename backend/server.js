const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// User routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Product routes
const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("Dealer Quotation Order API is running");
});


const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

app.use("/api/quotations", require("./routes/quotationRoutes"));

const dealerRoutes = require("./routes/dealerRoutes");
app.use("/api/dealer", dealerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

