const Faculty = require("../../models/user");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

exports.getFaculties = (req, res, next) => {
  Faculty.find({ role: "user" })
    .then((faculties) => {
      res.render("admin/faculty/index", {
        title: "ALCS | Faculty",
        faculties: faculties,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.getOneFaculty = (req, res, next) => {
  Faculty.findOne({ _id: req.params.id })
    .then((result) => {
      if (!result) {
        res.render("error/404", {
          title: "ALCS | 404",
        });
      }
      res.render("admin/faculty/profile", {
        title: "ALCS | Faculty Profile",
        faculty: result,
        id: req.params.id,
      });
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.addFaculty = (req, res, next) => {
  if (req.method === "GET") {
    res.render("admin/faculty/form", {
      title: "ALCS | Adding faculty",
      edit: false,
      faculty: [],
      errors: [],
    });
  } else {
    const faculty_code = req.body.faculty_code;
    const first_name = req.body.first_name;
    const middle_name = req.body.middle_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const faculty_type = req.body.faculty_type;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/faculty/form", {
        title: "ALCS | Adding Faculty",
        edit: false,
        faculty: {
          faculty_code: faculty_code,
          first_name: first_name,
          middle_name: middle_name,
          last_name: last_name,
          email: email,
          faculty_type: faculty_type,
        },
        errors: errors.array(),
      });
    }
    bcrypt
      .hash("password", 12)
      .then((password) => {
        return new Faculty({
          email: email,
          password: password,
          userInformation: {
            faculty_code: faculty_code,
            first_name: first_name,
            middle_name: middle_name,
            last_name: last_name,
            faculty_type: faculty_type,
          },
        }).save();
      })
      .then((result) => {
        req.flash(
          "input_success_message",
          "You have successfully created new faculty"
        );
        return res.redirect("/admin/faculty");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editFaculty = (req, res, next) => {};

exports.deleteFaculty = (req, res, next) => {};

exports.getFacultyAPI = (req, res, next) => {
  console.log(req.query.q);
  Faculty.find({
    first_name: { $regex: ".*" + req.query.q + ".*", $options: "i" },
  })
    .limit(2)
    .then((faculty) => {
      res.json(faculty);
    })
    .catch((error) => {
      throw new Error(error);
    });
};
