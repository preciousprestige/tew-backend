const jwt = require("jsonwebtoken");

const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "30d", // token expires in 30 days
  });
};

module.exports = generateToken;
