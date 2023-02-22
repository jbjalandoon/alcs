const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const Faculty = require("../../../models/user");
const FacultyType = require("../../../models/faculty-type");

exports.getActiveFaculty = async (req, res, next) => {
  try {
    const activeFaculty = await Curriculum.aggregate([
      {
        $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
      },
      { $unwind: "$semesters" },
      {
        $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
      },
      {
        $project: {
          faculty: "$semesters.activeFaculties",
        },
      },
      {
        $unwind: "$faculty",
      },
    ]);

    const populatedFaculty = await Faculty.find({ _id: { $in: result.map((e) => e.faculty) } })
      .populate("userInformation.academicQualifications.academicQualification")
      .populate("userInformation.academicQualifications.licenseIndustry")
      .populate("userInformation.courseTaken")
      .populate("userInformation.facultyType");

    if (populatedFaculty.length === 0) return res.status(404).json({ status: 404, data: populatedFaculty });
    res.status(200).json({ status: 200, data: populatedFaculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};

exports.getActiveFacultyCounts = async (req, res, next) => {
  try {
    const facultyCounts = await Curriculum.aggregate([
      {
        $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
      },
      { $unwind: "$semesters" },
      {
        $match: { "semesters._id": mongoose.Types.ObjectId(req.params.semester) },
      },
      {
        $project: {
          faculty: "$semesters.activeFaculties",
        },
      },
      {
        $unwind: "$faculty",
      },
      {
        $lookup: {
          from: "users",
          localField: "faculty",
          foreignField: "_id",
          as: "faculty",
        },
      },
      {
        $group: {
          _id: "$faculty.userInformation.facultyType",
          count: { $count: {} },
        },
      },
      {
        $lookup: {
          from: "facultytypes",
          localField: "_id",
          foreignField: "_id",
          as: "facultyType",
        },
      },
      {
        $unwind: "$facultyType",
      },
    ]);

    res.status(200).json({ status: 200, data: facultyCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};

exports.getActiveFacultyType = async (req, res, next) => {
  try {
    const activeFaculty = await FacultyType.findOne({ facultyType: req.params.type });
    const faculty = await Curriculum.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $unwind: "$semesters",
      },
      {
        $unwind: "$semesters.activeFaculties",
      },
      {
        $project: {
          faculty: "$semesters.activeFaculties",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "faculty",
          foreignField: "_id",
          as: "faculty",
        },
      },
      {
        $unwind: "$faculty",
      },
      {
        $match: {
          "faculty.userInformation.facultyType": mongoose.Types.ObjectId(activeFaculty._id),
        },
      },
      {
        $project: {
          _id: "$faculty._id",
          facultyInformation: "$faculty.userInformation",
        },
      },
    ]);

    res.status(200).json({ status: 200, data: faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: error });
  }
};

exports.postActiveFaculty = async (req, res, next) => {
  try {
    const update = await Curriculum.updateOne(
      { "semesters._id": req.params.semester },
      {
        $addToSet: {
          "semesters.$[semester].activeFaculties": req.body.faculty,
        },
      },
      { arrayFilters: [{ "semester._id": req.params.semester }] }
    );

    const faculty = await Faculty.find({ _id: { $in: req.body.faculty } })
      .populate("userInformation.academicQualifications.academicQualification")
      .populate("userInformation.academicQualifications.licenseIndustry")
      .populate("userInformation.courseTaken")
      .populate("userInformation.facultyType");

    res, status(201).json({ status: 201, data: faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};

exports.deleteActiveFaculty = async (req, res, next) => {
  try {
    const deleteActiveFaculty = await Curriculum.updateOne(
      { "semesters._id": req.params.semester },
      {
        $pull: {
          "semesters.$[semester].activeFaculties": req.params.id,
        },
        $set: {
          "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules.$[faculty].faculty": null,
        },
      },
      {
        arrayFilters: [{ "semester._id": req.params.semester }, { "faculty.faculty": req.params.id }],
      }
    );

    res.status(202).json({ status: 202, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};
