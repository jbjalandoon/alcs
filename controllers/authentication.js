const bcrypt = require("bcrypt");
const { findOne } = require("../models/user");
const User = require("../models/user");

exports.login = (req, res, next) => {
  console.log(req.body);
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
      console.log(user);
      if (user == null) {
        return res.redirect("/authentication/login/?valid=false");
      }
      return bcrypt.compare(password, user.password).then((result) => {
        if (!result) {
          return res.redirect("/authentication/login/?valid=false");
        }
        req.session.user = user;
        return req.session.save((error) => {
          if (req.body.landing) {
            return res.redirect(req.body.landing);
          }
          if(req.session.user.role === 'admin') {
            return res.redirect("/admin/schedules");
          } 
          if(req.session.user.role === 'user') {
            return res.redirect("/user/schedule");
          }
        });
      });
    })
    .catch((error) => {
      throw new Error(error);
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
