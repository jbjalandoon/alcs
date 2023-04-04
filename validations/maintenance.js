const { check, param } = require("express-validator");
const bcrypt = require("bcrypt");
const Program = require("../models/program");
const Year = require("../models/year");
const Faculty = require("../models/user");
const User = require("../models/user");
const Level = require("../models/level");
const Course = require("../models/course");
const AcademicQualification = require("../models/academic-qualification");
const FacultyType = require("../models/faculty-type");
const Room = require("../models/room");

exports.program = [
  check("programCode")
    .notEmpty()
    .withMessage("Program Code is required.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("No special characters allowed.")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          programCode: value,
          deleted: false,
        };
      } else {
        query = {
          programCode: value,
          _id: { $ne: req.params.id },
        };
      }
      return Program.findOne(query).then((data) => {
        if (data) {
          if (data.deleted)
            return Promise.reject("Program code is in recycle bin.");
          return Promise.reject("Program code already exists.");
        }
      });
    }),
  check("programName")
    .notEmpty()
    .withMessage("Program name is required.")
    .isAlphanumeric("en-US", { ignore: " -'" })
    .withMessage("No special characters allowed.")
    .trim(),
];

exports.academicQualification = [
  check("academicQualification")
    .notEmpty()
    .withMessage("Academic Qualification is required.")
    .isAlphanumeric("en-US", { ignore: "- " })
    .withMessage("Special character is not allowed")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          academicQualification: value,
          deleted: false,
        };
      } else {
        query = {
          academicQualification: value,
          _id: { $ne: req.params.id },
        };
      }
      return AcademicQualification.findOne(query).then((data) => {
        if (data) {
          if (data.deleted)
            return Promise.reject("Academic Qualification is in Recycle Bin.");
          return Promise.reject("Academic Qualification already exists.");
        }
      });
    }),
];

exports.year = [
  check("year")
    .notEmpty()
    .withMessage("School Year is Empty")
    .isAlphanumeric("en-US", { ignore: "- " })
    .withMessage("Wrong Format")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          year: value,
          deleted: false,
        };
      } else {
        query = {
          year: value,
          _id: { $ne: req.params.id },
        };
      }
      return Year.findOne(query).then((data) => {
        if (data) {
          if (data.deleted) Promise.reject("Year is in recycle bin");
          return Promise.reject("School Year already exists.");
        }
      });
    }),
];

exports.putYear = [
  check("yearLevel")
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

exports.level = [
  check("yearLevel")
    .notEmpty()
    .withMessage("Year level is required.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("No Special Character")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          yearLevel: value,
          deleted: false,
        };
      } else {
        query = {
          yearLevel: value,
          _id: { $ne: req.params.id },
        };
      }
      return Level.findOne(query).then((data) => {
        if (data) {
          if (data.deleted)
            return Promise.reject("Year Level is in recycle bin.");
          return Promise.reject("Year level already exists.");
        }
      });
    }),
  check("display")
    .notEmpty()
    .withMessage("Display is required.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("No Special Characters")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          display: value,
          deleted: false,
        };
      } else {
        query = {
          display: value,
          _id: { $ne: req.params.id },
        };
      }
      return Level.findOne(query).then((data) => {
        if (data) {
          if (data.deleted) return Promise.reject("Display is in recycle bin.");
          return Promise.reject("Display already exists.");
        }
      });
    }),
];

exports.room = [
  check("roomName")
    .notEmpty()
    .withMessage("Room name is empty.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("Wrong Format")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          roomName: value,
          deleted: false,
        };
      } else {
        query = {
          roomName: value,
          _id: { $ne: req.params.id },
        };
      }
      return Room.findOne(query).then((data) => {
        if (data) {
          if (data.deleted) return Promise.reject("Room is in Recycle Bin");
          return Promise.reject("Room name already exists.");
        }
      });
    }),
];

exports.course = [
  check("courseCode")
    .notEmpty()
    .withMessage("Course code is required.")
    .isAlphanumeric("en-US", { ignore: " -" })
    .withMessage("No Special Characters Allowed")
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          courseCode: value,
          deleted: false,
        };
      } else {
        query = {
          courseCode: value,
          _id: { $ne: req.params.id },
        };
      }
      return Course.findOne(query).then((data) => {
        if (data) {
          if (data.deleted) Promise.reject("Course code is in recycle bin.");
          return Promise.reject("Course code already exists.");
        }
      });
    }),
  check("courseDescription")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -/," })
    .withMessage("No special characters allowed.")
    .trim(),
  check("lecture")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed")
    .trim(),
  check("lab")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed")
    .trim(),
  check("units")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed")
    .trim(),
  check("experience")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only numbers are allowed"),
  check("academicQualification")
    .notEmpty()
    .withMessage("This field is required"),
  check("degree").notEmpty().withMessage("This field is required"),
];

