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

    if (levents.length === 0) return res.status(404).json({ status: 404, data: levels });
    res.status(200).json({ status: 200, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};

exports.addYearLevel = async (req, res, next) => {
  try {
    const schedules = [];
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ ok: false, errors: errors.mapped() });
    // }

    const course = await Course.find({ _id: { $in: req.body.course } });

    course.forEach((element) => {
      if (element.lecture != 0) {
        schedules.push({
          course: element._id,
          hour: element.lecture,
          type: "lecture",
          day: null,
          start_time: null,
          end_time: null,
          room: null,
          faculty: null,
        });
      }
      if (element.lab != 0) {
        schedules.push({
          course: element._id,
          hour: element.lab,
          type: "lab",
          day: null,
          start_time: null,
          end_time: null,
          room: null,
          faculty: null,
        });
      }
    });

    const update = Curriculum.updateOne(
      {
        "semesters.programs._id": req.params.program,
      },
      {
        $push: {
          "semesters.$[].programs.$[program].year": {
            year_level: req.body.year_level,
            courses: req.body.course,
            sections: req.body.section.map((element) => {
              return {
                section: element,
                schedules: schedules,
              };
            }),
          },
        },
      },
      {
        arrayFilters: [{ "program._id": req.params.program }],
      }
    );

    return res.status(201).json({ status: 201, data: update });
  } catch (error) {
    res.status(500).json({ status: 500, error: error });
  }
};
