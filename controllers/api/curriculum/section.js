const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const { validationResult } = require("express-validator");

// middleware for getting sections by level
exports.getSections = async (req, res, next) => {
  try {
    const sections = await Curriculum.aggregate([
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.level
          ),
        },
      },
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      { $unwind: "$semesters.programs.year" },
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.level
          ),
        },
      },
      { $unwind: "$semesters.programs.year.sections" },
      {
        $project: {
          _id: "$semesters.programs.year.sections._id",
          section: "$semesters.programs.year.sections.section",
        },
      },
    ]);

    if (sections.length === 0)
      return res.status(404).json({ status: 404, data: sections });
    res.status(200).json({ status: 200, data: sections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};

// middleware for getting adding sections by level
exports.postSection = async (req, res, next) => {
  try {
    let filteredSection;
    const sections = await Curriculum.aggregate([
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.level
          ),
        },
      },
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      { $unwind: "$semesters.programs.year" },
      {
        $match: {
          "semesters.programs.year._id": mongoose.Types.ObjectId(
            req.params.level
          ),
        },
      },
      {
        $unwind: {
          path: "$semesters.programs.year.sections",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year.sections._id",
          section: "$semesters.programs.year.sections.section",
          courses: "$semesters.programs.year.courses",
        },
      },
    ]);

    filteredSection = req.body.sections.filter((element) => {
      return !sections.some((section) => {
        return section.section?.toLowerCase() === element.toLowerCase();
      });
    });

    const update = await Curriculum.updateOne(
      {
        "semesters.programs.year._id": req.params.level,
      },
      {
        $push: {
          "semesters.$[].programs.$[].year.$[year].sections":
            filteredSection.map((element) => {
              return {
                section: element.toLowerCase(),
                schedules: [],
              };
            }),
        },
      },
      {
        arrayFilters: [{ "year._id": req.params.level }],
      }
    );

    res.status(201).json({ msg: "Section successfully added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      {
        "semesters.programs.year.sections._id": req.params.section,
      },
      {
        $pull: {
          "semesters.$[].programs.$[].year.$[].sections": {
            _id: req.params.section,
          },
        },
      }
    );
    if (update.modifiedCount === 0) {
      return res.status(500).json({ status: 500, error: "Error" });
    }
    return res.status(202).json({ status: 202, data: update });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};

exports.getTotalUnits = async (req, res, next) => {
  try {
    const sections = await Curriculum.aggregate([
      {
        $match: {
          "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
            req.params.section
          ),
        },
      },
      { $unwind: "$semesters" },
      { $unwind: "$semesters.programs" },
      { $unwind: "$semesters.programs.year" },
      { $unwind: "$semesters.programs.year.sections" },
      {
        $match: {
          "semesters.programs.year.sections._id": mongoose.Types.ObjectId(
            req.params.section
          ),
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year.sections._id",
          courses: "$semesters.programs.year.courses",
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
      { $unwind: "$courses" },
      {
        $group: {
          _id: "$_id",
          totalUnits: { $sum: "$courses.units" },
        },
      },
    ]);
    if (sections.length === 0)
      return res.status(404).json({ status: 404, data: sections });
    res.status(200).json({ status: 200, data: sections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};
