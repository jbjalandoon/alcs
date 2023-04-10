const Curriculum = require("../../../models/curriculum");

exports.getSchoolYears = async (req, res, next) => {
  try {
    const curriculum = await Curriculum.aggregate([
      {
        $lookup: {
          from: "years",
          localField: "schoolYear",
          foreignField: "_id",
          as: "schoolYear",
        },
      },
      {
        $match: {
          "schoolYear.deleted": { $ne: true },
        },
      },
      {
        $project: {
          schoolYear: "$schoolYear.year",
          _id: "$schoolYear._id",
        },
      },
      { $unwind: "$schoolYear" },
      { $unwind: "$_id" },
    ]);

    if (curriculum.length === 0)
      res.status(404).json({ msg: "No available school year" });

    res.status(200).json({ curriculum });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};
