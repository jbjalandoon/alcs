const express = require("express");
const router = express.Router();

const Semester = require("../controllers/api/curriculum/semester");
const Program = require("../controllers/api/curriculum/program");

const CurriculumValidation = require("../validations/curriculum");

// ---> START OF SEMESTER <---
router.get("/semesters/active", Semester.getActiveSemester);
router.get("/semesters/:schoolYear", Semester.getSemesters);
router.put("/semesters/active/:semester", Semester.putActiveSemester);
router.post("/semesters/copy/:active/:sem", Semester.copySemester);
// ---> END OF SEMESTER <---

// ---> START OF PROGRAM <---
router.get("/programs/:semester", Program.getPrograms);
router.post("/programs/:semester", CurriculumValidation.postPrograms, Program.postPrograms);
router.get("/programs/:semester/:program", Program.getOneProgram);
router.delete("/programs/:program", Program.deleteOneProgram);
// ---> END OF PROGRAM <---


module.exports = router;
