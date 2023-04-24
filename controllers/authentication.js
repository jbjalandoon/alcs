const bcrypt = require("bcrypt");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { sendMail } = require("../helper/email");

exports.login = async (req, res) => {
  const { method } = req;
  if (method === "GET") {
    return res.render("authentication/login");
  }
  const { validationResult } = require("express-validator");

  errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mappedErrors = errors.mapped();
    const returnErrors = [];
    for (var key in mappedErrors) {
      if (mappedErrors.hasOwnProperty(key)) {
        returnErrors.push(mappedErrors[key].msg);
      }
    }
    return res
      .status(400)
      .json({ msg: "Validation Error", errors: returnErrors });
  }

  const { email, password } = req.body;
  const user = await User.findOne({
    email: email,
  }).select("+password");

  if (!user) {
    return res
      .status(400)
      .json({ msg: "Validation Error", errors: ["User is not found"] });
  }

  const correctPassword = await bcrypt.compare(password, user.password);

  if (!correctPassword)
    return res
      .status(400)
      .json({ msg: "Validation Error", errors: ["Incorrect Password"] });

  req.session.user = {
    email: user.email,
    userId: user._id,
    role: user.role,
  };
  return req.session.save((error) => {
    const { role } = req.session.user;
    res.status(200).json({ role });
    // if (role === "superadmin") {
    //   return res.redirect("/admin/dashboard");
    // }
    // if (role === "user") {
    //   return res.redirect("/user/schedule");
    // } else {
    //   return res.redirect("/admin/dashboard");
    // }
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

exports.postForgotPassword = async (req, res, next) => {
  try {
    console.log(req.body.email);
    errors = validationResult(req);
    console.log(errors.mapped());
    if (!errors.isEmpty()) {
      const mappedErrors = errors.mapped();
      const returnErrors = [];
      for (var key in mappedErrors) {
        if (mappedErrors.hasOwnProperty(key)) {
          returnErrors.push(mappedErrors[key].msg);
        }
      }
      return res
        .status(400)
        .json({ msg: "Validation Error", errors: returnErrors });
    }
    crypto.randomBytes(32, async (err, buffer) => {
      const token = buffer.toString("hex");
      try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
          return res
            .status(400)
            .json({ msg: "Validation Error", errors: ["User is not found"] });
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        await user.save();

        const sendMailData = await sendMail(
          email,
          "Schedula - Password Reset",
          `<a href="http://localhost:3000/authentication/reset/${token}">Link</a>`
        );

        res.status(200).json({ msg: "Successfully Sent" });
      } catch (error) {
        res.status(500).json({ msg: "Something went wrong" });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
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
    .catch((error) => {});
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
