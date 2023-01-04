const express = require("express");
const router = express.Router();

const controller = require("../controllers/user");

router.get("/schedule", controller.getSchedule);
router.get("/profile", controller.getProfile);
router.get("/schedule-preference", controller.getSchedulePreference);

module.exports = router;