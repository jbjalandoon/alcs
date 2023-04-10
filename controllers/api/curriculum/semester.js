const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const Level = require("../../../models/level");
const { validationResult } = require("express-validator");

// middleware for getting the 3 sem based on school year
exports.getSemesters = async (req, res, next) => {
  try {
    const semesters = await Curriculum.aggregate([
      {
        $match: {
          schoolYear: mongoose.Types.ObjectId(req.params.schoolYear),
        },
      },
      { $unwind: "$semesters" },
      {
        $project: {
          _id: "$semesters._id",
          sem: "$semesters.sem",
        },
      },
    ]);
    if (semesters.length === 0)
      return res.status(404).json({ msg: "No semesters available" });
    return res.status(200).json({ semesters });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// middleware for getting the current active semester
exports.getActiveSemester = async (req, res, next) => {
  try {
    const activeSemester = await Curriculum.aggregate([
      {
        $match: {
          "semesters.isActive": true,
        },
      },
      { $unwind: "$semesters" },
      {
        $match: {
          "semesters.isActive": true,
        },
      },
      {
        $lookup: {
          from: "years",
          localField: "schoolYear",
          foreignField: "_id",
          as: "schoolYear",
        },
      },
    ]);
    if (activeSemester.length === 0) {
      return res.status(404).json({ msg: "No active semester" });
    }
    return res.status(200).json({ semester: activeSemester[0].semesters, year: activeSemester[0].schoolYear[0] });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// middleware for setting the active semester
exports.putActiveSemester = async (req, res, next) => {
  try {
    const setActiveFalse = await Curriculum.updateMany(
      {},
      { "semesters.$[].isActive": false }
    );
    const setActiveTrue = await Curriculum.updateOne(
      {
        "semesters._id": req.params.semester,
      },
      {
        "semesters.$[semester].isActive": true,
      },
      { arrayFilters: [{ "semester._id": req.params.semester }] }
    );
    res.status(200).json({ msg: "Semester successfully set as active" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// middleware for copying semester
exports.copySemester = async (req, res, next) => {
  try {
    const programs = [];

    // semester to copy
    const otherSemester = await Curriculum.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.sem),
        },
      },
      { $unwind: "$semesters" },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.sem),
        },
      },
      {
        $lookup: {
          from: "years",
          localField: "schoolYear",
          foreignField: "_id",
          as: "schoolYear",
        },
      },
    ]);

    // pushing the data to programs array from the other semester
    otherSemester[0].semesters.programs.forEach((element) => {
      programs.push({
        program: element.program,
        year: element.year.map((element) => {
          return {
            yearLevel: element.yearLevel,
            courses: element.courses,
          };
        }),
      });
    });

    // new semester
    const currentSemester = await Curriculum.updateOne(
      {
        "semesters._id": mongoose.Types.ObjectId(req.params.active),
      },
      {
        "semesters.$[semester].programs": programs,
      },
      { arrayFilters: [{ "semester._id": req.params.active }] }
    );

    res.status(201).json({ status: 201, data: currentSemester });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, errors: error });
  }
};
