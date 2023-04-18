const express = require("express");
const router = express.Router();

const Section = require("../controllers/api/schedules/section");
const Faculty = require("../controllers/api/schedules/faculty");
const Room = require("../controllers/api/schedules/room");

router.get("/sections/:section", Section.getSchedules);
router.post("/sections/create/:section", Section.createSchedule);
router.get("/sections/:semester/:program", Section.getGroupedSchedules);
router.put("/sections/edit/:section/:schedule", Section.editSchedule);
router.put("/sections/split/:semester/:schedule", Section.splitSchedule);
router.get("/sections/view/:semester/:schedule", Section.getSchedule);
router.delete("/sections/delete/:semester/:schedule", Section.deleteSchedule);
router.get("/sections/grouped/course/:semester/:section", Section.getSchedulesByCourse);

router.get("/faculty/:semester/", Faculty.getAllSchedules);
router.get("/faculty/:semester/:faculty", Faculty.getSchedules);
router.get("/faculty/units/:semester/:faculty", Faculty.getUnits);
router.get(
  "/faculty/loadable/courses/:semester/:faculty",
  Faculty.getLoadableCourses
);
router.get(
  "/faculty/loadable/schedules/:semester/:course",
  Faculty.getLoadableSchedules
);
router.put("/faculty/load/:schedule", Faculty.loadSchedule);
router.delete("/faculty/unload/:schedule", Faculty.unloadSchedule);
router.get(
  "/faculty/grouped/course/:semester/:faculty/",
  Faculty.getSchedulesByCourse
);

router.get("/rooms/:semester", Room.getSchedules);
router.get("/rooms/active/:semester", Room.getActiveRoom);
router.get("/rooms/:semester/:room", Room.getSchedule);

module.exports = router;
