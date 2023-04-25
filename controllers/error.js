exports.get404 = (req, res, next) => {
  if (res.locals.isActive) {
    const { role } = req.session.user;
    if (role === "superadmin") {
      return res.redirect("/admin/dashboard");
    }
    if (role === "user") {
      return res.redirect("/user/schedule");
    } else {
      return res.redirect("/admin/dashboard");
    }
  } else {
    res.render("error/404", {
      title: "ALCS | 404 Page Not Found",
    });
  }
};
