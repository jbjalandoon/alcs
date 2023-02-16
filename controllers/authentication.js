const bcrypt = require("bcrypt");
const { findOne } = require("../models/user");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

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

exports.getForgotPassword = (req, res, next) => {
  return res.render("authentication/forgot");
};

exports.forgotPassword = (req, res, next) => {
  let token;
  crypto.randomBytes(32, (err, buffer) => {
    token = buffer.toString("hex");
    return User.findOne({ email: req.body.email })
      .then((result) => {
        if (result == null) {
          return Promise.reject();
        }
        result.resetToken = token;
        result.resetTokenExpiration = Date.now() + 3600000;
        return result.save();
      })
      .then((result) => {
        const emailDetails = {
          from: "sticaschedula@gmail.com",
          to: req.body.email,
          subject: "No Reply - Forgot Password",
          html: `<a href="http://localhost:3000/authentication/reset/${token}">Link</a>`,
        };
        return mailTransporter.sendMail(emailDetails);
      })
      .then((result) => {
        return res.redirect("/authentication/login?forgot=true");
      })
      .catch((error) => {
        console.log(error);
        return res.redirect("/authentication/login?forgot=false");
      });
  });
};

exports.reset = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((result) => {
      if (result) {
        return res.render("authentication/reset", {
          userId: result._id.toString(),
        });
      }
      return res.redirect("/authentication/login");
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.postReset = (req, res, next) => {
  bcrypt
    .hash(req.body.newPassword, 12)
    .then((password) => {
      return User.updateOne(
        { _id: req.body.id },
        {
          password: password,
          resetToken: null,
          resetTokenExpiration: null,
        }
      );
    })
    .then((result) => {
      console.log(result);
      res.redirect("/authentication/login?reset=true");
    })
    .catch((error) => {
      res.redirect("/authentication/login?reset=false");
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
