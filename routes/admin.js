const express = require("express");
const course = require("../controllers/admin/course");
const program = require("../controllers/admin/program");
const year = require("../controllers/admin/year");
const room = require("../controllers/admin/room");
const faculty = require("../controllers/admin/faculty");
const schedule = require("../controllers/admin/schedule");
const level = require("../controllers/admin/level");
const curriculum = require("../controllers/admin/curriculum");

const validation = require("../validations/curriculum");

const router = express.Router();

// Course Routes
router.get("/courses", course.getCourses);
router.get("/api/courses", course.apiGetCourses);

router.get("/courses/add", course.addCourse);
router.post("/courses/add", validation.course, course.addCourse);

router.get("/courses/edit/:id", course.editCourse);
router.post("/courses/edit/:id", validation.course, course.editCourse);

router.post("/courses/delete", course.deleteCourse);

// Program Routes
router.get("/programs", program.getPrograms);

router.get("/programs/add", program.addProgram);
router.post("/programs/add", validation.program, program.addProgram);

router.get("/programs/edit/:id", program.editProgram);
router.post("/programs/edit/:id", validation.program, program.editProgram);

router.post("/programs/delete", program.deleteProgram);

// Room Routes
router.get("/rooms", room.getRooms);

router.get("/rooms/add", room.addRoom);
router.post("/rooms/add", validation.room, room.addRoom);

router.get("/rooms/edit/:id", room.editRoom);
router.post("/rooms/edit/:id", validation.room, room.editRoom);

router.post("/rooms/delete", room.deleteRoom);

// Faculty Routes
router.get("/faculty", faculty.getFaculties);

router.get("/api/faculty", faculty.getFacultyAPI);

router.get("/faculty/add", faculty.addFaculty);
router.post("/faculty/add", validation.faculty, faculty.addFaculty);

router.get("/faculty/edit/:id", faculty.editFaculty);
router.post("/faculty/edit/:id", validation.faculty, faculty.editFaculty);

router.post("/faculty/delete", faculty.deleteFaculty);

// Sections Routes
router.get("/levels", level.getLevels);

router.get("/levels/add", level.addLevel);
router.post("/levels/add", level.addLevel);

router.get("/levels/edit/:id", level.editLevel);
router.post("/levels/edit/:id", level.editLevel);

router.post("/levels/delete", level.deleteLevel);

//Curriculum Routes
router.get("/curriculums", curriculum.getCurriculums);
router.get("/curriculums/sections-courses", curriculum.getSectionsAndCourses);

router.get("/curriculums/:id", curriculum.getBySchoolYear);

router.post(
  "/curriculum/programs/:school_year",
  validation.postProgram,
  curriculum.postProgram
);
router.post(
  "/curriculum/year/:school_year",
  validation.postYearLevel,
  curriculum.postYearLevel
);

router.get("/curriculum/programs/:school_year", curriculum.getProgram);
router.get("/curriculum/programs/:school_year/:program", curriculum.getOneProgram);


router.get("/curriculum/semester/:school_year", curriculum.getSemester);

router.get("/curriculums/add", curriculum.addCurriculum);
router.post("/curriculums/add", curriculum.addCurriculum);

router.get("/curriculums/edit/:id", curriculum.editCurriculum);
router.post("/curriculums/edit/:id", curriculum.editCurriculum);

router.post("/curriculums/delete", curriculum.deleteCurriculum);

//Year Routes
router.get("/years", year.getYears);

router.get("/years/add", year.addYear);
router.post("/years/add", year.addYear);

router.get("/years/edit/:id", year.editYear);
router.post("/years/edit/:id", year.editYear);

router.post("/years/delete", year.deleteYear);

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
