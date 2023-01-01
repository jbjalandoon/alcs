// Rendering the view of faculty types
exports.getFacultyType = (req, res, next) => {
  res.render("maintenance/faculty-type", {
    title: "Faculty Types",
  });
};

// Rendering the view of programs
exports.getPrograms = (req, res, next) => {
  res.render("admin/program/index", {
    title: "Programs",
  });
};

// Rendering the view of courses
exports.getCourses = (req, res, next) => {
  res.render("admin/course/index", {
    title: "Courses",
  });
};

// Rendering the view of Academic Qualfications
exports.getAcademicQualifications = (req, res, next) => {
  res.render("admin/aq/index", {
    title: "Academic Qualifcations",
  });
};

// Rendering the view of Roooms
exports.getRooms = (req, res, next) => {
  res.render("admin/room/index", {
    title: "ALCS | Room",
  });
};

// Rendering the view of levels
exports.getLevels = (req, res, next) => {
  res.render("admin/level/index", {
    title: "ALCS | LEVELS",
  });
};

// Rendering the view of years
exports.getYears = (req, res, next) => {
  res.render("admin/year", {
    title: "ALCS | School Year",
  });
};

// Rendering the views of faculties
exports.getFaculties = (req, res, next) => {
  res.render("admin/faculty/index", {
    title: "ALCS | Faculty",
  });
};