exports.putCourse = [
  check("course_code")
    .notEmpty()
    .withMessage("This field is required")
    .isAlphanumeric("en-US", { ignore: " -," })
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
    .isAlphanumeric("en-US", { ignore: " -/," })
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

exports.faculty = [
  check("facultyCode")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlphanumeric("en-US", { ignore: "-" })
    .withMessage('Only "-" special character is allowed.')
    .trim()
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          "userInformation.facultyCode": value,
          deleted: false,
        };
      } else {
        query = {
          "userInformation.facultyCode": value,
          _id: { $ne: req.params.id },
        };
      }
      return Faculty.findOne(query).then((data) => {
        if (data) {
          if (data.deleted)
            return Promise.reject("Faculty Code is in recycle bin");
          return Promise.reject("Faculty code already exists.");
        }
      });
    }),
  check("email")
    .notEmpty()
    .withMessage("This field is required.")
    .isEmail()
    .withMessage("Email is not valid.")
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          email: value,
          deleted: false,
        };
      } else {
        query = {
          email: value,
          _id: { $ne: req.params.id },
        };
      }
      return Faculty.findOne(query).then((data) => {
        if (data) {
          return Promise.reject("Email is already exists.");
        }
      });
    }),
  check("facultyType").notEmpty().withMessage("This field is required.").trim(),
  check("firstName")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
  check("lastName")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
  check("academicQualifications").notEmpty(),
];

exports.postYearLevel = [
  check("year_level").notEmpty().withMessage("Please select year level"),
  check("section").notEmpty().withMessage("This field is required"),
  check("course").notEmpty().withMessage("Please select course"),
];

exports.spreadsheet = [
  check("spreadsheet").custom((value, { req }) => {
    if (
      req.file.mimetype !=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      req.file.mimetype != "text/csv" &&
      req.file.mimetype != "application/vnd.ms-excel"
    ) {
      return Promise.reject("Only xls, xlsx, and csv are allowed");
    }
  }),
];

exports.postCurriculumProgram = [
  check("semester").notEmpty().withMessage("Please select semester"),
  check("program").notEmpty().withMessage("Please select something"),
];

exports.facultyType = [
  check("facultyType")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -/," })
    .withMessage("Only alphabet is allowed")
    .custom((value, { req, loc, path }) => {
      let query;
      if (req.method === "POST") {
        query = {
          facultyType: value,
          deleted: false,
        };
      } else {
        query = {
          facultyType: value,
          _id: { $ne: req.params.id },
        };
      }
      return FacultyType.findOne(query).then((data) => {
        if (data) {
          if (data.deleted)
            return Promise.reject("Faculty Type is in Recycle Bin");
          return Promise.reject("Faculty Type already exists.");
        }
      });
    })
    .trim()
    .escape(),
  check("unitsCap")
    .notEmpty()
    .withMessage("This field is required.")
    .isNumeric()
    .withMessage("Only number is allowed.")
    .custom((value) => {
      if (value % 1 !== 0) {
        return Promise.reject("Only whole number is allowed.");
      }
      return Promise.resolve();
    }),
  check("hoursCap")
    .notEmpty()
    .withMessage("This field is required")
    .isNumeric()
    .withMessage("Only number is allowed")
    .custom((value) => {
      if (value % 1 !== 0) {
        return Promise.reject("Only whole number is allowed.");
      }
      return Promise.resolve();
    }),
];

exports.changePassword = [
  check("oldPassword")
    .notEmpty()
    .withMessage("Please Enter Old Password")
    .custom((value, { req }) => {
      return User.findOne({ email: req.session.user.email })
        .then((result) => {
          return bcrypt.compare(value, result.password);
        })
        .then((result) => {
          if (!result) return Promise.reject("Password is incorrect");
        });
    }),
  check("newPassword").notEmpty().withMessage("Please Enter New Password"),
  check("retypePassword")
    .notEmpty()
    .withMessage("Please Enter Retype Password")
    .custom((value, { req }) => {
      console.log(`${value} === ${req.body.newPassword}`);
      if (value !== req.body.newPassword) {
        return Promise.reject("Password does not match");
      }
      return Promise.resolve();
    }),
];

exports.user = [
  check("email")
    .notEmpty()
    .withMessage("This field is required.")
    .isEmail()
    .withMessage("Email is not valid.")
    .custom((value, { req }) => {
      let query;
      if (req.method === "POST") {
        query = {
          email: value,
          deleted: false,
        };
      } else {
        query = {
          email: value,
          _id: { $ne: req.params.id },
        };
      }
      return User.findOne(query).then((data) => {
        if (data) {
          return Promise.reject("Email is already exists.");
        }
      });
    }),
  check("firstName")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
  check("lastName")
    .notEmpty()
    .withMessage("This field is required.")
    .isAlpha("en-US", { ignore: " -" })
    .withMessage("Numbers and Special characters are not allowed")
    .trim(),
];
