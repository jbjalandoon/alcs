const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const Program = require("../../../models/program");
const Level = require("../../../models/level");
const { validationResult } = require("express-validator");

exports.getPrograms = async (req, res, next) => {
  try {
    const programs = await Curriculum.aggregate([
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          _id: "$semesters.programs._id",
          program: "$semesters.programs.program",
        },
      },
      {
        $lookup: {
          from: "programs",
          localField: "program",
          foreignField: "_id",
          as: "program",
        },
      },
      { $unwind: "$program" },
    ]);

    if (programs.length === 0) return res.status(404).json({ status: 404, data: programs });
    return res.status(200).json({ status: 200, data: programs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, errors: error });
  }
};

exports.getOneProgram = async (req, res, next) => {
  try {
    const program = await Curriculum.aggregate([
      {
        $match: {
          "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      { $unwind: "$semesters" },
      {
        $unwind: "$semesters.programs",
      },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
          "semesters.programs._id": mongoose.Types.ObjectId(req.params.program),
        },
      },
      { $unwind: "$semesters.programs.year" },
      {
        $lookup: {
          from: "programs",
          localField: "semesters.programs.program",
          foreignField: "_id",
          as: "semesters.programs.program",
        },
      },
      { $unwind: "$semesters.programs.program" },
      {
        $lookup: {
          from: "levels",
          localField: "semesters.programs.year.yearLevel",
          foreignField: "_id",
          as: "semesters.programs.year.yearLevel",
        },
      },
      { $unwind: "$semesters.programs.year.yearLevel" },
      {
        $project: {
          _id: "$semesters.programs.year._id",
          school_year: "$school_year",
          sem: "$semesters.sem",
          program: "$semesters.programs.program",
          year: "$semesters.programs.year.yearLevel",
          courses: "$semesters.programs.year.courses",
          sections: {
            _id: "$semesters.programs.year.sections._id",
            section: "$semesters.programs.year.sections.section",
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courses",
          foreignField: "_id",
          as: "course",
        },
      },
    ]);
    if (program === 0) return res.status(404).json({ status: 404, data: program });
    res.status(200).json({ status: 200, data: program });
  } catch (error) {
    res.status(500).json({ status: 500, error: error });
  }
};

exports.postPrograms = async (req, res, next) => {
  try {
    let fetchedLevel;
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return 400 if validation error
      return res.status(400).json({ ok: false, errors: errors.mapped() });
    }

    const level = await Level.find({ deleted: false });

    fetchedLevel = level.map((element) => {
      return { yearLevel: element._id };
    });

    const update = await Curriculum.updateOne(
      {
        "semesters._id": req.params.semester,
      },
      {
        $push: {
          "semesters.$[semester].programs": req.body.programs.map((element) => {
            return {
              program: element,
              year: fetchedLevel,
            };
          }),
        },
      },
      { arrayFilters: [{ "semester._id": req.params.semester }] }
    );
    if (update.modifiedCount === 1) {
      return res.status(201).json({ status: 201, data: update });
    }
    res.status(500).json({ status: 500, data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};

exports.deleteOneProgram = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      {
        "semesters._id": mongoose.Types.ObjectId(req.params.semester),
      },
      {
        $pull: {
          "semesters.$[].programs": { _id: req.params.program },
        },
      },
      { arrayFilters: [{ "program._id": req.params.program }] }
    );

    return res.status(202).json({ status: 202, data: update });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};
