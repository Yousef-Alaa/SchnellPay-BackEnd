const express = require("express");

const app = express();

const userRoutes = require("../routes/users/users");
const transactionsRoutes = require("../routes/transactions/transactions");
const authRouter = require("../routes/auth/auth");
const logger = require("../middleware/logger");

app.use(express.json());

app.use(logger);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/transactions", transactionsRoutes);

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
