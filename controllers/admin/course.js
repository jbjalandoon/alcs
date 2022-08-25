const Course = require("../../models/course");

exports.getCourses = (req, res, next) => {
  Course.find()
    .then((courses) => {
      res.render("admin/course/index", {
        title: "ALCS | Course",
        courses: courses,
      });
    })
    .catch((error) => {
      throw new Error(error);
    });
};

exports.addCourse = (req, res, next) => {
  if (req.method === "GET") {
    res.render("admin/course/form", {
      title: "ALCS | Adding Course",
      edit: false,
      course: []
    });
  } else {
    const course_code = req.body.course_code;
    const course_description = req.body.course_description;
    const units = req.body.units;
    new Course({
      course_code: course_code,
      course_description: course_description,
      units: units,
    })
      .save()
      .then((result) => {
        req.flash(
          "input_success_message",
          "You have successfully created new course"
        );
        return res.redirect("/admin/courses");
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
};

exports.editCourse = (req, res, next) => {
  Course.findOne({ _id: req.params.id })
    .then((course) => {
      if (req.method === "GET") {
        res.render("admin/course/form", {
          title: "ALCS | Adding Course",
          edit: true,
          course: course,
        });
      } else {
        course.course_code = req.body.course_code;
        course.course_description = req.body.course_description;
        course.units = req.body.units;
        return course.save().then((result) => {
          req.flash(
            "input_success_message",
            "You have successfully edited a course"
          );
          res.redirect("/admin/courses");
        });
      }
    })

    .catch((error) => {
      throw new Error(error);
    });
};

exports.deleteCourse = (req, res, next) => {
  const id = req.body.id;
  Course.findByIdAndDelete(id)
    .then((result) => {
      req.flash(
        "input_success_message",
        "You have successfully deleted a course"
      );
      res.redirect("/admin/courses");
    })
    .catch((error) => {
      throw new Error(error);
    });
};
