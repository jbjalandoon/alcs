const { check } = require("express-validator");

exports.courses = [
  check("courses").notEmpty().withMessage("Please select some course"),
];

exports.program = [
  check("program_code")
    .not()
    .isEmpty()
    .withMessage("The program code is empty.")
    .trim(),
  check("program_name")
    .not()
    .isEmpty()
    .withMessage("The program name is empty.")
    .trim()
    .isString()
    .withMessage("Only Alphanumeric is allowed."),
];

exports.room = [
  check("room_name").not().isEmpty().withMessage("The room is empty.").trim(),
];

exports.faculty = [
  check("faculty_code")
    .not()
    .isEmpty()
    .withMessage("Faculty code is empty.")
    .trim(),
  check("first_name")
    .not()
    .isEmpty()
    .withMessage("First name is empty.")
    .trim(),
  check("middle_name")
    .not()
    .isEmpty()
    .withMessage("Middle ame is empty.")
    .trim(),
  check("last_name").not().isEmpty().withMessage("Last name is empty.").trim(),
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is empty")
    .isEmail()
    .withMessage("Please enter valid email.")
    .normalizeEmail(),
  check("faculty_type")
    .not()
    .isEmpty()
    .withMessage("Please select faculty type")
    .trim(),
];

exports.section = [
  check("sections")
    .not()
    .isEmpty()
    .withMessage("Section field is required.")
];

exports.postPrograms = [
  check("programs").notEmpty().withMessage("Please select something"),
];

exports.postYearLevel = [
  check("year_level").notEmpty().withMessage("Please select year level"),
  check("section").notEmpty().withMessage("This field is required"),
  check("course").notEmpty().withMessage("Please select course"),
];
