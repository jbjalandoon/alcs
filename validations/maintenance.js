const { check, param } = require("express-validator");
const Program = require("../models/program");
const Year = require("../models/year");
const Faculty = require("../models/user");
const Level = require("../models/level");
const Course = require("../models/course");
const Room = require("../models/room");

exports.postProgram = [
  check("program_code")
    .notEmpty()
    .withMessage("Course code is empty.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Only alpha is allowed.")
    .trim()
    .custom((value) => {
      return Program.findOne({ program_code: value }).then((data) => {
        if (data) {
          return Promise.reject("Program code already exists.");
        }
      });
    }),
  check("program_name")
    .notEmpty()
    .withMessage("Course code is empty.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Only alpha is allowed.")
    .trim()
    .custom((value) => {
      return Program.findOne({ program_name: value }).then((data) => {
        if (data) {
          return Promise.reject("Program name already exists.");
        }
      });
    }),
];

exports.putPorgram = [
  check("program_code")
    .notEmpty()
    .withMessage("Course code is empty.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Only alpha is allowed.")
    .trim()
    .custom((value, { req, loc, path }) => {
      return Program.findOne({
        _id: { $ne: req.params.id },
        program_code: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Program code already exists.");
        }
      });
    }),
  check("program_name")
    .notEmpty()
    .withMessage("Course code is empty.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Only alpha is allowed.")
    .trim()
    .custom((value, { req, loc, path }) => {
      return Program.findOne({
        _id: { $ne: req.params.id },
        program_name: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Program name already exists.");
        }
      });
    }),
];

exports.postYear = [
  check("year")
    .notEmpty()
    .withMessage("School Year is Empty")
    .isAlphanumeric("en-US", { ignore: "-" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value) => {
      return Year.findOne({
        year: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("School Year already exists.");
        }
      });
    }),
];

exports.putYear = [
  check("year")
    .notEmpty()
    .withMessage("School Year is Empty")
    .isAlphanumeric("en-US", { ignore: "-" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value, { req, loc, path }) => {
      return Year.findOne({
        _id: { $ne: req.params.id },
        year: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("School Year already exists.");
        }
      });
    }),
];

exports.postLevel = [
  check("year_level")
    .notEmpty()
    .withMessage("Year level is empty.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value) => {
      return Level.findOne({
        level: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Year level already exists.");
        }
      });
    }),
];

exports.putLevel = [
  check("year_level")
    .notEmpty()
    .withMessage("Year level is empty.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value, { req, loc, path }) => {
      return Level.findOne({
        _id: { $ne: req.params.id },
        level: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Year level already exists.");
        }
      });
    }),
];

exports.postRoom = [
  check("room_name")
    .notEmpty()
    .withMessage("Room name is empty.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value) => {
      return Room.findOne({ room_name: value }).then((data) => {
        if (data) {
          return Promise.reject("Room name already exists.");
        }
      });
    }),
];

exports.putRoom = [
  check("room_name")
    .notEmpty()
    .withMessage("Room name is empty.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value, { req }) => {
      return Room.findOne({
        _id: { $ne: req.params.id },
        room_name: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Room name already exists.");
        }
      });
    }),
];

exports.postCourse = [
  check("course_code")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong format")
    .trim()
    .custom((value) => {
      return Course.findOne({ course_code: value }).then((data) => {
        console.log(data);
        if (data) {
          return Promise.reject("Course code already exists.");
        }
      });
    }),
  check("course_description")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -/" })
    .trim(),
  check("lecture")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
  check("lab")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
  check("units")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
];

exports.putCourse = [
  check("course_code")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong format")
    .trim()
    .custom((value, { req }) => {
      return Course.findOne({
        _id: { $ne: req.params.id },
        course_code: value,
      }).then((data) => {
        if (data) {
          return Promise.reject("Course code already exists.");
        }
      });
    }),
  check("course_description")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -/" })
    .trim(),
  check("lecture")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
  check("lab")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
  check("units")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
];

exports.postFaculty = [
  check("faculty_code")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .trim()
    .custom((value) => {
      return Faculty.findOne({ "userInformation.faculty_code": value }).then(
        (data) => {
          console.log(data);
          if (data) {
            return Promise.reject("Faculty code already exists.");
          }
        }
      );
    }),
  check("email")
    .notEmpty()
    .withMessage("This field is required.")
    .isEmail()
    .withMessage("Email is not valid.")
    .normalizeEmail()
    .custom((value) => {
      return Faculty.findOne({ email: value }).then((data) => {
        if (data) {
          return Promise.reject("Email is already exists.");
        }
      });
    }),
  check("faculty_type")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .trim(),
  check("first_name")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
  check("middle_name")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
  check("last_name")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
];

exports.postYearLevel = [
  check("year_level").notEmpty().withMessage("Please select year level"),
  check("section").notEmpty().withMessage("This field is required"),
  check("course").notEmpty().withMessage("Please select course"),
];
