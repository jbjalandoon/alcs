const express = require("express");
const router = express.Router();

const Semester = require("../controllers/api/curriculum/semester");
const Curriculum = require("../controllers/api/curriculum/school-year");
const Program = require("../controllers/api/curriculum/program");
const Course = require("../controllers/api/curriculum/course");
const Section = require("../controllers/api/curriculum/section");
const Faculty = require("../controllers/api/curriculum/faculty");
const Level = require("../controllers/api/curriculum/level");

const CurriculumValidation = require("../validations/curriculum");
const validateForm = require("../middleware/validate-form");

// ---> START OF SEMESTER <---
router.get("/semesters/active", Semester.getActiveSemester);
router.get("/semesters/:schoolYear", Semester.getSemesters);
router.put("/semesters/active/:semester", Semester.putActiveSemester);
router.post("/semesters/copy/:active/:sem", Semester.copySemester);
// ---> END OF SEMESTER <---

// ---> START OF PROGRAM <---
router.get("/programs/:semester", Program.getPrograms);
router.post(
  "/programs/:semester",
  CurriculumValidation.postPrograms,
  validateForm,
  Program.postPrograms
);
router.get("/programs/:semester/:program", Program.getOneProgram);
router.delete("/programs/:semester/:program", Program.deleteOneProgram);
// ---> END OF PROGRAM <---

// ---> START OF COURSE <---
router.get("/course/:year", Course.getCourses);
router.post("/course/:year", CurriculumValidation.courses, Course.postCourse);
router.delete("/course/:year/:course", Course.deleteCourse);
// ---> END OF COURSE <---

// ---> START OF SECTION <---
router.get("/sections/:level", Section.getSections);
router.post("/sections/:level", Section.postSection);
router.delete("/sections/:section", Section.deleteSection);
router.get("/sections/units/:section", Section.getTotalUnits);
// ---> END OF SECTION <---

// ---> START OF SECTION <---
router.get("/faculty/:semester", Faculty.getActiveFaculty);
router.get("/faculty/counts/:semester", Faculty.getActiveFacultyCounts);
router.get("/faculty/type/:type/:semester", Faculty.getActiveFacultyType);
router.post("/faculty/:semester", Faculty.postActiveFaculty);
router.delete("/faculty/:semester/:id", Faculty.deleteActiveFaculty);
// ---> END OF SECTION <---

// ---> START OF LEVEL <---
router.get("/levels/:program", Level.getYearLevels);
router.post("/levels/:program", Level.addYearLevel);
router.delete("/levels/:program/:yearLevel", Level.deleteYearLevel);
// ---> END OF LEVEL <---

router.get("/school-year", Curriculum.getSchoolYears);

module.exports = router;
