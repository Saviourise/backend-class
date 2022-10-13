const express = require("express");
const route = express.Router();
const User = require("../models/Usermodel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

require("dotenv").config();

let transporter = nodemailer.createTransport({
  name: "www.a2z.com.ng",
  host: "mail.a2z.com.ng",
  port: 465,
  secure: true,
  auth: {
    user: "test@a2z.com.ng",
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

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
      // generate random 6 digit number
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += Math.floor(Math.random() * 10);
      }

      //hash user password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      //create new user
      const user = new User({
        email: email,
        name: name,
        password: hashedPassword,
        verifyCode: code,
      });

      //save user to database
      let savedUser = await user.save();

      let sendMail = await transporter.sendMail({
        from: '"My Server" <test@a2z.com.ng>', // sender address
        to: email, // list of receivers
        subject: "Verify Account", // Subject line
        text: `Your verification code is ${code}`, // plain text body
        html: `<div style="text-align:center;">Your verification code is ${code}</div>`, // html body
      });

      console.log("Message sent: %s", sendMail.messageId);

      //return saved user
      res
        .status(200)
        .json({ message: `A verification email has been sent to ${email}` });
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
      const validPass = await bcrypt.compare(password, userExists.password);
      // check if password is correct
      if (!validPass) {
        return res.status(400).json({ error: "Password is incorrect" });
      } else {
        // return user
        res.json({
          message: "User logged in successfully",
          ...userExists._doc,
        });
      }
    }
  }
});

// get all users
route.get("/all", async (req, res) => {
  let users = await User.find();
  res.json({ message: "All users", users });
});

// create verify route
route.post("/verify", async (req, res) => {
  // get user input
  const { email, code } = req.body;

  // validate user input
  if (!email || !code) {
    return res.status(400).json({ error: "Please fill all the fields" });
  } else {
    // check if user exist
    let userExists = await User.findOne({ email: email });

    // if user does not exist
    if (!userExists) {
      return res.status(400).json({ error: "User does not exist" });
    } else {
      // check if code is correct
      if (code !== userExists.verifyCode) {
        return res.status(400).json({ error: "Code is incorrect" });
      } else {
        // update user
        let updatedUser = await User.findOneAndUpdate(
          { email: email },
          { verified: true }
        );

        // send email to user
        let sendMail = await transporter.sendMail({
          from: '"My Server" <test@a2z.com.ng>', // sender address
          to: email, // list of receivers
          subject: "Account verified", // Subject line
          text: `Account Verified`, // plain text body
          html: `<div style="text-align:center;">Your account has been verified successfully</div>`, // html body
        });

        console.log("Message sent: %s", sendMail.messageId);
      }
    }
  }

  // return user
  res.json({
    message: "User verified successfully",
  });
});

module.exports = route;
