const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const Course = require("../../../models/course");
const { validationResult } = require("express-validator");

// middleware for getting the course by year
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Curriculum.aggregate([
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.year
          ),
        },
      },
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      { $unwind: "$semesters.programs.year" },
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.year
          ),
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year._id",
          course: "$semesters.programs.year.courses",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
    ]);

    res.status(200).json({ courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// middleware for adding course by year
exports.postCourse = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      {
        "semesters.programs.year._id": req.params.year,
      },
      {
        $push: {
          "semesters.$[].programs.$[].year.$[year].courses": req.body.courses,
        },
      },
      {
        arrayFilters: [
          {
            "year._id": req.params.year,
          },
        ],
      }
    );

    const courses = await Course.find({ _id: { $in: req.body.courses } });

    return res.status(201).json({ msg: "Course successfully added", courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// middleware for deleting course by year
exports.deleteCourse = async (req, res, next) => {
  try {
    const operation = await Curriculum.updateOne(
      {
        "semesters.programs.year._id": req.params.year,
      },
      {
        $pull: {
          "semesters.$[].programs.$[].year.$[year].courses": req.params.course,
          "semesters.$[].programs.$[].year.$[year].sections.$[].schedules": {
            course: req.params.course,
          },
        },
      },
      {
        arrayFilters: [{ "year._id": req.params.year }],
      }
    );

    res.status(200).json({ msg: "Course successfully delete" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};
