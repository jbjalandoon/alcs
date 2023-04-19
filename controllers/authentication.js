const bcrypt = require("bcrypt");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const crypto = require("crypto");

exports.login = async (req, res) => {
  const { method } = req;
  if (method === "GET") {
    return res.render("authentication/login", {
      landing: req.query.landing,
    });
  }

  const { email, password } = req.body;
  const user = await User.findOne({
    email: email,
  }).select("+password");
  if (!user) {
    return res.redirect(
      "/authentication/login/?valid=false&email=" + req.body.email
    );
  }

  const correctPassword = await bcrypt.compare(password, user.password);

  if (!correctPassword)
    return res.redirect("/authentication/login?valid=false&email=" + email);

  req.session.user = {
    email: user.email,
    userId: user._id,
    role: user.role,
  };

  return req.session.save((error) => {
    const { role } = req.session.user;
    if (role === "superadmin") {
      return res.redirect("/admin/dashboard");
    }
    if (role === "user") {
      return res.redirect("/user/schedule");
    } else {
      return res.redirect("/admin/dashboard");
    }
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
      return User.updateOne(
        { email: req.session.user.email },
        {
          password: result,
        }
      );
    })
    .then((result) => {
      res.json({ status: 201, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.getForgotPassword = (req, res, next) => {
  return res.render("authentication/forgot");
};

exports.postForgotPassword = (req, res, next) => {
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
