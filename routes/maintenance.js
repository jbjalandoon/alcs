const express = require("express");

const validateForm = require("../middleware/validate-form");
const validation = require("../validations/maintenance");

const user = require("../controllers/api/user");
const academicQualification = require("../controllers/api/academic-qualification");
const program = require("../controllers/api/program");
const level = require("../controllers/api/level");
const room = require("../controllers/api/room");
const course = require("../controllers/api/course");
const year = require("../controllers/api/year");
const faculty = require("../controllers/api/faculty");
const facultyType = require("../controllers/api/faculty-type");

const router = express.Router();

/* USER ADMIN ROUTES */
router.get("/users", user.get);
router.get("/users/:id", user.getOne);
router.post("/users", validation.user, validateForm, user.post);
router.put("/users/:id", validation.user, validateForm, user.edit);
router.delete("/users/:id", user.delete);

/* ACADEMIC QUALIFICATION ROUTES */
router.get("/academic-qualifications", academicQualification.get);
router.get("/academic-qualifications/:id", academicQualification.getOne);
router.get(
  "/academic-qualifications/multiple/:academicQualification",
  academicQualification.getMultiple
);
router.post(
  "/academic-qualifications",
  validation.academicQualification,
  validateForm,
  academicQualification.post
);
router.put(
  "/academic-qualifications/:id",
  validation.academicQualification,
  validateForm,
  academicQualification.edit
);
router.delete("/academic-qualifications/:id", academicQualification.delete);

/* PROGRAMS ROUTE */
router.get("/programs", program.get);
router.get("/programs/:id", program.getOne);
router.post("/programs/upload", program.postSpreadsheet);
router.post("/programs/", validation.program, validateForm, program.post);
router.put("/programs/:id", validation.program, validateForm, program.edit);
router.delete("/programs/:id", program.delete);

/* LEVELS ROUTE */
router.get("/levels", level.get);
router.get("/levels/:id", level.getOne);
router.post("/levels", validation.level, validateForm, level.post);
router.put("/levels/:id", validation.level, validateForm, level.edit);
router.delete("/levels/:id", level.delete);

router.get("/faculty-types", facultyType.get);
router.get("/faculty-types/:id", facultyType.getOne);
router.post(
  "/faculty-types",
  validation.facultyType,
  validateForm,
  facultyType.post
);
router.put(
  "/faculty-types/:id",
  validation.facultyType,
  validateForm,
  facultyType.put
);
router.delete("/faculty-types/:id", facultyType.delete);

router.get("/rooms", room.get);
router.get("/rooms/:id", room.getOne);
router.post("/rooms", validation.room, validateForm, room.post);
router.put("/rooms/:id", validation.room, validateForm, room.edit);
router.post("/rooms/upload", room.postSpreadsheet);
router.delete("/rooms/:id", room.delete);

router.get("/courses", course.get);
router.get("/courses/filtered/:courses", course.getFiltered);
router.get("/courses/units", course.getUnits);
router.get("/courses/:id", course.getOne);
router.post("/courses", validation.course, validateForm, course.post);
router.post("/courses/upload", course.postSpreadsheet);
router.put("/courses/:id", validation.course, validateForm, course.edit);
router.delete("/courses/:id", course.delete);

router.get("/years", year.get);
router.get("/years/:id", year.getOne);
router.post("/years", validation.year, validateForm, year.post);
router.put("/years/:id", validation.year, validateForm, year.edit);
router.delete("/years/:id", year.delete);

router.get("/faculty", faculty.get);
router.get("/faculty/:id", faculty.getOne);
router.post("/faculty", validation.faculty, validateForm, faculty.post);
router.put("/faculty/:id", validation.faculty, validateForm, faculty.put);
router.delete("/faculty/:id", faculty.delete);

module.exports = router;
