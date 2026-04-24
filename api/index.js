const express = require("express");
const app = express();
const { poolPromise } = require("../config/db");

const userRoutes = require("../routes/users");

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
