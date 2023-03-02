const express = require("express");
const router = express.Router();

const Section = require("../controllers/api/schedules/section");

router.post("/sections/create/:section", Section.createSchedule);
router.put("/sections/edit/:section/:schedule", Section.editSchedule);

module.exports = router;
