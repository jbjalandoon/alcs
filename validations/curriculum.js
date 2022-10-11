const { check } = require("express-validator");

exports.course = [
  check("course_code")
    .not()
    .isEmpty()
    .withMessage("The course code is empty.")
    .trim(),
  check("course_description")
    .not()
    .isEmpty()
    .withMessage("The course description is empty.")
    .trim()
    .isString()
    .withMessage("Only Alphanumeric is allowed."),
  check("units")
    .not()
    .isEmpty()
    .withMessage("The units is empty.")
    .trim()
    .toFloat()
    .isFloat()
    .withMessage("The unit is not a number."),
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
  check("program").not().isEmpty().withMessage("Program is empty."),
  check("year_level").not().isEmpty().withMessage("Year level is empty."),
  check("section").not().isEmpty().withMessage("Section is empty.").trim(),
];

exports.postProgram = [
  check("semester").notEmpty().withMessage("Please select semester"),
  check("program").notEmpty().withMessage("Please select something"),
];

exports.postYearLevel = [
  check("year_level").notEmpty().withMessage("Please select year level"),
  check("section").notEmpty().withMessage("This field is required"),
  check("course").notEmpty().withMessage("Please select course"),
];
