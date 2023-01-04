exports.getSchedule = (req, res, next) => {
  res.render("user/schedule", {
    title: "Current Schedule",
  });
};

exports.getProfile = (req,res,next) => {
  res.render("user/profile", {
    title: "My Profile",
  });
}

exports.getSchedulePreference = (req,res,next) => {
  res.render("user/schedule-preference", {
    title: "Schedule Preference",
  });
}