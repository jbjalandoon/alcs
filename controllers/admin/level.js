const Level = require("../../models/level");
const Program = require("../../models/program");

const { validationResult } = require("express-validator");

exports.getLevels = (req, res, next) => {
  Level.find()
    .then((levels) => {
      res.render("admin/level/index", {
        title: "ALCS | LEVELS",
        levels: levels,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.addLevel = (req, res, next) => {
  const dropdown = {};
  if (req.method === "GET") {
    Program.find()
      .then((programs) => {
        dropdown.programs = programs;
        res.render("admin/level/form", {
          title: "ALCS | Adding level",
          edit: false,
          dropdown: dropdown,
          level: [],
          errors: [],
        });
      })
      .catch((error) => {
        throw new Error(error);
      });
  } else {
    const program = req.body.program;
    const year_level = req.body.year_level;
    const level = req.body.level;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return Program.find()
        .then((programs) => {
          dropdown.programs = programs;
          return res.render("admin/level/form", {
            title: "ALCS | Adding level",
            edit: false,
            dropdown: dropdown,
            level: {
              program: program,
              year_level: year_level,
              level: level,
            },
            errors: errors.array(),
          });
        })
        .catch((error) => {
          throw new Error(error);
        });
    }
    new Level({
      level: level,
    })
      .save()
      .then((result) => {
        req.flash(
          "input_success_message",
          "You have successfully created new level"
        );
        res.redirect("/admin/levels");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editLevel = (req, res, next) => {};

exports.deleteLevel = (req, res, next) => {};
