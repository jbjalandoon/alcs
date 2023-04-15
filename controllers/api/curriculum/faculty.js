const { mongoose } = require("mongoose");
const Curriculum = require("../../../models/curriculum");
const Faculty = require("../../../models/user");
const FacultyType = require("../../../models/faculty-type");
const { validationResult } = require("express-validator");

exports.getActiveFaculty = async (req, res, next) => {
  try {
    const activeFaculty = await Curriculum.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      { $unwind: "$semesters" },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
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

    const faculty = await Faculty.find({
      _id: { $in: activeFaculty.map((e) => e.faculty) },
    })
      .populate("facultyInformation.courseTaken")
      .populate("facultyInformation.facultyType");

    if (faculty.length === 0)
      return res.status(200).json({ msg: "No Active Faculty", faculty: [] });
    res.status(200).json({ faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getActiveFacultyCounts = async (req, res, next) => {
  try {
    const facultyCounts = await Curriculum.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      { $unwind: "$semesters" },
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
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
          _id: "$faculty.facultyInformation.facultyType",
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
    console.log(facultyCounts);
    res.status(200).json({ facultyCounts });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

exports.getActiveFacultyType = async (req, res, next) => {
  try {
    const activeFaculty = await FacultyType.findOne({
      facultyType: req.params.type,
    });
    console.log(activeFaculty);
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
          "faculty.facultyInformation.facultyType": mongoose.Types.ObjectId(
            activeFaculty._id
          ),
        },
      },
      {
        $project: {
          _id: "$faculty._id",
          userInformation: "$faculty.userInformation",
          facultyInformation: "$faculty.facultyInformation",
        },
      },
    ]);
    res.status(200).json({ faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
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
      .populate("facultyInformation.courseTaken")
      .populate("facultyInformation.facultyType");

    res
      .status(201)
      .json({ msg: "Successfully added new active faculty", faculty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
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
          "semesters.$[semester].programs.$[].year.$[].sections.$[].schedules.$[faculty].faculty":
            null,
        },
      },
      {
        arrayFilters: [
          { "semester._id": req.params.semester },
          { "faculty.faculty": req.params.id },
        ],
      }
    );
    console.log(deleteActiveFaculty);
    res.status(200).json({ msg: "Active faculty successfully deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Something went wrong" });
  }
};
