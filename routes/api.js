const express = require("express");

const program = require("../controllers/api/program");
const year = require("../controllers/api/year");
const level = require("../controllers/api/level");
const room = require("../controllers/api/room");
const course = require("../controllers/api/course");
const faculty = require("../controllers/api/faculty");
const schedule = require("../controllers/api/schedule");
const curriculum = require("../controllers/api/curriculum");
const validation = require("../validations/maintenance");

const router = express.Router();

router.get("/programs", program.get);
router.get("/programs/:id", program.getOne);
router.post("/programs/upload", program.postSpreadsheet);
router.post("/programs/", validation.postProgram, program.post);
router.put("/programs/:id", validation.putPorgram, program.edit);
router.delete("/programs/:id", program.delete);

router.get("/years", year.get);
router.get("/years/:id", year.getOne);
router.post("/years", validation.postYear, year.post);
router.put("/years/:id", validation.putYear, year.edit);
router.delete("/years/:id", year.delete);

router.get("/levels", level.get);
router.get("/levels/:id", level.getOne);
router.post("/levels", validation.postLevel, level.post);
router.put("/levels/:id", validation.putLevel, level.edit);
router.delete("/levels/:id", level.delete);

router.get("/rooms", room.get);
router.get("/rooms/:id", room.getOne);
router.post("/rooms", validation.postRoom, room.post);
router.put("/rooms/:id", validation.putRoom, room.edit);
router.delete("/rooms/:id", room.delete);

router.get("/course", course.get);
router.get("/course/:id", course.getOne);
router.post("/course", validation.postCourse, course.post);
router.post("/course/upload", course.postSpreadsheet);
router.put("/course/:id", validation.putCourse, course.edit);
router.delete("/course/:id", course.delete);

router.get("/faculty", faculty.get);
router.get("/faculty/:id", faculty.getOne);
router.post("/faculty", validation.postFaculty, faculty.post);
// router.put("/faculty/:id", validation.putCourse, faculty.edit);
router.delete("/faculty/:id", faculty.delete);

router.get("/curriculums/semesters/:school_year", curriculum.getSemesters);
router.get("/curriculums/school-year", curriculum.getSchoolYears);
router.get("/curriculums/programs/:semester", curriculum.getPrograms);
router.get("/curriculums/program/:program", curriculum.getOneProgram);
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
  "/curriculums/programs/:school_year",
  validation.postCurriculumProgram,
  curriculum.postPrograms
);

router.post(
  "/curriculums/programs/:school_year",
  validation.postCurriculumProgram,
  curriculum.postPrograms
);

router.get("/schedules/:schedule", schedule.getOneSchedule);
router.get("/schedules", schedule.getSchedule);
router.get('/schedules/year-level/:yearLevel', schedule.getYearLevelSchedules)
router.get("/schedules/room/:semester/:room", schedule.getRoomSchedule);
router.get("/schedules/rooms/:semester", schedule.getRoomsSchedule);
router.put("/schedules/set/:schedule", schedule.setSchedule);
router.put("/schedules/assign/:schedule", schedule.assignSchedule);
router.delete("/schedules/unassign/:schedule", schedule.unassignSchedule);
router.get("/schedules/faculty/:semester/:faculty", schedule.getFacultySchedule);
router.delete("/schedules/:schedule", schedule.deleteSchedule);
router.get("/schedules/assignable-course/:sem", schedule.getAssignableCourse);
router.get("/schedules/faculties/:semester", schedule.getFacultiesSchedule);
router.get('/schedules/unassigned-schedule/:semester', schedule.getUnassignedSchedules);
router.get('/schedules/unloaded-schedule/:semester', schedule.getUnloadedSchedules);

module.exports = router;
