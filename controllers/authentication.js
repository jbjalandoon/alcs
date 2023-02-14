const bcrypt = require("bcrypt");
const { findOne } = require("../models/user");
const User = require("../models/user");
const { validationResult } = require("express-validator");

exports.login = (req, res, next) => {
  if (req.method === "GET") {
    return res.render("authentication/login", {
      landing: req.query.landing,
    });
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({
    email: email,
  })
    .then((user) => {
      if (user == null) {
        return res.redirect(
          "/authentication/login/?valid=false&email=" + req.body.email
        );
      }
      return bcrypt.compare(password, user.password).then((result) => {
        if (!result) {
          return res.redirect(
            "/authentication/login/?valid=false&email=" + req.body.email
          );
        }
        req.session.user = user;
        return req.session.save((error) => {
          if (req.body.landing) {
            return res.redirect(req.body.landing);
          }
          if (req.session.user.role === "admin") {
            return res.redirect("/admin/dashboard");
          }
          if (req.session.user.role === "superadmin") {
            return res.redirect("/admin/dashboard");
          }
          if (req.session.user.role === "user") {
            return res.redirect("/user/schedule");
          }
        });
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.changePassword = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.mapped() });
  }
  bcrypt
    .hash(req.body.newPassword, 12)
    .then((result) => {
      console.log(result);
      return User.updateOne(
        { email: req.session.user.email },
        {
          password: result,
        }
      );
    })
    .then((result) => {
      console.log(result);
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      throw error;
    }
    res.redirect("/authentication/login");
  });
};
