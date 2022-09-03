const Program = require("../../models/program");
const { validationResult } = require("express-validator");

exports.getPrograms = (req, res, next) => {
  Program.find()
    .then((programs) => {
      res.render("admin/program/index", {
        title: "ALCS | Course",
        programs: programs,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.addProgram = (req, res, next) => {
  if (req.method === "GET") {
    res.render("admin/program/form", {
      title: "ALCS | Adding Program",
      edit: false,
      program: [],
      errors: [],
    });
  } else {
    const program_name = req.body.program_name;
    const program_code = req.body.program_code;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/program/form", {
        title: "ALCS | Adding Program",
        edit: false,
        program: {
          program_name: program_name,
          program_code: program_code,
        },
        errors: errors.array(),
      });
    }
    new Program({
      program_name: program_name,
      program_code: program_code,
    })
      .save()
      .then((result) => {
        req.flash(
          "input_success_message",
          "You have successfully created new program"
        );
        return res.redirect("/admin/programs");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editProgram = (req, res, next) => {
  Program.findOne({ _id: req.params.id })
    .then((program) => {
      if (req.method === "GET") {
        res.render("admin/program/form", {
          title: "ALCS | Adding Program",
          edit: true,
          program: program,
          errors: [],
        });
      } else {
        program.program_name = req.body.program_name;
        program.program_code = req.body.program_code;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.render("admin/program/form", {
            title: "ALCS | Adding Program",
            edit: true,
            program: program,
            errors: errors.array(),
          });
        }
        return program.save().then((result) => {
          req.flash(
            "input_success_message",
            "You have successfully edited a program"
          );
          res.redirect("/admin/programs");
        });
      }
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.deleteProgram = (req, res, next) => {
  const id = req.body.id;
  Program.findByIdAndDelete(id)
    .then((result) => {
      req.flash(
        "input_success_message",
        "You have successfully deleted a program"
      );
      res.redirect("/admin/programs");
    })
    .catch((error) => {
      throw new Error(error);
    });
};
