const express = require("express");
const dashboard = require("../controllers/admin/dashboard");
const schedule = require("../controllers/admin/schedule");
const curriculum = require("../controllers/admin/curriculum");

const maintenance = require("../controllers/admin/maintenance");

const validation = require("../validations/curriculum");

const router = express.Router();


// Dashboard Start
router.get("/dashboard", dashboard.getDashboard);
// Dashboard End

// ------------------------------------------------------------------------------------

// Maintenances Start
router.get("/faculty-types", maintenance.getFacultyType);
router.get("/programs", maintenance.getPrograms);
router.get("/courses", maintenance.getCourses);
router.get("/aq", maintenance.getAcademicQualifications);
router.get("/rooms", maintenance.getRooms);
router.get("/levels", maintenance.getLevels);
router.get("/years", maintenance.getYears);
router.get("/faculty", maintenance.getFaculties);
// Maintenances End

// ------------------------------------------------------------------------------------

// Faculty Start
// Faculty End

// ------------------------------------------------------------------------------------

// Curriculum Start
router.get("/curriculum", curriculum.getCurriculum);
// Curriculum End

// ------------------------------------------------------------------------------------

//Curriculum Routes
router.get("/curriculums/sections-courses", curriculum.getSectionsAndCourses);

router.get("/curriculums/:id", curriculum.getBySchoolYear);

// router.post(
//   "/curriculum/year/:school_year",
//   validation.postYearLevel,
//   curriculum.postYearLevel
// );

router.get("/curriculum/programs/:school_year", curriculum.getProgram);
router.get(
  "/curriculum/programs/:school_year/:program",
  curriculum.getOneProgram
);

router.get("/curriculum/semester/:school_year", curriculum.getSemester);

router.get("/curriculums/add", curriculum.addCurriculum);
// router.post("/curriculums/add", curriculum.addCurriculum);

router.get("/curriculums/edit/:id", curriculum.editCurriculum);
router.post("/curriculums/edit/:id", curriculum.editCurriculum);

router.post("/curriculums/delete", curriculum.deleteCurriculum);

//Schedule
router.get("/schedules", schedule.getSchedule);
router.get("/schedules/get-semester-list", schedule.getSemesters);
router.get("/schedules/get-program-list", schedule.getPrograms);
router.get("/schedules/get-level-list", schedule.getLevels);
router.get("/schedules/get-sections-list", schedule.getSections);
router.get("/schedules/courses", schedule.getCoursesTable);
router.post("/schedules/set", schedule.setSchedule);
router.post("/schedules/assign", schedule.assignFaculty);
router.get("/schedules/faculty", schedule.getFacultySchedule);
router.get("/schedules/room", schedule.getRoomSchedules);
router.get("/schedules/room-section", schedule.getRoomSectionSchedule);
router.get("/schedules/unavailable", schedule.getUnavailableSchedules);
router.get("/schedules/api", schedule.api);

module.exports = router;
