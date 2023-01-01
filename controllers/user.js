exports.getSchedule = (req, res, next) => {
  res.render("user/schedule", {
    title: "Current Schedule",
  });
};
