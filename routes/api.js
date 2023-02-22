const express = require("express");

const program = require("../controllers/api/program");
const year = require("../controllers/api/year");
const level = require("../controllers/api/level");
const user = require("../controllers/api/user");
const room = require("../controllers/api/room");
const course = require("../controllers/api/course");
const faculty = require("../controllers/api/faculty");
const facultyType = require("../controllers/api/faculty-type");
const degree = require("../controllers/api/degree");
const schedule = require("../controllers/api/schedule");
const academicQualification = require("../controllers/api/academic-qualification");
const tag = require("../controllers/api/tag");
const curriculum = require("../controllers/api/curriculum");

const curriculumValidation = require("../validations/curriculum");
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
router.post("/years", validation.year, year.post);
router.put("/years/:id", validation.year, year.edit);
router.delete("/years/:id", year.delete);

router.get("/levels", level.get);
router.get("/levels/:id", level.getOne);
router.post("/levels", validation.level, level.post);
router.put("/levels/:id", validation.level, level.edit);
router.delete("/levels/:id", level.delete);

router.get("/users", user.get);
router.get("/users/:id", user.getOne);
router.post("/users", validation.user, user.post);
router.put("/users/:id", validation.user, user.edit);
router.delete("/users/:id", user.delete);

router.get("/rooms", room.get);
router.get("/rooms/:id", room.getOne);
router.post("/rooms", validation.room, room.post);
router.put("/rooms/:id", validation.room, room.edit);
router.post("/rooms/upload", room.postSpreadsheet);
router.delete("/rooms/:id", room.delete);

router.get("/academic-qualifications", academicQualification.get);
router.get("/academic-qualifications/:id", academicQualification.getOne);
router.get("/academic-qualifications/multiple/:academicQualification", academicQualification.getMultiple);
router.post("/academic-qualifications", validation.academicQualification, academicQualification.post);
router.put("/academic-qualifications/:id", validation.academicQualification, academicQualification.edit);
router.delete("/academic-qualifications/:id", academicQualification.delete);
// router.delete("/academic-qualifications/:id", academicQualification.delete);

router.get("/courses", course.get);
router.get("/courses/filtered/:courses", course.getFiltered);
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
router.post("/faculty/course/:id", faculty.postCourse);
router.post("/faculty/schedule-preference/:id", faculty.postSchedulePreference);
router.put("/faculty/schedule-preference/:id/:preference", faculty.putSchedulePreference);
router.delete("/faculty/schedule-preference/:id/:preference", faculty.deleteSchedulePreference);
router.post("/faculty/send-password/:id/", faculty.sendNewPassword);
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

router.get("/curriculums/school-year", curriculum.getSchoolYears);
router.get("/curriculums/semesters/:schoolYear", curriculum.getSemesters);

router.get("/curriculums/active", curriculum.getActiveSemester);
router.put("/curriculums/active/:semester", curriculum.putActiveSemester);

router.get("/curriculums/programs/:semester", curriculum.getPrograms);
router.post("/curriculums/programs/:semester", curriculumValidation.postPrograms, curriculum.postPrograms);
router.get("/curriculums/program/:program", curriculum.getOneProgram);
router.delete("/curriculums/program/:program", curriculum.deleteOneProgram);

router.get("/curriculums/sections/:year_level", curriculum.getSections);
router.post("/curriculums/sections/:year", curriculum.postSections);

router.get("/curriculums/year-levels/:program", curriculum.getYearLevels);

router.post("/curriculums/copy/:active/:sem", curriculum.copySemester);

router.get("/curriculums/schedules/:section", curriculum.getSectionSchedules);

router.get("/curriculums/faculty/:semester", curriculum.getActiveFaculty);
router.get("/curriculums/faculty/counts/:semester", curriculum.getActiveFacultyCounts);
router.get("/curriculums/faculty/type/:type/:semester", curriculum.getActiveFacultyType);
router.post("/curriculums/faculty/:semester", curriculum.postActiveFaculty);
router.delete("/curriculums/faculty/:semester/:id", curriculum.deleteActiveFaculty);

router.get("/curriculums/room/:sem", curriculum.getActiveRoom);

router.delete("/curriculums/course/:year/:course", curriculum.deleteCourse);
router.post("/curriculums/course/:year", curriculumValidation.courses, curriculum.postCourse);
router.get("/curriculums/course/:year", curriculum.getCourse);

router.post("/curriculums/year/:program", validation.postYearLevel, curriculum.addYearLevel);

router.get("/schedules/single/:semester/:schedule", schedule.getOneSchedule);

router.put("/schedules/adjust/:semester/:schedule", schedule.adjustSchedule);
router.delete("/schedules/single/:semester/:schedule", schedule.deleteSchedule);

router.get("/schedules", schedule.getSchedule);

router.get("/schedules/loadable-schedules/:sem", schedule.getAllLoadableSchedules);
router.get("/schedules/assignable-schedules/:semester", schedule.getAllAssignableSchedules);

router.post("/schedules/assign/:section", schedule.assignSchedule);
router.put("/schedules/reassign/:section/:schedule", schedule.reAssignSchedule);

router.put("/schedules/load/:schedule", schedule.loadSchedule);

router.get("/schedules/room/:semester/:room", schedule.getRoomSchedule);

router.get("/schedules/year-level/:yearLevel", schedule.getYearLevelSchedules);
router.get("/schedules/room/finished/:semester/:room", schedule.getFinishedRoomSchedule);
router.get("/schedules/rooms/:semester", schedule.getRoomsSchedule);
router.delete("/schedules/unassign/:schedule", schedule.unassignSchedule);
router.get("/schedules/faculty/:semester/:faculty/", schedule.getFacultySchedule);
router.get("/schedules/faculty/unit-hour/:faculty/:semester", schedule.getFacultyScheduleUnitHour);
router.get("/schedules/section/:section/", schedule.getSectionSchedule);

router.get("/schedules/section/:semester/:program", schedule.getGroupedSectionSchedule);

router.get("/schedules/faculty/:semester/", schedule.getGroupedAllFacultySchedule);
router.get("/schedules/room/:semester/", schedule.getGroupedRoomSchedule);

router.get("/schedules/faculty/grouped/course/:semester/:faculty/", schedule.getGroupedCourseScheduleFaculty);
router.get("/schedules/faculty/grouped/course/:semester", schedule.getGroupedCourseAllScheduleFaculty);

router.get("/schedules/section/grouped/course/:semester/:section", schedule.getGroupedCourseScheduleSection);
router.get("/schedules/section/grouped/course/:semester", schedule.getGroupedCourseAllScheduleSection);

router.get("/schedules/loadable-schedules/:sem/:faculty", schedule.getFacultyLoadableSchedules); // Routes for getting loadable scheduels for faculty
router.get("/schedules/loadable-schedules/:sem", schedule.getAllLoadableSchedules); // Routes for getting all of the loadable schedules

router.get("/schedules/faculties/:semester", schedule.getFacultiesSchedule);
router.get("/schedules/unassigned-schedule/:semester", schedule.getUnassignedSchedules);
router.get("/schedules/unloaded-schedule/:semester", schedule.getUnloadedSchedules);

module.exports = router;
