const express = require("express");


const faculty = require("../controllers/api/faculty");
const schedule = require("../controllers/api/schedule");


const curriculum = require("../controllers/api/curriculum");

const router = express.Router();

router.get("/faculty/type/:id", faculty.getFacultyType);

router.post("/faculty/course/:id", faculty.postCourse);
router.post("/faculty/schedule-preference/:id", faculty.postSchedulePreference);
router.put("/faculty/schedule-preference/:id/:preference", faculty.putSchedulePreference);
router.delete("/faculty/schedule-preference/:id/:preference", faculty.deleteSchedulePreference);
router.post("/faculty/send-password/:id/", faculty.sendNewPassword);
router.post("/faculty/upload", faculty.postSpreadsheet);

// Faculty Type Endw

router.get("/curriculums/schedules/:section", curriculum.getSectionSchedules);


// router.post("/curriculums/year/:program", validation.postYearLevel, curriculum.addYearLevel);


router.get("/schedules/loadable-schedules/:sem", schedule.getAllLoadableSchedules);
router.get("/schedules/assignable-schedules/:semester", schedule.getAllAssignableSchedules);

router.get("/schedules/year-level/:yearLevel", schedule.getYearLevelSchedules);
router.get("/schedules/room/finished/:semester/:room", schedule.getFinishedRoomSchedule);
router.get("/schedules/faculty/unit-hour/:faculty/:semester", schedule.getFacultyScheduleUnitHour);


router.get("/schedules/section/grouped/course/:semester", schedule.getGroupedCourseAllScheduleSection);

router.get("/schedules/loadable-schedules/:sem", schedule.getAllLoadableSchedules); // Routes for getting all of the loadable schedules

router.get("/schedules/faculties/:semester", schedule.getFacultiesSchedule);
router.get("/schedules/unassigned-schedule/:semester", schedule.getUnassignedSchedules);
router.get("/schedules/unloaded-schedule/:semester", schedule.getUnloadedSchedules);

module.exports = router;
