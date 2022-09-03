const Year = require("../../models/year");

const { validationResult } = require("express-validator");

exports.getYears = (req, res, next) => {
  Year.find()
    .then((years) => {
      res.render("admin/year", {
        title: "ALCS | School Year",
        years: years,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.addYear = (req, res, next) => {
  if (req.method === "GET") {
    return res.render("admin/year/form", {
      title: "ALCS | Adding School Year",
      edit: false,
      errors: [],
      year: [],
    });
  } else {
    const year = req.body.year;
    new Year({
      year: year,
    })
      .save()
      .then((result) => {
        req.flash("input_success_message", "School Year Sucessfully Added");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editYear = (req, res, next) => {};

exports.deleteYear = (req, res, next) => {};
