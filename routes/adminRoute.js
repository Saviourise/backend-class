const express = require("express");
const route = express.Router();

route.get("/", (req, res) => {
  res.send("Welcome to Admin routes!");
});

route.get("/login", (req, res) => {
  res.send("Logged in successfully!");
});

route.get("/register", (req, res) => {
  res.send("Registration successfully!");
});

route.get("/logout", (req, res) => {
  res.send("Logout successfully!");
});

module.exports = route;
