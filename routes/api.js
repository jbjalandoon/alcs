const express = require("express");

const program = require("../controllers/api/program");
const year = require("../controllers/api/year");
const level = require("../controllers/api/level");
const room = require("../controllers/api/room");
const course = require("../controllers/api/course");
const faculty = require("../controllers/api/faculty");
const facultyType = require("../controllers/api/faculty-type");
const degree = require("../controllers/api/degree");
const schedule = require("../controllers/api/schedule");
const academicQualification = require("../controllers/api/academic-qualification");
const tag = require("../controllers/api/tag");
const curriculum = require("../controllers/api/curriculum");
const validation = require("../validations/maintenance");

const router = express.Router();

router.get("/programs", program.get);
router.get("/programs/:id", program.getOne);
router.post("/programs/upload", program.postSpreadsheet);
router.post("/programs/", validation.program, program.post);
router.put("/programs/:id", validation.program, program.edit);
router.delete("/programs/:id", program.delete);

router.get("/years", year.get);
router.get("/years/:id", year.getOne);
router.post("/years", validation.postYear, year.post);
router.put("/years/:id", validation.putYear, year.edit);
router.delete("/years/:id", year.delete);

router.get("/levels", level.get);
router.get("/levels/:id", level.getOne);
router.post("/levels", validation.level, level.post);
router.put("/levels/:id", validation.level, level.edit);
router.delete("/levels/:id", level.delete);

router.get("/rooms", room.get);
router.get("/rooms/:id", room.getOne);
router.post("/rooms", validation.room, room.post);
router.put("/rooms/:id", validation.room, room.edit);
router.delete("/rooms/:id", room.delete);

router.get("/academic-qualifications", academicQualification.get);
router.get("/academic-qualifications/:id", academicQualification.getOne);
router.get(
  "/academic-qualifications/multiple/:academicQualification",
  academicQualification.getMultiple
);
router.post(
  "/academic-qualifications",
  validation.academicQualification,
  academicQualification.post
);
router.put(
  "/academic-qualifications/:id",
  validation.academicQualification,
  academicQualification.edit
);
router.delete("/academic-qualifications/:id", academicQualification.delete);
// router.delete("/academic-qualifications/:id", academicQualification.delete);

router.get("/courses", course.get);
router.get("/courses/units", course.getUnits);
router.get("/courses/:id", course.getOne);
router.post("/courses", validation.course, course.post);
router.post("/courses/upload", course.postSpreadsheet);
router.put("/courses/:id", validation.course, course.edit);
router.delete("/courses/:id", course.delete);

router.get("/faculty", faculty.get);
router.get("/faculty/:id", faculty.getOne);
router.post("/faculty", validation.faculty, faculty.post);
router.put("/faculty/:id", validation.faculty, faculty.put);
router.put("/faculty/:id", validation.faculty, faculty.put);
router.post("/faculty/upload", faculty.postSpreadsheet);
router.delete("/faculty/:id", faculty.delete);

// Faculty Type Start
router.get("/faculty-types", facultyType.get);
router.get("/faculty-types/:id", facultyType.getOne);
router.post("/faculty-types", validation.facultyType, facultyType.post);
router.put("/faculty-types/:id", validation.facultyType, facultyType.put);
router.delete("/faculty-types/:id", facultyType.delete);
// Faculty Type Endw

router.get("/degree", degree.get);
router.get("/degree/:id", degree.getOne);
router.post("/degree", degree.post);

router.get("/tags", tag.get);
// router.get("/tags/:id", faculty.getOne);
// router.post("/tags", validation.postFaculty, faculty.post);
// // router.put("/tags/:id", validation.putCourse, faculty.edit);
// router.delete("/tags/:id", faculty.delete);

router.get("/curriculums/active", curriculum.getActiveSemester);
router.post("/curriculums/copy/:active/:sem", curriculum.copySemester);
router.put("/curriculums/active/:semester", curriculum.putActiveSemester);
router.get("/curriculums/semesters/:school_year", curriculum.getSemesters);
router.get("/curriculums/school-year", curriculum.getSchoolYears);
router.get("/curriculums/programs/:semester", curriculum.getPrograms);
router.get("/curriculums/program/:program", curriculum.getOneProgram);
router.delete("/curriculums/program/:program", curriculum.deleteOneProgram);
router.get("/curriculums/year-levels/:program", curriculum.getYearLevels);
router.get("/curriculums/sections/:year_level", curriculum.getSections);
router.post("/curriculums/sections/:year", curriculum.postSections);
router.get("/curriculums/schedules/:section", curriculum.getSectionSchedules);

router.delete("/curriculums/course/:year/:course", curriculum.deleteCourse);
router.post(
  "/curriculums/course/:year",
  validation.postCurriculumCourse,
  curriculum.postCourse
);
router.get("/curriculums/course/:year", curriculum.getCourse);

router.post(
  "/curriculums/year/:program",
  validation.postYearLevel,
  curriculum.addYearLevel
);

router.post(
  "/curriculums/programs/:semester",
  validation.postCurriculumProgram,
  curriculum.postPrograms
);

router.get("/schedules/:schedule", schedule.getOneSchedule);
router.get("/schedules", schedule.getSchedule);
router.get("/schedules/year-level/:yearLevel", schedule.getYearLevelSchedules);
router.get("/schedules/room/:semester/:room", schedule.getRoomSchedule);
router.get("/schedules/rooms/:semester", schedule.getRoomsSchedule);
router.put("/schedules/set/:schedule", schedule.setSchedule);
router.put("/schedules/assign/:schedule", schedule.assignSchedule);
router.delete("/schedules/unassign/:schedule", schedule.unassignSchedule);
router.get(
  "/schedules/faculty/:semester/:faculty/",
  schedule.getFacultySchedule
);
router.delete("/schedules/:schedule", schedule.deleteSchedule);
router.get(
  "/schedules/assignable-course/:sem/:faculty",
  schedule.getAssignableCourse
);
router.get("/schedules/faculties/:semester", schedule.getFacultiesSchedule);
router.get(
  "/schedules/unassigned-schedule/:semester",
  schedule.getUnassignedSchedules
);
router.get(
  "/schedules/unloaded-schedule/:semester",
  schedule.getUnloadedSchedules
);

module.exports = router;
