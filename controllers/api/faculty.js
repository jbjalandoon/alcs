const Faculty = require("../../models/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
exports.get = (req, res, next) => {
  Faculty.find({ deleted_at: null, role: "user" })
    .then((faculty) => {
      if (faculty.length == 0) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: faculty });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.getOne = (req, res, next) => {
  Faculty.findOne({ role: "user", _id: req.params.id })
    .then((faculty) => {
      if (!faculty) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: faculty });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.post = (req, res, next) => {
  console.log(req.body);
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  bcrypt
    .hash("password", 12)
    .then((password) => {
      return new Faculty({
        email: req.body.email,
        password: password,
        userInformation: {
          faculty_code: req.body.faculty_code,
          first_name: req.body.first_name,
          middle_name: req.body.middle_name,
          last_name: req.body.last_name,
          faculty_type: req.body.faculty_type,
        },
      }).save();
    })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};

exports.delete = (req, res, next) => {
  Faculty.findOneAndUpdate({ _id: req.params.id }, { deleted_at: new Date() })
    .then((result) => {
      if (!result) {
        return res.json({ ok: false });
      }
      res.json({ ok: true, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ ok: false });
    });
};
