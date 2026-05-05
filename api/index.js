const express = require("express");

const app = express();

const atmRoutes = require("../routes/atm/atmRoutes");
const billsRoutes = require("../routes/bills/billsRoute");
const userRoutes = require("../routes/users/usersRoute");
const transactionsRoutes = require("../routes/transactions/transactionsRoute");
const authRouter = require("../routes/auth/authRoute");
const logger = require("../middleware/logger");
const paymentMethodsRouter = require("../routes/paymentMethods/paymentMethodsRoute");
const depositMethodRouter = require("../routes/paymentMethods/depositMethodRoute");

app.use(express.json());

app.use(logger);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/atm", atmRoutes);
app.use("/api/v1/bills", billsRoutes);
app.use("/api/v1/transactions", transactionsRoutes);

app.use("/api/v1/payment-methods",paymentMethodsRouter);
app.use("/api/v1/wallet/deposit",depositMethodRouter);

//global middleware for wrong routing
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

//global error handling middleware
app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
