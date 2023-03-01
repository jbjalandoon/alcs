const express = require("express");
const router = express.Router();

const Analytics = require("../controllers/api/dashboard/analytics");

// router.get("/analytics/active-faculty/:sem", Analytics.getActiveFaculty);
// router.get("/analytics/active-room/:sem", Analytics.getActiveRoom);
router.get("/analytics/unloaded-schedule/:semester", Analytics.getUnloadedSchedule);
router.get("/analytics/unassigned-schedule/:semester", Analytics.getUnassgiendSchedule);

module.exports = router;
