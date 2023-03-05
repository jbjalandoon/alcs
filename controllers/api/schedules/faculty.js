const Schedule = require("../../../models/curriculum");
const io = require("../../../socket");
const mongoose = require("mongoose");

exports.getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $unwind: "$semesters",
      },
      {
        $unwind: "$semesters.programs",
      },
      {
        $unwind: "$semesters.programs.year",
      },
      {
        $unwind: "$semesters.programs.year.sections",
      },
      {
        $unwind: "$semesters.programs.year.sections.schedules",
      },
      {
        $match: {
          "semesters.programs.year.sections.schedules.faculty": mongoose.Types.ObjectId(req.params.faculty),
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year.sections.schedules._id",
          section: "$semesters.programs.year.sections._id",
          yearLevel: "$semesters.programs.year.yearLevel",
          sectionName: "$semesters.programs.year.sections.section",
          program: "$semesters.programs.program",
          course: "$semesters.programs.year.sections.schedules.course",
          type: "$semesters.programs.year.sections.schedules.type",
          hour: "$semesters.programs.year.sections.schedules.hour",
          day: "$semesters.programs.year.sections.schedules.day",
          startTime: "$semesters.programs.year.sections.schedules.startTime",
          endTime: "$semesters.programs.year.sections.schedules.endTime",
          room: "$semesters.programs.year.sections.schedules.room",
          faculty: "$semesters.programs.year.sections.schedules.faculty",
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
      {
        $lookup: {
          from: "programs",
          localField: "program",
          foreignField: "_id",
          as: "program",
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "room",
          foreignField: "_id",
          as: "room",
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
        $lookup: {
          from: "levels",
          localField: "yearLevel",
          foreignField: "_id",
          as: "level",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$level", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$program", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$faculty", preserveNullAndEmptyArrays: true } },
    ]);

    return res.json({ status: 200, data: schedules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};

exports.getUnits = async (req, res, next) => {
  try {
    const schedules = await Schedule.aggregate([
      {
        $match: {
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $unwind: "$semesters",
      },
      {
        $unwind: "$semesters.programs",
      },
      {
        $unwind: "$semesters.programs.year",
      },
      {
        $unwind: "$semesters.programs.year.sections",
      },
      {
        $unwind: "$semesters.programs.year.sections.schedules",
      },
      {
        $match: {
          "semesters.programs.year.sections.schedules.faculty": mongoose.Types.ObjectId(req.params.faculty),
          "semesters._id": mongoose.Types.ObjectId(req.params.semester),
        },
      },
      {
        $project: {
          _id: "$semesters.programs.year.sections.schedules._id",
          section: "$semesters.programs.year.sections._id",
          course: "$semesters.programs.year.sections.schedules.course",
          faculty: "$semesters.programs.year.sections.schedules.faculty",
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
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { section: "$section", course: "$course._id" },
          faculty: { $first: "$faculty" },
          units: { $first: "$course.units" },
        },
      },
      {
        $group: {
          _id: "$faculty",
          units: { $sum: "$units" },
        },
      },
    ]);
    if (schedules.length === 0) {
      return res.json({ status: 200, data: 0 });
    }
    return res.json({ status: 200, data: schedules[0].units });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, data: error });
  }
};
