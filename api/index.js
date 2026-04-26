const express = require("express");

const app = express();

const logger = require("../middlewares/logger")
const userRoutes = require("../routes/users");
const transactionsRoutes = require("../routes/transactions");

app.use(express.json());

app.use(logger)


app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
