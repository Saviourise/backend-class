const checkUser = (req, res, next) => {
  req.body.username == "Bornor" ? next() : res.send("You are not a user!");
};

const checkEmail = (req, res, next) => {
  let email = req.body.email;
  if (email == "Bigboy@yahoo.com") {
    next();
  } else {
    res.send("You are a thief!");
  }
};

module.exports = { checkUser, checkEmail };
