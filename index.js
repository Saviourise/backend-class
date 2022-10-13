const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const adminRoute = require("./routes/adminRoute");

const app = express();

app.use(bodyParser.json());

mongoose.connect("mongodb+srv://test:test@cluster0.noo9j.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, () => {
  console.log("Connected to database");
});

app.use("/user", userRoutes);
app.use("/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
