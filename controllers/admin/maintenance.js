// Rendering the view of faculty types
exports.getFacultyType = (req, res, next) => {
  res.render("maintenance/faculty-type", {
    title: "Schedula | Faculty Types",
  });
};

// Rendering the view of programs
exports.getPrograms = (req, res, next) => {
  res.render("maintenance/program", {
    title: "Schedula | Programs",
  });
};

// Rendering the view of courses
exports.getCourses = (req, res, next) => {
  res.render("admin/course/index", {
    title: "Schedula | Courses",
  });
};

// Rendering the view of Academic Qualfications
exports.getAcademicQualifications = (req, res, next) => {
  res.render("maintenance/aq", {
    title: "Schedula | Academic Qualifcations",
  });
};

// Rendering the view of Roooms
exports.getRooms = (req, res, next) => {
  res.render("admin/room/index", {
    title: "Schedula | Room",
  });
};

// Rendering the view of levels
exports.getLevels = (req, res, next) => {
  res.render("maintenance/level", {
    title: "Schedula | Levels",
  });
};

// Rendering the view of years
exports.getYears = (req, res, next) => {
  res.render("admin/year", {
    title: "Schedula | School Year",
  });
};

// Rendering the views of faculties
exports.getFaculties = (req, res, next) => {
  res.render("admin/faculty/index", {
    title: "Schedula | Faculty",
  });
};

// Rendering the views of Users
exports.getUsers = (req, res, next) => {
  res.render("maintenance/user", {
    title: "Schedula | Users",
  });
};
