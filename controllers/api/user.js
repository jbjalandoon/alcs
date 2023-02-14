const User = require("../../models/user");
const Crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sticaschedula@gmail.com",
    pass: "fglzoantcdlqjoyr",
  },
});

exports.get = (req, res, next) => {
  User.find({ deleted: false, role: "admin" })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.getOne = (req, res, next) => {
  User.findOne({ _id: req.params.id, role: "admin" })
    .then((result) => {
      res.json({ status: 200, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, data: error });
    });
};

exports.post = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  let returnValue;
  let randomString = Crypto.randomBytes(8).toString("base64").slice(0, 9),
    generatedPassword;
  bcrypt
    .hash(randomString, 12)
    .then((password) => {
      generatedPassword = password;
      return User.findOne({
        email: req.body.email,
      });
    })
    .then((result) => {
      if (result) {
        result.email = req.body.email;
        result.password = generatedPassword;
        result.deleted = false;
        result.role = "admin";
        result.userInformation = {
          firstName: req.body.firstName,
          middleName: req.body.middleName,
          lastName: req.body.lastName,
        };
        return result.save();
      }
      return new User({
        email: req.body.email,
        password: generatedPassword,
        role: "admin",
        userInformation: {
          firstName: req.body.firstName,
          middleName: req.body.middleName,
          lastName: req.body.lastName,
        },
      }).save();
    })
    .then((result) => {
      returnValue = result;
      const emailDetails = {
        from: "sticaschedula@gmail.com",
        to: req.body.email,
        subject: "No Reply - Password Generated",
        text: randomString,
      };
      return mailTransporter.sendMail(emailDetails);
    })
    .then((result) => {
      res.status(201).json({ status: 201, data: returnValue });
    })
    .catch((error) => {
      console.log(error);
      res.json({ status: 500, data: error });
    });
};

exports.edit = (req, res, next) => {
  errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.mapped() });
  }
  User.findOneAndUpdate(
    { _id: req.params.id },
    {
      email: req.body.email,
      userInformation: {
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
      },
    },
    { new: true }
  )
    .then((result) => {
      res.status(201).json({ status: 201, data: result });
    })
    .catch((error) => {
      res.status(500).json({ status: 500, data: error });
    });
};

exports.delete = (req, res, next) => {
  User.findOneAndUpdate({ _id: req.params.id }, { deleted: true })
    .then((result) => {
      res.json({ status: 202, data: result });
    })
    .catch((error) => {
      res.json({ status: 500, result: error });
    });
};
