const express = require("express");
const course = require("../controllers/admin/course");
// const { authenticate } = require('../middleware/authentication')

const router = express.Router();

// Course Routes
router.get("/courses", course.getCourses);

router.get('/courses/add', course.addCourse)
router.post("/courses/add", course.addCourse);

router.get("/courses/edit/:id", course.editCourse);
router.post("/courses/edit/:id", course.editCourse);

router.post("/courses/delete", course.deleteCourse);

module.exports = router;
