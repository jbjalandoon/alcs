const express = require("express");
const course = require("../controllers/admin/course");
// const { authenticate } = require('../middleware/authentication')

const router = express.Router();

// Course Routes
router.get("/courses", course.getCourses);
router.post("/courses/add", course.addCourse);
router.post("/course/edit/:id", course.editCourse);
router.post("/course/delete/:id", course.deleteCourse);

module.exports = router;
