const express = require("express");
const route = express.Router();
const User = require("../models/Usermodel");

route.get("/", (req, res) => {
  res.send("Welcome to users routes!");
});

route.post("/register", async (req, res) => {
  //get user input
  const { email, name, password } = req.body;

  //validate user input
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Please fill all the fields" });
  } else {
    //check if user already exist
    let userExists = await User.findOne({ email: email });

    //if user already exist
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    } else {
      //create new user
      const user = new User({
        email: email,
        name: name,
        password: password,
      });

      //save user to database
      let savedUser = await user.save();

      //return saved user
      res.status(200).json({ message: "User saved successfully", ...savedUser._doc });
    }
  }
});

//login user
route.post("/login", async (req, res) => {
  // get user input
  const { email, password } = req.body;

  // validate user input
  if (!email || !password) {
    return res.status(400).json({ error: "Please fill all the fields" });
  } else {
    // check if user exist
    let userExists = await User.findOne({ email: email });

    // if user does not exist
    if (!userExists) {
      return res.status(400).json({ error: "User does not exist" });
    } else {
      // check if password is correct
      if (password !== userExists.password) {
        return res.status(400).json({ error: "Password is incorrect" });
      } else {
        // return user
        res.json({ message: "User logged in successfully", ...userExists._doc });
      }
    }
  }
});

module.exports = route;
