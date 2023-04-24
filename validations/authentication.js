const { check } = require("express-validator");

exports.login = [
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email field is required")
    .isEmail()
    .withMessage("Please enter valid email"),
  check("password").not().isEmpty().withMessage("Password field is required"),
];

exports.forgot = [
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email field is required")
    .isEmail()
    .withMessage("Please enter valid email"),
];
