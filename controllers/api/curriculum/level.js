const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const { validationResult } = require("express-validator");

exports.getYearLevels = async (req, res, next) => {
  // if (!req.params.program.match(/^[0-9a-fA-F]{24}$/))
  //   return res.json({ status: 400, msg: "Invalid Query" });
  try {
    const levels = await Curriculum.aggregate([
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      {
        $match: {
          "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
        },
      },
      { $unwind: "$semesters.programs.year" },
      {
        $project: {
          _id: "$semesters.programs.year._id",
          level: "$semesters.programs.year.yearLevel",
          courses: "$semesters.programs.year.courses",
        },
      },
      {
        $lookup: {
          from: "levels",
          localField: "level",
          foreignField: "_id",
          as: "level",
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "courses",
        },
      },
      { $unwind: "$level" },
    ]);

    if (levels.length === 0)
      return res.status(404).json({ msg: "No Year Level Available" });
    res.status(200).json({ levels });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.addYearLevel = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      {
        "semesters.programs._id": req.params.program,
      },
      {
        $push: {
          "semesters.$[].programs.$[program].year": {
            yearLevel: req.body.yearLevel,
            courses: [],
            sections: [],
          },
        },
      },
      {
        arrayFilters: [{ "program._id": req.params.program }],
      }
    );

    return res.status(201).json({ msg: "Year Level Successfully Added" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.deleteYearLevel = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      {
        "semesters.programs._id": req.params.program,
      },
      {
        $pull: {
          "semesters.$[].programs.$[].year": {
            _id: req.params.yearLevel,
          },
        },
      }
    );
    console.log(update);
    if (update.modifiedCount === 0) {
      return res.status(500).json({ status: 500, data: update });
    }
    return res.status(201).json({ status: 202, data: update });
  } catch (error) {
    res.status(500).json({ status: 500, error: error });
  }
};
