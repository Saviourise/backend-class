const express = require("express");
const mongoose = require("mongoose");
const route = express.Router();
const User = require("../models/Usermodel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");

require("dotenv").config();

let gfs, gridfsBucket;

const conn = mongoose.connection;

conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "files",
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("files");
});

const storage = new GridFsStorage({
  url: "mongodb+srv://test:test@cluster0.noo9j.mongodb.net/?retryWrites=true&w=majority",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  file: (req, file) => {
    const match = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "video/mp4",
    ];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-image-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: "files",
      filename: `${Date.now()}-image-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });

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

route.get("/file/:filename", async (req, res) => {
  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });
    const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

route.post("/register", upload.array("files"), async (req, res) => {
  //get user input
  const { email, name, password } = req.body;
  const profileImg = `user/files/${req.files[0].filename}`;

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
        profilePic: profileImg,
      });

      //save user to database
      let savedUser = await user.save();

      await transporter.sendMail({
        from: '"My Server" <test@a2z.com.ng>', // sender address
        to: email, // list of receivers
        subject: "Verify Account", // Subject line
        text: `Your verification code is ${code}`, // plain text body
        html: `<head>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Nunito&family=Poppins&display=swap");

    * {
      font-family: "Poppins", sans-serif;
    }
  </style>
</head>
<body>
  <div style="text-align: center; background: whitesmoke; font-size: 20px">
    <p style="text-align: center">
      <img
        src="https://cdn.pixabay.com/photo/2016/12/26/18/33/logo-1932539__340.png"
        alt="logo"
        width="100"
        height="100"
      />
    </p>
    <p>Your verification code is ${code}</p>
    <p>
      Or click
      <a
        href="http://localhost:5000/user/verify/${email}/${code}"
        target="_blank"
        >here</a
      >
      to verify your email.
    </p>
  </div>
</body>
`, // html body
      });

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
route.get("/verify/:email/:code", async (req, res) => {
  // get user input
  const { email, code } = req.params;

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
        await transporter.sendMail({
          from: '"My Server" <test@a2z.com.ng>', // sender address
          to: email, // list of receivers
          subject: "Account verified", // Subject line
          text: `Account Verified`, // plain text body
          html: `<div style="text-align:center;">Your account has been verified successfully</div>`, // html body
        });
      }
    }
  }

  // return user
  res.json({
    message: "User verified successfully",
  });
});

route.delete("/delete", async (req, res) => {
  const delUsers = await User.deleteMany();
  res.json({ message: "All users deleted", delUsers });
});

module.exports = route;
