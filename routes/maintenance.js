const express = require("express");

const validateForm = require("../middleware/validate-form");
const validation = require("../validations/maintenance");

const user = require("../controllers/api/user");
const academicQualification = require("../controllers/api/academic-qualification");
const program = require("../controllers/api/program");
const level = require("../controllers/api/level");

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

module.exports = router;
