exports.validateAuthentication = (req, res, next) => {
  console.log(res.locals.isActive);
  if (res.locals.isActive) {
    next();
  } else {
    res.redirect("/authentication/login");
  }
};

exports.validateAdminAuthorization = (req, res, next) => {
  const { role } = req.session.user;
  if (role === "admin") {
    return next();
  }
  if (role === "superadmin") {
    return next();
  }
  res.render("error/404", {
    title: "Schedula | 404 Page Not Found",
  });
};

exports.validateFacultyAuthorization = (req, res, next) => {
  const { role } = req.session.user;
  if (role === "user") {
    return next();
  }
  return res.render("error/404", {
    title: "ALCS | 404 Page Not Found",
  });
};
