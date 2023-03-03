const express = require("express");
const router = express.Router();

const Section = require("../controllers/api/schedules/section");

router.get("/sections/:section", Section.getSchedules);
router.post("/sections/create/:section", Section.createSchedule);
router.put("/sections/edit/:section/:schedule", Section.editSchedule);
router.put("/sections/split/:semester/:schedule", Section.splitSchedule);
router.get("/sections/view/:semester/:schedule", Section.getSchedule);
router.delete("/sections/delete/:semester/:schedule", Section.deleteSchedule);

module.exports = router;
